// Serviço de Análise de Comportamento
// Detecta padrões suspeitos e comportamentos anormais

export interface BehaviorPattern {
  id: string;
  type: 'loitering' | 'running' | 'fighting' | 'falling' | 'crowd' | 'abandoned_object' | 'custom';
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionRules: {
    minDuration?: number; // ms
    maxSpeed?: number;
    minPeople?: number;
    maxPeople?: number;
    customCondition?: string;
  };
  active: boolean;
}

export interface BehaviorDetection {
  id: string;
  patternId: string;
  patternName: string;
  timestamp: number;
  duration: number;
  confidence: number;
  description: string;
  imageUrl: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { x: number; y: number };
  resolved: boolean;
}

class BehaviorAnalysisService {
  private patterns: BehaviorPattern[] = [];
  private detections: BehaviorDetection[] = [];
  private trackingData: Map<string, any> = new Map();

  constructor() {
    this.loadPatterns();
    this.loadDetections();
    this.initializeDefaultPatterns();
  }

  private initializeDefaultPatterns(): void {
    if (this.patterns.length === 0) {
      this.patterns = [
        {
          id: 'pattern_loitering',
          type: 'loitering',
          name: 'Pessoa Parada por Muito Tempo',
          description: 'Detecta quando alguém fica parado no mesmo lugar por muito tempo',
          severity: 'medium',
          detectionRules: { minDuration: 30000 },
          active: true
        },
        {
          id: 'pattern_running',
          type: 'running',
          name: 'Pessoa Correndo',
          description: 'Detecta movimento rápido que pode indicar fuga ou emergência',
          severity: 'high',
          detectionRules: { maxSpeed: 10 },
          active: true
        }
      ];
      this.savePatterns();
    }
  }

  // Analisar frame e detectar comportamentos
  analyzeFrame(detections: any[], frameUrl: string): BehaviorDetection[] {
    const newDetections: BehaviorDetection[] = [];

    this.patterns.forEach(pattern => {
      if (!pattern.active) return;

      // Simular detecção baseada em regras
      const detected = this.checkPattern(pattern, detections);

      if (detected) {
        const detection: BehaviorDetection = {
          id: `behavior_${Date.now()}_${Math.random()}`,
          patternId: pattern.id,
          patternName: pattern.name,
          timestamp: Date.now(),
          duration: 0,
          confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
          description: pattern.description,
          imageUrl: frameUrl,
          severity: pattern.severity,
          location: { x: Math.random(), y: Math.random() },
          resolved: false
        };

        newDetections.push(detection);
        this.detections.push(detection);
      }
    });

    if (newDetections.length > 0) {
      this.saveDetections();
    }

    return newDetections;
  }

  private checkPattern(pattern: BehaviorPattern, detections: any[]): boolean {
    // Lógica simplificada de detecção
    const random = Math.random();
    
    switch (pattern.type) {
      case 'loitering':
        return random < 0.05; // 5% chance
      case 'running':
        return random < 0.03; // 3% chance
      case 'fighting':
        return random < 0.01; // 1% chance
      case 'falling':
        return random < 0.02; // 2% chance
      case 'crowd':
        return detections.length > (pattern.detectionRules.minPeople || 10);
      default:
        return false;
    }
  }

  getDetections(filters?: {
    patternId?: string;
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }): BehaviorDetection[] {
    let filtered = [...this.detections];

    if (filters?.patternId) {
      filtered = filtered.filter(d => d.patternId === filters.patternId);
    }

    if (filters?.severity) {
      filtered = filtered.filter(d => d.severity === filters.severity);
    }

    if (filters?.resolved !== undefined) {
      filtered = filtered.filter(d => d.resolved === filters.resolved);
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  resolveDetection(detectionId: string): void {
    const detection = this.detections.find(d => d.id === detectionId);
    if (detection) {
      detection.resolved = true;
      this.saveDetections();
    }
  }

  getPatterns(): BehaviorPattern[] {
    return this.patterns;
  }

  createPattern(pattern: Omit<BehaviorPattern, 'id'>): BehaviorPattern {
    const newPattern: BehaviorPattern = {
      ...pattern,
      id: `pattern_${Date.now()}`
    };
    this.patterns.push(newPattern);
    this.savePatterns();
    return newPattern;
  }

  updatePattern(patternId: string, updates: Partial<BehaviorPattern>): void {
    const index = this.patterns.findIndex(p => p.id === patternId);
    if (index !== -1) {
      this.patterns[index] = { ...this.patterns[index], ...updates };
      this.savePatterns();
    }
  }

  deletePattern(patternId: string): void {
    this.patterns = this.patterns.filter(p => p.id !== patternId);
    this.savePatterns();
  }

  private savePatterns(): void {
    localStorage.setItem('security_behavior_patterns', JSON.stringify(this.patterns));
  }

  private loadPatterns(): void {
    const saved = localStorage.getItem('security_behavior_patterns');
    if (saved) {
      this.patterns = JSON.parse(saved);
    }
  }

  private saveDetections(): void {
    localStorage.setItem('security_behavior_detections', JSON.stringify(this.detections));
  }

  private loadDetections(): void {
    const saved = localStorage.getItem('security_behavior_detections');
    if (saved) {
      this.detections = JSON.parse(saved);
    }
  }
}

export const behaviorAnalysisService = new BehaviorAnalysisService();
