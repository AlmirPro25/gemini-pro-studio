// Live Vision Service - Integra análise visual com Gemini Live
// Permite conversa por voz com contexto visual em tempo real

import { LiveSessionManager } from './geminiService';
import { visualMemoryService, VisualContext } from './visualMemoryService';
import { aiDetectionService, DetectionResult } from './aiDetectionService';
import { hybridVisionService } from './hybridVisionService';
import { contextSyncManager } from './contextSyncManager';

interface LiveVisionCallbacks {
  onTranscription: (text: string, isFinal: boolean) => void;
  onResponse: (text: string) => void;
  onVisualUpdate: (context: VisualContext) => void;
  onError: (error: string) => void;
}

class LiveVisionService {
  private liveSession: LiveSessionManager | null = null;
  private isActive = false;
  private analysisInterval: number | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private callbacks: LiveVisionCallbacks | null = null;
  
  // Configurações
  private analysisIntervalMs = 3000; // Analisa a cada 3 segundos
  private autoSendVisualUpdates = true; // Envia atualizações visuais automaticamente

  /**
   * Inicia sessão Live com visão
   */
  async startLiveVision(
    videoElement: HTMLVideoElement,
    callbacks: LiveVisionCallbacks
  ): Promise<void> {
    if (this.isActive) {
      throw new Error('Live Vision já está ativo');
    }

    this.videoElement = videoElement;
    this.callbacks = callbacks;
    this.liveSession = new LiveSessionManager();

    try {
      // Iniciar sessão Live
      await this.liveSession.startSession({
        onOpen: () => {
          console.log('✅ Gemini Live conectado');
          this.isActive = true;
          
          // Registrar no contexto
          contextSyncManager.update('system', 'Gemini Live conectado');
          
          // Enviar contexto inicial
          this.sendInitialContext();
          
          // Iniciar análise visual periódica
          this.startVisualAnalysis();
        },
        onMessage: (message) => {
          // Processar mensagens do servidor
          const text = message.serverContent?.modelTurn?.parts[0]?.text;
          if (text && this.callbacks) {
            this.callbacks.onResponse(text);
          }
        },
        onTranscription: async (text, isFinal) => {
          if (this.callbacks) {
            this.callbacks.onTranscription(text, isFinal);
            
            // Registrar no contexto
            if (text) {
              contextSyncManager.update('audio', text, { isFinal });
            }
            
            // Se a transcrição menciona algo visual, analisar com Vision
            if (isFinal && text && hybridVisionService.requiresVisualAnalysis(text)) {
              await this.handleVisualQuestion(text);
            }
          }
        },
        onError: (e) => {
          console.error('Erro no Live:', e);
          if (this.callbacks) {
            this.callbacks.onError(e.message || 'Erro desconhecido');
          }
        },
        onClose: (e) => {
          console.log('Live desconectado:', e.reason);
          this.stopLiveVision();
        }
      });
    } catch (error) {
      console.error('Erro ao iniciar Live Vision:', error);
      if (this.callbacks) {
        this.callbacks.onError(error instanceof Error ? error.message : 'Erro ao iniciar');
      }
      throw error;
    }
  }

  /**
   * Para sessão Live
   */
  async stopLiveVision(): Promise<void> {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    if (this.liveSession) {
      await this.liveSession.closeSession();
      this.liveSession = null;
    }

    this.isActive = false;
    this.videoElement = null;
    this.callbacks = null;
  }

  /**
   * Envia contexto inicial
   */
  private async sendInitialContext(): Promise<void> {
    if (!this.liveSession) return;

    const context = `
Olá! Sou seu assistente de segurança com visão computacional.

Estou monitorando uma câmera em tempo real e posso:
- Descrever o que estou vendo
- Alertar sobre mudanças importantes
- Responder suas perguntas sobre a cena
- Manter histórico do que aconteceu

Quando você perguntar sobre a câmera, vou pausar brevemente para analisar a imagem e depois responder por voz.

Pode me perguntar coisas como:
"O que você está vendo?"
"Quantas pessoas tem aí?"
"Algo mudou?"

Estou pronto!
    `.trim();

    // Enviar texto inicial
    await this.liveSession.sendMessage({ text: context });
  }

  /**
   * Inicia análise visual periódica
   */
  private startVisualAnalysis(): void {
    if (this.analysisInterval) return;

    this.analysisInterval = window.setInterval(() => {
      this.analyzeCurrentFrame();
    }, this.analysisIntervalMs);

    // Análise imediata
    this.analyzeCurrentFrame();
  }

