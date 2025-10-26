// Serviço de Reconhecimento Facial Real com Face-API.js
import * as faceapi from 'face-api.js';

export interface FaceDetectionResult {
  id: string;
  detection: faceapi.FaceDetection;
  landmarks?: faceapi.FaceLandmarks68;
  descriptor?: Float32Array;
  expressions?: faceapi.FaceExpressions;
  age?: number;
  gender?: string;
  match?: { name: string; distance: number };
  timestamp: number;
}

class FaceApiService {
  private isReady = false;
  private isLoading = false;
  private knownFaces: Map<string, Float32Array[]> = new Map();

  async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isLoading) {
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (this.isReady) { clearInterval(check); resolve(true); }
        }, 100);
      });
      return true;
    }

    try {
      this.isLoading = true;
      console.log('🤖 Carregando modelos Face-API.js...');
      
      const MODEL_URL = '/models'; // Modelos devem estar em public/models
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);
      
      this.isReady = true;
      this.isLoading = false;
      console.log('✅ Face-API.js carregado!');
      this.loadKnownFaces();
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar Face-API:', error);
      this.isLoading = false;
      return false;
    }
  }

  async detectFaces(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult[]> {
    if (!this.isReady) throw new Error('Face-API não está pronto');

    const detections = await faceapi
      .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions()
      .withAgeAndGender();

    return detections.map((det, i) => {
      const result: FaceDetectionResult = {
        id: `face_${Date.now()}_${i}`,
        detection: det.detection,
        landmarks: det.landmarks,
        descriptor: det.descriptor,
        expressions: det.expressions,
        age: det.age,
        gender: det.gender,
        timestamp: Date.now()
      };

      // Tentar reconhecer
      if (det.descriptor) {
        result.match = this.recognizeFace(det.descriptor);
      }

      return result;
    });
  }

  private recognizeFace(descriptor: Float32Array): { name: string; distance: number } | undefined {
    let bestMatch: { name: string; distance: number } | undefined;
    let minDistance = 0.6; // Threshold

    this.knownFaces.forEach((descriptors, name) => {
      descriptors.forEach(known => {
        const distance = faceapi.euclideanDistance(descriptor, known);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = { name, distance };
        }
      });
    });

    return bestMatch;
  }

  addKnownFace(name: string, descriptor: Float32Array): void {
    if (!this.knownFaces.has(name)) {
      this.knownFaces.set(name, []);
    }
    this.knownFaces.get(name)!.push(descriptor);
    this.saveKnownFaces();
  }

  private saveKnownFaces(): void {
    const data: any = {};
    this.knownFaces.forEach((descriptors, name) => {
      data[name] = descriptors.map(d => Array.from(d));
    });
    localStorage.setItem('known_faces', JSON.stringify(data));
  }

  private loadKnownFaces(): void {
    const saved = localStorage.getItem('known_faces');
    if (saved) {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([name, descriptors]: [string, any]) => {
        this.knownFaces.set(name, descriptors.map((d: number[]) => new Float32Array(d)));
      });
    }
  }

  drawFaces(ctx: CanvasRenderingContext2D, faces: FaceDetectionResult[], width: number, height: number): void {
    faces.forEach(face => {
      const box = face.detection.box;
      
      // Cor baseada em reconhecimento
      const color = face.match ? '#00ff00' : '#ff0000';
      
      // Desenhar caixa
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Label
      const label = face.match 
        ? `${face.match.name} (${Math.round((1 - face.match.distance) * 100)}%)`
        : 'Desconhecido';
      
      ctx.fillStyle = color;
      ctx.fillRect(box.x, box.y - 25, ctx.measureText(label).width + 10, 25);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(label, box.x + 5, box.y - 7);

      // Landmarks
      if (face.landmarks) {
        const landmarks = face.landmarks.positions;
        ctx.fillStyle = color;
        landmarks.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });
  }

  isModelReady(): boolean {
    return this.isReady;
  }

  getKnownFaces(): string[] {
    return Array.from(this.knownFaces.keys());
  }
}

export const faceApiService = new FaceApiService();
