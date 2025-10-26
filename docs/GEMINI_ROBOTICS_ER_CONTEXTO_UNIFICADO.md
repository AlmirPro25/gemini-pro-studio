# 🤖 Gemini Robotics ER 1.5 - Contexto Unificado

## 📊 Capacidades do Modelo

### Limites Técnicos (Oficial)
- **Input:** 1.048.576 tokens (texto + multimídia combinado)
- **Output:** 65.536 tokens
- **Imagens:** Até ~3.000 imagens por prompt (inferido de modelos similares)
- **Modalidades:** Texto, imagens, vídeo, áudio

### Características Especiais
- ✅ **Agentic** - Decompõe tarefas em subtarefas
- ✅ **Function Calling** - Chama ferramentas externas
- ✅ **Planning** - Cria planos de alto nível
- ✅ **Self-correction** - Detecta erros e corrige

## 🎯 Problema do Contexto no Live

### O Que Acontece (Descoberta Importante)

```
┌─────────────────────────────────────────┐
│  GEMINI LIVE (Modo Streaming)           │
│                                         │
│  Canal de Áudio  ──────────────────┐   │
│  (voz em tempo real)               │   │
│                                    ↓   │
│  Canal de Texto  ──────────────────┤   │
│  (mensagens escritas)              │   │
│                                    ↓   │
│  ❌ NÃO SE JUNTAM AUTOMATICAMENTE  │   │
│                                         │
│  O modelo processa separadamente!      │
└─────────────────────────────────────────┘
```

### Por Que Isso Acontece

1. **Streams Diferentes** - Áudio e texto são canais separados
2. **Contexto Isolado** - Cada canal tem seu próprio buffer
3. **Sem Sincronização Automática** - O modelo não une os contextos sozinho

### Exemplo Real

```
Você (voz): "O que você está vendo?"
Sistema (texto): [envia contexto visual]
IA: "Sou um modelo de áudio, não vejo imagens" ❌

Por quê? O texto chegou, mas não foi unido ao contexto da conversa por voz!
```

## ✅ Solução: Context Sync Manager

### Arquitetura Proposta

```
┌─────────────────────────────────────────────────┐
│              CONTEXT SYNC MANAGER               │
│  (Unifica todos os canais em um único estado)   │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┼────────┬────────┬────────┐
    ↓        ↓        ↓        ↓        ↓
┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐
│ Áudio ││ Texto ││ Visão ││ Ações ││ Logs  │
│ Live  ││ Chat  ││ Câmera││ Mouse ││ Estado│
└───────┘└───────┘└───────┘└───────┘└───────┘
```

### Implementação

```typescript
class ContextSyncManager {
  private context: ContextEntry[] = [];
  private maxEntries = 50;

  interface ContextEntry {
    source: 'audio' | 'text' | 'vision' | 'action' | 'system';
    content: string;
    timestamp: number;
    metadata?: any;
  }

  // Adiciona entrada de qualquer canal
  update(source: ContextEntry['source'], content: string, metadata?: any) {
    this.context.push({
      source,
      content,
      timestamp: Date.now(),
      metadata
    });
    
    this.trim();
  }

  // Gera contexto unificado para o modelo
  getUnifiedContext(): string {
    const recent = this.context.slice(-20); // Últimos 20 eventos
    
    return `
CONTEXTO ATUAL (Últimos eventos):

${recent.map(entry => 
  `[${entry.source.toUpperCase()}] ${entry.content}`
).join('\n')}

────────────────────────────────────
Estado atual do sistema:
- Áudio: ${this.getLastBySource('audio')?.content || 'Nenhum'}
- Visão: ${this.getLastBySource('vision')?.content || 'Nenhuma'}
- Ação: ${this.getLastBySource('action')?.content || 'Nenhuma'}
    `.trim();
  }

  // Obtém última entrada de um canal específico
  private getLastBySource(source: ContextEntry['source']) {
    return this.context
      .filter(e => e.source === source)
      .slice(-1)[0];
  }

  // Mantém apenas últimas N entradas
  private trim() {
    if (this.context.length > this.maxEntries) {
      this.context = this.context.slice(-this.maxEntries);
    }
  }

  // Limpa contexto
  clear() {
    this.context = [];
  }

  // Exporta para análise
  export() {
    return JSON.stringify(this.context, null, 2);
  }
}
```

