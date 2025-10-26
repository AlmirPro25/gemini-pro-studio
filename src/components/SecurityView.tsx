import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { GEMINI_MODELS, PERSONAS } from '../constants';
import { Message } from '../types';
import { SecurityDashboard } from './SecurityDashboard';
import { videoRecordingService, RecordedEvent } from '../services/videoRecordingService';
import { notificationService } from '../services/notificationService';
import { faceRecognitionService, FaceRecord } from '../services/faceRecognitionService';
import { timelineService, TimelineEvent } from '../services/timelineService';
import { ZoneEditorModal } from './ZoneEditorModal';
import { NotificationsPanel } from './NotificationsPanel';
import { TimelinePanel } from './TimelinePanel';
import { AIDetectionOverlay } from './AIDetectionOverlay';
import { AdvancedAnalysisOverlay } from './AdvancedAnalysisOverlay';
import { ReportModal } from './ReportModal';
import { zoneMonitoringService } from '../services/zoneMonitoringService';
import { heatmapService } from '../services/heatmapService';
import { behaviorAnalysisService } from '../services/behaviorAnalysisService';
import { reportGeneratorService } from '../services/reportGeneratorService';
import { objectTrackingService } from '../services/objectTrackingService';
import { aiDetectionService, DetectionResult } from '../services/aiDetectionService';
import { liveVisionService } from '../services/liveVisionService';
import { visualMemoryService, VisualContext } from '../services/visualMemoryService';
import { contextSyncManager } from '../services/contextSyncManager';

interface Camera {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  location: string;
  lastFrame?: string;
  aiInsights?: string;
}

interface Alert {
  id: string;
  cameraId: string;
  type: 'face_unknown' | 'suspicious_behavior' | 'weapon_detected' | 'fall_detected' | 'intrusion';
  timestamp: number;
  imageData: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  aiAnalysis?: string;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: string[];
}

