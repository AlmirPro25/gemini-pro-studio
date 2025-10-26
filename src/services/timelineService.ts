// Serviço de Timeline de Eventos
// Gerencia linha do tempo de todos os eventos de segurança

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'motion' | 'alert' | 'face_detected' | 'face_unknown' | 'recording' | 'manual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  metadata?: any;
}

class TimelineService {
  private events: TimelineEvent[] = [];

  constructor() {
    this.loadEvents();
  }

  // Adicionar evento
  addEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent {
    const newEvent: TimelineEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.events.unshift(newEvent);
    this.saveEvents();
    return newEvent;
  }

  // Obter eventos com filtros
  getEvents(filters?: {
    startDate?: number;
    endDate?: number;
    type?: TimelineEvent['type'];
    severity?: TimelineEvent['severity'];
    limit?: number;
  }): TimelineEvent[] {
    let filtered = [...this.events];

    if (filters?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
    }

    if (filters?.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters?.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  // Obter eventos por período
  getEventsByPeriod(period: 'today' | 'week' | 'month' | 'all'): TimelineEvent[] {
    const now = Date.now();
    let startDate: number;

    switch (period) {
      case 'today':
        startDate = new Date().setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
      default:
        return this.events;
    }

    return this.events.filter(e => e.timestamp >= startDate);
  }

  // Buscar eventos
  searchEvents(query: string): TimelineEvent[] {
    const lowerQuery = query.toLowerCase();
    return this.events.filter(e =>
      e.title.toLowerCase().includes(lowerQuery) ||
      e.description.toLowerCase().includes(lowerQuery)
    );
  }

  // Obter estatísticas
  getStats(period: 'today' | 'week' | 'month' = 'today') {
    const events = this.getEventsByPeriod(period);

    return {
      total: events.length,
      byType: {
        motion: events.filter(e => e.type === 'motion').length,
        alert: events.filter(e => e.type === 'alert').length,
        face_detected: events.filter(e => e.type === 'face_detected').length,
        face_unknown: events.filter(e => e.type === 'face_unknown').length,
        recording: events.filter(e => e.type === 'recording').length,
        manual: events.filter(e => e.type === 'manual').length
      },
      bySeverity: {
        low: events.filter(e => e.severity === 'low').length,
        medium: events.filter(e => e.severity === 'medium').length,
        high: events.filter(e => e.severity === 'high').length,
        critical: events.filter(e => e.severity === 'critical').length
      },
      hourlyDistribution: this.getHourlyDistribution(events)
    };
  }

  // Distribuição por hora
  private getHourlyDistribution(events: TimelineEvent[]): number[] {
    const hours = Array(24).fill(0);
    events.forEach(e => {
      const hour = new Date(e.timestamp).getHours();
      hours[hour]++;
    });
    return hours;
  }

  // Deletar evento
  deleteEvent(id: string): void {
    this.events = this.events.filter(e => e.id !== id);
    this.saveEvents();
  }

  // Limpar eventos antigos
  clearOldEvents(daysToKeep: number = 30): number {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= cutoffDate);
    this.saveEvents();
    return initialCount - this.events.length;
  }

  // Exportar eventos
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    } else {
      // CSV
      const headers = 'ID,Timestamp,Type,Severity,Title,Description\n';
      const rows = this.events.map(e =>
        `${e.id},${new Date(e.timestamp).toISOString()},${e.type},${e.severity},"${e.title}","${e.description}"`
      ).join('\n');
      return headers + rows;
    }
  }

  // Salvar eventos
  private saveEvents(): void {
    try {
      // Manter apenas últimos 1000 eventos
      if (this.events.length > 1000) {
        this.events = this.events.slice(0, 1000);
      }
      localStorage.setItem('security_timeline', JSON.stringify(this.events));
    } catch (error) {
      console.error('Erro ao salvar timeline:', error);
    }
  }

  // Carregar eventos
  private loadEvents(): void {
    try {
      const saved = localStorage.getItem('security_timeline');
      if (saved) {
        this.events = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
    }
  }
}

export const timelineService = new TimelineService();
