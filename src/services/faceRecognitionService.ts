// Serviço de Reconhecimento Facial com IA
// Usa Gemini Vision para comparar rostos

export interface FaceRecord {
  id: string;
  name: string;
  role: string;
  photos: string[]; // Múltiplas fotos para melhor reconhecimento
  accessLevel: 'authorized' | 'visitor' | 'blocked';
  createdAt: number;
  lastSeen?: number;
  appearances: FaceAppearance[];
}

export interface FaceAppearance {
  id: string;
  faceId: string;
  timestamp: number;
  imageUrl: string;
  confidence: number;
  location: string;
}

class FaceRecognitionService {
  private faces: FaceRecord[] = [];

  constructor() {
    this.loadFaces();
  }

  // Adicionar rosto
  async addFace(name: string, role: string, photos: string[], accessLevel: FaceRecord['accessLevel']): Promise<FaceRecord> {
    const face: FaceRecord = {
      id: `face_${Date.now()}`,
      name,
      role,
      photos,
      accessLevel,
      createdAt: Date.now(),
      appearances: []
    };

    this.faces.push(face);
    this.saveFaces();
    return face;
  }

  // Adicionar foto a um rosto existente
  addPhotoToFace(faceId: string, photo: string): void {
    const face = this.faces.find(f => f.id === faceId);
    if (face) {
      face.photos.push(photo);
      this.saveFaces();
    }
  }

  // Reconhecer rosto usando Gemini Vision
  async recognizeFace(imageData: string): Promise<{
    recognized: boolean;
    face?: FaceRecord;
    confidence: number;
    message: string;
  }> {
    if (this.faces.length === 0) {
      return {
        recognized: false,
        confidence: 0,
        message: 'Nenhum rosto cadastrado no sistema'
      };
    }

    try {
      // Usar Gemini para comparar com rostos cadastrados
      const prompt = `Analise este rosto e compare com os rostos cadastrados abaixo.

ROSTOS CADASTRADOS:
${this.faces.map((f, i) => `${i + 1}. ${f.name} (${f.role})`).join('\n')}

Responda em JSON:
{
  "matchFound": boolean,
  "matchedPersonIndex": number ou null (índice 1-based),
  "confidence": number (0-100),
  "reasoning": "explicação breve"
}`;

      // Por enquanto, retorna simulação
      // Em produção, chamaria a API do Gemini com as imagens
      
      return {
        recognized: false,
        confidence: 0,
        message: 'Rosto não reconhecido'
      };
    } catch (error) {
      console.error('Erro no reconhecimento facial:', error);
      return {
        recognized: false,
        confidence: 0,
        message: 'Erro ao processar reconhecimento'
      };
    }
  }

  // Registrar aparição
  registerAppearance(faceId: string, imageUrl: string, confidence: number, location: string): void {
    const face = this.faces.find(f => f.id === faceId);
    if (face) {
      const appearance: FaceAppearance = {
        id: `app_${Date.now()}`,
        faceId,
        timestamp: Date.now(),
        imageUrl,
        confidence,
        location
      };

      face.appearances.unshift(appearance);
      face.lastSeen = Date.now();
      
      // Manter apenas últimas 100 aparições
      if (face.appearances.length > 100) {
        face.appearances = face.appearances.slice(0, 100);
      }

      this.saveFaces();
    }
  }

  // Obter todos os rostos
  getAllFaces(): FaceRecord[] {
    return this.faces;
  }

  // Obter rosto por ID
  getFaceById(id: string): FaceRecord | undefined {
    return this.faces.find(f => f.id === id);
  }

  // Atualizar rosto
  updateFace(id: string, updates: Partial<FaceRecord>): void {
    const index = this.faces.findIndex(f => f.id === id);
    if (index !== -1) {
      this.faces[index] = { ...this.faces[index], ...updates };
      this.saveFaces();
    }
  }

  // Deletar rosto
  deleteFace(id: string): void {
    this.faces = this.faces.filter(f => f.id !== id);
    this.saveFaces();
  }

  // Obter histórico de aparições
  getAppearanceHistory(faceId?: string, limit: number = 50): FaceAppearance[] {
    if (faceId) {
      const face = this.faces.find(f => f.id === faceId);
      return face?.appearances.slice(0, limit) || [];
    }

    // Todas as aparições
    const allAppearances: FaceAppearance[] = [];
    this.faces.forEach(face => {
      allAppearances.push(...face.appearances);
    });

    return allAppearances
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Estatísticas
  getStats() {
    return {
      totalFaces: this.faces.length,
      authorized: this.faces.filter(f => f.accessLevel === 'authorized').length,
      visitors: this.faces.filter(f => f.accessLevel === 'visitor').length,
      blocked: this.faces.filter(f => f.accessLevel === 'blocked').length,
      totalAppearances: this.faces.reduce((sum, f) => sum + f.appearances.length, 0),
      recentlySeen: this.faces.filter(f => f.lastSeen && f.lastSeen > Date.now() - 24 * 60 * 60 * 1000).length
    };
  }

  // Salvar no localStorage
  private saveFaces(): void {
    try {
      localStorage.setItem('security_faces', JSON.stringify(this.faces));
    } catch (error) {
      console.error('Erro ao salvar rostos:', error);
    }
  }

  // Carregar do localStorage
  private loadFaces(): void {
    try {
      const saved = localStorage.getItem('security_faces');
      if (saved) {
        this.faces = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar rostos:', error);
    }
  }
}

export const faceRecognitionService = new FaceRecognitionService();