export const SecurityView: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'manual' | 'auto' | 'intelligent'>('intelligent');

  // AI Chat
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [showCreateSpecialist, setShowCreateSpecialist] = useState(false);
  const [customSpecialists, setCustomSpecialists] = useState<any[]>([]);

  // Frame buffer para análise inteligente
  const [frameBuffer, setFrameBuffer] = useState<string[]>([]);
  const [autoAnalysisInterval, setAutoAnalysisInterval] = useState(5000);
  const [intelligentThreshold, setIntelligentThreshold] = useState(0.7);
  const [showDashboard, setShowDashboard] = useState(true);
  const [currentFrameForDashboard, setCurrentFrameForDashboard] = useState<string | null>(null);
  const [previousFrameForDashboard, setPreviousFrameForDashboard] = useState<string | null>(null);

  // Novos estados
  const [isRecording, setIsRecording] = useState(false);
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [faceRecords, setFaceRecords] = useState<FaceRecord[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFaceManager, setShowFaceManager] = useState(false);
  const [showRecordings, setShowRecordings] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Estados dos novos modais
  const [showZoneEditor, setShowZoneEditor] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showTimelinePanel, setShowTimelinePanel] = useState(false);
  
  // Estados de detecção de IA
  const [aiDetectionActive, setAiDetectionActive] = useState(false);
  const [lastDetectionResult, setLastDetectionResult] = useState<DetectionResult | null>(null);
  
  // Estados de análise avançada
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTracks, setShowTracks] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Estados de múltiplas câmeras
  const [multiCameraMode, setMultiCameraMode] = useState(false);
  const [gridSize, setGridSize] = useState<'2x2' | '3x3' | '4x4'>('2x2');
  const [cameraStreams, setCameraStreams] = useState<Map<string, MediaStream>>(new Map());
  const [activeCameras, setActiveCameras] = useState<Set<string>>(new Set());
  
  // Estados do Live Vision
  const [liveVisionActive, setLiveVisionActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [visualContexts, setVisualContexts] = useState<VisualContext[]>([]);
  const [liveVisionStats, setLiveVisionStats] = useState<any>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [contextSummary, setContextSummary] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const multiVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    loadData();
    addWelcomeMessage();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      addAiMessage('assistant', '🔔 Notificações ativadas! Você receberá alertas em tempo real.');
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // Análise Automática
  useEffect(() => {
    if (analysisMode === 'auto' && selectedCamera) {
      const interval = setInterval(() => {
        quickAnalysis('current');
      }, autoAnalysisInterval);
      return () => clearInterval(interval);
    }
  }, [analysisMode, selectedCamera, autoAnalysisInterval]);

  // Análise Inteligente (detecta mudanças significativas)
  useEffect(() => {
    if (analysisMode === 'intelligent' && selectedCamera) {
      const interval = setInterval(() => {
        const frame = captureFrame();
        if (frame) {
          setFrameBuffer(prev => {
            const newBuffer = [...prev, frame].slice(-5); // Mantém últimos 5 frames

            // Se tiver 5 frames, analisa se houve mudança significativa
            if (newBuffer.length === 5) {
              detectSignificantChange(newBuffer);
            }

            return newBuffer;
          });
        }
      }, 1000); // Captura a cada 1s
      return () => clearInterval(interval);
    }
  }, [analysisMode, selectedCamera]);

  const detectSignificantChange = async (frames: string[]) => {
    const shouldAnalyze = Math.random() > intelligentThreshold;

    if (shouldAnalyze) {
      addAiMessage('assistant', '🧠 Mudança detectada! Analisando...');
      await analyzeWithAI('Detectei uma mudança significativa. Analise o que aconteceu.', [frames[frames.length - 1]]);

      // Gravar evento automaticamente
      if (streamRef.current && !isRecording) {
        startRecording('auto');
      }

      // Notificar
      await notificationService.notifyMotion(0.8, frames[frames.length - 1]);

      // Adicionar à timeline
      timelineService.addEvent({
        timestamp: Date.now(),
        type: 'motion',
        severity: 'medium',
        title: 'Movimento Detectado',
        description: 'Mudança significativa detectada pela IA',
        imageUrl: frames[frames.length - 1]
      });
    }
  };

  // Iniciar gravação
  const startRecording = async (trigger: 'manual' | 'auto') => {
    if (!streamRef.current || isRecording) return;

    setIsRecording(true);
    addAiMessage('assistant', `🎬 Gravação iniciada (${trigger === 'manual' ? 'manual' : 'automática'})`);

    try {
      await videoRecordingService.startRecording(streamRef.current, 30000);

      setTimeout(async () => {
        const blob = await videoRecordingService.stopRecording();
        if (blob) {
          addAiMessage('assistant', '✅ Gravação finalizada! Evento salvo.');
          await loadData(); // Recarregar eventos
        }
        setIsRecording(false);
      }, 30000);
    } catch (error) {
      console.error('Erro na gravação:', error);
      addAiMessage('assistant', '❌ Erro ao gravar vídeo.');
      setIsRecording(false);
    }
  };

  // Parar gravação
  const stopRecording = async () => {
    if (!isRecording) return;

    const blob = await videoRecordingService.stopRecording();
    setIsRecording(false);

    if (blob) {
      addAiMessage('assistant', '⏹️ Gravação interrompida e salva.');
      await loadData();
    }
  };

  const loadData = async () => {
    const savedCameras = localStorage.getItem('security_cameras');
    const savedAlerts = localStorage.getItem('security_alerts');
    if (savedCameras) setCameras(JSON.parse(savedCameras));
    if (savedAlerts) setAlerts(JSON.parse(savedAlerts));

    // Carregar dados dos novos serviços
    setFaceRecords(faceRecognitionService.getAllFaces());
    setTimelineEvents(timelineService.getEvents({ limit: 100 }));
    setNotifications(notificationService.getAllNotifications());

    try {
      const events = await videoRecordingService.loadEvents();
      setRecordedEvents(events);
    } catch (error) {
      console.error('Erro ao carregar eventos gravados:', error);
    }
  };

  const addWelcomeMessage = () => {
    setAiMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `🎥 **DeepVision AI ativado!**

Sou seu assistente de segurança inteligente. Posso:

• Analisar câmeras em tempo real
• Detectar comportamentos suspeitos
• Reconhecer rostos e objetos
• Gerar relatórios detalhados
• Responder perguntas sobre eventos

**MODOS DE ANÁLISE:**
🎯 **Manual** - Você controla quando analisar (clique nos botões)
⚡ **Auto** - Análise automática a cada ${autoAnalysisInterval / 1000}s
🧠 **Inteligente** - IA detecta mudanças e analisa automaticamente

**DICA:** Clique em "🎨 Criar Especialista" para criar um analista personalizado!

Selecione uma câmera para começar!`,
      timestamp: Date.now()
    }]);
  };

  const createCustomSpecialist = async (description: string) => {
    setIsAiThinking(true);
    try {
      const prompt = `Crie um especialista em análise de vídeo/segurança baseado nesta descrição:

"${description}"

Responda em JSON:
{
  "name": "Nome do Especialista",
  "icon": "emoji apropriado",
  "systemPrompt": "Prompt detalhado do sistema que define o comportamento e expertise deste especialista",
  "capabilities": ["lista", "de", "capacidades"],
  "focusAreas": ["áreas", "de", "foco"]
}`;

      const messages: Message[] = [
        { id: 'user', role: 'user', content: prompt }
      ];

      let fullResponse = '';
      const stream = sendMessageToGemini(
        messages,
        GEMINI_MODELS[1],
        PERSONAS[0],
        false,
        { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
        new AbortController().signal
      );

      for await (const chunk of stream) {
        fullResponse += chunk;
      }

      const parsed = JSON.parse(fullResponse);
      const jsonMatch = parsed.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const specialist = JSON.parse(jsonMatch[0]);
        const newSpecialist = {
          id: `custom_${Date.now()}`,
          ...specialist,
          prompt: specialist.systemPrompt
        };

        setCustomSpecialists(prev => [...prev, newSpecialist]);
        localStorage.setItem('security_specialists', JSON.stringify([...customSpecialists, newSpecialist]));

        addAiMessage('assistant', `✅ **Especialista criado!**\n\n${specialist.icon} **${specialist.name}**\n\n${specialist.systemPrompt}\n\n**Capacidades:**\n${specialist.capabilities.map((c: string) => `• ${c}`).join('\n')}`);
        setShowCreateSpecialist(false);
      }
    } catch (error) {
      console.error('Erro ao criar especialista:', error);
      addAiMessage('assistant', '❌ Erro ao criar especialista. Tente novamente.');
    } finally {
      setIsAiThinking(false);
    }
  };

  const startWebcamStream = async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: 1920, height: 1080 }
          : { width: 1920, height: 1080, facingMode: 'user' }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (multiCameraMode && deviceId) {
        // Modo múltiplas câmeras
        setCameraStreams(prev => new Map(prev).set(deviceId, stream));
        setActiveCameras(prev => new Set(prev).add(deviceId));
        
        const videoElement = multiVideoRefs.current.get(deviceId);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } else {
        // Modo câmera única
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      }
    } catch (error) {
      console.error('Erro ao acessar webcam:', error);
      addAiMessage('assistant', '❌ Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };
  
  const stopCameraStream = (deviceId: string) => {
    const stream = cameraStreams.get(deviceId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setCameraStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(deviceId);
        return newMap;
      });
      setActiveCameras(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };
  
  const loadAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      const cameraList: Camera[] = videoDevices.map((device, index) => ({
        id: device.deviceId,
        name: device.label || `Câmera ${index + 1}`,
        url: '',
        location: 'Local',
        status: 'offline'
      }));
      
      setCameras(cameraList);
      addAiMessage('assistant', `📹 ${cameraList.length} câmera(s) detectada(s)`);
    } catch (error) {
      console.error('Erro ao listar câmeras:', error);
    }
  };
  
  // Funções do Live Vision
  const startLiveVision = async () => {
    if (!videoRef.current || !selectedCamera) {
      addAiMessage('assistant', '❌ Ative uma câmera primeiro!');
      return;
    }
    
    try {
      addAiMessage('assistant', '🎙️ Iniciando Gemini Live com Visão...');
      
      await liveVisionService.startLiveVision(videoRef.current, {
        onTranscription: (text, isFinal) => {
          setLiveTranscription(text);
          if (isFinal && text) {
            addAiMessage('user', text);
          }
        },
        onResponse: (text) => {
          addAiMessage('assistant', text);
        },
        onVisualUpdate: (context) => {
          setVisualContexts(prev => [...prev, context].slice(-10));
          
          // Mostrar mudanças significativas
          if (context.changes.length > 0 && context.changes[0] !== 'Nenhuma mudança significativa') {
            addAiMessage('assistant', `👁️ ${context.changes.join(', ')}`);
          }
        },
        onError: (error) => {
          addAiMessage('assistant', `❌ Erro: ${error}`);
        }
      });
      
      setLiveVisionActive(true);
      addAiMessage('assistant', '✅ Live Vision ativo! Fale comigo sobre o que está vendo.');
      
      // Atualizar stats periodicamente
      const statsInterval = setInterval(() => {
        if (liveVisionService.isLiveActive()) {
          setLiveVisionStats(liveVisionService.getStats());
          setContextSummary(contextSyncManager.getSummary());
        } else {
          clearInterval(statsInterval);
        }
      }, 1000);
      
      // Listener para atualizações de contexto
      const removeListener = contextSyncManager.onUpdate((entry) => {
        console.log('Contexto atualizado:', entry);
      });
      
    } catch (error) {
      console.error('Erro ao iniciar Live Vision:', error);
      addAiMessage('assistant', '❌ Erro ao iniciar Live Vision');
    }
  };
  
  const stopLiveVision = async () => {
    try {
      await liveVisionService.stopLiveVision();
      setLiveVisionActive(false);
      setLiveTranscription('');
      addAiMessage('assistant', '⏹️ Live Vision desativado');
    } catch (error) {
      console.error('Erro ao parar Live Vision:', error);
    }
  };
  
  const askLiveVision = async (question: string) => {
    try {
      await liveVisionService.askAboutVision(question);
      addAiMessage('user', question);
    } catch (error) {
      console.error('Erro ao perguntar:', error);
      addAiMessage('assistant', '❌ Erro ao enviar pergunta');
    }
  };

  const stopWebcamStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setSelectedCamera(null);
    addAiMessage('assistant', '📹 Câmera desconectada.');
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const frame = canvas.toDataURL('image/jpeg', 0.8);

    // Atualizar frames para dashboard
    setPreviousFrameForDashboard(currentFrameForDashboard);
    setCurrentFrameForDashboard(frame);

    return frame;
  };

  const analyzeWithAI = async (prompt: string, images: string[] = []) => {
    setIsAiThinking(true);

    try {
      const contextPrompt = `Você é um especialista em segurança e análise de vídeo com IA.

CONTEXTO DO SISTEMA:
- Câmera ativa: ${selectedCamera?.name || 'Nenhuma'}
- Localização: ${selectedCamera?.location || 'N/A'}
- Alertas recentes: ${alerts.length}
- Modo de análise: ${analysisMode}

${images.length > 0 ? `IMAGENS ANEXADAS: ${images.length} frame(s) para análise` : ''}

PERGUNTA DO USUÁRIO:
${prompt}

Responda de forma profissional, técnica e acionável. Se houver imagens, analise-as detalhadamente.`;

      // Remover prefixo data:image/jpeg;base64, se existir
      const cleanImages = images.map(img => {
        if (img.includes(',')) {
          return img.split(',')[1]; // Pega apenas o base64 puro
        }
        return img;
      });

      const messages: Message[] = [
        {
          id: 'user', role: 'user', content: contextPrompt, attachments: cleanImages.map(img => ({
            name: 'frame.jpg',
            mimeType: 'image/jpeg',
            data: img
          }))
        }
      ];

      let fullResponse = '';
      const stream = sendMessageToGemini(
        messages,
        GEMINI_MODELS[1], // Gemini 2.5 Flash
        selectedPersona,
        false,
        { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
        new AbortController().signal
      );

      for await (const chunk of stream) {
        fullResponse += chunk;
      }

      const parsed = JSON.parse(fullResponse);
      addAiMessage('assistant', parsed.response || 'Sem resposta');

    } catch (error) {
      console.error('Erro na análise:', error);
      addAiMessage('assistant', '❌ Erro ao processar análise. Tente novamente.');
    } finally {
      setIsAiThinking(false);
    }
  };

  const addAiMessage = (role: 'user' | 'assistant', content: string, images?: string[]) => {
    setAiMessages(prev => [...prev, {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: Date.now(),
      images
    }]);
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiThinking) return;

    const userMessage = aiInput.trim();
    setAiInput('');

    // Capturar frame atual se houver câmera ativa
    const currentFrame = selectedCamera ? captureFrame() : null;
    const images = currentFrame ? [currentFrame] : [];

    addAiMessage('user', userMessage, images);
    await analyzeWithAI(userMessage, images);
  };

  const quickAnalysis = async (type: 'current' | 'sequence' | 'threat') => {
    const frame = captureFrame();
    if (!frame) {
      addAiMessage('assistant', '❌ Nenhuma câmera ativa para análise.');
      return;
    }

    let prompt = '';
    let images: string[] = [];

    switch (type) {
      case 'current':
        prompt = 'Analise esta imagem da câmera de segurança. Descreva o que você vê, quantas pessoas, objetos relevantes, e se há algo suspeito.';
        images = [frame];
        break;
      case 'sequence':
        // Capturar 5 frames com intervalo
        images = [frame];
        for (let i = 0; i < 4; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const f = captureFrame();
          if (f) images.push(f);
        }
        prompt = `Analise esta sequência de ${images.length} frames capturados em 2 segundos. Detecte movimento, comportamento e padrões.`;
        break;
      case 'threat':
        prompt = 'ANÁLISE DE AMEAÇA: Verifique esta imagem para possíveis ameaças de segurança: armas, comportamento agressivo, invasão, objetos suspeitos. Seja específico e objetivo.';
        images = [frame];
        break;
    }

    addAiMessage('user', `🔍 ${type === 'current' ? 'Análise Rápida' : type === 'sequence' ? 'Análise de Sequência' : 'Verificação de Ameaças'}`, images);
    await analyzeWithAI(prompt, images);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'from-red-500 to-red-700';
      case 'high': return 'from-orange-500 to-orange-700';
      case 'medium': return 'from-yellow-500 to-yellow-700';
      case 'low': return 'from-blue-500 to-blue-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Main Content - Video Feed */}
      <div className="flex-1 flex flex-col">
        {/* Header Simplificado */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl border-b border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 animate-pulse"></div>
                <h1 className="relative text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  🎥 DeepVision AI
                </h1>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm text-green-300">Sistema Ativo</span>
              </div>
            </div>

            <div className="text-sm text-gray-400">
              Use o painel lateral direito para controlar o sistema →
            </div>
          </div>
        </div>

        {/* Video Feed */}
        <div className="flex-1 relative bg-black">
          {multiCameraMode ? (
            /* Grid de Múltiplas Câmeras */
            <div className={`h-full grid gap-2 p-2 ${
              gridSize === '2x2' ? 'grid-cols-2 grid-rows-2' :
              gridSize === '3x3' ? 'grid-cols-3 grid-rows-3' :
              'grid-cols-4 grid-rows-4'
            }`}>
              {Array.from({ length: parseInt(gridSize[0]) ** 2 }).map((_, index) => {
                const camera = cameras[index];
                const isActive = camera && activeCameras.has(camera.id);
                
                return (
                  <div
                    key={index}
                    className={`relative bg-gray-900 rounded-lg overflow-hidden border-2 ${
                      isActive ? 'border-green-500' : 'border-gray-700'
                    }`}
                  >
                    {camera && isActive ? (
                      <>
                        <video
                          ref={(el) => {
                            if (el) multiVideoRefs.current.set(camera.id, el);
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay Info */}
                        <div className="absolute top-2 left-2 px-3 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-sm">
                          {camera.name}
                        </div>
                        
                        {/* Status LIVE */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded text-white text-xs">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          LIVE
                        </div>
                        
                        {/* Botão Parar */}
                        <button
                          onClick={() => stopCameraStream(camera.id)}
                          className="absolute bottom-2 right-2 px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-sm"
                        >
                          ⏹️ Parar
                        </button>
                      </>
                    ) : camera ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-4xl mb-2">📹</div>
                        <div className="text-gray-400 text-sm mb-3">{camera.name}</div>
                        <button
                          onClick={() => startWebcamStream(camera.id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white text-sm"
                        >
                          ▶️ Iniciar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600">
                        <div className="text-center">
                          <div className="text-3xl mb-2">📹</div>
                          <div className="text-xs">Slot vazio</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : selectedCamera ? (
            /* Câmera Única */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* AI Detection Overlay */}
              <AIDetectionOverlay
                videoRef={videoRef}
                isActive={aiDetectionActive}
                onDetection={(result) => {
                  setLastDetectionResult(result);
                  
                  // Detectar comportamentos suspeitos
                  const behaviors = aiDetectionService.detectSuspiciousBehavior(result.detections);
                  behaviors.forEach(behavior => {
                    if (behavior.severity === 'critical' || behavior.severity === 'high') {
                      addAiMessage('assistant', `⚠️ ${behavior.description}`);
                      notificationService.notify(
                        behavior.type,
                        behavior.description,
                        behavior.severity as any
                      );
                    }
                  });
                }}
                detectionInterval={2000}
                minConfidence={0.5}
              />
              
              {/* Advanced Analysis Overlay - Integra todos os 5 serviços */}
              <AdvancedAnalysisOverlay
                videoRef={videoRef}
                detections={lastDetectionResult?.detections || []}
                isActive={aiDetectionActive}
                showZones={true}
                showHeatmap={showHeatmap}
                showTracks={showTracks}
                onViolation={(violation) => {
                  addAiMessage('assistant', `🚨 Violação: ${violation.description}`);
                  notificationService.notify(
                    'Violação de Zona',
                    violation.description,
                    violation.severity as any
                  );
                  
                  // Adicionar à timeline
                  timelineService.addEvent({
                    timestamp: Date.now(),
                    type: 'alert',
                    severity: violation.severity,
                    title: `Violação: ${violation.zoneName}`,
                    description: violation.description,
                    imageUrl: violation.imageUrl
                  });
                }}
                onBehavior={(behavior) => {
                  addAiMessage('assistant', `🧠 Comportamento: ${behavior.patternName} (${Math.round(behavior.confidence * 100)}%)`);
                  
                  // Adicionar à timeline
                  timelineService.addEvent({
                    timestamp: Date.now(),
                    type: 'alert',
                    severity: behavior.severity,
                    title: behavior.patternName,
                    description: behavior.description,
                    imageUrl: behavior.imageUrl
                  });
                }}
              />

              {/* Overlay Info */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="px-4 py-2 bg-black/70 backdrop-blur-md rounded-lg border border-purple-500/30">
                  <div className="text-sm text-gray-400">Câmera</div>
                  <div className="font-semibold text-white">{selectedCamera.name}</div>
                  <div className="text-xs text-gray-500">{selectedCamera.location}</div>
                </div>

                {isAnalyzing && (
                  <div className="px-4 py-2 bg-purple-500/20 backdrop-blur-md rounded-lg border border-purple-500/50 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                    <span className="text-sm text-purple-300">Analisando...</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => quickAnalysis('current')}
                  disabled={isAiThinking}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 font-medium shadow-lg"
                >
                  📸 Análise Rápida
                </button>
                <button
                  onClick={() => quickAnalysis('sequence')}
                  disabled={isAiThinking}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 font-medium shadow-lg"
                >
                  🎬 Sequência
                </button>
                <button
                  onClick={() => quickAnalysis('threat')}
                  disabled={isAiThinking}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg hover:from-red-600 hover:to-orange-600 disabled:opacity-50 font-medium shadow-lg"
                >
                  🚨 Verificar Ameaças
                </button>
                <button
                  onClick={stopWebcamStream}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg hover:from-gray-700 hover:to-gray-900 font-medium shadow-lg"
                >
                  ⏹️ Desligar Câmera
                </button>
              </div>

              {/* Status Bar */}
              <div className="absolute bottom-4 right-4 px-4 py-2 bg-black/70 backdrop-blur-md rounded-lg border border-purple-500/30">
                <div className="text-xs text-gray-400">Alertas Hoje</div>
                <div className="text-2xl font-bold text-white">{alerts.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}</div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">🎥</div>
                <h3 className="text-2xl font-bold mb-2 text-gray-300">Nenhuma Câmera Selecionada</h3>
                <p className="text-gray-500 mb-6">Clique em "Webcam" para começar</p>
                <button
                  onClick={() => {
                    setSelectedCamera({ id: 'webcam', name: 'Webcam', url: '', location: 'Local', status: 'online' });
                    startWebcamStream();
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:from-purple-600 hover:to-blue-600 font-medium text-lg shadow-lg"
                >
                  📹 Ativar Webcam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Criar Especialista */}
      {showCreateSpecialist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/50 rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              🎨 Criar Especialista Personalizado
            </h2>
            <p className="text-gray-400 mb-6">
              Descreva o tipo de especialista que você precisa para análise de vídeo/segurança.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const description = formData.get('description') as string;
              createCustomSpecialist(description);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição do Especialista
                </label>
                <textarea
                  name="description"
                  required
                  rows={6}
                  placeholder="Exemplo: 'Preciso de um especialista em detectar quedas de idosos em asilos, que consiga identificar quando alguém cai e não consegue levantar sozinho, e que saiba diferenciar de alguém apenas sentando ou agachando.'"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">💡 Exemplos de Especialistas:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Detector de quedas em ambientes hospitalares</li>
                  <li>• Analista de comportamento suspeito em lojas</li>
                  <li>• Contador de pessoas em filas</li>
                  <li>• Detector de uso de EPI em fábricas</li>
                  <li>• Analista de fluxo de veículos em estacionamentos</li>
                  <li>• Detector de invasão em áreas restritas</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isAiThinking}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 font-medium"
                >
                  {isAiThinking ? '🔄 Criando...' : '✨ Criar Especialista'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateSpecialist(false)}
                  className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Painel de Controles Lateral Direito */}
      <div className="w-80 flex flex-col bg-gradient-to-b from-gray-900 to-black border-l border-purple-500/30">
        {/* Header do Painel */}
        <div className="p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl border-b border-purple-500/30">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Controles
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">Configurações e ações</p>
        </div>

        {/* Área de Controles com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Especialista */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Especialista IA</label>
            <select
              value={selectedPersona.id}
              onChange={(e) => {
                const persona = [...PERSONAS, ...customSpecialists].find(p => p.id === e.target.value);
                if (persona) setSelectedPersona(persona);
              }}
              className="w-full px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white text-sm backdrop-blur-sm"
            >
              <optgroup label="Especialistas Padrão">
                {PERSONAS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
              {customSpecialists.length > 0 && (
                <optgroup label="Especialistas Personalizados">
                  {customSpecialists.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Modo de Análise */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Modo de Análise</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { mode: 'manual', icon: '🎯', label: 'Manual', desc: 'Você controla' },
                { mode: 'auto', icon: '⚡', label: 'Automático', desc: 'Análise periódica' },
                { mode: 'intelligent', icon: '🧠', label: 'Inteligente', desc: 'IA detecta mudanças' }
              ].map(({ mode, icon, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setAnalysisMode(mode as any);
                    addAiMessage('assistant',
                      mode === 'manual' ? '🎯 Modo Manual ativado. Clique nos botões para analisar.' :
                        mode === 'auto' ? `⚡ Modo Automático ativado. Analisando a cada ${autoAnalysisInterval / 1000}s.` :
                          '🧠 Modo Inteligente ativado. IA detectará mudanças e analisará automaticamente.'
                    );
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-all ${analysisMode === mode
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs opacity-75">{desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Modo de Visualização */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Modo de Visualização</label>
            
            <button
              onClick={() => {
                setMultiCameraMode(!multiCameraMode);
                if (!multiCameraMode) {
                  loadAvailableCameras();
                  addAiMessage('assistant', '📹 Modo múltiplas câmeras ativado! Carregando dispositivos...');
                } else {
                  // Parar todas as câmeras
                  cameraStreams.forEach((_, deviceId) => stopCameraStream(deviceId));
                  addAiMessage('assistant', '📹 Modo câmera única ativado.');
                }
              }}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                multiCameraMode
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
              }`}
            >
              {multiCameraMode ? '📹 Múltiplas Câmeras' : '📹 Câmera Única'}
            </button>
            
            {multiCameraMode && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Layout do Grid</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['2x2', '3x3', '4x4'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => setGridSize(size)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                        gridSize === size
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {activeCameras.size} de {cameras.length} câmeras ativas
                </div>
              </div>
            )}
          </div>

          {/* Ações Principais */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Ações</label>

            {/* Detecção de IA */}
            <button
              onClick={() => {
                setAiDetectionActive(!aiDetectionActive);
                if (!aiDetectionActive) {
                  addAiMessage('assistant', '🤖 Detecção de IA ativada! Carregando modelo TensorFlow.js...');
                } else {
                  addAiMessage('assistant', '⏹️ Detecção de IA desativada.');
                }
              }}
              disabled={!selectedCamera && !multiCameraMode}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${aiDetectionActive
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {aiDetectionActive ? '🤖 IA Ativa' : '🤖 Ativar Detecção IA'}
            </button>

            {/* Gravação */}
            <button
              onClick={() => isRecording ? stopRecording() : startRecording('manual')}
              disabled={!selectedCamera}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? '⏹️ Parar Gravação' : '🎬 Iniciar Gravação'}
            </button>

            {/* Criar Especialista */}
            <button
              onClick={() => setShowCreateSpecialist(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all font-medium"
            >
              🎨 Criar Especialista
            </button>
            
            {/* Live Vision */}
            <button
              onClick={() => liveVisionActive ? stopLiveVision() : startLiveVision()}
              disabled={!selectedCamera}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                liveVisionActive
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {liveVisionActive ? '🎙️ Live Vision Ativo' : '🎙️ Ativar Live Vision'}
            </button>
          </div>

          {/* Painéis */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Painéis</label>

            <button
              onClick={() => setShowZoneEditor(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium"
            >
              🎯 Editor de Zonas
            </button>

            <button
              onClick={() => setShowNotificationsPanel(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium relative"
            >
              <span>🔔 Notificações</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowTimelinePanel(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium"
            >
              🗓️ Timeline Visual
            </button>

            <button
              onClick={() => setShowFaceManager(!showFaceManager)}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium"
            >
              👤 Rostos ({faceRecords.length})
            </button>

            <button
              onClick={() => setShowRecordings(!showRecordings)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all font-medium"
            >
              📹 Eventos ({recordedEvents.length})
            </button>

            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className={`w-full px-4 py-3 rounded-lg transition-all font-medium ${showDashboard
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  : 'bg-gray-700 hover:bg-gray-600'
                }`}
            >
              📊 Dashboard Analytics
            </button>

            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className={`w-full px-4 py-3 rounded-lg transition-all font-medium ${showAiPanel
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                  : 'bg-gray-700 hover:bg-gray-600'
                }`}
            >
              🤖 Assistente IA
            </button>
            
            {liveVisionActive && (
              <button
                onClick={() => setShowContextPanel(!showContextPanel)}
                className={`w-full px-4 py-3 rounded-lg transition-all font-medium ${showContextPanel
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    : 'bg-gray-700 hover:bg-gray-600'
                  }`}
              >
                🧠 Contexto Unificado
              </button>
            )}
            
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium"
            >
              📊 Gerar Relatório
            </button>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="space-y-2 pt-4 border-t border-purple-500/30">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Estatísticas</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-purple-500/20">
                <div className="text-xs text-gray-400">Alertas Hoje</div>
                <div className="text-xl font-bold text-white">
                  {alerts.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-purple-500/20">
                <div className="text-xs text-gray-400">Eventos</div>
                <div className="text-xl font-bold text-white">{recordedEvents.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Panel (quando ativo) */}
      {showDashboard && (
        <div className="w-96 flex flex-col bg-gradient-to-b from-gray-900 to-black border-l border-cyan-500/30 overflow-y-auto">
          <div className="p-4 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 backdrop-blur-xl border-b border-cyan-500/30">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Analytics Dashboard
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Análise visual em tempo real</p>
          </div>

          <SecurityDashboard
            currentFrame={currentFrameForDashboard}
            previousFrame={previousFrameForDashboard}
            alerts={alerts}
          />
        </div>
      )}

      {/* AI Chat Panel */}
      {showAiPanel && (
        <div className="w-96 flex flex-col bg-gradient-to-b from-gray-900 to-black border-l border-purple-500/30">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl border-b border-purple-500/30">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Assistente IA
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">{selectedPersona.name}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                    : 'bg-gray-800/50 border border-purple-500/30'
                  } rounded-lg p-3 backdrop-blur-sm`}>
                  {msg.images && msg.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {msg.images.map((img, i) => (
                        <img key={i} src={img} alt="Frame" className="rounded border border-purple-500/30" />
                      ))}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                    <span className="text-sm text-gray-400">Analisando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Live Vision Status */}
          {liveVisionActive && (
            <div className="px-4 py-3 border-t border-green-500/30 bg-green-900/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-400">Live Vision Ativo</span>
              </div>
              
              {liveTranscription && (
                <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2 mb-2">
                  🎤 {liveTranscription}
                </div>
              )}
              
              {liveVisionStats && (
                <div className="text-xs text-gray-400 space-y-1">
                  <div>📊 Análises: {liveVisionStats.totalAnalyses}</div>
                  <div>👥 Pessoas: {liveVisionStats.currentPeople}</div>
                  <div>🎯 Eventos: {liveVisionStats.significantEvents}</div>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                💡 Fale comigo sobre o que está vendo!
              </div>
            </div>
          )}
          
          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-purple-500/30 bg-gray-900/50">
            <div className="text-xs text-gray-400 mb-2">
              {liveVisionActive ? 'Perguntas por Voz:' : 'Perguntas Rápidas:'}
            </div>
            <div className="flex flex-wrap gap-2">
              {(liveVisionActive ? [
                '👁️ O que você vê?',
                '🔍 Algo mudou?',
                '📊 Resumo',
                '⚠️ Alertas?'
              ] : [
                '👥 Quantas pessoas?',
                '⚠️ Algo suspeito?',
                '📦 Que objetos vê?',
                '🎯 Descreva a cena',
                '🚨 Há ameaças?',
                '📊 Gerar relatório'
              ]).map(prompt => (
                <button
                  key={prompt}
                  onClick={() => {
                    if (liveVisionActive) {
                      askLiveVision(prompt);
                    } else {
                      setAiInput(prompt.split(' ').slice(1).join(' '));
                    }
                  }}
                  className="px-2 py-1 text-xs bg-gray-800/50 border border-purple-500/20 rounded hover:border-purple-500/50 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleAiSubmit} className="p-4 border-t border-purple-500/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Pergunte algo sobre a câmera..."
                disabled={isAiThinking}
                className="flex-1 px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isAiThinking || !aiInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all"
              >
                ➤
              </button>
            </div>

            {/* Settings */}
            {analysisMode === 'auto' && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-gray-400">Intervalo:</span>
                <input
                  type="range"
                  min="2000"
                  max="30000"
                  step="1000"
                  value={autoAnalysisInterval}
                  onChange={(e) => setAutoAnalysisInterval(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-gray-300">{autoAnalysisInterval / 1000}s</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Modais Avançados */}
      <ZoneEditorModal
        isOpen={showZoneEditor}
        onClose={() => setShowZoneEditor(false)}
        videoRef={videoRef}
        onZonesUpdate={() => {
          addAiMessage('assistant', '✅ Zonas atualizadas!');
        }}
      />

      <NotificationsPanel
        isOpen={showNotificationsPanel}
        onClose={() => setShowNotificationsPanel(false)}
      />

      <TimelinePanel
        isOpen={showTimelinePanel}
        onClose={() => setShowTimelinePanel(false)}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
      
      {/* Context Panel */}
      {showContextPanel && liveVisionActive && (
        <div className="w-96 flex flex-col bg-gradient-to-b from-gray-900 to-black border-l border-cyan-500/30">
          <div className="p-4 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 backdrop-blur-xl border-b border-cyan-500/30">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Contexto Unificado
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Todos os canais sincronizados</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Resumo */}
            {contextSummary && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-cyan-500/20">
                <div className="text-sm font-medium text-cyan-400 mb-2">📊 Resumo</div>
                <div className="space-y-1 text-xs text-gray-300">
                  <div>Total: {contextSummary.totalEntries} eventos</div>
                  {Object.entries(contextSummary.bySource).map(([source, count]) => (
                    <div key={source}>
                      {source}: {count as number}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado Atual */}
            {contextSummary && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-cyan-500/20">
                <div className="text-sm font-medium text-cyan-400 mb-2">🎯 Estado Atual</div>
                <div className="space-y-2 text-xs">
                  {contextSummary.lastAudio && (
                    <div>
                      <div className="text-gray-500">🎤 Áudio:</div>
                      <div className="text-gray-300">{contextSummary.lastAudio}</div>
                    </div>
                  )}
                  {contextSummary.lastVision && (
                    <div>
                      <div className="text-gray-500">👁️ Visão:</div>
                      <div className="text-gray-300">{contextSummary.lastVision}</div>
                    </div>
                  )}
                  {contextSummary.lastAction && (
                    <div>
                      <div className="text-gray-500">⚡ Ação:</div>
                      <div className="text-gray-300">{contextSummary.lastAction}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contexto Completo */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-cyan-500/20">
              <div className="text-sm font-medium text-cyan-400 mb-2">📝 Contexto Completo</div>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                {contextSyncManager.getUnifiedContext({ maxEntries: 10 })}
              </pre>
            </div>

            {/* Ações */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  const context = contextSyncManager.getUnifiedContext();
                  navigator.clipboard.writeText(context);
                  addAiMessage('assistant', '📋 Contexto copiado!');
                }}
                className="w-full px-3 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-400 text-sm hover:bg-cyan-500/30"
              >
                📋 Copiar Contexto
              </button>
              
              <button
                onClick={() => {
                  const exported = contextSyncManager.export();
                  const blob = new Blob([exported], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `context_${Date.now()}.json`;
                  a.click();
                  addAiMessage('assistant', '💾 Contexto exportado!');
                }}
                className="w-full px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded text-blue-400 text-sm hover:bg-blue-500/30"
              >
                💾 Exportar JSON
              </button>
              
              <button
                onClick={() => {
                  if (confirm('Limpar todo o contexto?')) {
                    contextSyncManager.clear();
                    addAiMessage('assistant', '🗑️ Contexto limpo!');
                  }
                }}
                className="w-full px-3 py-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm hover:bg-red-500/30"
              >
                🗑️ Limpar Contexto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