## 🔄 Fluxo de Uso

### 1. Inicialização

```typescript
const contextSync = new ContextSyncManager();

// Registrar eventos de todos os canais
liveSession.on('transcription', (text) => {
  contextSync.update('audio', text);
});

chatInput.on('message', (text) => {
  contextSync.update('text', text);
});

camera.on('analysis', (description) => {
  contextSync.update('vision', description);
});
```

### 2. Envio para o Modelo

```typescript
// Quando o modelo precisa do contexto completo
async function sendToModel(userQuery: string) {
  const unifiedContext = contextSync.getUnifiedContext();
  
  const fullPrompt = `
${unifiedContext}

NOVA PERGUNTA DO USUÁRIO:
${userQuery}

Responda considerando TODO o contexto acima (áudio, texto, visão, ações).
  `;
  
  // Enviar para Gemini
  await gemini.send(fullPrompt);
}
```

### 3. Pausa Estratégica (Quando Necessário)

```typescript
// Quando contexto visual é crítico
async function handleVisualQuery(query: string) {
  // 1. Pausar Live temporariamente
  await liveSession.pause();
  
  // 2. Capturar e analisar frame
  const frame = captureFrame();
  const analysis = await analyzeWithVision(frame, query);
  
  // 3. Atualizar contexto
  contextSync.update('vision', analysis);
  
  // 4. Resumir para fala
  const spokenResponse = optimizeForSpeech(analysis);
  
  // 5. Retomar Live com resposta
  await liveSession.resume();
  await liveSession.speak(spokenResponse);
}
```

## 🤖 Integração com Automação de PC

### Arquitetura Completa

```
┌─────────────────────────────────────────────────┐
│         GEMINI ROBOTICS ER 1.5                  │
│  (Planning + Function Calling + Self-Repair)    │
└────────────┬────────────────────────────────────┘
             │
             │ Function Calls (JSON)
             ↓
┌─────────────────────────────────────────────────┐
│           MCP / TOOL SERVER (Local)             │
│  • Recebe chamadas do modelo                    │
│  • Traduz para ações do SO                      │
│  • Retorna resultados + evidências              │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┼────────┬────────┬────────┐
    ↓        ↓        ↓        ↓        ↓
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│PyAutoGUI││AutoHot││Selenium││Win32  ││OCR    │
│Mouse/KB ││Key    ││Browser ││API    ││Tesser.│
└────────┘└────────┘└────────┘└────────┘└────────┘
```

### Funções Disponíveis para o Modelo

```typescript
const AVAILABLE_FUNCTIONS = {
  // Mouse e Teclado
  click: { x: number, y: number },
  doubleClick: { x: number, y: number },
  rightClick: { x: number, y: number },
  type: { text: string },
  press: { key: string },
  hotkey: { keys: string[] },
  
  // Janelas
  openApp: { name: string },
  closeApp: { name: string },
  focusWindow: { title: string },
  moveWindow: { x: number, y: number },
  resizeWindow: { width: number, height: number },
  
  // Navegador
  openUrl: { url: string },
  clickElement: { selector: string },
  fillForm: { selector: string, value: string },
  submitForm: { selector: string },
  
  // Observação
  screenshot: {},
  ocr: { region?: { x, y, w, h } },
  findElement: { description: string },
  
  // Sistema
  wait: { seconds: number },
  runScript: { script: string },
  getClipboard: {},
  setClipboard: { text: string }
};
```

### Ciclo de Execução com Auto-Correção

