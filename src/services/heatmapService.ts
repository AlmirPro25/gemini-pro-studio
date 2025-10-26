// Serviço de Mapa de Calor
// Gera visualização de áreas mais movimentadas ao longo do tempo

export interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
  timestamp: number;
}

export interface HeatmapData {
  points: HeatPoint[];
  width: number;
  height: number;
  maxIntensity: number;
}

class HeatmapService {
  private heatPoints: HeatPoint[] = [];
  private maxPoints = 10000; // Limite de pontos armazenados

  constructor() {
    this.loadHeatPoints();
  }

  // Adicionar ponto de calor
  addHeatPoint(x: number, y: number, intensity: number = 1): void {
    const point: HeatPoint = {
      x,
      y,
      intensity,
      timestamp: Date.now()
    };

    this.heatPoints.push(point);

    // Limitar número de pontos
    if (this.heatPoints.length > this.maxPoints) {
      this.heatPoints = this.heatPoints.slice(-this.maxPoints);
    }

    this.saveHeatPoints();
  }

  // Adicionar múltiplos pontos (detecções de pessoas)
  addDetections(detections: Array<{ x: number; y: number }>): void {
    detections.forEach(detection => {
      this.addHeatPoint(detection.x, detection.y, 1);
    });
  }

  // Obter dados do mapa de calor
  getHeatmapData(filters?: {
    startTime?: number;
    endTime?: number;
    minIntensity?: number;
  }): HeatmapData {
    let points = [...this.heatPoints];

    // Aplicar filtros
    if (filters?.startTime) {
      points = points.filter(p => p.timestamp >= filters.startTime!);
    }

    if (filters?.endTime) {
      points = points.filter(p => p.timestamp <= filters.endTime!);
    }

    if (filters?.minIntensity) {
      points = points.filter(p => p.intensity >= filters.minIntensity!);
    }

    const maxIntensity = Math.max(...points.map(p => p.intensity), 1);

    return {
      points,
      width: 1920,
      height: 1080,
      maxIntensity
    };
  }

  // Desenhar mapa de calor em canvas
  drawHeatmap(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filters?: {
      startTime?: number;
      endTime?: number;
      radius?: number;
      opacity?: number;
    }
  ): void {
    const data = this.getHeatmapData(filters);
    const radius = filters?.radius || 50;
    const opacity = filters?.opacity || 0.6;

    // Criar canvas temporário para o gradiente
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Desenhar pontos com gradiente radial
    data.points.forEach(point => {
      const x = point.x * width;
      const y = point.y * height;
      const normalizedIntensity = point.intensity / data.maxIntensity;

      const gradient = tempCtx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${normalizedIntensity * opacity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${normalizedIntensity * opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');

      tempCtx.fillStyle = gradient;
      tempCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    // Aplicar colorização
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha > 0) {
        const intensity = alpha / 255;
        
        // Gradiente de cores: azul -> verde -> amarelo -> vermelho
        if (intensity < 0.25) {
          pixels[i] = 0;
          pixels[i + 1] = 0;
          pixels[i + 2] = 255 * (intensity * 4);
        } else if (intensity < 0.5) {
          pixels[i] = 0;
          pixels[i + 1] = 255 * ((intensity - 0.25) * 4);
          pixels[i + 2] = 255;
        } else if (intensity < 0.75) {
          pixels[i] = 255 * ((intensity - 0.5) * 4);
          pixels[i + 1] = 255;
          pixels[i + 2] = 255 * (1 - (intensity - 0.5) * 4);
        } else {
          pixels[i] = 255;
          pixels[i + 1] = 255 * (1 - (intensity - 0.75) * 4);
          pixels[i + 2] = 0;
        }
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    // Desenhar no canvas principal
    ctx.drawImage(tempCanvas, 0, 0);
  }

  // Obter áreas mais quentes (hotspots)
  getHotspots(gridSize: number = 10): Array<{
    x: number;
    y: number;
    intensity: number;
    count: number;
  }> {
    const grid: Map<string, { x: number; y: number; intensity: number; count: number }> = new Map();

    this.heatPoints.forEach(point => {
      const gridX = Math.floor(point.x * gridSize);
      const gridY = Math.floor(point.y * gridSize);
      const key = `${gridX},${gridY}`;

      if (grid.has(key)) {
        const cell = grid.get(key)!;
        cell.intensity += point.intensity;
        cell.count++;
      } else {
        grid.set(key, {
          x: gridX / gridSize,
          y: gridY / gridSize,
          intensity: point.intensity,
          count: 1
        });
      }
    });

    return Array.from(grid.values())
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 10); // Top 10 hotspots
  }

  // Obter estatísticas
  getStats(): {
    totalPoints: number;
    averageIntensity: number;
    timeRange: { start: number; end: number };
    hotspots: number;
  } {
    const totalPoints = this.heatPoints.length;
    const averageIntensity = totalPoints > 0
      ? this.heatPoints.reduce((sum, p) => sum + p.intensity, 0) / totalPoints
      : 0;

    const timestamps = this.heatPoints.map(p => p.timestamp);
    const timeRange = {
      start: Math.min(...timestamps, Date.now()),
      end: Math.max(...timestamps, Date.now())
    };

    const hotspots = this.getHotspots().length;

    return {
      totalPoints,
      averageIntensity,
      timeRange,
      hotspots
    };
  }

  // Limpar dados
  clearData(olderThan?: number): void {
    if (olderThan) {
      const cutoff = Date.now() - olderThan;
      this.heatPoints = this.heatPoints.filter(p => p.timestamp > cutoff);
    } else {
      this.heatPoints = [];
    }
    this.saveHeatPoints();
  }

  // Exportar dados
  exportData(): string {
    return JSON.stringify({
      points: this.heatPoints,
      stats: this.getStats(),
      hotspots: this.getHotspots(),
      exportedAt: Date.now()
    }, null, 2);
  }

  // Importar dados
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.points && Array.isArray(data.points)) {
        this.heatPoints = data.points;
        this.saveHeatPoints();
      }
    } catch (error) {
      console.error('Erro ao importar dados:', error);
    }
  }

  // Salvar/Carregar
  private saveHeatPoints(): void {
    try {
      localStorage.setItem('security_heatmap', JSON.stringify(this.heatPoints));
    } catch (error) {
      console.error('Erro ao salvar heatmap:', error);
      // Se exceder limite do localStorage, remover pontos antigos
      this.heatPoints = this.heatPoints.slice(-5000);
      localStorage.setItem('security_heatmap', JSON.stringify(this.heatPoints));
    }
  }

  private loadHeatPoints(): void {
    const saved = localStorage.getItem('security_heatmap');
    if (saved) {
      try {
        this.heatPoints = JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar heatmap:', error);
        this.heatPoints = [];
      }
    }
  }
}

export const heatmapService = new HeatmapService();
