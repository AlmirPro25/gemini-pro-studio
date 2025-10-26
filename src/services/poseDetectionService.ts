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
    
    try {
      this.model = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
      });
      
      this.isReady = true;
      console.log('✅ PoseNet inicializado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar PoseNet:', error);
      return false;
    }
  }

  async detectPose(video: HTMLVideoElement): Promise<PoseDetectionResult | null> {
    if (!this.model || !this.isReady) return null;

    try {
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
    } catch (error) {
      console.error('Erro na detecção de pose:', error);
      return null;
    }
  }

  private detectFall(keypoints: posenet.Keypoint[]): boolean {
    const nose = keypoints.find(k => k.part === 'nose');
    const leftHip = keypoints.find(k => k.part === 'leftHip');
    const rightHip = keypoints.find(k => k.part === 'rightHip');

    if (!nose || !leftHip || !rightHip) return false;
    if (nose.score < 0.5 || leftHip.score < 0.5 || rightHip.score < 0.5) return false;

    const avgHipY = (leftHip.position.y + rightHip.position.y) / 2;
    const verticalDistance = Math.abs(nose.position.y - avgHipY);

    // Se a distância vertical for muito pequena, pessoa está horizontal (caída)
    return verticalDistance < 100;
  }

  private detectLyingDown(keypoints: posenet.Keypoint[]): boolean {
    const shoulders = keypoints.filter(k => 
      (k.part === 'leftShoulder' || k.part === 'rightShoulder') && k.score > 0.5
    );
    const hips = keypoints.filter(k => 
      (k.part === 'leftHip' || k.part === 'rightHip') && k.score > 0.5
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

  isInitialized(): boolean {
    return this.isReady;
  }
}

export const poseDetectionService = new PoseDetectionService();
