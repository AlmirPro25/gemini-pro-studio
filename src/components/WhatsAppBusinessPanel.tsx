/**
 * 📱 WHATSAPP BUSINESS PANEL - COMPLETO
 * 
 * Interface IDÊNTICA ao WhatsApp Business Web
 * Com TODAS as funcionalidades: Status, Catálogo, Cobranças, Configurações, etc.
 */

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WhatsAppMessage {
  id: string;
  from: string;
  fromName: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  type: string;
  isFromMe?: boolean;
  media?: {
    mimetype: string;
    data: string;
    filename?: string;
  };
}

interface WhatsAppChat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

type SidebarView = 'chats' | 'status' | 'channels' | 'communities' | 'settings' | 'business';

const BRIDGE_URL = (import.meta as any).env?.VITE_WHATSAPP_BRIDGE_URL || 'http://localhost:3001';

// Componente de Avatar com foto ou inicial colorida
const ContactAvatar: React.FC<{
  name: string;
  chatId: string;
  profilePicUrl?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ name, chatId, profilePicUrl, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-10 h-10 text-base',
    medium: 'w-12 h-12 text-lg',
    large: 'w-48 h-48 text-7xl'
  };

  const colorHue = name.charCodeAt(0) * 137.5 % 360;
  const backgroundColor = `hsl(${colorHue}, 50%, 50%)`;

  if (profilePicUrl) {
    return (
      <img 
        src={profilePicUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
        onError={(e) => {
          // Se a imagem falhar, mostra avatar colorido
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0" style="background-color: ${backgroundColor}">
                <span class="text-white font-semibold">${name.charAt(0).toUpperCase()}</span>
              </div>
            `;
          }
        }}
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor }}
    >
      <span className="text-white font-semibold">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export const WhatsAppBusinessPanel: React.FC = () => {
  const [isWhatsAppReady, setIsWhatsAppReady] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>('chats');
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [contactMedia, setContactMedia] = useState<{images: any[], videos: any[], audios: any[], documents: any[]}>({
    images: [],
    videos: [],
    audios: [],
    documents: []
  });
  const [mediaTab, setMediaTab] = useState<'all' | 'images' | 'videos' | 'audios' | 'documents'>('all');
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [profilePics, setProfilePics] = useState<Map<string, string>>(new Map());
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingCanceled, setRecordingCanceled] = useState(false);
  
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Conecta ao Socket.IO
  useEffect(() => {
    const socket = io(BRIDGE_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Conectado ao WhatsApp Bridge');
      loadChats();
    });

    socket.on('whatsapp:qr', (qr: string) => {
      setQrCode(qr);
      setIsWhatsAppReady(false);
    });

    socket.on('whatsapp:ready', () => {
      setIsWhatsAppReady(true);
      setQrCode(null);
      loadChats();
    });

    socket.on('whatsapp:message', (msg: WhatsAppMessage) => {
      if (selectedChat && msg.from === selectedChat.id) {
        setMessages(prev => [...prev, msg]);
      }
      loadChats();
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/chats`);
      if (response.ok) {
        const data = await response.json();
        setChats(data);
        
        // Carrega fotos de perfil de todos os chats
        loadProfilePics(data);
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
    }
  };

  // Carrega fotos de perfil em lote
  const loadProfilePics = async (chatList: WhatsAppChat[]) => {
    const newProfilePics = new Map(profilePics);
    
    for (const chat of chatList) {
      // Pula se já tem a foto
      if (newProfilePics.has(chat.id)) continue;
      
      try {
        const response = await fetch(`${BRIDGE_URL}/api/profile-pic/${encodeURIComponent(chat.id)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.profilePicUrl) {
            newProfilePics.set(chat.id, data.profilePicUrl);
          }
        }
      } catch (error) {
        // Silenciosamente ignora erros (usará avatar colorido)
      }
    }
    
    setProfilePics(newProfilePics);
  };

  const handleSelectChat = async (chat: WhatsAppChat) => {
    setSelectedChat(chat);
    setMessages([]);
    setShowContactInfo(false);
    
    try {
      // Primeiro tenta carregar do WhatsApp diretamente (histórico completo)
      const whatsappResponse = await fetch(`${BRIDGE_URL}/api/messages/${chat.id}?limit=1000`);
      if (whatsappResponse.ok) {
        const whatsappData = await whatsappResponse.json();
        const formattedMessages = whatsappData.map((msg: any) => ({
          id: msg.id,
          from: msg.fromMe ? 'me' : msg.from,
          fromName: msg.fromMe ? 'Você' : chat.name,
          body: msg.body,
          timestamp: msg.timestamp,
          hasMedia: msg.hasMedia,
          type: msg.type,
          isFromMe: msg.fromMe,
          media: msg.media
        }));
        setMessages(formattedMessages);
        console.log(`✅ Carregadas ${formattedMessages.length} mensagens do WhatsApp`);
        
        // Extrai mídias das mensagens
        extractMediaFromMessages(formattedMessages);
      } else {
        // Fallback: carrega do banco SQLite
        const dbResponse = await fetch(`${BRIDGE_URL}/api/db/messages/${encodeURIComponent(chat.id)}?limit=1000`);
        if (dbResponse.ok) {
          const data = await dbResponse.json();
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.message_id,
            from: msg.is_from_me ? 'me' : msg.from,
            fromName: msg.is_from_me ? 'Você' : chat.name,
            body: msg.content,
            timestamp: new Date(msg.timestamp).getTime() / 1000,
            hasMedia: !!msg.media_url,
            type: msg.type,
            isFromMe: msg.is_from_me
          }));
          setMessages(formattedMessages);
          console.log(`✅ Carregadas ${formattedMessages.length} mensagens do banco`);
          extractMediaFromMessages(formattedMessages);
        }
      }

      // Carrega informações do contato
      loadContactInfo(chat.id);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Extrai mídias das mensagens
  const extractMediaFromMessages = (msgs: WhatsAppMessage[]) => {
    const images: any[] = [];
    const videos: any[] = [];
    const audios: any[] = [];
    const documents: any[] = [];

    msgs.forEach(msg => {
      if (msg.hasMedia && msg.media) {
        const mediaItem = {
          id: msg.id,
          timestamp: msg.timestamp,
          from: msg.fromName,
          isFromMe: msg.isFromMe,
          ...msg.media
        };

        if (msg.media.mimetype.startsWith('image/')) {
          images.push(mediaItem);
        } else if (msg.media.mimetype.startsWith('video/')) {
          videos.push(mediaItem);
        } else if (msg.media.mimetype.startsWith('audio/')) {
          audios.push(mediaItem);
        } else {
          documents.push(mediaItem);
        }
      }
    });

    setContactMedia({ images, videos, audios, documents });
    console.log(`📊 Mídia extraída: ${images.length} imagens, ${videos.length} vídeos, ${audios.length} áudios, ${documents.length} documentos`);
  };

  // Carrega informações do contato
  const loadContactInfo = async (chatId: string) => {
    try {
      // Tenta carregar foto do perfil do WhatsApp diretamente
      const chatResponse = await fetch(`${BRIDGE_URL}/api/chats`);
      if (chatResponse.ok) {
        const chats = await chatResponse.json();
        const currentChat = chats.find((c: any) => c.id === chatId);
        
        if (currentChat) {
          // Busca foto do perfil via API do WhatsApp
          try {
            const profilePicResponse = await fetch(`${BRIDGE_URL}/api/profile-pic/${encodeURIComponent(chatId)}`);
            if (profilePicResponse.ok) {
              const profileData = await profilePicResponse.json();
              setContactInfo({
                phone_number: chatId,
                name: currentChat.name,
                profile_pic_url: profileData.profilePicUrl,
                is_group: false
              });
              console.log('✅ Foto do perfil carregada:', profileData.profilePicUrl);
              return;
            }
          } catch (err) {
            console.log('⚠️ Foto do perfil não disponível, usando avatar padrão');
          }
        }
      }

      // Fallback: carrega do banco
      const response = await fetch(`${BRIDGE_URL}/api/db/contacts`);
      if (response.ok) {
        const data = await response.json();
        const contact = data.contacts.find((c: any) => c.phone_number === chatId);
        if (contact) {
          setContactInfo(contact);
          console.log('✅ Informações do contato carregadas do banco:', contact);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar informações do contato:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!inputMessage.trim() && !selectedFile) || !selectedChat || isSending) return;
    
    setIsSending(true);
    
    try {
      let mediaBase64 = null;
      let mediaMimetype = null;

      // Se tem arquivo selecionado, converte para base64
      if (selectedFile) {
        const reader = new FileReader();
        mediaBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(selectedFile);
        });
        mediaMimetype = selectedFile.type;
      }

      const response = await fetch(`${BRIDGE_URL}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedChat.id,
          message: inputMessage || (selectedFile ? selectedFile.name : ''),
          mediaBase64,
          mediaMimetype
        })
      });
      
      if (response.ok) {
        const newMsg: WhatsAppMessage = {
          id: `temp_${Date.now()}`,
          from: 'me',
          fromName: 'Você',
          body: inputMessage || (selectedFile ? selectedFile.name : ''),
          timestamp: Date.now() / 1000,
          hasMedia: !!selectedFile,
          type: selectedFile ? 'media' : 'chat',
          isFromMe: true,
          media: selectedFile ? {
            mimetype: selectedFile.type,
            data: mediaBase64!,
            filename: selectedFile.name
          } : undefined
        };
        setMessages(prev => [...prev, newMsg]);
        setInputMessage('');
        setSelectedFile(null);
        setFilePreview(null);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Selecionar arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Criar preview para imagens e vídeos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Gravar áudio (segurar para gravar, soltar para enviar)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Para o stream
        stream.getTracks().forEach(track => track.stop());

        // Se foi cancelado, não envia
        if (recordingCanceled) {
          console.log('🚫 Gravação cancelada');
          setRecordingCanceled(false);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        
        // Envia o áudio usando endpoint específico
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          
          try {
            console.log('📤 Enviando áudio...');
            
            const response = await fetch(`${BRIDGE_URL}/api/send-audio`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: selectedChat!.id,
                audioBase64: base64
              })
            });
            
            if (response.ok) {
              const newMsg: WhatsAppMessage = {
                id: `temp_${Date.now()}`,
                from: 'me',
                fromName: 'Você',
                body: '',
                timestamp: Date.now() / 1000,
                hasMedia: true,
                type: 'ptt',
                isFromMe: true,
                media: {
                  mimetype: 'audio/ogg; codecs=opus',
                  data: base64,
                  filename: 'audio.ogg'
                }
              };
              setMessages(prev => [...prev, newMsg]);
              console.log('✅ Áudio enviado com sucesso!');
            } else {
              const error = await response.json();
              console.error('❌ Erro ao enviar áudio:', error);
              alert('Erro ao enviar áudio. Tente novamente.');
            }
          } catch (error) {
            console.error('❌ Erro ao enviar áudio:', error);
            alert('Erro ao enviar áudio. Verifique sua conexão.');
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingCanceled(false);
      
      // Contador de tempo
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('🎤 Gravando áudio...');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      if (cancel) {
        setRecordingCanceled(true);
      }
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      console.log(cancel ? '🚫 Gravação cancelada' : '✅ Gravação finalizada');
    }
  };

  const cancelRecording = () => {
    stopRecording(true);
  };

  // Formata tempo de gravação
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Renderiza QR Code
  if (!isWhatsAppReady && qrCode) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#111b21]">
        <div className="max-w-md w-full bg-[#202c33] rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#25d366] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-brands fa-whatsapp text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-[#e9edef] mb-2">Conectar WhatsApp</h2>
            <p className="text-[#8696a0]">Escaneie o QR Code com seu WhatsApp</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl mb-6">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
              alt="QR Code"
              className="w-full h-auto"
            />
          </div>
          
          <div className="space-y-2 text-sm text-[#8696a0]">
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#25d366] text-[#111b21] rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Abra o WhatsApp no seu celular
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#25d366] text-[#111b21] rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Toque em Menu ou Configurações
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#25d366] text-[#111b21] rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Toque em Aparelhos conectados
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#25d366] text-[#111b21] rounded-full flex items-center justify-center text-xs font-bold">4</span>
              Escaneie este código QR
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza painel principal
  return (
    <div className="flex h-full bg-[#111b21]">
      {/* SIDEBAR ESQUERDA - Ícones Verticais */}
      <div className="w-[60px] bg-[#202c33] flex flex-col items-center py-3 gap-4 border-r border-[#2a3942]">
        {/* Ícone WhatsApp */}
        <button 
          onClick={() => setSidebarView('chats')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            sidebarView === 'chats' ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]'
          }`}
          title="Conversas"
        >
          <i className="fa-solid fa-comment text-[#aebac1] text-xl"></i>
        </button>

        {/* Status */}
        <button 
          onClick={() => setSidebarView('status')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            sidebarView === 'status' ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]'
          }`}
          title="Status"
        >
          <i className="fa-regular fa-circle-dot text-[#aebac1] text-xl"></i>
        </button>

        {/* Canais */}
        <button 
          onClick={() => setSidebarView('channels')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            sidebarView === 'channels' ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]'
          }`}
          title="Canais"
        >
          <i className="fa-solid fa-bullhorn text-[#aebac1] text-xl"></i>
        </button>

        {/* Comunidades */}
        <button 
          onClick={() => setSidebarView('communities')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            sidebarView === 'communities' ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]'
          }`}
          title="Comunidades"
        >
          <i className="fa-solid fa-users text-[#aebac1] text-xl"></i>
        </button>

        {/* Ferramentas Comerciais */}
        <button 
          onClick={() => setSidebarView('business')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            sidebarView === 'business' ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]'
          }`}
          title="Ferramentas comerciais"
        >
          <i className="fa-solid fa-briefcase text-[#aebac1] text-xl"></i>
        </button>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Configurações */}
        <button 
          onClick={() => setSidebarView('settings')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            sidebarView === 'settings' ? 'bg-[#2a3942]' : 'hover:bg-[#2a3942]'
          }`}
          title="Configurações"
        >
          <i className="fa-solid fa-gear text-[#aebac1] text-xl"></i>
        </button>

        {/* Perfil */}
        <button className="w-10 h-10 bg-[#6b7c85] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
          <i className="fa-solid fa-user text-[#111b21] text-lg"></i>
        </button>
      </div>

      {/* ÁREA CENTRAL - Lista/Conteúdo */}
      <div className="w-[400px] bg-[#111b21] border-r border-[#2a3942] flex flex-col">
        {/* Renderiza conteúdo baseado na view selecionada */}
        {sidebarView === 'chats' && (
          <>
            {/* Header */}
            <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
              <h2 className="text-[#e9edef] font-medium text-xl">WhatsApp</h2>
              <div className="flex items-center gap-4">
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-camera text-xl"></i>
                </button>
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-plus text-xl"></i>
                </button>
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                </button>
              </div>
            </div>

            {/* Barra de Pesquisa */}
            <div className="px-3 py-2 bg-[#111b21]">
              <div className="bg-[#202c33] rounded-lg px-4 py-2 flex items-center gap-3">
                <i className="fa-solid fa-magnifying-glass text-[#aebac1] text-sm"></i>
                <input
                  type="text"
                  placeholder="Pesquisar ou começar uma nova conversa"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[#e9edef] text-[14px] placeholder-[#667781] outline-none"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="px-3 py-2 flex items-center gap-2 border-b border-[#2a3942]">
              <button className="px-3 py-1.5 bg-[#2a3942] text-[#e9edef] text-sm rounded-full">
                Tudo
              </button>
              <button className="px-3 py-1.5 text-[#8696a0] text-sm rounded-full hover:bg-[#2a3942] transition-colors">
                Não lidas
              </button>
              <button className="px-3 py-1.5 text-[#8696a0] text-sm rounded-full hover:bg-[#2a3942] transition-colors">
                Favoritas
              </button>
              <button className="px-3 py-1.5 text-[#8696a0] text-sm rounded-full hover:bg-[#2a3942] transition-colors">
                Grupos
              </button>
            </div>

            {/* Lista de Chats */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-transparent">
              {chats.filter(chat => 
                chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(chat => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`px-4 py-3 cursor-pointer transition-colors border-b border-[#2a3942] ${
                    selectedChat?.id === chat.id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar com foto real ou colorido */}
                    <ContactAvatar 
                      name={chat.name}
                      chatId={chat.id}
                      profilePicUrl={profilePics.get(chat.id)}
                      size="medium"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-medium text-[#e9edef] text-[15px] truncate">{chat.name}</h3>
                        <span className="text-[#667781] text-xs">
                          {new Date(chat.timestamp * 1000).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] text-[#8696a0] truncate flex-1">{chat.lastMessage}</p>
                        {chat.unreadCount > 0 && (
                          <span className="bg-[#25d366] text-[#111b21] text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VIEW: STATUS */}
        {sidebarView === 'status' && (
          <div className="flex-1 flex flex-col">
            <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
              <h2 className="text-[#e9edef] font-medium text-xl">Status</h2>
              <button className="text-[#aebac1] hover:text-white transition-colors">
                <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-32 h-32 bg-[#2a3942] rounded-full flex items-center justify-center mb-6">
                <i className="fa-regular fa-circle-dot text-[#667781] text-6xl"></i>
              </div>
              <h3 className="text-[24px] font-light text-[#e9edef] mb-3">Compartilhe atualizações de status</h3>
              <p className="text-[14px] text-[#8696a0] max-w-sm mb-6">
                Compartilhe fotos, vídeos e textos que desaparecem após 24 horas.
              </p>
              <button className="bg-[#25d366] hover:bg-[#20bd5f] text-[#111b21] px-6 py-2.5 rounded-full font-medium transition-colors">
                Criar status
              </button>
            </div>
          </div>
        )}

        {/* VIEW: FERRAMENTAS COMERCIAIS */}
        {sidebarView === 'business' && (
          <div className="flex-1 flex flex-col">
            <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
              <h2 className="text-[#e9edef] font-medium text-xl">Ferramentas comerciais</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-1">
                <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-[#2a3942] rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-user-tie text-[#aebac1] text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium text-[15px]">Perfil comercial</h3>
                    <p className="text-[#8696a0] text-[13px]">Gerencie o endereço, horário de atendimento e s</p>
                  </div>
                </button>

                <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-[#2a3942] rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-grid-2 text-[#aebac1] text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium text-[15px]">Catálogo</h3>
                    <p className="text-[#8696a0] text-[13px]">Exiba produtos e serviços</p>
                  </div>
                </button>

                <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-[#2a3942] rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-receipt text-[#aebac1] text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium text-[15px]">Cobranças</h3>
                    <p className="text-[#8696a0] text-[13px]">Gerencie cobranças e pagamentos</p>
                  </div>
                </button>

                <div className="pt-4 pb-2">
                  <p className="text-[#25d366] text-[13px] font-medium px-4">Conecte-se com mais clientes</p>
                </div>

                <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-[#2a3942] rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-bullhorn text-[#aebac1] text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium text-[15px]">Anunciar</h3>
                    <p className="text-[#8696a0] text-[13px]">Crie anúncios que levam ao WhatsApp</p>
                  </div>
                </button>

                <div className="pt-4 pb-2">
                  <p className="text-[#25d366] text-[13px] font-medium px-4">Conversa</p>
                </div>

                <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-[#2a3942] rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-bolt text-[#aebac1] text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium text-[15px]">Respostas rápidas</h3>
                    <p className="text-[#8696a0] text-[13px]">Reutilize mensagens frequentes</p>
                  </div>
                </button>

                <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-[#2a3942] rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-tag text-[#aebac1] text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium text-[15px]">Etiquetas</h3>
                    <p className="text-[#8696a0] text-[13px]">Organize conversas e clientes</p>
                  </div>
                </button>

                <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] rounded-lg transition-colors text-left">
                  <div className="w-10 h-10 bg-[#2a3942] rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-circle-question text-[#aebac1] text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium text-[15px]">Central de Ajuda para empresas</h3>
                    <p className="text-[#8696a0] text-[13px]">Obtenha ajuda, fale conosco, Política de Privacidade</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CONFIGURAÇÕES */}
        {sidebarView === 'settings' && (
          <div className="flex-1 flex flex-col">
            <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
              <h2 className="text-[#e9edef] font-medium text-xl">Configurações</h2>
            </div>

            {/* Barra de Pesquisa */}
            <div className="px-3 py-2 bg-[#111b21]">
              <div className="bg-[#202c33] rounded-lg px-4 py-2 flex items-center gap-3">
                <i className="fa-solid fa-magnifying-glass text-[#aebac1] text-sm"></i>
                <input
                  type="text"
                  placeholder="Pesquisar configurações"
                  className="flex-1 bg-transparent text-[#e9edef] text-[14px] placeholder-[#667781] outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Perfil do Usuário */}
              <div className="px-4 py-4 border-b border-[#2a3942]">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-[#6b7c85] rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-user text-[#111b21] text-2xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium text-[16px]">fé</h3>
                    <p className="text-[#8696a0] text-[14px]">Olá! Eu estou usando o WhatsApp.</p>
                  </div>
                </div>
              </div>

              {/* Ferramentas comerciais */}
              <div className="px-4 py-3 border-b border-[#2a3942]">
                <button className="w-full flex items-center gap-4 py-2 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-briefcase text-[#aebac1] text-xl w-8"></i>
                  <span className="text-[#e9edef] text-[15px]">Ferramentas comerciais</span>
                </button>
              </div>

              {/* Opções */}
              <div className="px-4 py-2 space-y-1">
                <button className="w-full flex items-center gap-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-key text-[#aebac1] text-xl w-8"></i>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] text-[15px]">Conta</h3>
                    <p className="text-[#8696a0] text-[13px]">Notificações de segurança, dados da conta</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-lock text-[#aebac1] text-xl w-8"></i>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] text-[15px]">Privacidade</h3>
                    <p className="text-[#8696a0] text-[13px]">Contatos bloqueados, mensagens temporárias</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-user text-[#aebac1] text-xl w-8"></i>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] text-[15px]">Avatar</h3>
                    <p className="text-[#8696a0] text-[13px]">Crie, edite e compartilhe seu avatar</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-message text-[#aebac1] text-xl w-8"></i>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] text-[15px]">Conversas</h3>
                    <p className="text-[#8696a0] text-[13px]">Tema, papel de parede, configurações de conversas</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-bell text-[#aebac1] text-xl w-8"></i>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] text-[15px]">Notificações</h3>
                    <p className="text-[#8696a0] text-[13px]">Notificações de mensagens</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-database text-[#aebac1] text-xl w-8"></i>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] text-[15px]">Armazenamento</h3>
                    <p className="text-[#8696a0] text-[13px]">Gerencie o armazenamento de dados</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-keyboard text-[#aebac1] text-xl w-8"></i>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] text-[15px]">Atalhos do teclado</h3>
                    <p className="text-[#8696a0] text-[13px]">Ações rápidas</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 py-3 hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-circle-question text-[#aebac1] text-xl w-8"></i>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] text-[15px]">Ajuda</h3>
                    <p className="text-[#8696a0] text-[13px]">Central de Ajuda, fale conosco, Política de Privacidade</p>
                  </div>
                </button>
              </div>

              {/* Desconectar */}
              <div className="px-4 py-4 border-t border-[#2a3942]">
                <button className="w-full flex items-center gap-4 py-2 text-[#ea5545] hover:bg-[#202c33] rounded-lg transition-colors">
                  <i className="fa-solid fa-right-from-bracket text-xl w-8"></i>
                  <span className="text-[15px]">Desconectar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Outras views (Canais, Comunidades) */}
        {(sidebarView === 'channels' || sidebarView === 'communities') && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-32 h-32 bg-[#2a3942] rounded-full flex items-center justify-center mb-6">
              <i className={`fa-solid ${sidebarView === 'channels' ? 'fa-bullhorn' : 'fa-users'} text-[#667781] text-6xl`}></i>
            </div>
            <h3 className="text-[24px] font-light text-[#e9edef] mb-3">
              {sidebarView === 'channels' ? 'Canais' : 'Comunidades'}
            </h3>
            <p className="text-[14px] text-[#8696a0] max-w-sm">
              {sidebarView === 'channels' 
                ? 'Siga canais para receber atualizações de pessoas e organizações.' 
                : 'Organize grupos relacionados e envie anúncios para todos.'}
            </p>
          </div>
        )}
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-[#2a3942] rounded-lg px-2 py-1 -ml-2 transition-colors"
                onClick={() => setShowContactInfo(!showContactInfo)}
              >
                <ContactAvatar 
                  name={selectedChat.name}
                  chatId={selectedChat.id}
                  profilePicUrl={contactInfo?.profile_pic_url || profilePics.get(selectedChat.id)}
                  size="small"
                />
                <div>
                  <h3 className="font-medium text-[#e9edef] text-[15px]">{selectedChat.name}</h3>
                  <p className="text-xs text-[#8696a0]">clique para mostrar os dados do contato</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-video text-xl"></i>
                </button>
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-phone text-xl"></i>
                </button>
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-magnifying-glass text-xl"></i>
                </button>
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div 
              className="flex-1 overflow-y-auto px-16 py-6 space-y-2 scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-transparent"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#0b141a'
              }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-[#2a3942] rounded-full flex items-center justify-center mb-4">
                    <i className="fa-solid fa-lock text-[#667781] text-4xl"></i>
                  </div>
                  <p className="text-[#8696a0] text-sm max-w-md">
                    As mensagens e chamadas são protegidas com a criptografia de ponta a ponta.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isFromMe = msg.isFromMe || msg.from === 'me';
                  
                  return (
                    <div key={msg.id || idx} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                      <div className={`max-w-[65%] rounded-lg shadow-whatsapp ${
                        isFromMe
                          ? 'bg-[#005c4b] rounded-br-none'
                          : 'bg-[#202c33] rounded-bl-none'
                      } ${msg.hasMedia ? 'p-1' : 'px-3 py-2'}`}>
                        {msg.hasMedia && msg.media && (
                          <div className={msg.body ? 'mb-2' : ''}>
                            {msg.media.mimetype.startsWith('image/') && (
                              <img 
                                src={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                                alt="Imagem"
                                className="rounded-md max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(`data:${msg.media.mimetype};base64,${msg.media.data}`, '_blank')}
                              />
                            )}
                            {msg.media.mimetype.startsWith('video/') && (
                              <video 
                                src={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                                controls
                                className="rounded-md max-w-full"
                              />
                            )}
                            {msg.media.mimetype.startsWith('audio/') && (
                              <div className="flex items-center gap-2 px-2 py-1">
                                <i className="fa-solid fa-microphone text-[#e9edef]"></i>
                                <audio 
                                  src={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                                  controls
                                  className="flex-1"
                                  style={{ height: '32px' }}
                                />
                              </div>
                            )}
                            {msg.media.mimetype === 'application/pdf' && (
                              <div className="flex items-center gap-2 px-2 py-2 bg-[#2a3942] rounded-md">
                                <i className="fa-solid fa-file-pdf text-[#ea5545] text-2xl"></i>
                                <div className="flex-1">
                                  <p className="text-[#e9edef] text-sm font-medium">{msg.media.filename || 'Documento.pdf'}</p>
                                  <p className="text-[#8696a0] text-xs">PDF</p>
                                </div>
                                <a 
                                  href={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                                  download={msg.media.filename || 'documento.pdf'}
                                  className="text-[#25d366] hover:text-[#20bd5f]"
                                >
                                  <i className="fa-solid fa-download"></i>
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {msg.body && !msg.body.startsWith('🎤') && (
                          <p className={`text-[14.2px] text-[#e9edef] leading-[19px] whitespace-pre-wrap break-words ${msg.hasMedia ? 'px-2 pb-2' : ''}`}>
                            {msg.body}
                          </p>
                        )}
                        
                        <div className={`flex items-center justify-end gap-1 ${msg.hasMedia ? 'px-2 pb-1' : 'mt-1'}`}>
                          <span className="text-[11px] text-[#8696a0]">
                            {new Date(msg.timestamp * 1000).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {isFromMe && (
                            <i className="fa-solid fa-check-double text-[#53bdeb] text-xs"></i>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="px-4 py-3 bg-[#202c33]">
              {/* Preview de arquivo */}
              {filePreview && !isRecording && (
                <div className="mb-2 relative inline-block">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img src={filePreview} alt="Preview" className="max-h-32 rounded-lg" />
                  ) : selectedFile?.type.startsWith('video/') ? (
                    <video src={filePreview} className="max-h-32 rounded-lg" controls />
                  ) : (
                    <div className="bg-[#2a3942] px-4 py-2 rounded-lg flex items-center gap-2">
                      <i className="fa-solid fa-file text-[#aebac1]"></i>
                      <span className="text-[#e9edef] text-sm">{selectedFile?.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[#ea5545] rounded-full flex items-center justify-center hover:bg-[#d94a3a] transition-colors"
                  >
                    <i className="fa-solid fa-xmark text-white text-xs"></i>
                  </button>
                </div>
              )}

              {/* Interface de gravação de áudio (igual WhatsApp) */}
              {isRecording ? (
                <div className="flex items-center gap-3 bg-[#1e2a32] rounded-lg px-4 py-3">
                  {/* Botão de cancelar (lixeira) */}
                  <button
                    onClick={cancelRecording}
                    className="text-[#ea5545] hover:text-[#d94a3a] transition-colors"
                    title="Cancelar gravação"
                  >
                    <i className="fa-solid fa-trash text-xl"></i>
                  </button>

                  {/* Indicador de gravação */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 bg-[#ea5545] rounded-full animate-pulse"></div>
                    <span className="text-[#ea5545] font-medium">{formatRecordingTime(recordingTime)}</span>
                    
                    {/* Barra de onda (visual) */}
                    <div className="flex-1 flex items-center gap-0.5 h-8">
                      {[...Array(30)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#25d366] rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Botão de enviar */}
                  <button
                    onClick={() => stopRecording(false)}
                    className="w-12 h-12 bg-[#25d366] hover:bg-[#20bd5f] rounded-full flex items-center justify-center transition-colors"
                    title="Enviar áudio"
                  >
                    <i className="fa-solid fa-paper-plane text-[#111b21] text-lg"></i>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* Input de arquivo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Botão de anexar */}
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[#aebac1] hover:text-white transition-colors p-2"
                    title="Anexar arquivo"
                  >
                    <i className="fa-solid fa-paperclip text-2xl"></i>
                  </button>

                  <div className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2.5 flex items-center gap-2">
                    <button type="button" className="text-[#aebac1] hover:text-white transition-colors">
                      <i className="fa-solid fa-face-smile text-xl"></i>
                    </button>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Digite uma mensagem"
                      className="flex-1 bg-transparent text-[#e9edef] text-[15px] placeholder-[#8696a0] outline-none"
                      disabled={isSending}
                    />
                  </div>

                  {/* Botão de áudio/enviar */}
                  {inputMessage.trim() || selectedFile ? (
                    <button
                      type="submit"
                      disabled={isSending}
                      className="text-[#25d366] hover:text-[#20bd5f] transition-colors p-2 disabled:opacity-50"
                    >
                      <i className="fa-solid fa-paper-plane text-2xl"></i>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={startRecording}
                      onMouseUp={() => stopRecording(false)}
                      onMouseLeave={() => isRecording && cancelRecording()}
                      onTouchStart={startRecording}
                      onTouchEnd={() => stopRecording(false)}
                      className="text-[#aebac1] hover:text-white transition-colors p-2 select-none"
                      title="Segurar para gravar áudio"
                    >
                      <i className="fa-solid fa-microphone text-2xl"></i>
                    </button>
                  )}
                </form>
              )}
            </div>
          </>
        ) : (
          <div 
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0b141a'
            }}
          >
            <div className="w-32 h-32 border-[6px] border-[#2a3942] rounded-full flex items-center justify-center mb-8">
              <i className="fa-brands fa-whatsapp text-7xl text-[#667781]"></i>
            </div>
            <h3 className="text-[32px] font-light text-[#e9edef] mb-4">WhatsApp Web</h3>
            <p className="text-[14px] text-[#8696a0] max-w-md leading-relaxed mb-6">
              Envie e receba mensagens sem precisar manter seu celular conectado à internet.
            </p>
            <div className="flex items-center gap-2 text-[#8696a0] text-sm">
              <i className="fa-solid fa-lock text-xs"></i>
              <span>Suas mensagens pessoais são protegidas com criptografia de ponta a ponta</span>
            </div>
          </div>
        )}
      </div>

      {/* PAINEL DE INFORMAÇÕES DO CONTATO */}
      {showContactInfo && selectedChat && (
        <div className="w-[400px] bg-[#111b21] border-l border-[#2a3942] flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-transparent">
          {/* Header */}
          <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
            <h2 className="text-[#e9edef] font-medium text-[16px]">Dados do contato</h2>
            <button 
              onClick={() => setShowContactInfo(false)}
              className="text-[#aebac1] hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
          </div>

          {/* Perfil */}
          <div className="flex flex-col items-center py-8 bg-[#202c33] border-b border-[#2a3942]">
            {/* Foto do perfil grande */}
            <div className="mb-4">
              <ContactAvatar 
                name={selectedChat.name}
                chatId={selectedChat.id}
                profilePicUrl={contactInfo?.profile_pic_url || profilePics.get(selectedChat.id)}
                size="large"
              />
            </div>

            {/* Nome */}
            <h3 className="text-[#e9edef] font-medium text-[20px] mb-1">{selectedChat.name}</h3>
            
            {/* Número */}
            <p className="text-[#8696a0] text-[14px] mb-2">
              {selectedChat.id.replace('@c.us', '')}
            </p>

            {/* Estatísticas */}
            <div className="flex gap-4 mt-4">
              <div className="text-center">
                <p className="text-[#e9edef] font-bold text-lg">{messages.length}</p>
                <p className="text-[#8696a0] text-xs">Mensagens</p>
              </div>
              <div className="text-center">
                <p className="text-[#e9edef] font-bold text-lg">
                  {contactMedia.images.length + contactMedia.videos.length}
                </p>
                <p className="text-[#8696a0] text-xs">Mídias</p>
              </div>
              <div className="text-center">
                <p className="text-[#e9edef] font-bold text-lg">{contactMedia.documents.length}</p>
                <p className="text-[#8696a0] text-xs">Docs</p>
              </div>
            </div>

            {/* Primeira/Última mensagem */}
            {messages.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-[#8696a0] text-xs">
                  Primeira mensagem: {new Date(messages[0].timestamp * 1000).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-[#8696a0] text-xs">
                  Última mensagem: {new Date(messages[messages.length - 1].timestamp * 1000).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="py-2 border-b border-[#2a3942]">
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] transition-colors">
              <i className="fa-solid fa-share-nodes text-[#aebac1] text-xl"></i>
              <span className="text-[#e9edef] text-[15px]">Compartilhar</span>
            </button>
          </div>

          {/* Notas */}
          <div className="py-4 px-4 border-b border-[#2a3942]">
            <button className="w-full flex items-center justify-between hover:bg-[#202c33] rounded-lg p-2 transition-colors">
              <span className="text-[#8696a0] text-[14px]">Adicione notas sobre seu cliente.</span>
              <i className="fa-solid fa-pen text-[#aebac1] text-sm"></i>
            </button>
          </div>

          {/* Conta comercial */}
          <div className="py-4 px-4 border-b border-[#2a3942]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#8696a0] text-[13px]">Conta comercial</span>
              <i className="fa-solid fa-circle-info text-[#aebac1] text-sm"></i>
            </div>
            <div className="flex items-center gap-2 text-[#e9edef] text-[14px]">
              <span>sábado</span>
              <span className="text-[#8696a0]">•</span>
              <span>Fechada</span>
              <i className="fa-solid fa-chevron-down text-[#aebac1] text-xs ml-auto"></i>
            </div>
          </div>

          {/* Mídia, links e docs */}
          <div className="py-4 px-4 border-b border-[#2a3942]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#e9edef] text-[15px]">Mídia, links e docs</span>
              <div className="flex items-center gap-2">
                <span className="text-[#25d366] text-[14px]">
                  {contactMedia.images.length + contactMedia.videos.length + contactMedia.audios.length + contactMedia.documents.length}
                </span>
                <i className="fa-solid fa-chevron-right text-[#aebac1] text-sm"></i>
              </div>
            </div>

            {/* Tabs de mídia */}
            <div className="flex gap-2 mb-3 overflow-x-auto">
              <button
                onClick={() => setMediaTab('all')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  mediaTab === 'all' ? 'bg-[#25d366] text-[#111b21]' : 'bg-[#2a3942] text-[#8696a0]'
                }`}
              >
                Tudo ({contactMedia.images.length + contactMedia.videos.length + contactMedia.audios.length + contactMedia.documents.length})
              </button>
              <button
                onClick={() => setMediaTab('images')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  mediaTab === 'images' ? 'bg-[#25d366] text-[#111b21]' : 'bg-[#2a3942] text-[#8696a0]'
                }`}
              >
                Fotos ({contactMedia.images.length})
              </button>
              <button
                onClick={() => setMediaTab('videos')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  mediaTab === 'videos' ? 'bg-[#25d366] text-[#111b21]' : 'bg-[#2a3942] text-[#8696a0]'
                }`}
              >
                Vídeos ({contactMedia.videos.length})
              </button>
              <button
                onClick={() => setMediaTab('audios')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  mediaTab === 'audios' ? 'bg-[#25d366] text-[#111b21]' : 'bg-[#2a3942] text-[#8696a0]'
                }`}
              >
                Áudios ({contactMedia.audios.length})
              </button>
              <button
                onClick={() => setMediaTab('documents')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                  mediaTab === 'documents' ? 'bg-[#25d366] text-[#111b21]' : 'bg-[#2a3942] text-[#8696a0]'
                }`}
              >
                Docs ({contactMedia.documents.length})
              </button>
            </div>

            {/* Grid de mídia */}
            <div className="grid grid-cols-3 gap-1 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-transparent">
              {/* Imagens */}
              {(mediaTab === 'all' || mediaTab === 'images') && contactMedia.images.map((img, idx) => (
                <div 
                  key={`img-${idx}`} 
                  className="aspect-square bg-[#2a3942] rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                  onClick={() => window.open(`data:${img.mimetype};base64,${img.data}`, '_blank')}
                >
                  <img 
                    src={`data:${img.mimetype};base64,${img.data}`}
                    alt="Mídia"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback se a imagem não carregar
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><i class="fa-solid fa-image text-[#667781] text-2xl"></i></div>';
                      }
                    }}
                    loading="lazy"
                  />
                  {/* Overlay com data */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(img.timestamp * 1000).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}

              {/* Vídeos */}
              {(mediaTab === 'all' || mediaTab === 'videos') && contactMedia.videos.map((video, idx) => (
                <div 
                  key={`video-${idx}`} 
                  className="aspect-square bg-[#2a3942] rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                >
                  <video 
                    src={`data:${video.mimetype};base64,${video.data}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <i className="fa-solid fa-play text-white text-2xl"></i>
                  </div>
                </div>
              ))}

              {/* Áudios */}
              {(mediaTab === 'all' || mediaTab === 'audios') && contactMedia.audios.map((audio, idx) => (
                <div 
                  key={`audio-${idx}`} 
                  className="aspect-square bg-[#2a3942] rounded-md overflow-hidden flex flex-col items-center justify-center p-2"
                >
                  <i className="fa-solid fa-microphone text-[#25d366] text-3xl mb-2"></i>
                  <span className="text-[#8696a0] text-xs text-center">
                    {new Date(audio.timestamp * 1000).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}

              {/* Documentos */}
              {(mediaTab === 'all' || mediaTab === 'documents') && contactMedia.documents.map((doc, idx) => (
                <div 
                  key={`doc-${idx}`} 
                  className="aspect-square bg-[#2a3942] rounded-md overflow-hidden flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-[#374045] transition-colors"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `data:${doc.mimetype};base64,${doc.data}`;
                    link.download = doc.filename || 'documento';
                    link.click();
                  }}
                >
                  <i className="fa-solid fa-file-pdf text-[#ea5545] text-3xl mb-2"></i>
                  <span className="text-[#8696a0] text-xs text-center truncate w-full">
                    {doc.filename || 'Documento'}
                  </span>
                </div>
              ))}
            </div>

            {/* Mensagem se não houver mídia */}
            {contactMedia.images.length === 0 && 
             contactMedia.videos.length === 0 && 
             contactMedia.audios.length === 0 && 
             contactMedia.documents.length === 0 && (
              <div className="text-center py-8">
                <i className="fa-solid fa-image text-[#667781] text-4xl mb-2"></i>
                <p className="text-[#8696a0] text-sm">Nenhuma mídia compartilhada</p>
              </div>
            )}
          </div>

          {/* Opções */}
          <div className="py-2">
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] transition-colors">
              <i className="fa-solid fa-star text-[#aebac1] text-xl"></i>
              <span className="text-[#e9edef] text-[15px]">Mensagens com estrela</span>
            </button>
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] transition-colors">
              <i className="fa-solid fa-magnifying-glass text-[#aebac1] text-xl"></i>
              <span className="text-[#e9edef] text-[15px]">Pesquisar</span>
            </button>
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] transition-colors">
              <i className="fa-solid fa-bell-slash text-[#aebac1] text-xl"></i>
              <span className="text-[#e9edef] text-[15px]">Silenciar notificações</span>
            </button>
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] transition-colors">
              <i className="fa-solid fa-image text-[#aebac1] text-xl"></i>
              <span className="text-[#e9edef] text-[15px]">Papel de parede</span>
            </button>
          </div>

          {/* Ações perigosas */}
          <div className="py-2 border-t border-[#2a3942]">
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] transition-colors">
              <i className="fa-solid fa-ban text-[#ea5545] text-xl"></i>
              <span className="text-[#ea5545] text-[15px]">Bloquear</span>
            </button>
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] transition-colors">
              <i className="fa-solid fa-thumbs-down text-[#ea5545] text-xl"></i>
              <span className="text-[#ea5545] text-[15px]">Denunciar contato</span>
            </button>
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-[#202c33] transition-colors">
              <i className="fa-solid fa-trash text-[#ea5545] text-xl"></i>
              <span className="text-[#ea5545] text-[15px]">Apagar conversa</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
