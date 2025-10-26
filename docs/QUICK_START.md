# ⚡ Quick Start - Prox AI Studio AGI

## 🚀 Iniciar Sistema Completo

### 1. Frontend (já rodando)
```bash
npm run dev
# Acesse: http://localhost:3000
```

### 2. WhatsApp Bridge (já rodando)
```bash
cd whatsapp-bridge
npm start
# Porta: 3002
```

### 3. Backend Automation (iniciar manualmente)
```bash
cd backend
npm start
# Porta: 3001
```

## 🎯 Acessar Novos Recursos

### AI Agent (Agente Autônomo)
1. Clique em **"AI Agent"** na sidebar (ícone roxo com raios)
2. Digite um objetivo: "Abrir o Bloco de Notas"
3. Clique em "Create Plan"
4. Clique em "Start Execution"
5. Observe a mágica acontecer! ✨

### Automation (Automação Visual)
1. Clique em **"Automation"** na sidebar (ícone azul de camadas)
2. Clique em "Create New Trigger"
3. Configure:
   - Nome: "Detectar Botão"
   - Objeto: "botão vermelho"
   - Ação: Click
4. Clique em "Start Monitoring"
5. Sistema detecta e age automaticamente! 🎯

## 📊 Recursos Disponíveis

| Recurso | Localização | Função |
|---------|-------------|--------|
| 💬 Chat | Sidebar → Chat | Conversa com IA |
| 📄 Documents | Sidebar → Documents | Gerador de documentos |
| 🖼️ Gallery | Sidebar → Gallery | Galeria de imagens |
| 📚 Library | Sidebar → Library | Biblioteca de prompts |
| 📁 Projects | Sidebar → Projects | Gerenciador de projetos |
| 💬 WhatsApp | Sidebar → WhatsApp | Integração WhatsApp |
| 👤 Admin | Sidebar → Admin | Painel administrativo |
| 🛡️ Security AI | Sidebar → Security AI | Vigilância inteligente |
| 🤖 AI Agent | Sidebar → AI Agent | **Agente autônomo** |
| ⚡ Automation | Sidebar → Automation | **Automação visual** |

## 🎨 Gradientes dos Ícones

- 📄 Documents: Azul
- 🖼️ Gallery: Roxo → Rosa
- 📚 Library: Âmbar → Laranja
- 📁 Projects: Ciano → Verde-água
- 💬 WhatsApp: Verde → Esmeralda
- 👤 Admin: Índigo → Roxo
- 🛡️ Security: Vermelho → Rosa
- 🤖 AI Agent: Violeta → Fúcsia ✨
- ⚡ Automation: Céu → Azul ✨

## 🔧 Comandos Úteis

### Verificar Processos
```bash
# Ver processos Node rodando
tasklist | findstr node
```

### Parar Servidores
```bash
# Parar todos os processos Node
taskkill /F /IM node.exe
```

### Reinstalar Dependências
```bash
# Frontend
npm install

# Backend
cd backend
npm install

# WhatsApp
cd whatsapp-bridge
npm install
```

## 🐛 Troubleshooting Rápido

### Backend não conecta
```bash
# Verificar se porta 3001 está livre
netstat -ano | findstr :3001

# Matar processo na porta
taskkill /PID <PID> /F
```

### Frontend não carrega
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### WhatsApp desconectado
```bash
# Remover sessão e reconectar
cd whatsapp-bridge
rm -rf .wwebjs_auth .wwebjs_cache
npm start
```

## 📚 Documentação Completa

- `STARTUP_GUIDE.md` - Guia detalhado de inicialização
- `INTEGRACAO_COMPLETA_AGI.md` - Documentação da integração
- `AUTONOMOUS_AGENT_SYSTEM.md` - Sistema de agente
- `DEEPVISION_AUTOMATION_INTEGRATION.md` - Automação visual
- `COMPUTER_AUTOMATION_SETUP.md` - Setup do backend

## 💡 Dicas

1. **Sempre inicie o backend antes de usar AI Agent ou Automation**
2. **Configure limites de API para evitar custos excessivos**
3. **Use modo de simulação para testar antes de executar**
4. **Monitore o console para debug em tempo real**
5. **Faça backup das configurações de automação**

## 🎉 Pronto!

Seu sistema AGI está completo e funcionando. Explore os recursos e divirta-se! 🚀
