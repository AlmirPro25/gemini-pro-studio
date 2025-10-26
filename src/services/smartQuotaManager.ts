// Smart Quota Manager - Gerencia quota de API de forma inteligente
// Otimiza uso de 1.500 requisições/dia com detecção local

import { batchAnalysisService } from './batchAnalysisService';
import { aiDetectionService } from './aiDetectionService';
import { contextSyncManager } from './contextSyncManager';

interface QuotaConfig {
  maxDailyRequests: number;
  warningThreshold: number; // Percentual (0-1)
  captureInterval: number; // Segundos
  framesPerBatch: number;
  detectionThreshold: number; // Confiança mínima (0-1)
}

interface QuotaMetrics {
  dailyRequests: number;
  remainingQuota: number;
  usagePercentage: number;
  averageFramesPerRequest: number;
  detectionRate: number;
  lastReset: number;
  projectedDailyUsage: number;
}

interface ScheduleConfig {
  interval: number;
  threshold: number;
  priority: number;
}

class SmartQuotaManager {
  private config: QuotaConfig = {
    maxDailyRequests: 1500,
    warningThreshold: 0.9, // 90%
    captureInterval: 3, // 3 segundos
    framesPerBatch: 20,
    detectionThreshold: 0.5
  };

  private metrics: QuotaMetrics = {
    dailyRequests: 0,
    remainingQuota: 1500,
    usagePercentage: 0,
    averageFramesPerRequest: 0,
    detectionRate: 0,
    lastReset: Date.now(),
    projectedDailyUsage: 0
  };

  private frameBuffer: string[] = [];
  private interestingFrames = 0;
  private totalFramesCaptured = 0;
  private framesWithDetection = 0;
  private lastHeartbeat = Date.now();
  private isProcessing = false;

  // Agendamento por horário
  private schedule: Record<string, ScheduleConfig> = {
    '00-06': { interval: 10, threshold: 0.7, priority: 3 }, // Madrugada
    '06-09': { interval: 3, threshold: 0.5, priority: 7 },  // Manhã
    '09-18': { interval: 2, threshold: 0.4, priority: 10 }, // Dia
    '18-22': { interval: 3, threshold: 0.5, priority: 7 },  // Noite
    '22-24': { interval: 5, threshold: 0.6, priority: 5 }   // Noite tardia
  };

  /**
   * Processa novo frame
   */
  async processFrame(
    videoElement: HTMLVideoElement,
    imageData: string
  ): Promise<void> {
    // Verificar reset diário
    this.checkDailyReset();

    // Verificar quota
    if (!this.canMakeRequest()) {
      console.warn('Quota diária atingida');
      return;
    }

    this.totalFramesCaptured++;
    this.frameBuffer.push(imageData);

    // Manter buffer limitado
    if (this.frameBuffer.length > 100) {
      this.frameBuffer = this.frameBuffer.slice(-100);
    }

    // Detecção local (sem custo de API)
    const detection = await aiDetectionService.detectObjects(videoElement);

    const hasInterest = this.isFrameInteresting(detection);

    if (hasInterest) {
      this.interestingFrames++;
      this.framesWithDetection++;

      contextSyncManager.update(
        'detection',
        `Frame interessante: ${detection.detections.length} objetos`
      );

      // Adicionar ao batch analysis
      batchAnalysisService.addFrame(imageData, {
        detections: detection.detections.length,
        timestamp: Date.now()
      });
    }

    // Enviar batch quando acumular frames suficientes
    if (this.interestingFrames >= this.config.framesPerBatch) {
      await this.sendBatch();
    }

    // Heartbeat (1x por hora mesmo sem eventos)
    const hoursSinceHeartbeat =
      (Date.now() - this.lastHeartbeat) / (1000 * 60 * 60);

    if (hoursSinceHeartbeat >= 1) {
      await this.sendHeartbeat(imageData);
    }

    // Atualizar métricas
    this.updateMetrics();
  }

  /**
   * Verifica se frame é interessante
   */
  private isFrameInteresting(detection: any): boolean {
    const config = this.getCurrentScheduleConfig();

    // Verificar se tem pessoas
    const hasPerson = detection.detections.some(
      (d: any) => d.class === 'person' && d.score >= config.threshold
    );

    if (hasPerson) return true;

    // Verificar objetos importantes
    const importantObjects = ['car', 'truck', 'dog', 'cat', 'backpack'];
    const hasImportantObject = detection.detections.some(
      (d: any) =>
        importantObjects.includes(d.class) && d.score >= config.threshold
    );

    if (hasImportantObject) return true;

    // Verificar quantidade de objetos (possível movimento)
    if (detection.detections.length >= 3) return true;

    return false;
  }

