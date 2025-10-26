// Hybrid Vision Service - Combina Gemini Live (voz) + Gemini Vision (imagens)
// Usa Live para conversa e Vision para análise visual detalhada

import { sendMessageToGemini } from './geminiService';
import { GEMINI_MODELS, PERSONAS } from '../constants';
import { Message } from '../types';
import { visualMemoryService } from './visualMemoryService';

interface HybridVisionAnalysis {
  visualDescription: string;
  spokenResponse: string;
  timestamp: number;
}

class HybridVisionService {
  /**
   * Analisa imagem com Gemini Vision e retorna resposta para falar
   */
  async analyzeImageForSpeech(
    imageData: string,
    question: string
  ): Promise<HybridVisionAnalysis> {
    try {
      // Obter contexto da memória
      const memoryContext = visualMemoryService.getContextForLive();
      const stats = visualMemoryService.getStats();
      
      // Criar prompt otimizado
      const prompt = `
🎥 ANÁLISE DE CÂMERA DE SEGURANÇA

CONTEXTO ATUAL:
${memoryContext}

ESTATÍSTICAS:
• Total de análises: ${stats.totalAnalyses}
• Pessoas na cena: ${stats.currentPeople}
• Objetos detectados: ${stats.currentObjects.join(', ') || 'nenhum'}

PERGUNTA DO USUÁRIO:
"${question}"

INSTRUÇÕES:
1. Analise a imagem da câmera
2. Responda a pergunta do usuário de forma CONCISA (máximo 3 frases)
3. Use linguagem natural, como se estivesse falando
4. Foque apenas no que foi perguntado
5. Se houver mudanças importantes, mencione brevemente

FORMATO DA RESPOSTA:
Responda diretamente, sem formatação markdown, como se estivesse falando.
      `.trim();

      // Preparar mensagem com imagem
      const messages: Message[] = [{
        id: 'vision_query',
        role: 'user',
        content: prompt,
        attachments: [{
          name: 'camera_frame.jpg',
          mimeType: 'image/jpeg',
          data: imageData.split(',')[1] // Remove data:image/jpeg;base64,
        }]
      }];

      // Chamar Gemini Vision
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
          maxOutputTokens: 200 // Resposta curta para falar
        },
        new AbortController().signal
      );

      for await (const chunk of stream) {
        fullResponse += chunk;
      }

      const parsed = JSON.parse(fullResponse);
      const visualDescription = parsed.response || 'Não consegui analisar a imagem.';
      
      // Criar resposta otimizada para fala
      const spokenResponse = this.optimizeForSpeech(visualDescription);

      return {
        visualDescription,
        spokenResponse,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Erro na análise híbrida:', error);
      return {
        visualDescription: 'Erro ao analisar imagem',
        spokenResponse: 'Desculpe, tive um problema ao analisar a câmera.',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Otimiza texto para ser falado (remove markdown, emojis, etc)
   */
  private optimizeForSpeech(text: string): string {
    return text
      // Remove markdown
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove emojis (mantém apenas texto)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      // Remove múltiplas quebras de linha
      .replace(/\n{3,}/g, '\n\n')
      // Remove espaços extras
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Gera resumo visual para contexto
   */
  async generateVisualSummary(imageData: string): Promise<string> {
    try {
      const prompt = `
Analise esta imagem de câmera de segurança e descreva em 1-2 frases curtas:
- Quantas pessoas
- Principais objetos
- Atividade principal

Seja MUITO BREVE e objetivo, como se estivesse falando.
      `.trim();

      const messages: Message[] = [{
        id: 'summary',
        role: 'user',
        content: prompt,
        attachments: [{
          name: 'frame.jpg',
          mimeType: 'image/jpeg',
          data: imageData.split(',')[1]
        }]
      }];

      let fullResponse = '';
      const stream = sendMessageToGemini(
        messages,
        GEMINI_MODELS[1],
        PERSONAS[0],
        false,
        { temperature: 0.5, topK: 40, topP: 0.95, maxOutputTokens: 100 },
        new AbortController().signal
      );

      for await (const chunk of stream) {
        fullResponse += chunk;
      }

      const parsed = JSON.parse(fullResponse);
      return this.optimizeForSpeech(parsed.response || 'Cena vazia');

    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return 'Não consegui gerar resumo';
    }
  }

  /**
   * Detecta se a pergunta requer análise visual
   */
  requiresVisualAnalysis(question: string): boolean {
    const visualKeywords = [
      'ver', 'vendo', 'vê', 'olhar', 'olhando', 'mostrar', 'mostra',
      'câmera', 'imagem', 'foto', 'cena', 'acontecendo',
      'quem', 'quantos', 'quantas', 'onde', 'o que', 'como',
      'pessoa', 'pessoas', 'objeto', 'objetos',
      'mudou', 'mudança', 'diferente', 'novo', 'nova'
    ];
    
    const lowerQuestion = question.toLowerCase();
    return visualKeywords.some(keyword => lowerQuestion.includes(keyword));
  }
}

export const hybridVisionService = new HybridVisionService();
export type { HybridVisionAnalysis };
