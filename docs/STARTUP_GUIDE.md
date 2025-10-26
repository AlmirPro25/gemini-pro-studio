# 🚀 Prox AI Studio - Guia de Inicialização

## Status Atual do Sistema

✅ **Frontend**: Rodando em http://localhost:3000
✅ **WhatsApp Bridge**: Rodando e conectado
⚠️ **Backend Automation**: Precisa ser iniciado manualmente

## Novos Recursos Integrados

### 1. 🤖 AI Agent (Agente Autônomo)
- **Localização**: Sidebar → "AI Agent"
- **Funcionalidade**: Sistema de agente autônomo com planejamento e execução de tarefas
- **Recursos**:
  - Planejamento automático de tarefas complexas
  - Execução passo a passo com feedback visual
  - Recuperação automática de erros
  - Histórico de execuções
  - Controle de quota de API

### 2. ⚡ Automation (Automação DeepVision)
- **Localização**: Sidebar → "Automation"
- **Funcionalidade**: Integração de visão computacional com automação de computador
- **Recursos**:
  - Triggers baseados em detecção visual
  - Ações automatizadas (mouse, teclado, notificações)
  - Monitoramento em tempo real
  - Estatísticas de triggers

## Como Iniciar o Backend de Automação

O backend de automação precisa ser iniciado manualmente para habilitar os recursos de controle do computador:

```bash
cd backend
npm start
```

### Requisitos do Backend:
- **RobotJS**: Controle de mouse e teclado
- **Screenshot-desktop**: Captura de tela
- **Sharp**: Processamento de imagens
- **Socket.IO**: Comunicação em tempo real
- **Gemini AI**: Análise visual inteligente

### Porta do Backend:
- **HTTP**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vite)                       │
│                  http://localhost:3000                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ AI Agent │  │Automation│  │  DeepVision + Other  │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Backend Automation Server                   │
│                  http://localhost:3001                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ RobotJS  │  │Screenshot│  │   Gemini Vision AI   │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              WhatsApp Bridge Server                      │
│                  http://localhost:3002                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │WhatsApp  │  │ Database │  │   Media Handler      │  │
│  │Web.js    │  │ SQLite   │  │                      │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Funcionalidades por Módulo

### 🤖 AI Agent
1. **Planejamento de Tarefas**
   - Descreva um objetivo em linguagem natural
   - O agente cria um plano de ação detalhado
   - Cada passo é executado sequencialmente

2. **Execução Inteligente**
   - Captura de tela automática
   - Análise visual com Gemini
   - Ações de mouse/teclado precisas
   - Verificação de sucesso

3. **Recuperação de Erros**
   - Detecção automática de falhas
   - Tentativas de recuperação
   - Logging detalhado

### ⚡ Automation
1. **Triggers Visuais**
   - Detecta objetos específicos na tela
   - Monitora mudanças visuais
   - Ativa ações automaticamente

2. **Ações Configuráveis**
   - Cliques do mouse
   - Digitação de texto
   - Atalhos de teclado
   - Notificações do sistema

3. **Gerenciamento**
   - Ativar/desativar triggers
   - Editar configurações
   - Ver histórico de ativações

## Próximos Passos

1. **Iniciar Backend de Automação**
   ```bash
   cd backend
   npm start
   ```

2. **Testar AI Agent**
   - Acesse "AI Agent" na sidebar
   - Digite um objetivo simples (ex: "Abrir o Bloco de Notas")
   - Observe o planejamento e execução

3. **Configurar Automação**
   - Acesse "Automation" na sidebar
   - Crie um novo trigger visual
   - Configure a ação desejada
   - Inicie o monitoramento

## Notas Importantes

⚠️ **Segurança**: O sistema tem controle total do mouse e teclado. Use com cuidado!

⚠️ **API Quota**: O AI Agent consome quota da API Gemini. Configure limites apropriados.

⚠️ **Performance**: A captura de tela e análise visual podem consumir recursos do sistema.

## Troubleshooting

### Backend não inicia
- Verifique se a porta 3001 está disponível
- Confirme que todas as dependências estão instaladas: `npm install`
- Verifique se o arquivo `.env` tem a chave da API Gemini

### AI Agent não funciona
- Confirme que o backend está rodando
- Verifique a conexão WebSocket no console do navegador
- Teste a captura de tela manualmente

### Automation não detecta objetos
- Ajuste a confiança mínima do trigger
- Melhore a descrição do objeto a detectar
- Verifique se a câmera/tela está sendo capturada corretamente

## Suporte

Para mais informações, consulte:
- `docs/AUTONOMOUS_AGENT_SYSTEM.md` - Documentação completa do AI Agent
- `docs/DEEPVISION_AUTOMATION_INTEGRATION.md` - Integração DeepVision
- `docs/COMPUTER_AUTOMATION_SETUP.md` - Setup do backend de automação
- `docs/SISTEMA_AGI_COMPLETO_FINAL.md` - Visão geral do sistema AGI
