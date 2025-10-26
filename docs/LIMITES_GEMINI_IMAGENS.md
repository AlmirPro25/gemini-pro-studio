# 📊 Limites do Gemini - Imagens por Requisição

## 🎯 Informações Oficiais

### Gemini API / Vertex AI
- **Máximo:** 3.000 imagens por prompt
- **Inline (base64):** ~20 MB por requisição
- **File API:** Sem limite prático (referencia arquivos externos)

### Interface Web/App
- **Máximo:** 10 imagens por prompt (limitação de UI)

### Firebase AI Logic
- **Máximo:** 3.000 imagens
- **Sem limite de pixels** específico

## 💡 Estratégias de Uso

### 1. Análise em Lote (Batch Analysis)

**Cenário:** Analisar histórico de vídeo

```typescript
// Enviar 100 frames de uma vez
const frames = captureFrames(100); // Últimos 100 frames
const analysis = await gemini.analyzeMultipleFrames(frames);

// Resultado: análise temporal completa
"Nos últimos 100 frames (5 minutos):
- 3 pessoas entraram
- 2 saíram
- Detectei 5 objetos novos
- Padrão: movimento constante na porta"
```

### 2. Análise Temporal Profunda

**Cenário:** Investigar evento específico

```typescript
// Enviar frames antes e depois de um evento
const event = detectedEvents[0];
const framesBefore = getFrames(event.timestamp - 60000, event.timestamp);
const framesAfter = getFrames(event.timestamp, event.timestamp + 60000);

const analysis = await gemini.analyzeEventContext([
  ...framesBefore,
  ...framesAfter
]);

// Resultado: contexto completo do evento
"Evento: Pessoa caiu
Antes: Pessoa caminhando normalmente por 30s
Durante: Queda súbita
Depois: Pessoa permaneceu no chão por 45s"
```

### 3. Comparação de Cenas

**Cenário:** Detectar mudanças sutis

```typescript
// Enviar frames espaçados no tempo
const frames = [
  captureFrame(now - 3600000), // 1h atrás
  captureFrame(now - 1800000), // 30min atrás
  captureFrame(now - 900000),  // 15min atrás
  captureFrame(now)            // agora
];

const analysis = await gemini.compareScenes(frames);

// Resultado: evolução da cena
"Mudanças detectadas:
- 1h atrás: Sala vazia
- 30min atrás: 2 pessoas entraram
- 15min atrás: 1 pessoa saiu
- Agora: 1 pessoa trabalhando"
```

## 🚀 Implementação Otimizada

### Compressão Inteligente

```typescript
// Reduzir tamanho mantendo qualidade
function compressFrame(frame: string): string {
  // Reduzir resolução para 640x480
  // Qualidade JPEG 70%
  // Resultado: ~50KB por frame
  
  // 3.000 frames × 50KB = 150MB
  // Mas inline limit é 20MB...
  
  // Solução: usar File API!
}
```

### File API (Recomendado)

```typescript
// Upload de frames para File API
async function uploadFrames(frames: string[]): Promise<string[]> {
  const fileIds = [];
  
  for (const frame of frames) {
    const file = await gemini.files.upload({
      data: frame,
      mimeType: 'image/jpeg'
    });
    fileIds.push(file.name);
  }
  
  return fileIds;
}

// Usar nas requisições
const fileIds = await uploadFrames(frames);
const analysis = await gemini.analyze({
  text: "Analise estas 1000 imagens...",
  files: fileIds // Referências, não dados inline
});
```

## 📈 Casos de Uso Práticos

### 1. Análise de Vídeo Completo

```
Cenário: Analisar 1 hora de vídeo
Frames: 3.600 (1 por segundo)

Estratégia:
1. Capturar 3.600 frames
2. Dividir em 2 lotes de 1.800
3. Enviar cada lote para análise
4. Combinar resultados

Resultado: Análise completa de 1h em ~2 requisições
```

### 2. Detecção de Padrões

```
Cenário: Detectar padrão de movimento
Frames: 500 (últimos 5 minutos)

Estratégia:
1. Enviar 500 frames de uma vez
2. Pedir análise de padrões
3. Gemini identifica: "Pessoa circulando nervosamente"

Resultado: Detecção de comportamento suspeito
```

### 3. Resumo Inteligente

```
Cenário: Resumir dia inteiro
Frames: 86.400 (1 por segundo, 24h)

Estratégia:
1. Selecionar frames-chave (1 a cada 30s = 2.880 frames)
2. Enviar em 1 requisição
3. Gemini gera resumo do dia

Resultado: "Resumo de 24h:
- 08:00-12:00: 5 pessoas trabalhando
- 12:00-13:00: Sala vazia (almoço)
- 13:00-18:00: 3 pessoas trabalhando
- 18:00-08:00: Sala vazia"
```

## ⚠️ Limitações Práticas

### Inline (Base64)
- **Limite:** ~20 MB total
- **Frames:** ~400 frames (50KB cada)
- **Uso:** Análises rápidas

### File API
- **Limite:** 3.000 imagens
- **Frames:** Até 3.000 frames
- **Uso:** Análises profundas

### Recomendação

```typescript
if (frames.length <= 10) {
  // Usar inline (base64)
  sendInline(frames);
} else if (frames.length <= 400) {
  // Usar inline comprimido
  sendInlineCompressed(frames);
} else {
  // Usar File API
  uploadAndReference(frames);
}
```

## 🎯 Estratégia Ideal para DeepVision

### Análise Contínua (Atual)
- 1 frame a cada 3 segundos
- Análise individual
- Boa para tempo real

### Análise em Lote (Nova)
- 100 frames a cada 5 minutos
- Análise contextual profunda
- Ótima para padrões e resumos

### Híbrido (Melhor)
```
Tempo Real:
- 1 frame/3s → Detecção imediata

Background:
- 100 frames/5min → Análise de padrões
- 500 frames/30min → Resumo detalhado
- 2000 frames/dia → Relatório diário
```

## 💡 Próxima Implementação

Vou criar um serviço de **Batch Analysis** que:

1. Acumula frames em buffer
2. Envia lotes de 100-500 frames
3. Gera análises contextuais profundas
4. Detecta padrões que análise individual não vê

Quer que eu implemente isso agora?
