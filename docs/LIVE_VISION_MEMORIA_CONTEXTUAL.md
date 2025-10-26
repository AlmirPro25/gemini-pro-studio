# 🎙️ Live Vision - Análise Visual com Memória Contextual

## 🎯 O Que Foi Implementado

Sistema revolucionário que combina:
1. **Análise Visual com Memória** - Não repete análises, mantém contexto
2. **Gemini Live** - Conversa por voz em tempo real
3. **Integração Bidirecional** - Você fala, a IA vê e responde

## 🧠 Como Funciona

### 1. Visual Memory Service (`visualMemoryService.ts`)

**Mantém contexto das análises:**
```typescript
interface VisualContext {
  timestamp: number;
  description: string;
  objects: string[];      // Objetos detectados
  people: number;         // Número de pessoas
  activities: string[];   // Atividades inferidas
  changes: string[];      // Mudanças detectadas
  imageData?: string;     // Frame capturado
}
```

**Funcionalidades:**
- ✅ Detecta mudanças significativas
- ✅ Evita análises repetitivas
- ✅ Mantém histórico dos últimos 20 contextos
- ✅ Gera resumos inteligentes
- ✅ Identifica eventos importantes

**Exemplo de Detecção de Mudanças:**
```typescript
// Frame 1: 2 pessoas, laptop
// Frame 2: 2 pessoas, laptop  ← Não analisa (sem mudanças)
// Frame 3: 3 pessoas, laptop  ← Analisa! "1 pessoa entrou na cena"
// Frame 4: 3 pessoas, laptop, celular ← Analisa! "Novo objeto: celular"
```

### 2. Live Vision Service (`liveVisionService.ts`)

**Integra tudo:**
- 🎙️ Gemini Live (conversa por voz)
- 👁️ Análise visual contínua
- 🧠 Memória contextual
- 🔄 Comunicação bidirecional

**Fluxo de Funcionamento:**

```
┌─────────────────────────────────────────────┐
│  1. Você ativa Live Vision                  │
│  2. Sistema inicia Gemini Live              │
│  3. Análise visual a cada 3 segundos        │
│  4. Detecta mudanças significativas         │
│  5. Envia apenas mudanças para o Live       │
│  6. Você pode falar perguntas               │
│  7. IA responde com contexto visual         │
└─────────────────────────────────────────────┘
```

## 🎨 Interface

### Botão no Painel de Controles

```
┌─────────────────────────────────┐
│ 🎙️ Ativar Live Vision          │ ← Clique aqui
└─────────────────────────────────┘
```

### Quando Ativo

```
┌─────────────────────────────────┐
│ 🎙️ Live Vision Ativo           │
│ ● (pulsando)                    │
│                                 │
│ 🎤 "O que você está vendo?"    │ ← Sua fala
│                                 │
│ 📊 Análises: 15                 │
│ 👥 Pessoas: 2                   │
│ 🎯 Eventos: 3                   │
│                                 │
│ 💡 Fale comigo sobre o que     │
│    está vendo!                  │
└─────────────────────────────────┘
```

### Perguntas Rápidas (Modo Live)

```
┌─────────────────────────────────┐
│ Perguntas por Voz:              │
│                                 │
│ [👁️ O que você vê?]            │
│ [🔍 Algo mudou?]                │
│ [📊 Resumo]                     │
│ [⚠️ Alertas?]                   │
└─────────────────────────────────┘
```

## 🚀 Como Usar

### 1. Ativar Live Vision

```bash
1. Abra http://localhost:5173
2. Clique em "🎥 Segurança IA"
3. Ative uma câmera (Webcam)
4. No painel direito, clique em "🎙️ Ativar Live Vision"
5. Permita acesso ao microfone
6. Aguarde "Live Vision ativo!"
```

### 2. Conversar com a IA

**Você pode falar:**
- "O que você está vendo?"
- "Quantas pessoas tem aí?"
- "Algo mudou?"
- "Me dê um resumo"
- "Há algo suspeito?"
- "Descreva a cena"

**A IA responde:**
- Por voz (áudio)
- Com contexto visual completo
- Referenciando o histórico
- Alertando sobre mudanças

### 3. Perguntas Específicas

**Você:** "Foque na pessoa da esquerda"
**IA:** "Vejo uma pessoa à esquerda usando laptop..."

**Você:** "O que ela está fazendo?"
**IA:** "Baseado no histórico, ela está trabalhando no computador há 5 minutos..."

### 4. Desativar

```bash
1. Clique novamente em "🎙️ Live Vision Ativo"
2. Sistema para análise e desconecta
```

## 🧠 Inteligência do Sistema

### Análise Inteligente

**Antes (Sem Memória):**
```
Frame 1: "Vejo 2 pessoas e um laptop"
Frame 2: "Vejo 2 pessoas e um laptop"  ← Repetitivo!
Frame 3: "Vejo 2 pessoas e um laptop"  ← Repetitivo!
```

**Agora (Com Memória):**
```
Frame 1: "Vejo 2 pessoas e um laptop"
Frame 2: (sem mudanças, não analisa)
Frame 3: "Uma terceira pessoa entrou na cena" ← Só reporta mudanças!
```

### Contexto Persistente

**Você:** "Quantas pessoas?"
**IA:** "Atualmente 3 pessoas. Há 2 minutos eram 2, então 1 pessoa entrou."

**Você:** "O que elas estão fazendo?"
**IA:** "Baseado no histórico:
- Pessoa 1: Usando laptop (5 min)
- Pessoa 2: Usando celular (3 min)
- Pessoa 3: Acabou de entrar (30 seg)"

