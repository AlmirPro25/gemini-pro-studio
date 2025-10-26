import { GoogleGenAI } from '@google/genai';

// @ts-ignore
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey });

export interface SecurityAnalysisResult {
  alert: boolean;
  alertType: 'face_unknown' | 'suspicious_behavior' | 'weapon_detected' | 'fall_detected' | 'intrusion' | 'none';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedPeople: number;
  recognizedFaces: string[];
  unknownFaces: number;
  suspiciousActivities: string[];
  recommendations: string[];
}

export const analyzeSecurityFrame = async (
  imageData: string,
  knownFaces: { id: string; name: string }[] = []
): Promise<SecurityAnalysisResult> => {
  try {
    const base64Data = imageData.split(',')[1];
    
    const prompt = `Você é um sistema de segurança com IA avançada. Analise esta imagem de câmera de segurança e forneça um relatório detalhado.

ROSTOS CONHECIDOS/AUTORIZADOS:
${knownFaces.map(f => `- ${f.name} (ID: ${f.id})`).join('\n') || 'Nenhum rosto cadastrado'}

ANÁLISE REQUERIDA:
1. Conte quantas pessoas estão na imagem
2. Detecte se há rostos desconhecidos (não cadastrados acima)
3. Identifique comportamentos suspeitos:
   - Pessoas correndo
   - Gestos agressivos
   - Invasão de áreas restritas
   - Quedas ou acidentes
   - Armas ou objetos perigosos
   - Atividades fora do horário normal
   - Pessoas encapuzadas ou com rosto coberto
4. Avalie o nível de ameaça

RESPONDA EM JSON:
{
  "alert": boolean (true se houver algo suspeito),
  "alertType": "face_unknown" | "suspicious_behavior" | "weapon_detected" | "fall_detected" | "intrusion" | "none",
  "severity": "low" | "medium" | "high" | "critical",
  "description": "Descrição detalhada do que foi detectado",
  "detectedPeople": número de pessoas,
  "recognizedFaces": ["nomes dos rostos reconhecidos"],
  "unknownFaces": número de rostos desconhecidos,
  "suspiciousActivities": ["lista de atividades suspeitas"],
  "recommendations": ["recomendações de ação"]
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          }
        ]
      },
      config: {
        temperature: 0.1, // Baixa temperatura para respostas mais consistentes
        maxOutputTokens: 1000
      }
    });

    const responseText = result.text || '{}';
    
    // Extrair JSON da resposta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta inválida da IA');
    }

    const analysis: SecurityAnalysisResult = JSON.parse(jsonMatch[0]);
    
    return analysis;
  } catch (error) {
    console.error('Erro na análise de segurança:', error);
    return {
      alert: false,
      alertType: 'none',
      severity: 'low',
      description: 'Erro ao analisar imagem',
      detectedPeople: 0,
      recognizedFaces: [],
      unknownFaces: 0,
      suspiciousActivities: [],
      recommendations: []
    };
  }
};

// Análise de comportamento em sequência de frames
export const analyzeBehaviorSequence = async (
  frames: string[],
  timeInterval: number
): Promise<{
  movement: 'normal' | 'running' | 'falling' | 'fighting' | 'suspicious';
  description: string;
  alert: boolean;
}> => {
  try {
    const prompt = `Analise esta sequência de ${frames.length} frames capturados com intervalo de ${timeInterval}ms.

Detecte padrões de movimento e comportamento:
- Movimento normal (caminhando, parado)
- Corrida (fuga ou perseguição)
- Queda (acidente ou desmaio)
- Briga ou confronto
- Comportamento suspeito (olhando ao redor, tentando esconder algo)

Responda em JSON:
{
  "movement": "normal" | "running" | "falling" | "fighting" | "suspicious",
  "description": "Descrição do comportamento detectado",
  "alert": boolean
}`;

    // Preparar partes da mensagem com todos os frames
    const parts: any[] = [{ text: prompt }];
    frames.forEach((frame, index) => {
      const base64Data = frame.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({ text: `Frame ${index + 1}` });
    });

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts },
      config: {
        temperature: 0.1,
        maxOutputTokens: 500
      }
    });

    const responseText = result.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Resposta inválida');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Erro na análise de comportamento:', error);
    return {
      movement: 'normal',
      description: 'Erro ao analisar sequência',
      alert: false
    };
  }
};

// Reconhecimento facial simples (usando Gemini Vision)
export const compareFaces = async (
  faceImage: string,
  knownFaceImage: string
): Promise<{
  match: boolean;
  confidence: number;
  description: string;
}> => {
  try {
    const prompt = `Compare estes dois rostos e determine se são da mesma pessoa.

Analise:
- Formato do rosto
- Olhos, nariz, boca
- Características distintivas
- Idade aparente

Responda em JSON:
{
  "match": boolean (true se forem a mesma pessoa),
  "confidence": número de 0 a 100 (confiança na comparação),
  "description": "Explicação da comparação"
}`;

    const face1Data = faceImage.split(',')[1];
    const face2Data = knownFaceImage.split(',')[1];

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          { text: prompt },
          { text: 'Rosto 1:' },
          { inlineData: { mimeType: 'image/jpeg', data: face1Data } },
          { text: 'Rosto 2:' },
          { inlineData: { mimeType: 'image/jpeg', data: face2Data } }
        ]
      },
      config: {
        temperature: 0.1,
        maxOutputTokens: 300
      }
    });

    const responseText = result.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Resposta inválida');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Erro na comparação de rostos:', error);
    return {
      match: false,
      confidence: 0,
      description: 'Erro ao comparar rostos'
    };
  }
};

// Detecção de objetos perigosos
export const detectDangerousObjects = async (
  imageData: string
): Promise<{
  detected: boolean;
  objects: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}> => {
  try {
    const base64Data = imageData.split(',')[1];
    
    const prompt = `Analise esta imagem e detecte objetos perigosos ou suspeitos:

OBJETOS A DETECTAR:
- Armas (pistolas, facas, rifles)
- Objetos contundentes (tacos, barras de ferro)
- Ferramentas que podem ser usadas para invasão (pé de cabra, alicate)
- Mochilas ou bolsas suspeitas
- Máscaras ou capuzes
- Qualquer objeto que possa representar ameaça

Responda em JSON:
{
  "detected": boolean,
  "objects": ["lista de objetos detectados"],
  "severity": "low" | "medium" | "high" | "critical",
  "description": "Descrição detalhada"
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
        ]
      },
      config: {
        temperature: 0.1,
        maxOutputTokens: 500
      }
    });

    const responseText = result.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Resposta inválida');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Erro na detecção de objetos:', error);
    return {
      detected: false,
      objects: [],
      severity: 'low',
      description: 'Erro ao detectar objetos'
    };
  }
};