  /**
   * Analisa frame atual
   */
  private async analyzeCurrentFrame(): Promise<void> {
    if (!this.videoElement || !this.isActive) return;

    try {
      // Capturar frame
      const frameData = this.captureFrame();
      if (!frameData) return;

      // Detectar objetos com IA
      const detections = await aiDetectionService.detectObjects(this.videoElement);
      
      // Extrair informações
      const objects = detections.detections.map(d => d.class);
      const people = detections.detections.filter(d => d.class === 'person').length;
      const activities = this.inferActivities(detections);
      
      // Verificar se houve mudança significativa
      const hasChange = visualMemoryService.hasSignificantChange(objects, people);
      
      if (!hasChange) {
        // Sem mudanças significativas, não precisa enviar
        return;
      }
      
      // Detectar mudanças específicas
      const changes = visualMemoryService.detectChanges({ objects, people, activities });
      
      // Criar contexto
      const context: VisualContext = {
        timestamp: Date.now(),
        description: this.generateDescription(objects, people, activities),
        objects,
        people,
        activities,
        changes,
        imageData: frameData
      };
      
      // Adicionar à memória
      visualMemoryService.addContext(context);
      
      // Registrar no contexto unificado
      contextSyncManager.update('vision', context.description, {
        people: context.people,
        objects: context.objects,
        changes: context.changes
      });
      
      // Registrar detecções
      context.changes.forEach(change => {
        if (change !== 'Nenhuma mudança significativa') {
          contextSyncManager.update('detection', change);
        }
      });
      
      // Notificar callback
      if (this.callbacks) {
        this.callbacks.onVisualUpdate(context);
      }
      
      // Enviar para o Live se houver mudanças importantes
      if (this.autoSendVisualUpdates && changes.length > 0 && changes[0] !== 'Nenhuma mudança significativa') {
        await this.sendVisualUpdate(context);
      }
      
      // Adicionar eventos significativos
      if (people > 3) {
        visualMemoryService.addSignificantEvent('Aglomeração detectada');
      }
      
    } catch (error) {
      console.error('Erro na análise visual:', error);
    }
  }

  /**
   * Envia atualização visual para o Live (apenas mudanças importantes)
   */
  private async sendVisualUpdate(context: VisualContext): Promise<void> {
    if (!this.liveSession || !this.liveSession.isActive()) return;

    // Apenas mudanças críticas são enviadas por voz
    const criticalChanges = context.changes.filter(change => 
      change.includes('entrou') || 
      change.includes('saiu') ||
      change.includes('Novos objetos') ||
      change.includes('Aglomeração')
    );

    if (criticalChanges.length === 0) return;

    const update = criticalChanges.join('. ');
    await this.liveSession.sendMessage({ text: update });
  }

  /**
   * Processa pergunta visual (usa Gemini Vision + retorna resposta para Live)
   */
  private async handleVisualQuestion(question: string): Promise<void> {
    if (!this.videoElement || !this.liveSession) return;

    try {
      // Capturar frame atual
      const frameData = this.captureFrame();
      if (!frameData) return;

      // Analisar com Gemini Vision
      const analysis = await hybridVisionService.analyzeImageForSpeech(
        frameData,
        question
      );

      // Registrar resposta no contexto
      contextSyncManager.update('text', analysis.spokenResponse, {
        fullDescription: analysis.visualDescription
      });
      
      // Enviar resposta otimizada para o Live falar
      await this.liveSession.sendMessage({ 
        text: analysis.spokenResponse 
      });

      // Notificar callback com a descrição completa
      if (this.callbacks) {
        this.callbacks.onResponse(analysis.visualDescription);
      }

    } catch (error) {
      console.error('Erro ao processar pergunta visual:', error);
      await this.liveSession?.sendMessage({ 
        text: 'Desculpe, tive um problema ao analisar a câmera.' 
      });
    }
  }

  /**
   * Captura frame do vídeo
   */
  private captureFrame(): string | null {
    if (!this.videoElement) return null;

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7);
  }

  /**
   * Gera descrição da cena
   */
  private generateDescription(objects: string[], people: number, activities: string[]): string {
    const parts: string[] = [];
    
    if (people > 0) {
      parts.push(`${people} pessoa${people > 1 ? 's' : ''}`);
    }
    
    const nonPersonObjects = objects.filter(obj => obj !== 'person');
    if (nonPersonObjects.length > 0) {
      parts.push(`objetos: ${nonPersonObjects.slice(0, 5).join(', ')}`);
    }
    
    if (activities.length > 0) {
      parts.push(`atividades: ${activities.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Cena vazia';
  }

  /**
   * Infere atividades baseado nas detecções
   */
  private inferActivities(detections: DetectionResult): string[] {
    const activities: string[] = [];
    const objects = detections.detections.map(d => d.class);
    
    if (objects.includes('person') && objects.includes('cell phone')) {
      activities.push('usando celular');
    }
    
    if (objects.includes('person') && objects.includes('laptop')) {
      activities.push('usando computador');
    }
    
    if (objects.filter(o => o === 'person').length > 2) {
      activities.push('reunião/grupo');
    }
    
    return activities;
  }

  /**
   * Envia pergunta específica sobre a visão
   */
  async askAboutVision(question: string): Promise<void> {
    if (!this.liveSession || !this.liveSession.isActive()) {
      throw new Error('Live Vision não está ativo');
    }

    // Se requer análise visual, usar Vision
    if (hybridVisionService.requiresVisualAnalysis(question)) {
      await this.handleVisualQuestion(question);
    } else {
      // Pergunta geral, enviar direto para o Live
      await this.liveSession.sendMessage({ text: question });
    }
  }

  /**
   * Configurações
   */
  setAnalysisInterval(ms: number): void {
    this.analysisIntervalMs = ms;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.startVisualAnalysis();
    }
  }

  setAutoSendVisualUpdates(enabled: boolean): void {
    this.autoSendVisualUpdates = enabled;
  }

  /**
   * Status
   */
  isLiveActive(): boolean {
    return this.isActive;
  }

  getStats() {
    return {
      isActive: this.isActive,
      analysisInterval: this.analysisIntervalMs,
      autoSendUpdates: this.autoSendVisualUpdates,
      ...visualMemoryService.getStats()
    };
  }
}

export const liveVisionService = new LiveVisionService();
