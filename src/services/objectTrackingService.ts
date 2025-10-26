// Serviço de Rastreamento de Objetos
// Rastreia movimento de pessoas e objetos ao longo do tempo

export interface TrackedObject {
  id: string;
  type: 'person' | 'vehicle' | 'object';
  firstSeen: number;
  lastSeen: number;
  positions: Array<{
    x: number;
    y: number;
    timestamp: number;
  }>;
  velocity: { x: number; y: number };
  trajectory: string; // 'left-to-right', 'top-to-bottom', etc.
  dwellTime: number; // tempo em ms
  imageUrl?: string;
}

class ObjectTrackingService {
  private trackedObjects: Map<string, TrackedObject> = new Map();
  private maxTrackingTime = 60000; // 1 minuto

  trackObjects(detections: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
  }>): TrackedObject[] {
    const now = Date.now();
    const updated: TrackedObject[] = [];

    detections.forEach(detection => {
      if (this.trackedObjects.has(detection.id)) {
        // Atualizar objeto existente
        const obj = this.trackedObjects.get(detection.id)!;
        obj.lastSeen = now;
        obj.positions.push({ x: detection.x, y: detection.y, timestamp: now });
        
        // Calcular velocidade
        if (obj.positions.length >= 2) {
          const prev = obj.positions[obj.positions.length - 2];
          const curr = obj.positions[obj.positions.length - 1];
          const dt = (curr.timestamp - prev.timestamp) / 1000; // segundos
          obj.velocity = {
            x: (curr.x - prev.x) / dt,
            y: (curr.y - prev.y) / dt
          };
        }

        obj.dwellTime = now - obj.firstSeen;
        updated.push(obj);
      } else {
        // Novo objeto
        const newObj: TrackedObject = {
          id: detection.id,
          type: detection.type as any,
          firstSeen: now,
          lastSeen: now,
          positions: [{ x: detection.x, y: detection.y, timestamp: now }],
          velocity: { x: 0, y: 0 },
          trajectory: 'unknown',
          dwellTime: 0
        };
        this.trackedObjects.set(detection.id, newObj);
        updated.push(newObj);
      }
    });

    // Remover objetos antigos
    this.cleanupOldTracks(now);

    return updated;
  }

  private cleanupOldTracks(now: number): void {
    for (const [id, obj] of this.trackedObjects.entries()) {
      if (now - obj.lastSeen > this.maxTrackingTime) {
        this.trackedObjects.delete(id);
      }
    }
  }

  getTrackedObjects(): TrackedObject[] {
    return Array.from(this.trackedObjects.values());
  }

  getObjectById(id: string): TrackedObject | undefined {
    return this.trackedObjects.get(id);
  }

  drawTracks(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.trackedObjects.forEach(obj => {
      if (obj.positions.length < 2) return;

      ctx.save();
      ctx.strokeStyle = obj.type === 'person' ? '#00ff00' : '#ff00ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      obj.positions.forEach((pos, i) => {
        const x = pos.x * width;
        const y = pos.y * height;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Desenhar posição atual
      const last = obj.positions[obj.positions.length - 1];
      ctx.fillStyle = obj.type === 'person' ? '#00ff00' : '#ff00ff';
      ctx.beginPath();
      ctx.arc(last.x * width, last.y * height, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }
}

export const objectTrackingService = new ObjectTrackingService();
