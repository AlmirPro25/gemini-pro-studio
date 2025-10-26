// Context Sync Manager - Unifica contexto de múltiplos canais
// Resolve o problema de contexto isolado no Gemini Live

interface ContextEntry {
  id: string;
  source: 'audio' | 'text' | 'vision' | 'action' | 'system' | 'detection';
  content: string;
  timestamp: number;
  metadata?: any;
}

interface ContextSummary {
  totalEntries: number;
  bySource: Record<string, number>;
  recentActivity: string;
  lastAudio?: string;
  lastVision?: string;
  lastAction?: string;
}

class ContextSyncManager {
  private context: ContextEntry[] = [];
  private maxEntries = 100; // Mantém últimas 100 entradas
  private listeners: ((entry: ContextEntry) => void)[] = [];

  /**
   * Adiciona nova entrada ao contexto
   */
  update(
    source: ContextEntry['source'],
    content: string,
    metadata?: any
  ): void {
    const entry: ContextEntry = {
      id: `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      content,
      timestamp: Date.now(),
      metadata
    };

    this.context.push(entry);
    this.trim();

    // Notificar listeners
    this.listeners.forEach(listener => listener(entry));
  }

  /**
   * Gera contexto unificado para o modelo
   */
  getUnifiedContext(options?: {
    maxEntries?: number;
    sources?: ContextEntry['source'][];
    includeMetadata?: boolean;
  }): string {
    const maxEntries = options?.maxEntries || 20;
    const sources = options?.sources;
    const includeMetadata = options?.includeMetadata || false;

    let entries = this.context.slice(-maxEntries);

    // Filtrar por fontes se especificado
    if (sources && sources.length > 0) {
      entries = entries.filter(e => sources.includes(e.source));
    }

    const contextLines = entries.map(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const meta = includeMetadata && entry.metadata
        ? ` (${JSON.stringify(entry.metadata)})`
        : '';

      return `[${time}] [${entry.source.toUpperCase()}] ${entry.content}${meta}`;
    });

    const lastAudio = this.getLastBySource('audio');
    const lastVision = this.getLastBySource('vision');
    const lastAction = this.getLastBySource('action');

    return `
═══════════════════════════════════════════════════
CONTEXTO UNIFICADO DO SISTEMA
═══════════════════════════════════════════════════

📊 ESTADO ATUAL:
• Última fala: ${lastAudio?.content || 'Nenhuma'}
• Última visão: ${lastVision?.content || 'Nenhuma'}
• Última ação: ${lastAction?.content || 'Nenhuma'}

📝 HISTÓRICO RECENTE (${entries.length} eventos):
${contextLines.join('\n')}

═══════════════════════════════════════════════════
    `.trim();
  }

  /**
   * Gera contexto otimizado para fala (mais curto)
   */
  getSpokenContext(): string {
    const lastAudio = this.getLastBySource('audio');
    const lastVision = this.getLastBySource('vision');
    const recentDetections = this.context
      .filter(e => e.source === 'detection')
      .slice(-3)
      .map(e => e.content);

    const parts: string[] = [];

    if (lastAudio) {
      parts.push(`Você disse: "${lastAudio.content}"`);
    }

    if (lastVision) {
      parts.push(`Estou vendo: ${lastVision.content}`);
    }

    if (recentDetections.length > 0) {
      parts.push(`Detectei: ${recentDetections.join(', ')}`);
    }

    return parts.join('. ');
  }

  /**
   * Obtém última entrada de uma fonte específica
   */
  getLastBySource(source: ContextEntry['source']): ContextEntry | undefined {
    return this.context
      .filter(e => e.source === source)
      .slice(-1)[0];
  }

  /**
   * Obtém todas as entradas de uma fonte
   */
  getBySource(
    source: ContextEntry['source'],
    limit?: number
  ): ContextEntry[] {
    const entries = this.context.filter(e => e.source === source);
    return limit ? entries.slice(-limit) : entries;
  }

  /**
   * Obtém entradas em um intervalo de tempo
   */
  getByTimeRange(startTime: number, endTime: number): ContextEntry[] {
    return this.context.filter(
      e => e.timestamp >= startTime && e.timestamp <= endTime
    );
  }

  /**
   * Gera resumo do contexto
   */
  getSummary(): ContextSummary {
    const bySource: Record<string, number> = {};

    this.context.forEach(entry => {
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;
    });

    const recentEntries = this.context.slice(-5);
    const recentActivity = recentEntries
      .map(e => `${e.source}: ${e.content.substring(0, 30)}...`)
      .join('; ');

    return {
      totalEntries: this.context.length,
      bySource,
      recentActivity,
      lastAudio: this.getLastBySource('audio')?.content,
      lastVision: this.getLastBySource('vision')?.content,
      lastAction: this.getLastBySource('action')?.content
    };
  }

  /**
   * Busca no contexto
   */
  search(query: string): ContextEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.context.filter(entry =>
      entry.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Mantém apenas últimas N entradas
   */
  private trim(): void {
    if (this.context.length > this.maxEntries) {
      this.context = this.context.slice(-this.maxEntries);
    }
  }

  /**
   * Limpa contexto
   */
  clear(): void {
    this.context = [];
  }

  /**
   * Limpa entradas antigas (mais de X minutos)
   */
  clearOld(minutes: number): void {
    const cutoff = Date.now() - minutes * 60 * 1000;
    this.context = this.context.filter(e => e.timestamp > cutoff);
  }

  /**
   * Adiciona listener para novas entradas
   */
  onUpdate(callback: (entry: ContextEntry) => void): () => void {
    this.listeners.push(callback);

    // Retorna função para remover listener
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Exporta contexto para análise
   */
  export(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalEntries: this.context.length,
        entries: this.context
      },
      null,
      2
    );
  }

  /**
   * Importa contexto
   */
  import(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.entries && Array.isArray(data.entries)) {
        this.context = data.entries;
        this.trim();
      }
    } catch (error) {
      console.error('Erro ao importar contexto:', error);
    }
  }

  /**
   * Obtém estatísticas
   */
  getStats(): {
    total: number;
    bySource: Record<string, number>;
    oldestEntry: number;
    newestEntry: number;
    timeSpan: number;
  } {
    const bySource: Record<string, number> = {};

    this.context.forEach(entry => {
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;
    });

    const timestamps = this.context.map(e => e.timestamp);
    const oldestEntry = Math.min(...timestamps);
    const newestEntry = Math.max(...timestamps);

    return {
      total: this.context.length,
      bySource,
      oldestEntry,
      newestEntry,
      timeSpan: newestEntry - oldestEntry
    };
  }

  /**
   * Define limite máximo de entradas
   */
  setMaxEntries(max: number): void {
    this.maxEntries = max;
    this.trim();
  }

  /**
   * Obtém todas as entradas (para debug)
   */
  getAll(): ContextEntry[] {
    return [...this.context];
  }
}

// Singleton instance
export const contextSyncManager = new ContextSyncManager();
export type { ContextEntry, ContextSummary };
