// Serviço de Detecção de Objetos com IA Real (TensorFlow.js + COCO-SSD)
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface Detection {
  id: string;
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  center: { x: number; y: number };
  timestamp: number;
}

export interface DetectionResult {
  detections: Detection[];
  totalObjects: number;
  people: number;
  vehicles: number;
  animals: number;
  others: number;
  timestamp: number;
}

class AIDetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading = false;
  private isReady = false;
  private detectionHistory: Detection[] = [];
  private maxHistorySize = 1000;

  // Categorias de objetos
  private readonly PERSON_CLASSES = ['person'];
  private readonly VEHICLE_CLASSES = ['car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'bicycle'];
  private readonly ANIMAL_CLASSES = ['bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'];
  private readonly DANGEROUS_CLASSES = ['knife', 'scissors'];

  async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isLoading) {
      // Aguardar carregamento
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.isReady) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    }

    try {
      this.isLoading = true;
      console.log('🤖 Carregando modelo COCO-SSD...');
      
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // Modelo mais leve e rápido
      });
      
      this.isReady = true;
      this.isLoading = false;
      console.log('✅ Modelo COCO-SSD carregado com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar modelo:', error);
      this.isLoading = false;
      return false;
    }
  }

  async detectObjects(
    imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
  ): Promise<DetectionResult> {
    if (!this.isReady || !this.model) {
      throw new Error('Modelo não está pronto. Chame initialize() primeiro.');
    }

    try {
      const predictions = await this.model.detect(imageElement);
      
      const detections: Detection[] = predictions.map((pred, index) => {
        const [x, y, width, height] = pred.bbox;
        return {
          id: `det_${Date.now()}_${index}`,
          class: pred.class,
          score: pred.score,
          bbox: pred.bbox as [number, number, number, number],
          center: {
            x: (x + width / 2) / imageElement.width,
            y: (y + height / 2) / imageElement.height
          },
          timestamp: Date.now()
        };
      });

      // Adicionar ao histórico
      this.detectionHistory.push(...detections);
      if (this.detectionHistory.length > this.maxHistorySize) {
        this.detectionHistory = this.detectionHistory.slice(-this.maxHistorySize);
      }

      // Categorizar detecções
      const people = detections.filter(d => this.PERSON_CLASSES.includes(d.class)).length;
      const vehicles = detections.filter(d => this.VEHICLE_CLASSES.includes(d.class)).length;
      const animals = detections.filter(d => this.ANIMAL_CLASSES.includes(d.class)).length;
      const others = detections.length - people - vehicles - animals;

      return {
        detections,
        totalObjects: detections.length,
        people,
        vehicles,
        animals,
        others,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Erro na detecção:', error);
      return {
        detections: [],
        totalObjects: 0,
        people: 0,
        vehicles: 0,
        animals: 0,
        others: 0,
        timestamp: Date.now()
      };
    }
  }

  // Desenhar detecções no canvas
  drawDetections(
    ctx: CanvasRenderingContext2D,
    detections: Detection[],
    width: number,
    height: number,
    options: {
      showLabels?: boolean;
      showConfidence?: boolean;
      minConfidence?: number;
      colors?: { [key: string]: string };
    } = {}
  ): void {
    const {
      showLabels = true,
      showConfidence = true,
      minConfidence = 0.5,
      colors = {}
    } = options;

    detections.forEach(detection => {
      if (detection.score < minConfidence) return;

      const [x, y, w, h] = detection.bbox;
      
      // Cor baseada na categoria
      let color = colors[detection.class] || this.getColorForClass(detection.class);
      
      // Desenhar caixa
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Fundo do label
      if (showLabels) {
        const label = showConfidence 
          ? `${detection.class} ${Math.round(detection.score * 100)}%`
          : detection.class;
        
        ctx.font = 'bold 14px Arial';
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 25, textWidth + 10, 25);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(label, x + 5, y - 7);
      }

      // Ponto central
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private getColorForClass(className: string): string {
    if (this.PERSON_CLASSES.includes(className)) return '#00ff00'; // Verde
    if (this.VEHICLE_CLASSES.includes(className)) return '#0088ff'; // Azul
    if (this.ANIMAL_CLASSES.includes(className)) return '#ff8800'; // Laranja
    if (this.DANGEROUS_CLASSES.includes(className)) return '#ff0000'; // Vermelho
    return '#ffff00'; // Amarelo
  }

  // Detectar comportamentos suspeitos
  detectSuspiciousBehavior(detections: Detection[]): {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[] {
    const behaviors: any[] = [];

    // Aglomeração
    const people = detections.filter(d => this.PERSON_CLASSES.includes(d.class));
    if (people.length > 10) {
      behaviors.push({
        type: 'crowd',
        description: `Aglomeração detectada: ${people.length} pessoas`,
        severity: people.length > 20 ? 'high' : 'medium'
      });
    }

    // Objetos perigosos
    const dangerous = detections.filter(d => this.DANGEROUS_CLASSES.includes(d.class));
    if (dangerous.length > 0) {
      behaviors.push({
        type: 'dangerous_object',
        description: `Objeto perigoso detectado: ${dangerous[0].class}`,
        severity: 'critical'
      });
    }

    // Veículos em área restrita (exemplo)
    const vehicles = detections.filter(d => this.VEHICLE_CLASSES.includes(d.class));
    if (vehicles.length > 0) {
      behaviors.push({
        type: 'vehicle_detected',
        description: `Veículo detectado: ${vehicles[0].class}`,
        severity: 'low'
      });
    }

    return behaviors;
  }

  // Obter estatísticas
  getStats(): {
    totalDetections: number;
    uniqueClasses: string[];
    mostCommon: { class: string; count: number }[];
    averageConfidence: number;
  } {
    const classCounts: { [key: string]: number } = {};
    let totalConfidence = 0;

    this.detectionHistory.forEach(det => {
      classCounts[det.class] = (classCounts[det.class] || 0) + 1;
      totalConfidence += det.score;
    });

    const mostCommon = Object.entries(classCounts)
      .map(([className, count]) => ({ class: className, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalDetections: this.detectionHistory.length,
      uniqueClasses: Object.keys(classCounts),
      mostCommon,
      averageConfidence: this.detectionHistory.length > 0 
        ? totalConfidence / this.detectionHistory.length 
        : 0
    };
  }

  // Limpar histórico
  clearHistory(): void {
    this.detectionHistory = [];
  }

  // Verificar se está pronto
  isModelReady(): boolean {
    return this.isReady;
  }

  // Obter histórico
  getHistory(limit?: number): Detection[] {
    return limit 
      ? this.detectionHistory.slice(-limit)
      : this.detectionHistory;
  }
}

export const aiDetectionService = new AIDetectionService();