### Eventos Significativos

O sistema automaticamente detecta e memoriza:
- ✅ Pessoas entrando/saindo
- ✅ Novos objetos aparecendo
- ✅ Objetos desaparecendo
- ✅ Aglomerações (>3 pessoas)
- ✅ Atividades específicas (usando celular, laptop, etc.)

## 📊 Estatísticas em Tempo Real

```
📊 Análises: 25          ← Total de frames analisados
👥 Pessoas: 2            ← Pessoas na cena atual
🎯 Eventos: 5            ← Eventos significativos registrados
```

## 🔧 Configurações Avançadas

### Intervalo de Análise

```typescript
// Padrão: 3 segundos
liveVisionService.setAnalysisInterval(3000);

// Mais rápido: 1 segundo
liveVisionService.setAnalysisInterval(1000);

// Mais lento: 5 segundos
liveVisionService.setAnalysisInterval(5000);
```

### Auto-envio de Atualizações

```typescript
// Ativado por padrão
liveVisionService.setAutoSendVisualUpdates(true);

// Desativar (só envia quando você perguntar)
liveVisionService.setAutoSendVisualUpdates(false);
```

## 🎯 Casos de Uso

### 1. Monitoramento de Idosos

**Cenário:** Detectar quedas e atividades anormais

```
Sistema: "Detectei uma queda! Pessoa está no chão há 30 segundos."
Você: "Ela está se movendo?"
Sistema: "Não detectei movimento nos últimos 20 segundos. Recomendo verificar."
```

### 2. Segurança Residencial

**Cenário:** Monitorar entrada de pessoas

```
Sistema: "Nova pessoa detectada na entrada."
Você: "Quantas pessoas tem agora?"
Sistema: "3 pessoas. 2 já estavam, 1 acabou de entrar."
```

### 3. Monitoramento de Loja

**Cenário:** Acompanhar fluxo de clientes

```
Você: "Quantos clientes entraram hoje?"
Sistema: "Baseado no histórico, 15 pessoas entraram nas últimas 2 horas."
```

### 4. Escritório/Coworking

**Cenário:** Verificar ocupação

```
Você: "A sala está ocupada?"
Sistema: "Sim, 4 pessoas trabalhando. 3 usando laptops, 1 em reunião."
```

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. CÂMERA ATIVA                                   │
│     ↓                                              │
│  2. LIVE VISION INICIADO                           │
│     ↓                                              │
│  3. ANÁLISE VISUAL (a cada 3s)                     │
│     ├─ Detecta objetos (COCO-SSD)                 │
│     ├─ Conta pessoas                               │
│     ├─ Infere atividades                           │
│     └─ Compara com frame anterior                  │
│     ↓                                              │
│  4. MUDANÇA DETECTADA?                             │
│     ├─ SIM → Envia para Gemini Live               │
│     └─ NÃO → Aguarda próximo frame                │
│     ↓                                              │
│  5. VOCÊ FALA UMA PERGUNTA                         │
│     ↓                                              │
│  6. SISTEMA ENVIA:                                 │
│     ├─ Sua pergunta                                │
│     ├─ Contexto visual atual                       │
│     ├─ Histórico de mudanças                       │
│     └─ Eventos significativos                      │
│     ↓                                              │
│  7. GEMINI RESPONDE                                │
│     ├─ Por voz (áudio)                             │
│     ├─ Com contexto completo                       │
│     └─ Referenciando histórico                     │
│     ↓                                              │
│  8. LOOP CONTÍNUO                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 💡 Dicas de Uso

### Perguntas Efetivas

✅ **Boas perguntas:**
- "O que mudou desde a última vez?"
- "Descreva a pessoa da direita"
- "Há quanto tempo essa pessoa está aí?"
- "Algo suspeito aconteceu?"

❌ **Perguntas menos efetivas:**
- "Oi" (muito genérica)
- "Como você está?" (fora do contexto)

### Maximizar Eficiência

1. **Deixe o sistema aprender** - Primeiros minutos ele constrói contexto
2. **Faça perguntas específicas** - "Foque na porta" em vez de "O que você vê?"
3. **Use o histórico** - "O que aconteceu nos últimos 5 minutos?"
4. **Confie na memória** - Sistema lembra de tudo automaticamente

## 🎓 Arquitetura Técnica

### Serviços Criados

```
src/services/
├── visualMemoryService.ts      ← Memória contextual
├── liveVisionService.ts        ← Integração Live + Visão
└── geminiService.ts            ← Gemini Live (atualizado)
```

### Fluxo de Dados

```
VideoElement
    ↓
aiDetectionService (COCO-SSD)
    ↓
visualMemoryService (Memória)
    ↓
liveVisionService (Integração)
    ↓
LiveSessionManager (Gemini Live)
    ↓
Você (Áudio + Texto)
```

## 🎉 Resultado Final

Você agora tem um sistema de segurança que:

✅ **Vê** - Detecta objetos, pessoas, atividades
✅ **Lembra** - Mantém contexto e histórico
✅ **Pensa** - Analisa mudanças e padrões
✅ **Fala** - Conversa por voz em tempo real
✅ **Entende** - Responde perguntas contextuais
✅ **Alerta** - Notifica eventos importantes

É como ter um **assistente de segurança humano** que nunca dorme, nunca esquece, e está sempre atento! 🚀

---

**Desenvolvido com ❤️ usando Gemini 2.5 Flash + TensorFlow.js + React**
