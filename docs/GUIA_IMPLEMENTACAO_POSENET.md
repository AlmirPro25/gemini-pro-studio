# 🤸 Guia de Implementação - PoseNet (Detecção de Quedas)

## 📦 Instalação

```bash
npm install @tensorflow-models/posenet --legacy-peer-deps
```

## 🔧 Serviço (src/services/poseDetectionService.ts)

```typescript
import * as posenet from '@tensorflow-models/posenet';

export interface PoseDetectionResult {
  keypoints: posenet.Keypoint[];
  score: number;
  isFalling: boolean;
  isLyingDown: boolean;
  timestamp: number;
}

class PoseDetectionService {
  private model: posenet.PoseNet | null = null;
  private isReady = false;

  async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    
    this.model = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75
    });
    
    this.isReady = true;
    return true;
  }

  async detectPose(video: HTMLVideoElement): Promise<PoseDetectionResult | null> {
    if (!this.model) return null;

    const pose = await this.model.estimateSinglePose(video, {
      flipHorizontal: false
    });

    const isFalling = this.detectFall(pose.keypoints);
    const isLyingDown = this.detectLyingDown(pose.keypoints);

    return {
      keypoints: pose.keypoints,
      score: pose.score,
      isFalling,
      isLyingDown,
      timestamp: Date.now()
    };
  }

  private detectFall(keypoints: posenet.Keypoint[]): boolean {
    const nose = keypoints.find(k => k.part === 'nose');
    const leftHip = keypoints.find(k => k.part === 'leftHip');
    const rightHip = keypoints.find(k => k.part === 'rightHip');

    if (!nose || !leftHip || !rightHip) return false;

    const avgHipY = (leftHip.position.y + rightHip.position.y) / 2;
    const verticalDistance = Math.abs(nose.position.y - avgHipY);

    // Se a distância vertical for muito pequena, pessoa está horizontal
    return verticalDistance < 100 && nose.score > 0.5;
  }

  private detectLyingDown(keypoints: posenet.Keypoint[]): boolean {
    const shoulders = keypoints.filter(k => 
      k.part === 'leftShoulder' || k.part === 'rightShoulder'
    );
    const hips = keypoints.filter(k => 
      k.part === 'leftHip' || k.part === 'rightHip'
    );

    if (shoulders.length < 2 || hips.length < 2) return false;

    const shoulderY = (shoulders[0].position.y + shoulders[1].position.y) / 2;
    const hipY = (hips[0].position.y + hips[1].position.y) / 2;

    return Math.abs(shoulderY - hipY) < 50;
  }

  drawPose(ctx: CanvasRenderingContext2D, pose: PoseDetectionResult): void {
    const color = pose.isFalling ? '#ff0000' : '#00ff00';

    // Desenhar keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score > 0.5) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Desenhar skeleton
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
      pose.keypoints,
      0.5
    );

    adjacentKeyPoints.forEach(([from, to]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from.position.x, from.position.y);
      ctx.lineTo(to.position.x, to.position.y);
      ctx.stroke();
    });
  }
}

export const poseDetectionService = new PoseDetectionService();
```

## 🔗 Integração no AdvancedAnalysisOverlay

```typescript
// Adicionar ao processDetections()
const poseResult = await poseDetectionService.detectPose(video);

if (poseResult?.isFalling) {
  onBehavior?.({
    id: `fall_${Date.now()}`,
    patternName: 'Queda Detectada',
    description: 'Pessoa caiu e pode precisar de ajuda',
    severity: 'critical',
    confidence: poseResult.score,
    timestamp: Date.now()
  });
}

// Desenhar no canvas
if (poseResult) {
  poseDetectionService.drawPose(ctx, poseResult);
}
```

## ✅ Resultado

- Detecta quedas em tempo real
- Alerta crítico automático
- Desenha skeleton sobre a pessoa
- Identifica pessoa deitada
