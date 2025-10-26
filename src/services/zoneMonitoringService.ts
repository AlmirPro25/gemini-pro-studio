// Serviço de Monitoramento de Zonas
// Permite definir áreas específicas para monitorar (entrada, saída, área restrita, etc.)

export interface Zone {
  id: string;
  name: string;
  type: 'entrance' | 'exit' | 'restricted' | 'parking' | 'queue' | 'custom';
  coordinates: { x: number; y: number }[]; // Polígono
  color: string;
  rules: ZoneRule[];
  active: boolean;
  alerts: number;
}

export interface ZoneRule {
  id: string;
  type: 'max_people' | 'min_people' | 'dwell_time' | 'direction' | 'object_detection';
  value: any;
  action: 'alert' | 'record' | 'notify';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ZoneViolation {
  id: string;
  zoneId: string;
  zoneName: string;
  ruleId: string;
  timestamp: number;
  description: string;
  imageUrl: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

class ZoneMonitoringService {
  private zones: Zone[] = [];
  private violations: ZoneViolation[] = [];
  private peopleInZones: Map<string, number> = new Map();

  constructor() {
    this.loadZones();
    this.loadViolations();
  }

  // Criar zona
  createZone(zone: Omit<Zone, 'id' | 'alerts'>): Zone {
    const newZone: Zone = {
      ...zone,
      id: `zone_${Date.now()}`,
      alerts: 0
    };
    
    this.zones.push(newZone);
    this.saveZones();
    return newZone;
  }

  // Atualizar zona
  updateZone(zoneId: string, updates: Partial<Zone>): void {
    const index = this.zones.findIndex(z => z.id === zoneId);
    if (index !== -1) {
      this.zones[index] = { ...this.zones[index], ...updates };
      this.saveZones();
    }
  }

  // Deletar zona
  deleteZone(zoneId: string): void {
    this.zones = this.zones.filter(z => z.id !== zoneId);
    this.saveZones();
  }

  // Obter todas as zonas
  getZones(): Zone[] {
    return this.zones;
  }

  // Obter zona por ID
  getZone(zoneId: string): Zone | undefined {
    return this.zones.find(z => z.id === zoneId);
  }

  // Verificar se um ponto está dentro de uma zona
  isPointInZone(point: { x: number; y: number }, zone: Zone): boolean {
    const { coordinates } = zone;
    let inside = false;
    
    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      const xi = coordinates[i].x, yi = coordinates[i].y;
      const xj = coordinates[j].x, yj = coordinates[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  // Analisar frame e detectar violações
  analyzeFrame(detections: any[], frameUrl: string): ZoneViolation[] {
    const newViolations: ZoneViolation[] = [];

    this.zones.forEach(zone => {
      if (!zone.active) return;

      // Contar pessoas na zona
      const peopleInZone = detections.filter(d => 
        d.type === 'person' && this.isPointInZone(d.center, zone)
      ).length;

      this.peopleInZones.set(zone.id, peopleInZone);

      // Verificar regras
      zone.rules.forEach(rule => {
        let violated = false;
        let description = '';

        switch (rule.type) {
          case 'max_people':
            if (peopleInZone > rule.value) {
              violated = true;
              description = `Zona "${zone.name}" excedeu limite de ${rule.value} pessoas (${peopleInZone} detectadas)`;
            }
            break;

          case 'min_people':
            if (peopleInZone < rule.value) {
              violated = true;
              description = `Zona "${zone.name}" abaixo do mínimo de ${rule.value} pessoas (${peopleInZone} detectadas)`;
            }
            break;

          case 'object_detection':
            const objectsInZone = detections.filter(d => 
              d.type === rule.value && this.isPointInZone(d.center, zone)
            );
            if (objectsInZone.length > 0) {
              violated = true;
              description = `Objeto "${rule.value}" detectado na zona "${zone.name}"`;
            }
            break;
        }

        if (violated) {
          const violation: ZoneViolation = {
            id: `violation_${Date.now()}_${Math.random()}`,
            zoneId: zone.id,
            zoneName: zone.name,
            ruleId: rule.id,
            timestamp: Date.now(),
            description,
            imageUrl: frameUrl,
            severity: rule.severity,
            resolved: false
          };

          newViolations.push(violation);
          this.violations.push(violation);
          zone.alerts++;
        }
      });
    });

    if (newViolations.length > 0) {
      this.saveViolations();
      this.saveZones();
    }

    return newViolations;
  }

  // Obter violações
  getViolations(filters?: {
    zoneId?: string;
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }): ZoneViolation[] {
    let filtered = [...this.violations];

    if (filters?.zoneId) {
      filtered = filtered.filter(v => v.zoneId === filters.zoneId);
    }

    if (filters?.severity) {
      filtered = filtered.filter(v => v.severity === filters.severity);
    }

    if (filters?.resolved !== undefined) {
      filtered = filtered.filter(v => v.resolved === filters.resolved);
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  // Resolver violação
  resolveViolation(violationId: string): void {
    const violation = this.violations.find(v => v.id === violationId);
    if (violation) {
      violation.resolved = true;
      this.saveViolations();
    }
  }

  // Obter estatísticas de zona
  getZoneStats(zoneId: string): {
    totalViolations: number;
    unresolvedViolations: number;
    currentPeople: number;
    averagePeople: number;
  } {
    const violations = this.violations.filter(v => v.zoneId === zoneId);
    const currentPeople = this.peopleInZones.get(zoneId) || 0;

    return {
      totalViolations: violations.length,
      unresolvedViolations: violations.filter(v => !v.resolved).length,
      currentPeople,
      averagePeople: currentPeople // Simplificado
    };
  }

  // Desenhar zonas em canvas
  drawZones(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.zones.forEach(zone => {
      if (!zone.active) return;

      ctx.save();
      ctx.strokeStyle = zone.color;
      ctx.fillStyle = zone.color + '33'; // 20% opacity
      ctx.lineWidth = 3;

      // Desenhar polígono
      ctx.beginPath();
      zone.coordinates.forEach((coord, i) => {
        const x = coord.x * width;
        const y = coord.y * height;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Desenhar nome
      const centerX = zone.coordinates.reduce((sum, c) => sum + c.x, 0) / zone.coordinates.length * width;
      const centerY = zone.coordinates.reduce((sum, c) => sum + c.y, 0) / zone.coordinates.length * height;
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, centerX, centerY);

      // Desenhar contador de pessoas
      const peopleCount = this.peopleInZones.get(zone.id) || 0;
      ctx.fillStyle = zone.color;
      ctx.font = '14px Arial';
      ctx.fillText(`👥 ${peopleCount}`, centerX, centerY + 20);

      ctx.restore();
    });
  }

  // Salvar/Carregar
  private saveZones(): void {
    localStorage.setItem('security_zones', JSON.stringify(this.zones));
  }

  private loadZones(): void {
    const saved = localStorage.getItem('security_zones');
    if (saved) {
      this.zones = JSON.parse(saved);
    } else {
      // Criar zonas de exemplo
      this.zones = [
        {
          id: 'zone_entrance',
          name: 'Entrada Principal',
          type: 'entrance',
          coordinates: [
            { x: 0.1, y: 0.1 },
            { x: 0.4, y: 0.1 },
            { x: 0.4, y: 0.4 },
            { x: 0.1, y: 0.4 }
          ],
          color: '#00ff00',
          rules: [
            {
              id: 'rule_1',
              type: 'max_people',
              value: 5,
              action: 'alert',
              severity: 'medium'
            }
          ],
          active: true,
          alerts: 0
        },
        {
          id: 'zone_restricted',
          name: 'Área Restrita',
          type: 'restricted',
          coordinates: [
            { x: 0.6, y: 0.6 },
            { x: 0.9, y: 0.6 },
            { x: 0.9, y: 0.9 },
            { x: 0.6, y: 0.9 }
          ],
          color: '#ff0000',
          rules: [
            {
              id: 'rule_2',
              type: 'max_people',
              value: 0,
              action: 'alert',
              severity: 'critical'
            }
          ],
          active: true,
          alerts: 0
        }
      ];
      this.saveZones();
    }
  }

  private saveViolations(): void {
    localStorage.setItem('security_violations', JSON.stringify(this.violations));
  }

  private loadViolations(): void {
    const saved = localStorage.getItem('security_violations');
    if (saved) {
      this.violations = JSON.parse(saved);
    }
  }

  // Limpar dados antigos
  clearOldData(daysOld: number = 30): void {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    this.violations = this.violations.filter(v => v.timestamp > cutoff);
    this.saveViolations();
  }
}

export const zoneMonitoringService = new ZoneMonitoringService();
