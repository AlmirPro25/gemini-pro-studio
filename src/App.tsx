
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { MediaCaptureModal } from './components/MediaCaptureModal';
import { LibraryView } from './components/LibraryView';
import { ProjectsView } from './components/ProjectsView';
import { Header } from './components/Header';
import { InteractiveCodeBlock } from './components/InteractiveCodeBlock';
import { LiveTranscriptOverlay } from './components/LiveTranscriptOverlay';
import { GenerationOptionsModal, AspectRatio } from './components/GenerationOptionsModal';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { LibraryItemModal } from './components/LibraryItemModal';
import { LibrarySelectorModal } from './components/LibrarySelectorModal';
import { MetaPersonaModal } from './components/MetaPersonaModal';
import { ImageGalleryView } from './components/ImageGalleryView';
import { ImageViewerModal } from './components/ImageViewerModal';
import { DocumentGeneratorView } from './components/DocumentGeneratorView';
import { WhatsAppBusinessPanel } from './components/WhatsAppBusinessPanel';
import { WhatsAppAdminPanel } from './components/WhatsAppAdminPanel';
import { Message, GeminiModel, Persona, Chat, Attachment, Project, LibraryItem, GenerationConfig, LibraryItemType } from './types';
import { GEMINI_MODELS, PERSONAS, DEFAULT_GENERATION_CONFIG } from './constants';
import { sendMessageToGemini, sendMessageWithGrounding, generateOrEditImage, generateImageWithImagen, generateVideoWithVeo, transcribeAudio, generateSpeech, LiveSessionManager } from './services/geminiService';
import { detectTechnicalContext, TechnicalCodeValidator } from './services/neuralArchitectService';
import { safeLocalStorage } from './utils/storage';
import { dbService } from './services/databaseService';
import { backupService } from './services/backupService';

