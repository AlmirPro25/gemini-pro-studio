// Serviço de Gravação de Vídeo
// Grava clipes quando detecta eventos

export interface RecordedEvent {
  id: string;
  timestamp: number;
  duration: number;
  videoBlob: Blob;
  thumbnail: string;
  eventType: 'motion' | 'alert' | 'manual';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

class VideoRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private recordingTimeout: NodeJS.Timeout | null = null;

  // Iniciar gravação
  async startRecording(stream: MediaStream, duration: number = 30000): Promise<void> {
    if (this.isRecording) {
      console.warn('Já está gravando');
      return;
    }

    try {
      this.recordedChunks = [];
      
      // Criar MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9' };
      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Capturar a cada 100ms
      this.isRecording = true;

      // Parar automaticamente após duração
      this.recordingTimeout = setTimeout(() => {
        this.stopRecording();
      }, duration);

      console.log(`📹 Gravação iniciada (${duration / 1000}s)`);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      throw error;
    }
  }

  // Parar gravação
  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedChunks = [];
        this.isRecording = false;
        
        if (this.recordingTimeout) {
          clearTimeout(this.recordingTimeout);
          this.recordingTimeout = null;
        }

        console.log('⏹️ Gravação finalizada:', blob.size, 'bytes');
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Gravar evento automaticamente
  async recordEvent(
    stream: MediaStream,
    eventType: RecordedEvent['eventType'],
    severity: RecordedEvent['severity'],
    description: string,
    duration: number = 30000
  ): Promise<RecordedEvent | null> {
    try {
      await this.startRecording(stream, duration);
      const videoBlob = await this.stopRecording();

      if (!videoBlob) {
        throw new Error('Falha ao gravar vídeo');
      }

      // Gerar thumbnail
      const thumbnail = await this.generateThumbnail(videoBlob);

      const event: RecordedEvent = {
        id: `event_${Date.now()}`,
        timestamp: Date.now(),
        duration: duration / 1000,
        videoBlob,
        thumbnail,
        eventType,
        severity,
        description
      };

      // Salvar no IndexedDB
      await this.saveEvent(event);

      return event;
    } catch (error) {
      console.error('Erro ao gravar evento:', error);
      return null;
    }
  }

  // Gerar thumbnail do vídeo
  private async generateThumbnail(videoBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = 0.1; // Pegar frame em 0.1s
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(video.src);
        resolve(thumbnail);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(videoBlob);
    });
  }

  // Salvar evento no IndexedDB
  private async saveEvent(event: RecordedEvent): Promise<void> {
    const dbName = 'SecurityEventsDB';
    const storeName = 'events';

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Salvar evento (sem o blob para economizar espaço)
        const eventToSave = {
          ...event,
          videoUrl: URL.createObjectURL(event.videoBlob)
        };
        
        store.put(eventToSave);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('eventType', 'eventType', { unique: false });
          store.createIndex('severity', 'severity', { unique: false });
        }
      };
    });
  }

  // Carregar eventos salvos
  async loadEvents(): Promise<RecordedEvent[]> {
    const dbName = 'SecurityEventsDB';
    const storeName = 'events';

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result || []);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  }

  // Deletar evento
  async deleteEvent(eventId: string): Promise<void> {
    const dbName = 'SecurityEventsDB';
    const storeName = 'events';

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        store.delete(eventId);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  // Export para MP4 (usando FFmpeg.wasm seria ideal, mas por ora retorna WebM)
  async exportToMP4(videoBlob: Blob): Promise<Blob> {
    // Por enquanto retorna o WebM original
    // Para converter para MP4 de verdade, precisaria do FFmpeg.wasm
    return videoBlob;
  }

  // Download do vídeo
  downloadVideo(videoBlob: Blob, filename: string): void {
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Status da gravação
  getRecordingStatus(): { isRecording: boolean; chunksCount: number } {
    return {
      isRecording: this.isRecording,
      chunksCount: this.recordedChunks.length
    };
  }
}

export const videoRecordingService = new VideoRecordingService();
