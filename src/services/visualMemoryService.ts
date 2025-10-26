// Visual Memory Service - Mantém contexto das análises de vídeo
// Evita análises repetitivas e mantém histórico inteligente

interface VisualContext {
  timestamp: number;
  description: string;
  objects: string[];
  people: number;
  activities: string[];
  changes: string[];
  imageData?: string;
}

interface VisualMemory {
  contexts: VisualContext[];
  lastAnalysis: VisualContext | null;
  summary: string;
  significantEvents: string[];
}

class VisualMemoryService {
  private memory: VisualMemory = {
    contexts: [],
    lastAnalysis: null,
    summary: '',
    significantEvents: []
  };
  
  private maxContexts = 20; // Mantém últimos 20 contextos
  private similarityThreshold = 0.8; // 80% de similaridade = não analisa novamente

  /**
   * Adiciona novo contexto visual
   */
  addContext(context: VisualContext): void {
    this.memory.contexts.push(context);
    
    // Manter apenas os últimos N contextos
    if (this.memory.contexts.length > this.maxContexts) {
      this.memory.contexts = this.memory.contexts.slice(-this.maxContexts);
    }
    
    this.memory.lastAnalysis = context;
  }

  /**
   * Verifica se a cena mudou significativamente
   */
  hasSignificantChange(currentObjects: string[], currentPeople: number): boolean {
    if (!this.memory.lastAnalysis) return true;
    
    const lastObjects = this.memory.lastAnalysis.objects;
    const lastPeople = this.memory.lastAnalysis.people;
    
    // Mudança no número de pessoas
    if (Math.abs(currentPeople - lastPeople) > 0) {
      return true;
    }
    
    // Novos objetos detectados
    const newObjects = currentObjects.filter(obj => !lastObjects.includes(obj));
    if (newObjects.length > 0) {
      return true;
    }
    
    // Objetos removidos
    const removedObjects = lastObjects.filter(obj => !currentObjects.includes(obj));
    if (removedObjects.length > 0) {
      return true;
    }
    
    return false;
  }

  /**
   * Detecta mudanças entre análises
   */
  detectChanges(currentContext: Partial<VisualContext>): string[] {
    if (!this.memory.lastAnalysis) return ['Primeira análise'];
    
    const changes: string[] = [];
    const last = this.memory.lastAnalysis;
    
    // Mudanças em pessoas
    if (currentContext.people !== undefined && currentContext.people !== last.people) {
      if (currentContext.people > last.people) {
        changes.push(`${currentContext.people - last.people} pessoa(s) entraram na cena`);
      } else {
        changes.push(`${last.people - currentContext.people} pessoa(s) saíram da cena`);
      }
    }
    
    // Novos objetos
    if (currentContext.objects) {
      const newObjects = currentContext.objects.filter(obj => !last.objects.includes(obj));
      if (newObjects.length > 0) {
        changes.push(`Novos objetos: ${newObjects.join(', ')}`);
      }
      
      // Objetos removidos
      const removedObjects = last.objects.filter(obj => !currentContext.objects!.includes(obj));
      if (removedObjects.length > 0) {
        changes.push(`Objetos removidos: ${removedObjects.join(', ')}`);
      }
    }
    
    // Novas atividades
    if (currentContext.activities) {
      const newActivities = currentContext.activities.filter(act => 
        !last.activities.includes(act)
      );
      if (newActivities.length > 0) {
        changes.push(`Novas atividades: ${newActivities.join(', ')}`);
      }
    }
    
    return changes.length > 0 ? changes : ['Nenhuma mudança significativa'];
  }

  /**
   * Gera resumo do que aconteceu
   */
  generateSummary(): string {
    if (this.memory.contexts.length === 0) {
      return 'Nenhuma análise realizada ainda.';
    }
    
    const recentContexts = this.memory.contexts.slice(-5); // Últimos 5
    const allObjects = new Set<string>();
    const allActivities = new Set<string>();
    let maxPeople = 0;
    
    recentContexts.forEach(ctx => {
      ctx.objects.forEach(obj => allObjects.add(obj));
      ctx.activities.forEach(act => allActivities.add(act));
      maxPeople = Math.max(maxPeople, ctx.people);
    });
    
    const summary = `
📊 Resumo dos últimos ${recentContexts.length} frames:
• Pessoas detectadas: até ${maxPeople}
• Objetos identificados: ${Array.from(allObjects).join(', ') || 'nenhum'}
• Atividades: ${Array.from(allActivities).join(', ') || 'nenhuma'}
• Eventos significativos: ${this.memory.significantEvents.slice(-3).join('; ') || 'nenhum'}
    `.trim();
    
    this.memory.summary = summary;
    return summary;
  }

  /**
   * Adiciona evento significativo
   */
  addSignificantEvent(event: string): void {
    this.memory.significantEvents.push(`[${new Date().toLocaleTimeString()}] ${event}`);
    
    // Manter apenas últimos 10 eventos
    if (this.memory.significantEvents.length > 10) {
      this.memory.significantEvents = this.memory.significantEvents.slice(-10);
    }
  }

  /**
   * Obtém contexto para o Gemini Live
   */
  getContextForLive(): string {
    const summary = this.generateSummary();
    const recentChanges = this.memory.contexts
      .slice(-3)
      .flatMap(ctx => ctx.changes)
      .filter(change => change !== 'Nenhuma mudança significativa');
    
    return `
🎥 CONTEXTO VISUAL ATUAL:

${summary}

📝 Mudanças Recentes:
${recentChanges.length > 0 ? recentChanges.map((c, i) => `${i + 1}. ${c}`).join('\n') : 'Nenhuma mudança recente'}

${this.memory.lastAnalysis ? `
🔍 Última Análise:
${this.memory.lastAnalysis.description}
` : ''}
    `.trim();
  }

  /**
   * Obtém histórico de imagens para análise
   */
  getRecentImages(count: number = 3): string[] {
    return this.memory.contexts
      .slice(-count)
      .map(ctx => ctx.imageData)
      .filter((img): img is string => !!img);
  }

  /**
   * Limpa memória
   */
  clear(): void {
    this.memory = {
      contexts: [],
      lastAnalysis: null,
      summary: '',
      significantEvents: []
    };
  }

  /**
   * Obtém estatísticas
   */
  getStats(): {
    totalAnalyses: number;
    significantEvents: number;
    currentPeople: number;
    currentObjects: string[];
  } {
    return {
      totalAnalyses: this.memory.contexts.length,
      significantEvents: this.memory.significantEvents.length,
      currentPeople: this.memory.lastAnalysis?.people || 0,
      currentObjects: this.memory.lastAnalysis?.objects || []
    };
  }

  /**
   * Exporta memória
   */
  export(): VisualMemory {
    return JSON.parse(JSON.stringify(this.memory));
  }

  /**
   * Importa memória
   */
  import(memory: VisualMemory): void {
    this.memory = memory;
  }
}

export const visualMemoryService = new VisualMemoryService();
export type { VisualContext, VisualMemory };