  /**
   * Envia batch para análise
   */
  private async sendBatch(): Promise<void> {
    if (this.isProcessing) return;
    if (!this.canMakeRequest()) return;

    this.isProcessing = true;

    try {
      contextSyncManager.update(
        'system',
        `Enviando batch de ${this.interestingFrames} frames para análise`
      );

      // Usar batch analysis service
      const result = await batchAnalysisService.analyzeBatch({
        frameCount: this.config.framesPerBatch,
        analysisType: 'events'
      });

      // Incrementar contador
      this.metrics.dailyRequests++;
      this.interestingFrames = 0;

      contextSyncManager.update(
        'system',
        `Análise concluída: ${result.events.length} eventos detectados. Quota: ${this.metrics.dailyRequests}/${this.config.maxDailyRequests}`
      );

      // Verificar se precisa ajustar configuração
      this.adjustConfigIfNeeded();
    } catch (error) {
      console.error('Erro ao enviar batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Envia heartbeat
   */
  private async sendHeartbeat(imageData: string): Promise<void> {
    if (!this.canMakeRequest()) return;

    try {
      contextSyncManager.update('system', 'Enviando heartbeat');

      // Análise simples de 1 frame
      batchAnalysisService.addFrame(imageData);
      await batchAnalysisService.analyzeBatch({
        frameCount: 1,
        analysisType: 'summary'
      });

      this.metrics.dailyRequests++;
      this.lastHeartbeat = Date.now();

      contextSyncManager.update(
        'system',
        `Heartbeat enviado. Quota: ${this.metrics.dailyRequests}/${this.config.maxDailyRequests}`
      );
    } catch (error) {
      console.error('Erro ao enviar heartbeat:', error);
    }
  }

  /**
   * Verifica se pode fazer requisição
   */
  private canMakeRequest(): boolean {
    // Verificar quota diária
    if (this.metrics.dailyRequests >= this.config.maxDailyRequests) {
      return false;
    }

    // Verificar threshold de warning
    const usagePercent =
      this.metrics.dailyRequests / this.config.maxDailyRequests;

    if (usagePercent >= this.config.warningThreshold) {
      // Modo conservador - apenas eventos críticos
      const config = this.getCurrentScheduleConfig();
      return config.priority >= 8;
    }

    return true;
  }

  /**
   * Obtém configuração do horário atual
   */
  private getCurrentScheduleConfig(): ScheduleConfig {
    const hour = new Date().getHours();

    if (hour >= 0 && hour < 6) return this.schedule['00-06'];
    if (hour >= 6 && hour < 9) return this.schedule['06-09'];
    if (hour >= 9 && hour < 18) return this.schedule['09-18'];
    if (hour >= 18 && hour < 22) return this.schedule['18-22'];
    return this.schedule['22-24'];
  }

  /**
   * Ajusta configuração baseado no uso
   */
  private adjustConfigIfNeeded(): void {
    const usagePercent =
      this.metrics.dailyRequests / this.config.maxDailyRequests;

    // Se usar mais de 90%, reduzir frequência
    if (usagePercent >= 0.9) {
      this.config.captureInterval = Math.min(
        this.config.captureInterval * 1.5,
        10
      );
      this.config.detectionThreshold = Math.min(
        this.config.detectionThreshold + 0.1,
        0.9
      );

      contextSyncManager.update(
        'system',
        `Quota alta (${Math.round(usagePercent * 100)}%) - Reduzindo frequência`
      );
    }

    // Se usar menos de 50%, pode aumentar frequência
    if (usagePercent < 0.5 && this.metrics.dailyRequests > 100) {
      this.config.captureInterval = Math.max(
        this.config.captureInterval * 0.9,
        2
      );
      this.config.detectionThreshold = Math.max(
        this.config.detectionThreshold - 0.05,
        0.3
      );

      contextSyncManager.update(
        'system',
        `Quota baixa (${Math.round(usagePercent * 100)}%) - Aumentando frequência`
      );
    }
  }

  /**
   * Verifica reset diário
   */
  private checkDailyReset(): void {
    const now = Date.now();
    const hoursSinceReset = (now - this.metrics.lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      this.resetDailyMetrics();
    }
  }

  /**
   * Reseta métricas diárias
   */
  private resetDailyMetrics(): void {
    this.metrics.dailyRequests = 0;
    this.metrics.lastReset = Date.now();
    this.totalFramesCaptured = 0;
    this.framesWithDetection = 0;

    contextSyncManager.update('system', '🔄 Reset diário de quota');
  }

  /**
   * Atualiza métricas
   */
  private updateMetrics(): void {
    this.metrics.remainingQuota =
      this.config.maxDailyRequests - this.metrics.dailyRequests;

    this.metrics.usagePercentage =
      this.metrics.dailyRequests / this.config.maxDailyRequests;

    if (this.metrics.dailyRequests > 0) {
      this.metrics.averageFramesPerRequest =
        this.totalFramesCaptured / this.metrics.dailyRequests;
    }

    if (this.totalFramesCaptured > 0) {
      this.metrics.detectionRate =
        this.framesWithDetection / this.totalFramesCaptured;
    }

    // Projeção de uso diário
    const hoursSinceReset =
      (Date.now() - this.metrics.lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset > 0) {
      this.metrics.projectedDailyUsage =
        (this.metrics.dailyRequests / hoursSinceReset) * 24;
    }
  }

  /**
   * Obtém métricas
   */
  getMetrics(): QuotaMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtém configuração
   */
  getConfig(): QuotaConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(config: Partial<QuotaConfig>): void {
    this.config = { ...this.config, ...config };
    contextSyncManager.update('system', 'Configuração de quota atualizada');
  }

  /**
   * Força reset
   */
  forceReset(): void {
    this.resetDailyMetrics();
  }

  /**
   * Obtém status
   */
  getStatus(): {
    canMakeRequest: boolean;
    mode: 'normal' | 'warning' | 'critical';
    message: string;
  } {
    const usagePercent = this.metrics.usagePercentage;

    if (usagePercent >= 1) {
      return {
        canMakeRequest: false,
        mode: 'critical',
        message: 'Quota diária esgotada'
      };
    }

    if (usagePercent >= this.config.warningThreshold) {
      return {
        canMakeRequest: true,
        mode: 'warning',
        message: `Quota em ${Math.round(usagePercent * 100)}% - Modo conservador`
      };
    }

    return {
      canMakeRequest: true,
      mode: 'normal',
      message: `Quota em ${Math.round(usagePercent * 100)}%`
    };
  }
}

export const smartQuotaManager = new SmartQuotaManager();
export type { QuotaConfig, QuotaMetrics };
