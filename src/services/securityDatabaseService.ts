// Security Database Service - Extensão do databaseService para DeepVision AI
import { dbService } from './databaseService';

interface SecurityEvent {
  id: string;
  type: 'detection' | 'violation' | 'behavior' | 'fall' | 'intrusion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  metadata: any;
  cameraId?: string;
  timestamp: number;
}

interface Zone {
  id: string;
  name: string;
  type: 'restricted' | 'monitored' | 'safe';
  coordinates: { x: number; y: number }[];
  rules: string[];
  active: boolean;
  createdAt: number;
}

interface Recording {
  id: string;
  cameraId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  fileUrl: string;
  thumbnail?: string;
  events: string[];
}

class SecurityDatabaseService {
  private storeName = 'security_data';

  async init(): Promise<void> {
    // Usar o dbService existente e adicionar store de segurança se necessário
    const setting = await dbService.getSetting('security_initialized');
    if (!setting) {
      await dbService.saveSetting('security_initialized', true);
      console.log('✅ Security database initialized');
    }
  }

  // ==================== EVENTOS DE SEGURANÇA ====================

  async saveSecurityEvent(event: SecurityEvent): Promise<void> {
    const events = await this.getAllSecurityEvents();
    events.push(event);
    
    // Manter apenas os últimos 1000 eventos
    const recentEvents = events.slice(-1000);
    await dbService.saveSetting('security_events', recentEvents);
  }

  async getAllSecurityEvents(limit = 100): Promise<SecurityEvent[]> {
    const events = await dbService.getSetting('security_events') || [];
    return events.slice(-limit).reverse();
  }

  async getSecurityEventsByType(type: SecurityEvent['type']): Promise<SecurityEvent[]> {
    const events = await this.getAllSecurityEvents(1000);
    return events.filter(e => e.type === type);
  }

  async getSecurityEventsBySeverity(severity: SecurityEvent['severity']): Promise<SecurityEvent[]> {
    const events = await this.getAllSecurityEvents(1000);
    return events.filter(e => e.severity === severity);
  }

  async deleteSecurityEvent(id: string): Promise<void> {
    const events = await this.getAllSecurityEvents(1000);
    const filtered = events.filter(e => e.id !== id);
    await dbService.saveSetting('security_events', filtered);
  }

  async clearOldEvents(daysToKeep = 30): Promise<void> {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const events = await this.getAllSecurityEvents(1000);
    const filtered = events.filter(e => e.timestamp > cutoffTime);
    await dbService.saveSetting('security_events', filtered);
  }

  // ==================== ZONAS ====================

  async saveZone(zone: Zone): Promise<void> {
    const zones = await this.getAllZones();
    const index = zones.findIndex(z => z.id === zone.id);
    
    if (index >= 0) {
      zones[index] = zone;
    } else {
      zones.push(zone);
    }
    
    await dbService.saveSetting('security_zones', zones);
  }

  async getAllZones(): Promise<Zone[]> {
    return await dbService.getSetting('security_zones') || [];
  }

  async getZone(id: string): Promise<Zone | undefined> {
    const zones = await this.getAllZones();
    return zones.find(z => z.id === id);
  }

  async deleteZone(id: string): Promise<void> {
    const zones = await this.getAllZones();
    const filtered = zones.filter(z => z.id !== id);
    await dbService.saveSetting('security_zones', filtered);
  }

  async toggleZoneStatus(id: string): Promise<void> {
    const zones = await this.getAllZones();
    const zone = zones.find(z => z.id === id);
    if (zone) {
      zone.active = !zone.active;
      await dbService.saveSetting('security_zones', zones);
    }
  }

  // ==================== GRAVAÇÕES ====================

  async saveRecording(recording: Recording): Promise<void> {
    const recordings = await this.getAllRecordings();
    recordings.push(recording);
    
    // Manter apenas as últimas 100 gravações
    const recentRecordings = recordings.slice(-100);
    await dbService.saveSetting('security_recordings', recentRecordings);
  }

  async getAllRecordings(): Promise<Recording[]> {
    return await dbService.getSetting('security_recordings') || [];
  }

  async getRecordingsByCamera(cameraId: string): Promise<Recording[]> {
    const recordings = await this.getAllRecordings();
    return recordings.filter(r => r.cameraId === cameraId);
  }

  async deleteRecording(id: string): Promise<void> {
    const recordings = await this.getAllRecordings();
    const filtered = recordings.filter(r => r.id !== id);
    await dbService.saveSetting('security_recordings', filtered);
  }

  // ==================== ESTATÍSTICAS ====================

  async getSecurityStats(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    todayEvents: number;
    activeZones: number;
    totalRecordings: number;
    eventsByType: Record<string, number>;
  }> {
    const events = await this.getAllSecurityEvents(1000);
    const zones = await this.getAllZones();
    const recordings = await this.getAllRecordings();
    
    const today = new Date().setHours(0, 0, 0, 0);
    const todayEvents = events.filter(e => e.timestamp >= today).length;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    
    const eventsByType: Record<string, number> = {};
    events.forEach(e => {
      eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
    });
    
    return {
      totalEvents: events.length,
      criticalEvents,
      todayEvents,
      activeZones: zones.filter(z => z.active).length,
      totalRecordings: recordings.length,
      eventsByType
    };
  }

  // ==================== EXPORTAR/IMPORTAR ====================

  async exportSecurityData(): Promise<string> {
    const data = {
      events: await this.getAllSecurityEvents(1000),
      zones: await this.getAllZones(),
      recordings: await this.getAllRecordings(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  async importSecurityData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    if (data.events) {
      await dbService.saveSetting('security_events', data.events);
    }
    if (data.zones) {
      await dbService.saveSetting('security_zones', data.zones);
    }
    if (data.recordings) {
      await dbService.saveSetting('security_recordings', data.recordings);
    }
  }
}

export const securityDbService = new SecurityDatabaseService();
export type { SecurityEvent, Zone, Recording };

// Auto-initialize
securityDbService.init().catch(console.error);