type ActiveView = 'chat' | 'library' | 'projects' | 'gallery' | 'documents' | 'whatsapp' | 'admin';
type Theme = 'light' | 'dark';
type InteractiveTab = 'preview' | 'code';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    require?: any;
    monaco?: any;
  }
}

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string>(() => `chat_${Date.now()}`);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(GEMINI_MODELS[1]);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  const [liveConversationState, setLiveConversationState] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [generationTask, setGenerationTask] = useState<{ prompt: string; attachments?: Attachment[] } | null>(null);
  const [activeInteractiveCode, setActiveInteractiveCode] = useState<{ messageId: string; description: string; htmlCode: string } | null>(null);
  const [interactiveTab, setInteractiveTab] = useState<InteractiveTab>('preview');
  
  // New state for Projects and Library
  const [projects, setProjects] = useState<Project[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // State for new features
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>(DEFAULT_GENERATION_CONFIG);
  const [isLibraryItemModalOpen, setIsLibraryItemModalOpen] = useState(false);
  const [editingLibraryItem, setEditingLibraryItem] = useState<LibraryItem | null>(null);
  const [isLibrarySelectorOpen, setIsLibrarySelectorOpen] = useState(false);
  const [isMetaPersonaModalOpen, setIsMetaPersonaModalOpen] = useState(false);
  const [generatedPersonas, setGeneratedPersonas] = useState<Persona[]>([]);
  const [viewerImage, setViewerImage] = useState<{ image: Attachment; prompt: string } | null>(null);
  const appendToPromptRef = useRef<(text: string) => void>(() => {});


  const stopStreamingRef = useRef<() => void>(() => {});
  const liveSessionManagerRef = useRef<LiveSessionManager | null>(null);
  const interactivePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('gemini-pro-studio-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      (window as any).applyTheme(savedTheme);
    }
    
    // Carregar dados do IndexedDB
    loadDataFromDB();
  }, []);

  const loadDataFromDB = async () => {
    try {
      // Garantir que o IndexedDB está inicializado
      await dbService.init();
      
      console.log('💾 Carregando dados do IndexedDB...');
      
      // Tentar carregar do IndexedDB primeiro
      const [dbChats, dbProjects, dbLibrary] = await Promise.all([
        dbService.getAllChats(),
        dbService.getAllProjects(),
        dbService.getAllLibraryItems()
      ]);
      
      console.log(`📊 Dados carregados: ${dbChats.length} chats, ${dbProjects.length} projetos, ${dbLibrary.length} itens`);

      if (dbChats.length > 0) {
        setChatHistory(dbChats as any);
      } else {
        // Fallback para localStorage se IndexedDB estiver vazio
        const localChats = safeLocalStorage.getItem('geminiChatHistory', []);
        if (localChats.length > 0) {
          setChatHistory(localChats);
          // Migrar para IndexedDB
          localChats.forEach(chat => dbService.saveChat(chat));
        }
      }

      if (dbProjects.length > 0) {
        setProjects(dbProjects as any);
      } else {
        const localProjects = safeLocalStorage.getItem('geminiProjects', []);
        if (localProjects.length > 0) {
          setProjects(localProjects);
          localProjects.forEach(project => dbService.saveProject(project));
        }
      }

      if (dbLibrary.length > 0) {
        setLibraryItems(dbLibrary as any);
      } else {
        const localLibrary = safeLocalStorage.getItem('geminiLibrary', []);
        if (localLibrary.length > 0) {
          setLibraryItems(localLibrary);
          localLibrary.forEach(item => dbService.saveLibraryItem(item));
        }
      }

      // Carregar personas salvas
      const dbPersonas = await dbService.getAllPersonas();
      if (dbPersonas.length > 0) {
        setGeneratedPersonas(dbPersonas as any);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do IndexedDB:', error);
      // Fallback para localStorage
      setChatHistory(safeLocalStorage.getItem('geminiChatHistory', []));
      setProjects(safeLocalStorage.getItem('geminiProjects', []));
      setLibraryItems(safeLocalStorage.getItem('geminiLibrary', []));
    }
  };

  useEffect(() => {
    // Salvar no IndexedDB (principal)
    saveDataToDB();
    
    // Manter localStorage como backup
    safeLocalStorage.setItem('geminiChatHistory', chatHistory);
    safeLocalStorage.setItem('geminiProjects', projects);
    safeLocalStorage.setItem('geminiLibrary', libraryItems);
  }, [chatHistory, projects, libraryItems]);

  const saveDataToDB = async () => {
    try {
      // Garantir que o IndexedDB está pronto
      await dbService.init();
      
      // Salvar chats
      for (const chat of chatHistory) {
        await dbService.saveChat({
          ...chat,
          updatedAt: Date.now()
        });
      }
      
      // Salvar projetos
      for (const project of projects) {
        await dbService.saveProject({
          ...project,
          updatedAt: Date.now()
        });
      }
      
      // Salvar biblioteca
      for (const item of libraryItems) {
        await dbService.saveLibraryItem({
          ...item,
          updatedAt: Date.now()
        });
      }
      
      console.log('✅ Dados salvos no IndexedDB');
    } catch (error) {
      console.error('❌ Erro ao salvar no IndexedDB:', error);
      // Tentar novamente após 1 segundo
      setTimeout(() => saveDataToDB(), 1000);
    }
  };
  
  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('gemini-pro-studio-theme', newTheme);
    (window as any).applyTheme(newTheme);
  };

  const handleShowInteractiveCode = (message: Message) => {
    if (message.isInteractive && message.htmlCode) {
      setActiveInteractiveCode({
        messageId: message.id,
        description: message.content,
        htmlCode: message.htmlCode
      });
      setInteractiveTab('preview');
    }
  };

  const updateChatHistory = useCallback((finalMessages: Message[]) => {
    const firstUserMessage = finalMessages.find(m => m.role === 'user' && m.content);
    if (!firstUserMessage) return;

    const chatTitle = firstUserMessage.content.substring(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '');
    
    // Project-specific chat history
    if (activeProjectId) {
      setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === activeProjectId) {
          const chatIndex = p.chats.findIndex(c => c.id === currentChatId);
          if (chatIndex > -1) {
            p.chats[chatIndex] = { ...p.chats[chatIndex], messages: finalMessages, title: chatTitle, createdAt: Date.now(), generationConfig };
          } else {
            p.chats.push({ id: currentChatId, title: chatTitle, messages: finalMessages, createdAt: Date.now(), generationConfig });
          }
          p.chats.sort((a,b) => b.createdAt - a.createdAt);
        }
        return p;
      }));
    } else { // Global chat history
      setChatHistory(prev => {
        const existingChatIndex = prev.findIndex(c => c.id === currentChatId);
        if (existingChatIndex !== -1) {
          const updatedChat = { ...prev[existingChatIndex], messages: finalMessages, title: chatTitle, createdAt: Date.now(), generationConfig };
          return [updatedChat, ...prev.filter(c => c.id !== currentChatId)].sort((a, b) => b.createdAt - a.createdAt);
        } else {
          const newChat: Chat = { id: currentChatId, title: chatTitle, messages: finalMessages, createdAt: Date.now(), generationConfig };
          return [newChat, ...prev].sort((a, b) => b.createdAt - a.createdAt);
        }
      });
    }
  }, [currentChatId, activeProjectId, generationConfig]);


  // 🧠 NEURAL ARCHITECT: Validar código em respostas
  const validateCodeInResponse = (content: string) => {
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1];
      const code = match[2];
      
      const validation = TechnicalCodeValidator.validateCode(code, language);
      
      if (!validation.isValid || validation.suggestions.length > 0) {
        const report = TechnicalCodeValidator.generateQualityReport(code, language);
        console.log('🔍 Code Quality Report:\n', report);
        
        if (!validation.isValid) {
          console.warn(`⚠️ Código ${language} contém problemas:`, validation.issues);
        }
        if (validation.suggestions.length > 0) {
          console.info(`💡 Sugestões para ${language}:`, validation.suggestions);
        }
      }
    }
  };

  const executeSend = async (history: Message[]) => {
    if (isLoading) return;
    setIsLoading(true);
    
    const thinkingMessageId = `ai_${Date.now()}`;
    const abortController = new AbortController();
    stopStreamingRef.current = () => {
      abortController.abort();
      setIsLoading(false);
    };
    
    setMessages([...history, { id: thinkingMessageId, role: 'model', content: '', isLoading: true, isThinking: isThinkingMode }]);

    let fullJsonResponse = "";
    try {
        const stream = sendMessageToGemini(history, selectedModel, selectedPersona, isThinkingMode, generationConfig, abortController.signal);
        
        for await (const chunk of stream) {
            if (abortController.signal.aborted) break;
            fullJsonResponse += chunk;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error('Error during Gemini API call:', error);
        setMessages([...history, { id: thinkingMessageId, role: 'model', content: '', error: errorMessage }]);
        setIsLoading(false);
        return;
    } 

    if (abortController.signal.aborted) {
        setMessages(prev => prev.map(m => m.id === thinkingMessageId ? {...m, isLoading: false, content: "*Geração interrompida.*"} : m));
        setIsLoading(false);
        return;
    }

    let finalAiMessage: Message;
    try {
        const parsedResponse = JSON.parse(fullJsonResponse);
        finalAiMessage = {
            id: thinkingMessageId,
            role: 'model',
            content: parsedResponse.response || "Sem conteúdo na resposta.",
            suggestedPrompts: parsedResponse.suggestions || [],
            isInteractive: parsedResponse.isInteractive || false,
            htmlCode: parsedResponse.htmlCode || undefined,
        };
        
        // 🧠 NEURAL ARCHITECT: Validar código automaticamente
        if (finalAiMessage.content.includes('```')) {
          validateCodeInResponse(finalAiMessage.content);
        }
        
        if (finalAiMessage.isInteractive && finalAiMessage.htmlCode) {
            handleShowInteractiveCode(finalAiMessage);
        }
    } catch (e) {
         console.error("Falha ao analisar a resposta JSON final:", fullJsonResponse);
         finalAiMessage = {
            id: thinkingMessageId, role: 'model', content: '',
            error: "Formato de resposta inválido recebido da API."
         };
    }
    
    const finalMessages = [...history, finalAiMessage];
    setMessages(finalMessages);
    updateChatHistory(finalMessages);
    setIsLoading(false);
  };
  
  const executeSendWithGrounding = async (history: Message[], groundingTool: 'googleSearch' | 'googleMaps') => {
    if (isLoading) return;
    setIsLoading(true);
    
    const thinkingMessageId = `ai_${Date.now()}`;
    setMessages([...history, { id: thinkingMessageId, role: 'model', content: '', isLoading: true }]);

    try {
      const userLocation = null; // Could be enhanced with geolocation API
      const { content, sources } = await sendMessageWithGrounding(
        history,
        selectedModel,
        selectedPersona,
        groundingTool,
        userLocation
      );

      const finalAiMessage: Message = {
        id: thinkingMessageId,
        role: 'model',
        content: content || "Sem conteúdo na resposta.",
        sources: sources,
      };

      const finalMessages = [...history, finalAiMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('Error during grounded API call:', error);
      setMessages([...history, { id: thinkingMessageId, role: 'model', content: '', error: errorMessage }]);
    }
    
    setIsLoading(false);
  };

  const handleImageEdit = async (prompt: string, attachments: Attachment[]) => {
    if (isLoading) return;
    setIsLoading(true);

    const userMessage: Message = { id: `user_${Date.now()}`, role: 'user', content: prompt, attachments };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);

    const thinkingMessageId = `ai_${Date.now()}`;
    setMessages([...newHistory, { id: thinkingMessageId, role: 'model', content: '', isLoading: true }]);

    try {
      const generatedImage = await generateOrEditImage(prompt, attachments, selectedModel.id);
      
      const finalAiMessage: Message = {
        id: thinkingMessageId,
        role: 'model',
        content: 'Imagem gerada com sucesso!',
        attachments: [generatedImage],
      };

      const finalMessages = [...newHistory, finalAiMessage];
      setMessages(finalMessages);
      updateChatHistory(finalMessages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar imagem";
      console.error('Error generating image:', error);
      setMessages([...newHistory, { id: thinkingMessageId, role: 'model', content: '', error: errorMessage }]);
    }

    setIsLoading(false);
  };

  const handleSend = async (prompt: string, attachments?: Attachment[]) => {
    setActiveInteractiveCode(null);
    
    // Se é modelo de imagem E tem anexos, trata como edição
    const isImageModel = selectedModel.id === 'gemini-2.5-flash-image' || selectedModel.id === 'gemini-2.0-flash-exp';
    if (isImageModel && attachments && attachments.length > 0) {
        await handleImageEdit(prompt, attachments);
        return;
    }

    if ((selectedModel.type === 'image' || selectedModel.type === 'video') && !isLoading) {
      setGenerationTask({ prompt, attachments });
      setIsOptionsModalOpen(true);
      return;
    }
    
    let contextPrompt = prompt;
    if (activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId);
      if (project && project.files.length > 0) {
        const fileContext = project.files.map(f => `\n--- FILE: ${f.path} ---\n${f.content}`).join('\n');
        contextPrompt = `CONTEXT: I am working on a project with the following files:\n${fileContext}\n\nTASK: ${prompt}`;
      }
    }

    const userMessage: Message = { id: `user_${Date.now()}`, role: 'user', content: contextPrompt, attachments };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);

    // Grounding logic as before
    const lowerCasePrompt = prompt.toLowerCase();
    const searchKeywords = ['who is', 'what is', 'latest', 'news', 'search for', 'find information on'];
    const mapsKeywords = ['nearby', 'restaurants near', 'directions to', 'where is', 'map of'];
    let groundingTool: 'googleSearch' | 'googleMaps' | null = null;
    if (searchKeywords.some(kw => lowerCasePrompt.includes(kw))) groundingTool = 'googleSearch';
    else if (mapsKeywords.some(kw => lowerCasePrompt.includes(kw))) groundingTool = 'googleMaps';

    if (groundingTool) {
      await executeSendWithGrounding(newHistory, groundingTool);
    } else {
      await executeSend(newHistory);
    }
  };

  const handleStartGeneration = async (options: { aspectRatio: AspectRatio }) => {
    if (!generationTask || isLoading) return;
    setIsOptionsModalOpen(false);
    setIsLoading(true);

    const { prompt, attachments } = generationTask;
    const userMessage: Message = { id: `user_${Date.now()}`, role: 'user', content: prompt, attachments };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);

    const generationMessageId = `ai_${Date.now()}`;

    if (selectedModel.type === 'video') {
      setMessages([...newHistory, { 
        id: generationMessageId, 
        role: 'model', 
        content: 'Gerando vídeo...', 
        videoState: 'generating',
        generationProgress: 'Iniciando geração de vídeo...'
      }]);

      try {
        const imageAttachment = attachments?.find(a => a.mimeType.startsWith('image/'));
        const videoUri = await generateVideoWithVeo(
          prompt,
          options.aspectRatio as '16:9' | '9:16',
          imageAttachment,
          (progress) => {
            setMessages(prev => prev.map(m => 
              m.id === generationMessageId 
                ? { ...m, generationProgress: progress }
                : m
            ));
          }
        );

        const finalMessage: Message = {
          id: generationMessageId,
          role: 'model',
          content: 'Vídeo gerado com sucesso!',
          videoState: 'completed',
          videoUri: videoUri,
        };

        const finalMessages = [...newHistory, finalMessage];
        setMessages(finalMessages);
        updateChatHistory(finalMessages);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao gerar vídeo";
        console.error('Error generating video:', error);
        setMessages(prev => prev.map(m => 
          m.id === generationMessageId 
            ? { ...m, videoState: 'failed', error: errorMessage }
            : m
        ));
      }
    } else if (selectedModel.type === 'image') {
      setMessages([...newHistory, { id: generationMessageId, role: 'model', content: '', isLoading: true }]);

      try {
        let generatedImage: Attachment;
        
        if (selectedModel.id === 'imagen-4.0-generate-001') {
          generatedImage = await generateImageWithImagen(prompt, options.aspectRatio);
        } else {
          generatedImage = await generateOrEditImage(prompt, attachments, selectedModel.id);
        }

        const finalMessage: Message = {
          id: generationMessageId,
          role: 'model',
          content: 'Imagem gerada com sucesso!',
          attachments: [generatedImage],
        };

        const finalMessages = [...newHistory, finalMessage];
        setMessages(finalMessages);
        updateChatHistory(finalMessages);

        // Salvar imagem no IndexedDB
        try {
          await dbService.saveImage({
            id: `img_${Date.now()}`,
            prompt: prompt,
            imageData: generatedImage.data,
            mimeType: generatedImage.mimeType,
            createdAt: Date.now(),
            metadata: {
              model: selectedModel.id,
              aspectRatio: options.aspectRatio
            }
          });
          console.log('✅ Imagem salva no IndexedDB');
        } catch (dbError) {
          console.error('Erro ao salvar imagem no IndexedDB:', dbError);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao gerar imagem";
        console.error('Error generating image:', error);
        setMessages([...newHistory, { id: generationMessageId, role: 'model', content: '', error: errorMessage }]);
      }
    }

    setIsLoading(false);
    setGenerationTask(null);
  };
  
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setActiveInteractiveCode(null);
    setCurrentChatId(`chat_${Date.now()}`);
    setGenerationConfig(DEFAULT_GENERATION_CONFIG); // Reset config for new chat
    setActiveView('chat');
    if (activeProjectId) {
      // If in a project, the new chat belongs to the project.
      // The UI will just clear the messages, ready for a new conversation.
    } else {
      setActiveProjectId(null); // Ensure we are in global context
    }
  }, [activeProjectId]);
  
  const handleSelectChat = useCallback((chatId: string) => {
    let selectedChat: Chat | undefined;
    if (activeProjectId) {
        selectedChat = projects.find(p => p.id === activeProjectId)?.chats.find(c => c.id === chatId);
    } else {
        selectedChat = chatHistory.find(chat => chat.id === chatId);
    }

    if (selectedChat) {
      setCurrentChatId(selectedChat.id);
      setMessages(selectedChat.messages);
      setGenerationConfig(selectedChat.generationConfig || DEFAULT_GENERATION_CONFIG);
      const lastMessage = selectedChat.messages[selectedChat.messages.length - 1];
      if (lastMessage?.isInteractive && lastMessage.htmlCode) {
        handleShowInteractiveCode(lastMessage);
      } else {
        setActiveInteractiveCode(null);
      }
      setActiveView('chat');
    }
  }, [chatHistory, projects, activeProjectId]);
  
  const handleRegenerate = useCallback(async () => {
    if (isLoading || messages.length < 2) return;
    
    // Find last user message index (reverse search)
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex === -1) return;

    const historyUpToLastUser = messages.slice(0, lastUserMessageIndex + 1);
    
    // Check if grounding was used
    const lastAiMessage = messages[messages.length - 1];
    if (lastAiMessage.sources && lastAiMessage.sources.length > 0) {
      const groundingTool = lastAiMessage.sources[0].type === 'web' ? 'googleSearch' : 'googleMaps';
      await executeSendWithGrounding(historyUpToLastUser, groundingTool);
    } else {
      await executeSend(historyUpToLastUser);
    }
  }, [messages, isLoading, executeSend, executeSendWithGrounding]);
  const handleEditPrompt = useCallback(async (messageId: string, newContent: string) => {
    if (isLoading) return;

    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'user') return;

    const updatedMessage = { ...messages[messageIndex], content: newContent, isEdited: true };
    const newHistory = [...messages.slice(0, messageIndex), updatedMessage];
    setMessages(newHistory);

    await executeSend(newHistory);
  }, [messages, isLoading, executeSend]);
  const handleLiveConversation = async () => {
    if (liveConversationState === 'idle') {
      setLiveConversationState('connecting');
      setLiveTranscript('');

      try {
        const manager = new LiveSessionManager();
        liveSessionManagerRef.current = manager;

        await manager.startSession({
          onOpen: () => {
            setLiveConversationState('active');
          },
          onMessage: (message) => {
            console.log('Live message:', message);
          },
          onError: (error) => {
            console.error('Live session error:', error);
            setLiveConversationState('idle');
            setLiveTranscript('Erro na conexão. Tente novamente.');
          },
          onClose: () => {
            setLiveConversationState('idle');
            setLiveTranscript('');
          },
          onTranscription: (text, isFinal) => {
            if (isFinal && text) {
              setLiveTranscript(prev => prev + ' ' + text);
            } else if (text) {
              setLiveTranscript(text);
            }
          }
        });
      } catch (error) {
        console.error('Failed to start live session:', error);
        setLiveConversationState('idle');
        setLiveTranscript('Falha ao iniciar conversa ao vivo.');
      }
    } else {
      // Stop the session
      if (liveSessionManagerRef.current) {
        await liveSessionManagerRef.current.closeSession();
        liveSessionManagerRef.current = null;
      }
      setLiveConversationState('idle');
      setLiveTranscript('');
    }
  };
  const handleTranscribe = async (audioBase64: string) => {
    try {
      const transcription = await transcribeAudio(audioBase64);
      return transcription;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  };
  const handleTextToSpeech = async (text: string): Promise<string> => {
    try {
      const audioData = await generateSpeech(text);
      return audioData;
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  };
  const handleDeleteChat = useCallback((chatId: string) => {
    if (activeProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, chats: p.chats.filter(c => c.id !== chatId) };
        }
        return p;
      }));
    } else {
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    }
    
    if (chatId === currentChatId) {
      handleNewChat();
    }
  }, [currentChatId, handleNewChat, activeProjectId]);
  const handleUpdateChatTitle = useCallback((chatId: string, newTitle: string) => {
    if (activeProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            chats: p.chats.map(c => c.id === chatId ? { ...c, title: newTitle } : c)
          };
        }
        return p;
      }));
    } else {
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
    }
  }, [activeProjectId]);
  const handleImageCapture = (attachments: Attachment[]) => {
    // Envia as imagens capturadas diretamente para o chat
    if (attachments.length > 0) {
      const prompt = `[${attachments.length} imagem(ns) anexada(s)]`;
      handleSend(prompt, attachments);
    }
    setIsCameraOpen(false);
  };
  const handleCloseInteractiveCode = () => setActiveInteractiveCode(null);
  const handleFullScreen = () => {
    if (interactivePanelRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        interactivePanelRef.current.requestFullscreen();
      }
    }
  };
  const handleOpenInNewTab = () => {
    if (activeInteractiveCode) {
      const blob = new Blob([activeInteractiveCode.htmlCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  // Project and Library handlers
  const handleCreateProject = () => {
    const projectName = prompt('Nome do projeto:');
    if (!projectName) return;

    const newProject: Project = {
      id: `project_${Date.now()}`,
      name: projectName,
      description: '',
      chats: [],
      files: [],
      libraryItems: [],
      createdAt: Date.now(),
    };

    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setActiveView('chat');
    handleNewChat();
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveView('chat');
    
    const project = projects.find(p => p.id === projectId);
    if (project && project.chats.length > 0) {
      const latestChat = project.chats[0];
      handleSelectChat(latestChat.id);
    } else {
      handleNewChat();
    }
  };

  const handleExitProject = () => {
    setActiveProjectId(null);
    setActiveView('chat');
    handleNewChat();
  };

  // Library Item CRUD
  const handleSaveLibraryItem = (item: LibraryItem) => {
    setLibraryItems(prev => {
      const index = prev.findIndex(i => i.id === item.id);
      if (index > -1) {
        const newItems = [...prev];
        newItems[index] = item;
        return newItems;
      }
      return [item, ...prev];
    });
    setIsLibraryItemModalOpen(false);
    setEditingLibraryItem(null);
  };

  const handleOpenLibraryItemModal = (item: LibraryItem | null) => {
    setEditingLibraryItem(item);
    setIsLibraryItemModalOpen(true);
  };

  const handleDeleteLibraryItem = (itemId: string) => {
    setLibraryItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Meta-Persona handlers
  const handleSelectGeneratedPersona = async (persona: Persona) => {
    setSelectedPersona(persona);
    setGeneratedPersonas(prev => {
      const exists = prev.find(p => p.id === persona.id);
      if (!exists) {
        return [persona, ...prev];
      }
      return prev;
    });

    // Salvar persona no IndexedDB
    try {
      await dbService.savePersona({
        id: persona.id,
        name: persona.name,
        description: (persona as any).description || persona.prompt,
        systemPrompt: (persona as any).systemPrompt || persona.prompt,
        createdAt: Date.now()
      });
      console.log('✅ Persona salva no IndexedDB');
    } catch (error) {
      console.error('Erro ao salvar persona:', error);
    }
  };

  const getConversationContext = (): string[] => {
    return messages
      .filter(m => m.content && !m.isLoading && !m.error)
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`)
      .slice(-10); // Last 10 messages
  };

  // Gallery handlers
  const handleImageClick = (image: Attachment, prompt: string) => {
    setViewerImage({ image, prompt });
  };

  const handleDownloadImage = (image: Attachment) => {
    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.data}`;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseAsReference = (image: Attachment) => {
    // Volta para o chat e adiciona a imagem como anexo
    setActiveView('chat');
    // Aqui você pode implementar lógica para adicionar ao input
    // Por enquanto, apenas mostra uma mensagem
    console.log('Using image as reference:', image.name);
  };

  const handleEditImage = (image: Attachment, prompt: string) => {
    // Seleciona modelo de edição e volta para o chat
    const editModel = GEMINI_MODELS.find(m => m.id === 'gemini-2.0-flash-exp') || GEMINI_MODELS[2];
    setSelectedModel(editModel);
    setActiveView('chat');
    // Adiciona imagem e prompt de edição
    handleSend(`Edite esta imagem: ${prompt}`, [image]);
  };

  // Coleta todas as mensagens de todos os chats para a galeria
  const getAllMessages = (): Message[] => {
    const allMessages: Message[] = [...messages];
    
    // Adiciona mensagens do histórico global
    chatHistory.forEach(chat => {
      allMessages.push(...chat.messages);
    });
    
    // Adiciona mensagens dos projetos
    projects.forEach(project => {
      project.chats.forEach(chat => {
        allMessages.push(...chat.messages);
      });
    });
    
    return allMessages;
  };


  const renderActiveView = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);

    switch(activeView) {
      case 'library': 
        return <LibraryView items={libraryItems} onEditItem={handleOpenLibraryItemModal} onDeleteItem={handleDeleteLibraryItem} onNewItem={() => handleOpenLibraryItemModal(null)} />;
      case 'projects': 
        return <ProjectsView projects={projects} onCreateProject={handleCreateProject} onSelectProject={handleSelectProject} />;
      case 'gallery':
        return (
          <ImageGalleryView
            chatHistory={getAllMessages()}
            onImageClick={handleImageClick}
            onDownload={handleDownloadImage}
            onUseAsReference={handleUseAsReference}
          />
        );
      case 'documents':
        return <DocumentGeneratorView />;
      case 'whatsapp':
        return <WhatsAppBusinessPanel />;
      case 'admin':
        return <WhatsAppAdminPanel />;
      case 'chat':
      default:
        return (
          <ChatView
            messages={messages} isLoading={isLoading} onSend={handleSend}
            onStop={stopStreamingRef.current} onCameraClick={() => setIsCameraOpen(true)}
            onRegenerate={handleRegenerate}
            onEditPrompt={handleEditPrompt}
            onTranscribe={handleTranscribe} onTextToSpeech={handleTextToSpeech}
            onShowInteractiveCode={handleShowInteractiveCode}
            theme={theme}
            projectName={activeProject?.name}
            onOpenLibrary={() => setIsLibrarySelectorOpen(true)}
            appendToPromptRef={appendToPromptRef}
            isThinkingMode={isThinkingMode}
            selectedPersona={selectedPersona}
          />
        );
    }
  };

  const TabButton: React.FC<{ tab: InteractiveTab; text: string }> = ({ tab, text }) => (
    <button
      onClick={() => setInteractiveTab(tab)}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${interactiveTab === tab ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary/50'}`}
    >
      {text}
    </button>
  );

  const currentChats = activeProjectId ? projects.find(p => p.id === activeProjectId)?.chats || [] : chatHistory;

  return (
    <div className="flex h-screen w-full bg-bg-primary text-text-primary">
      {liveConversationState !== 'idle' && (
        <LiveTranscriptOverlay 
            state={liveConversationState} 
            transcript={liveTranscript} 
            onClose={handleLiveConversation} 
        />
      )}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-3 left-3 z-20 p-2 text-text-secondary bg-bg-secondary/50 rounded-md hover:bg-bg-tertiary/70 transition-colors"
          aria-label="Open sidebar"
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      )}
      <Sidebar
        isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat} chatHistory={currentChats}
        currentChatId={currentChatId} onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat} onUpdateChatTitle={handleUpdateChatTitle}
        onSelectLibrary={() => setActiveView('library')}
        onSelectProjects={() => setActiveView('projects')}
        onSelectGallery={() => setActiveView('gallery')}
        onSelectDocuments={() => setActiveView('documents')}
        onSelectWhatsApp={() => setActiveView('whatsapp')}
        onSelectAdmin={() => setActiveView('admin')}
        // Project props
        activeProjectId={activeProjectId}
        onExitProject={handleExitProject}
        projectFiles={projects.find(p => p.id === activeProjectId)?.files || []}
      />
      <main className="flex-1 flex flex-col transition-all duration-300 min-w-0 h-full overflow-hidden">
        <Header 
            selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            selectedPersona={selectedPersona} setSelectedPersona={setSelectedPersona}
            theme={theme} onToggleTheme={handleToggleTheme}
            isThinkingMode={isThinkingMode} onToggleThinkingMode={() => setIsThinkingMode(!isThinkingMode)}
            liveConversationState={liveConversationState} onLiveConversationClick={handleLiveConversation}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenMetaPersona={() => setIsMetaPersonaModalOpen(true)}
            generatedPersonas={generatedPersonas}
        />
        <div className="flex-1 flex overflow-hidden">
            <div className={`transition-all duration-300 flex-1 ${activeInteractiveCode ? 'w-1/2' : 'w-full'}`}>
                {renderActiveView()}
            </div>
            {activeInteractiveCode && (
                <div ref={interactivePanelRef} className="w-1/2 h-full flex flex-col p-2 border-l border-border-color bg-bg-primary">
                  <div className="flex flex-col h-full rounded-xl bg-bg-secondary border border-border-color shadow-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-color flex-shrink-0">
                          <div className="flex items-center gap-1 p-0.5 bg-bg-primary rounded-lg">
                              <TabButton tab="preview" text="Pré-visualização" />
                              <TabButton tab="code" text="Código" />
                          </div>
                          <div className="flex items-center gap-1 text-text-secondary">
                              <button onClick={handleOpenInNewTab} data-tooltip="Abrir em nova aba" className="w-8 h-8 rounded-md hover:bg-bg-tertiary transition-colors"><i className="fa-solid fa-arrow-up-right-from-square"></i></button>
                              <button onClick={handleFullScreen} data-tooltip="Tela cheia" className="w-8 h-8 rounded-md hover:bg-bg-tertiary transition-colors"><i className="fa-solid fa-expand"></i></button>
                              <button onClick={handleCloseInteractiveCode} data-tooltip="Fechar" className="w-8 h-8 rounded-md hover:bg-bg-tertiary transition-colors"><i className="fa-solid fa-xmark"></i></button>
                          </div>
                      </div>
                      <InteractiveCodeBlock
                          htmlCode={activeInteractiveCode.htmlCode}
                          theme={theme}
                          activeView={interactiveTab}
                      />
                  </div>
                </div>
            )}
        </div>
      </main>
      {isOptionsModalOpen && generationTask && (
        <GenerationOptionsModal
            model={selectedModel}
            onClose={() => { setIsOptionsModalOpen(false); setGenerationTask(null); }}
            onSubmit={handleStartGeneration}
        />
      )}
      {isSettingsModalOpen && (
        <ModelSettingsModal
          config={generationConfig}
          onSave={setGenerationConfig}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
      {isLibraryItemModalOpen && (
        <LibraryItemModal
          item={editingLibraryItem}
          onSave={handleSaveLibraryItem}
          onClose={() => { setIsLibraryItemModalOpen(false); setEditingLibraryItem(null); }}
        />
      )}
      {isLibrarySelectorOpen && (
        <LibrarySelectorModal
          items={libraryItems}
          onSelect={(item) => {
            if (appendToPromptRef.current) {
               appendToPromptRef.current(typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2));
            }
            setIsLibrarySelectorOpen(false);
          }}
          onClose={() => setIsLibrarySelectorOpen(false)}
        />
      )}
      {isCameraOpen && <MediaCaptureModal onClose={() => setIsCameraOpen(false)} onCapture={handleImageCapture} />}
      {isMetaPersonaModalOpen && (
        <MetaPersonaModal
          onClose={() => setIsMetaPersonaModalOpen(false)}
          onSelectPersona={handleSelectGeneratedPersona}
          conversationContext={getConversationContext()}
        />
      )}
      {viewerImage && (
        <ImageViewerModal
          image={viewerImage.image}
          prompt={viewerImage.prompt}
          onClose={() => setViewerImage(null)}
          onDownload={handleDownloadImage}
          onUseAsReference={handleUseAsReference}
          onEdit={handleEditImage}
        />
      )}
    </div>
  );
};

export default App;