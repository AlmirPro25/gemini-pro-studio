# 📊 Cálculo de Quota Otimizada - Sistema 24/7

## 🎯 Dados do Sistema

- **Quota diária:** 1.500 requisições/dia
- **Monitoramento:** 24 horas (86.400 segundos)
- **Capacidade:** Até 3.000 imagens por requisição

## 📐 Cálculos Fundamentais

### Cenários de Captura

| Imagens/Req | Total Imagens/Dia | Intervalo Captura | Intervalo Requisição |
|-------------|-------------------|-------------------|----------------------|
| 1           | 1.500             | 57,6s             | 57,6s                |
| 5           | 7.500             | 11,5s             | 57,6s                |
| 10          | 15.000            | 5,8s              | 57,6s                |
| **20**      | **30.000**        | **2,9s**          | **57,6s**            |
| 30          | 45.000            | 1,9s              | 57,6s                |
| 50          | 75.000            | 1,2s              | 57,6s                |

## ✅ Configuração Recomendada

### Opção 1: Captura Contínua (Sua Ideia Original)

```
Captura: A cada 3 segundos
Frames por dia: 28.800
Agrupamento: 20 frames por requisição
Requisições/dia: 1.440 ✅ (dentro da quota)
Cobertura temporal: 60 segundos por análise
```

**Vantagens:**
- ✅ Boa resolução temporal
- ✅ Detecta gestos e movimentos
- ✅ Usa 96% da quota (eficiente)

**Desvantagens:**
- ❌ Analisa tudo (mesmo sem eventos)
- ❌ Gasta quota em períodos vazios

### Opção 2: Detecção Local + Batch (RECOMENDADO)

```
Captura: A cada 3 segundos (local)
Detecção local: COCO-SSD (já implementado)
Envio: Apenas quando detectar movimento/pessoa
Agrupamento: 20 frames por requisição

Cenário típico:
- Movimento 30% do tempo → 432 requisições/dia
- Movimento 50% do tempo → 720 requisições/dia
- Movimento 100% do tempo → 1.440 requisições/dia
```

**Vantagens:**
- ✅ Economia massiva de quota
- ✅ Foco em eventos importantes
- ✅ Análise mais precisa
- ✅ Margem para picos

**Desvantagens:**
- ⚠️ Requer detecção local (já temos!)

## 🎯 Implementação Prática

### Sistema de 3 Camadas

```
┌─────────────────────────────────────────────┐
│  CAMADA 1: Captura Contínua (Local)         │
│  • A cada 3 segundos                        │
│  • Armazena em buffer                       │
│  • Sem custo de API                         │
└────────────┬────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────┐
│  CAMADA 2: Detecção Local (COCO-SSD)       │
│  • Detecta pessoas, objetos, movimento      │
│  • Filtra frames irrelevantes               │
│  • Sem custo de API                         │
└────────────┬────────────────────────────────┘
             │
             ↓ (Apenas se detectar algo)
┌─────────────────────────────────────────────┐
│  CAMADA 3: Análise Gemini (Cloud)          │
│  • 20 frames por requisição                 │
│  • Análise contextual profunda              │
│  • USA QUOTA                                │
└─────────────────────────────────────────────┘
```

### Lógica de Decisão

```typescript
// A cada 3 segundos
const frame = captureFrame();
buffer.push(frame);

// Detecção local (sem custo)
const detection = await cocoSSD.detect(frame);

if (detection.hasPerson || detection.hasMovement) {
  // Marcar como "interessante"
  interestingFrames++;
  
  // Quando acumular 20 frames interessantes
  if (interestingFrames >= 20) {
    // ENVIAR PARA GEMINI (usa 1 requisição)
    await gemini.analyzeBatch(buffer.slice(-20));
    interestingFrames = 0;
  }
} else {
  // Frame vazio - não enviar
  // Mas manter heartbeat (1x por hora)
  if (hoursSinceLastHeartbeat >= 1) {
    await gemini.healthCheck(frame);
  }
}
```

## 📊 Simulações de Uso

### Cenário 1: Loja Vazia (Noite)
```
Período: 22:00 - 06:00 (8 horas)
Movimento: 5% do tempo
Requisições: ~58 (economia de 92%)
```

