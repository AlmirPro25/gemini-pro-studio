// Batch Analysis Service - Analisa múltiplos frames de uma vez
// Aproveita o limite de 3.000 imagens do Gemini para análises profundas

import { sendMessageToGemini } from './geminiService';
import { GEMINI_MODELS, PERSONAS } from '../constants';
import { Message } from '../types';
import { contextSyncManager } from './contextSyncManager';

interface BatchFrame {
  timestamp: number;
  imageData: string;
  metadata?: any;
}

interface BatchAnalysisResult {
  summary: string;
  patterns: string[];
  events: Array<{
    timestamp: number;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  statistics: {
    totalFrames: number;
    timeSpan: number;
    peopleCount: { min: number; max: number; avg: number };
    objectsDetected: string[];
  };
}

class BatchAnalysisService {
  private frameBuffer: BatchFrame[] = [];
  private maxBufferSize = 500; // Máximo de frames no buffer
  private isAnalyzing = false;

  /**
   * Adiciona frame ao buffer
   */
  addFrame(imageData: string, metadata?: any): void {
    this.frameBuffer.push({
      timestamp: Date.now(),
      imageData,
      metadata
    });

    // Manter apenas últimos N frames
    if (this.frameBuffer.length > this.maxBufferSize) {
      this.frameBuffer = this.frameBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Analisa lote de frames
   */
  async analyzeBatch(options?: {
    frameCount?: number;
    startTime?: number;
    endTime?: number;
    analysisType?: 'summary' | 'patterns' | 'events' | 'full';
  }): Promise<BatchAnalysisResult> {
    if (this.isAnalyzing) {
      throw new Error('Análise em lote já em andamento');
    }

    this.isAnalyzing = true;

    try {
      // Selecionar frames
      let frames = this.selectFrames(options);

      if (frames.length === 0) {
        throw new Error('Nenhum frame disponível para análise');
      }

      // Limitar a 100 frames para não exceder limites
      if (frames.length > 100) {
        frames = this.sampleFrames(frames, 100);
      }

      contextSyncManager.update(
        'system',
        `Iniciando análise em lote de ${frames.length} frames`
      );

      // Preparar prompt
      const prompt = this.buildPrompt(frames, options?.analysisType || 'full');

      // Preparar attachments
      const attachments = frames.map((frame, index) => ({
        name: `frame_${index}_${frame.timestamp}.jpg`,
        mimeType: 'image/jpeg' as const,
        data: frame.imageData.split(',')[1] // Remove data:image/jpeg;base64,
      }));

      // Criar mensagem
      const messages: Message[] = [{
        id: 'batch_analysis',
        role: 'user',
        content: prompt,
        attachments
      }];

      // Chamar Gemini
      let fullResponse = '';
      const stream = sendMessageToGemini(
        messages,
        GEMINI_MODELS[1], // Gemini 2.5 Flash
        PERSONAS[0],
        false,
        {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        },
        new AbortController().signal
      );

      for await (const chunk of stream) {
        fullResponse += chunk;
      }

      const parsed = JSON.parse(fullResponse);
      const result = this.parseAnalysisResult(parsed.response, frames);

      contextSyncManager.update(
        'system',
        `Análise em lote concluída: ${result.events.length} eventos detectados`
      );

      return result;

    } catch (error) {
      console.error('Erro na análise em lote:', error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Seleciona frames baseado em critérios
   */
  private selectFrames(options?: {
    frameCount?: number;
    startTime?: number;
    endTime?: number;
  }): BatchFrame[] {
    let frames = [...this.frameBuffer];

    // Filtrar por tempo
    if (options?.startTime) {
      frames = frames.filter(f => f.timestamp >= options.startTime!);
    }
    if (options?.endTime) {
      frames = frames.filter(f => f.timestamp <= options.endTime!);
    }

    // Limitar quantidade
    if (options?.frameCount && frames.length > options.frameCount) {
      frames = this.sampleFrames(frames, options.frameCount);
    }

    return frames;
  }

  /**
   * Amostra frames uniformemente
   */
  private sampleFrames(frames: BatchFrame[], targetCount: number): BatchFrame[] {
    if (frames.length <= targetCount) return frames;

    const step = frames.length / targetCount;
    const sampled: BatchFrame[] = [];

    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step);
      sampled.push(frames[index]);
    }

    return sampled;
  }

  /**
   * Constrói prompt para análise
   */
  private buildPrompt(
    frames: BatchFrame[],
    analysisType: 'summary' | 'patterns' | 'events' | 'full'
  ): string {
    const timeSpan = frames[frames.length - 1].timestamp - frames[0].timestamp;
    const timeSpanMin = Math.round(timeSpan / 60000);

    const basePrompt = `
🎥 ANÁLISE EM LOTE DE VÍDEO DE SEGURANÇA

INFORMAÇÕES:
• Total de frames: ${frames.length}
• Período: ${timeSpanMin} minutos
• Intervalo: ${Math.round(timeSpan / frames.length / 1000)}s entre frames

FRAMES ANEXADOS:
${frames.map((f, i) => `Frame ${i + 1}: ${new Date(f.timestamp).toLocaleTimeString()}`).join('\n')}
    `.trim();

    const instructions: Record<string, string> = {
      summary: `
TAREFA: Gere um RESUMO EXECUTIVO do que aconteceu neste período.

Inclua:
1. Visão geral (1-2 frases)
2. Principais eventos
3. Estatísticas (pessoas, objetos)
4. Conclusão
      `,
      patterns: `
TAREFA: DETECTE PADRÕES DE COMPORTAMENTO neste período.

Analise:
1. Movimentos repetitivos
2. Comportamentos suspeitos
3. Padrões temporais
4. Anomalias
      `,
      events: `
TAREFA: LISTE TODOS OS EVENTOS IMPORTANTES neste período.

Para cada evento:
1. Timestamp aproximado
2. Descrição clara
3. Severidade (low/medium/high/critical)
4. Pessoas/objetos envolvidos
      `,
      full: `
TAREFA: ANÁLISE COMPLETA E DETALHADA deste período.

Forneça:
1. Resumo executivo
2. Eventos importantes (com timestamps)
3. Padrões detectados
4. Estatísticas:
   - Número de pessoas (min/max/média)
   - Objetos detectados
   - Atividades principais
5. Alertas e recomendações

FORMATO DA RESPOSTA:
Use JSON estruturado para facilitar parsing:
{
  "summary": "...",
  "events": [
    {"timestamp": "14:30:15", "description": "...", "severity": "high"}
  ],
  "patterns": ["...", "..."],
  "statistics": {
    "people": {"min": 0, "max": 5, "avg": 2.3},
    "objects": ["laptop", "phone"],
    "activities": ["working", "meeting"]
  }
}
      `
    };

    return `${basePrompt}\n\n${instructions[analysisType]}`;
  }

  /**
   * Parseia resultado da análise
   */
  private parseAnalysisResult(
    response: string,
    frames: BatchFrame[]
  ): BatchAnalysisResult {
    try {
      // Tentar extrair JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          summary: data.summary || response,
          patterns: data.patterns || [],
          events: data.events || [],
          statistics: {
            totalFrames: frames.length,
            timeSpan: frames[frames.length - 1].timestamp - frames[0].timestamp,
            peopleCount: data.statistics?.people || { min: 0, max: 0, avg: 0 },
            objectsDetected: data.statistics?.objects || []
          }
        };
      }
    } catch (error) {
      console.error('Erro ao parsear JSON:', error);
    }

    // Fallback: análise textual
    return {
      summary: response,
      patterns: [],
      events: [],
      statistics: {
        totalFrames: frames.length,
        timeSpan: frames[frames.length - 1].timestamp - frames[0].timestamp,
        peopleCount: { min: 0, max: 0, avg: 0 },
        objectsDetected: []
      }
    };
  }

  /**
   * Analisa últimos N minutos
   */
  async analyzeLastMinutes(minutes: number): Promise<BatchAnalysisResult> {
    const endTime = Date.now();
    const startTime = endTime - minutes * 60 * 1000;

    return this.analyzeBatch({
      startTime,
      endTime,
      analysisType: 'full'
    });
  }

  /**
   * Analisa período específico
   */
  async analyzePeriod(
    startTime: number,
    endTime: number
  ): Promise<BatchAnalysisResult> {
    return this.analyzeBatch({
      startTime,
      endTime,
      analysisType: 'full'
    });
  }

  /**
   * Detecta padrões
   */
  async detectPatterns(frameCount: number = 100): Promise<string[]> {
    const result = await this.analyzeBatch({
      frameCount,
      analysisType: 'patterns'
    });
    return result.patterns;
  }

  /**
   * Gera resumo
   */
  async generateSummary(frameCount: number = 50): Promise<string> {
    const result = await this.analyzeBatch({
      frameCount,
      analysisType: 'summary'
    });
    return result.summary;
  }

  /**
   * Obtém estatísticas do buffer
   */
  getBufferStats(): {
    totalFrames: number;
    oldestFrame: number;
    newestFrame: number;
    timeSpan: number;
  } {
    if (this.frameBuffer.length === 0) {
      return {
        totalFrames: 0,
        oldestFrame: 0,
        newestFrame: 0,
        timeSpan: 0
      };
    }

    return {
      totalFrames: this.frameBuffer.length,
      oldestFrame: this.frameBuffer[0].timestamp,
      newestFrame: this.frameBuffer[this.frameBuffer.length - 1].timestamp,
      timeSpan:
        this.frameBuffer[this.frameBuffer.length - 1].timestamp -
        this.frameBuffer[0].timestamp
    };
  }

  /**
   * Limpa buffer
   */
  clearBuffer(): void {
    this.frameBuffer = [];
  }

  /**
   * Define tamanho máximo do buffer
   */
  setMaxBufferSize(size: number): void {
    this.maxBufferSize = size;
    if (this.frameBuffer.length > size) {
      this.frameBuffer = this.frameBuffer.slice(-size);
    }
  }

  /**
   * Verifica se está analisando
   */
  isAnalyzingBatch(): boolean {
    return this.isAnalyzing;
  }
}

export const batchAnalysisService = new BatchAnalysisService();
export type { BatchFrame, BatchAnalysisResult };