```typescript
async function executeTask(task: string) {
  const maxAttempts = 3;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      // 1. Modelo gera plano
      const plan = await gemini.generatePlan(task);
      contextSync.update('system', `Plano: ${plan}`);
      
      // 2. Executar cada passo
      for (const step of plan.steps) {
        // Executar ação
        const result = await executeAction(step.action);
        contextSync.update('action', `${step.action}: ${result.status}`);
        
        // Capturar evidência
        const screenshot = await captureScreenshot();
        const ocr = await performOCR(screenshot);
        
        // Verificar sucesso
        const success = await gemini.verifySuccess({
          expected: step.expectedResult,
          actual: { screenshot, ocr, result }
        });
        
        if (!success) {
          // Falhou - pedir correção
          const correction = await gemini.generateCorrection({
            step,
            error: result.error,
            context: contextSync.getUnifiedContext()
          });
          
          // Tentar correção
          await executeAction(correction.action);
        }
      }
      
      // Sucesso!
      return { success: true, attempts: attempt + 1 };
      
    } catch (error) {
      attempt++;
      contextSync.update('system', `Tentativa ${attempt} falhou: ${error}`);
      
      if (attempt >= maxAttempts) {
        return { success: false, error, attempts: attempt };
      }
      
      // Aguardar antes de tentar novamente
      await wait(1000);
    }
  }
}
```

## 🎯 Exemplo Prático Completo

### Tarefa: "Organize minhas abas do Chrome e envie um email"

```typescript
// 1. Usuário fala
contextSync.update('audio', 'Organize minhas abas do Chrome e envie um email');

// 2. Modelo gera plano
const plan = {
  steps: [
    { action: 'focusWindow', params: { title: 'Chrome' } },
    { action: 'screenshot', params: {} },
    { action: 'ocr', params: {} },
    { action: 'analyzeTabsWithVision', params: {} },
    { action: 'groupSimilarTabs', params: {} },
    { action: 'openUrl', params: { url: 'gmail.com' } },
    { action: 'clickElement', params: { selector: '[aria-label="Compose"]' } },
    { action: 'fillForm', params: { selector: 'input[name="to"]', value: 'user@example.com' } },
    { action: 'type', params: { text: 'Abas organizadas com sucesso!' } },
    { action: 'clickElement', params: { selector: '[aria-label="Send"]' } }
  ]
};

// 3. Executar com auto-correção
const result = await executeTask(plan);

// 4. Reportar resultado por voz
if (result.success) {
  await liveSession.speak('Tarefa concluída! Organizei as abas e enviei o email.');
} else {
  await liveSession.speak(`Não consegui completar. Erro: ${result.error}`);
}
```

## 🔒 Segurança e Boas Práticas

### 1. Sandbox de Execução

```typescript
// Executar em ambiente isolado
const sandbox = new VMSandbox({
  allowedActions: ['click', 'type', 'screenshot'],
  blockedActions: ['deleteFile', 'formatDisk', 'shutdown'],
  requireConfirmation: ['openUrl', 'runScript']
});
```

### 2. Auditoria Completa

```typescript
// Registrar tudo
const auditLog = {
  timestamp: Date.now(),
  user: 'user@example.com',
  task: 'Organize tabs',
  actions: [...],
  screenshots: [...],
  result: 'success'
};

await db.saveAuditLog(auditLog);
```

### 3. Kill Switch

```typescript
// Botão de emergência
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && e.ctrlKey && e.shiftKey) {
    emergencyStop();
  }
});

function emergencyStop() {
  liveSession.stop();
  automationEngine.stopAll();
  contextSync.clear();
  alert('🛑 Sistema parado!');
}
```

## 📊 Métricas e Monitoramento

```typescript
interface SystemMetrics {
  totalTasks: number;
  successRate: number;
  averageAttempts: number;
  averageExecutionTime: number;
  contextSwitches: number;
  errorsDetected: number;
  autoCorrections: number;
}

// Atualizar em tempo real
setInterval(() => {
  const metrics = calculateMetrics();
  updateDashboard(metrics);
}, 1000);
```

## 🎉 Resultado Final

Com essa arquitetura, você tem:

✅ **Contexto Unificado** - Áudio, texto, visão, ações em um só lugar
✅ **Auto-Correção** - Detecta erros e tenta consertar
✅ **Automação Completa** - Controla mouse, teclado, janelas, navegador
✅ **Segurança** - Sandbox, auditoria, kill switch
✅ **Inteligência** - Planning, function calling, self-repair
✅ **Multimodal** - Voz, texto, imagem, ações

É como ter um **assistente robótico completo** que vê, ouve, pensa e age! 🤖✨

---

**Próximo passo:** Implementar o Context Sync Manager no sistema atual?