### Cenário 2: Loja Movimentada (Dia)
```
Período: 09:00 - 18:00 (9 horas)
Movimento: 80% do tempo
Requisições: ~432 (uso de 29% da quota)
```

### Cenário 3: Evento Especial
```
Período: 24 horas
Movimento: 100% do tempo
Requisições: 1.440 (uso de 96% da quota)
```

### Total Típico
```
Noite (8h): 58 requisições
Dia (16h): 864 requisições
Total: 922 requisições/dia
Margem: 578 requisições (38% de reserva)
```

## 🔧 Configurações Ajustáveis

### Modo Econômico
```typescript
captureInterval: 5s
framesPerBatch: 30
detectionThreshold: 0.7 (mais rigoroso)
→ ~600 requisições/dia
```

### Modo Balanceado (RECOMENDADO)
```typescript
captureInterval: 3s
framesPerBatch: 20
detectionThreshold: 0.5
→ ~900 requisições/dia
```

### Modo Intensivo
```typescript
captureInterval: 2s
framesPerBatch: 15
detectionThreshold: 0.3 (mais sensível)
→ ~1.400 requisições/dia
```

## 🎯 Proteções de Quota

### 1. Contador Diário
```typescript
let dailyRequests = 0;
const MAX_DAILY = 1500;
const WARNING_THRESHOLD = 1350; // 90%

if (dailyRequests >= MAX_DAILY) {
  // Parar envios automáticos
  mode = 'emergency-only';
}

if (dailyRequests >= WARNING_THRESHOLD) {
  // Reduzir frequência
  captureInterval *= 2;
}
```

### 2. Priorização de Eventos
```typescript
const priorities = {
  person: 10,
  fall: 9,
  intrusion: 8,
  movement: 5,
  object: 3
};

// Enviar apenas eventos de alta prioridade quando quota baixa
if (dailyRequests > WARNING_THRESHOLD) {
  if (event.priority < 7) {
    skip();
  }
}
```

### 3. Heartbeat Inteligente
```typescript
// Enviar 1 frame por hora mesmo sem eventos
// Total: 24 requisições/dia (reserva de segurança)

if (hoursSinceLastRequest >= 1) {
  await gemini.healthCheck({
    frame: currentFrame,
    status: 'no-events',
    lastEvent: lastDetection
  });
}
```

## 💡 Otimizações Avançadas

### 1. Compressão Inteligente
```typescript
// Frames normais: 640x480, JPEG 70%
// Frames importantes: 1280x720, JPEG 85%

if (detection.severity === 'critical') {
  quality = 'high';
} else {
  quality = 'normal';
}
```

### 2. Análise Diferencial
```typescript
// Não enviar frames muito similares
const similarity = compareFrames(current, previous);

if (similarity > 0.95) {
  skip(); // Cena não mudou
}
```

### 3. Agendamento Inteligente
```typescript
// Horários de pico: análise mais frequente
// Horários vazios: análise reduzida

const schedule = {
  '00:00-06:00': { interval: 10s, threshold: 0.7 },
  '06:00-09:00': { interval: 3s, threshold: 0.5 },
  '09:00-18:00': { interval: 2s, threshold: 0.4 },
  '18:00-22:00': { interval: 3s, threshold: 0.5 },
  '22:00-24:00': { interval: 5s, threshold: 0.6 }
};
```

## 📈 Métricas de Monitoramento

```typescript
interface QuotaMetrics {
  dailyRequests: number;
  remainingQuota: number;
  usagePercentage: number;
  averageFramesPerRequest: number;
  detectionRate: number; // % de frames com detecção
  costPerHour: number;
  projectedDailyUsage: number;
}
```

## 🎉 Resultado Final

### Configuração Ideal
```
✅ Captura: A cada 3 segundos (local)
✅ Detecção: COCO-SSD local (sem custo)
✅ Envio: 20 frames quando detectar evento
✅ Heartbeat: 1 frame por hora
✅ Uso típico: ~900 requisições/dia (60%)
✅ Margem: 600 requisições (40% reserva)
```

### Benefícios
- 💰 Economia de 40% da quota
- 🎯 Foco em eventos importantes
- 🚀 Análise mais precisa
- 🛡️ Margem para picos
- 📊 Monitoramento 24/7 eficiente

---

**Próximo passo:** Implementar o sistema inteligente de quota?
