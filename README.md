# 🚀 Gemini Pro Studio + WhatsApp Integration

Sistema completo de IA com interface web e integração WhatsApp, usando Gemini API.

## ✨ Funcionalidades

### 🤖 IA Avançada
- **7 Personas Especializadas** (ML, Full Stack, DevOps, Security, Data, Code Review)
- **Modo Thinking** - Raciocínio profundo passo a passo
- **Chat Contextual** - Mantém histórico de conversas
- **Análise de Código** - Review automático com sugestões

### 🎨 Geração de Conteúdo
- **Imagens** - Geração com Gemini 2.0 Flash Exp (grátis!)
- **Edição de Imagens** - Remover fundo, aplicar efeitos
- **Análise de Imagens** - Gemini Vision para descrever e analisar
- **Documentos** - Currículos profissionais com 6 templates

### 📱 WhatsApp Integration
- **Bot Inteligente** - Todas as funcionalidades via WhatsApp
- **Comandos Especiais** - `/help`, `/persona`, `/imagem`, `/codigo`
- **Detecção Inteligente** - Reconhece pedidos sem comandos
- **Painel Web** - Gerencia conversas em tempo real

### 📄 Sistema de Documentos
- **Currículos** - 6 templates profissionais
- **Contratos** - Locação, prestação de serviços
- **Declarações** - Simples e personalizadas
- **Propostas** - Comerciais profissionais

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar API Key

```bash
cp .env.example .env.local
# Edite .env.local e adicione sua GEMINI_API_KEY
```

### 3. Iniciar Studio

```bash
npm run dev
```

Acesse: http://localhost:3000

### 4. Iniciar WhatsApp Bridge (Opcional)

```bash
cd whatsapp-bridge
npm install
cp .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY
npm start
```

Escaneie o QR Code com seu WhatsApp!

## 📚 Documentação

### Guias Principais
- **[Integração WhatsApp](docs/INTEGRACAO_WHATSAPP.md)** - Guia completo
- **[Início Rápido WhatsApp](docs/GUIA_RAPIDO_WHATSAPP.md)** - 5 minutos
- **[Sistema de Documentos](docs/GUIA_SISTEMA_DOCUMENTOS.md)** - Currículos e mais

### Documentação Técnica
- **[WhatsApp Bridge](whatsapp-bridge/README.md)** - API e arquitetura
- **[Resumos](docs/)** - Todos os guias e resumos

## 🎯 Comandos WhatsApp

| Comando | Descrição |
|---------|-----------|
| `/help` | Lista todos os comandos |
| `/persona [nome]` | Muda especialista (ml, fullstack, devops, etc) |
| `/thinking` | Ativa modo raciocínio profundo |
| `/codigo` | Analisa código enviado |
| `/imagem [descrição]` | Gera imagem com IA |
| `/status` | Status do sistema |
| `/reset` | Limpa histórico |

**Ou use linguagem natural:**
- "gera uma imagem de um gato astronauta"
- "analise este código: [código]"
- [Enviar foto] "o que tem nesta imagem?"

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│     Gemini Pro Studio (React)       │
│  - Interface Web                    │
│  - Chat com IA                      │
│  - Geração de Documentos            │
│  - Galeria de Imagens               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   WhatsApp Bridge (Node.js)         │
│  - Express API                      │
│  - Socket.IO Real-time              │
│  - WhatsApp-Web.js                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        Gemini API (Google)          │
│  - Gemini 2.5 Flash                 │
│  - Gemini 2.0 Flash Exp (Imagens)   │
│  - Gemini Vision                    │
└─────────────────────────────────────┘
```

## 🛠️ Tecnologias

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS (via CDN)

### Backend
- Node.js
- Express
- Socket.IO
- WhatsApp-Web.js

### IA
- Google Gemini API
- Gemini 2.5 Flash (Chat)
- Gemini 2.0 Flash Exp (Imagens - Grátis!)
- Gemini Vision (Análise de imagens)

## 📊 Estrutura do Projeto

```
gemini-pro-studio/
├── src/                    # Código fonte React
│   ├── components/         # Componentes React
│   ├── services/          # Serviços e APIs
│   ├── data/              # Dados e configurações
│   └── utils/             # Utilitários
├── whatsapp-bridge/       # Servidor WhatsApp
│   ├── server.js          # Servidor principal
│   ├── enhanced-features.js # Funcionalidades avançadas
│   └── package.json       # Dependências
├── docs/                  # Documentação completa
├── public/                # Assets públicos
└── README.md             # Este arquivo
```

## 🎓 Casos de Uso

### 1. Atendimento ao Cliente
- Bot WhatsApp 24/7
- Respostas inteligentes
- Análise de imagens de produtos
- Geração de propostas

### 2. Criação de Conteúdo
- Geração de imagens para redes sociais
- Edição automática de fotos
- Criação de currículos
- Documentos profissionais

### 3. Desenvolvimento
- Code review automático
- Análise de código
- Consultoria com especialistas IA
- Debugging assistido

### 4. Produtividade
- Assistente pessoal via WhatsApp
- Geração de documentos
- Análise de imagens
- Automação de tarefas

## 💰 Custo

**100% GRÁTIS!** 🎉

- Gemini 2.5 Flash: Grátis (quota generosa)
- Gemini 2.0 Flash Exp: Grátis (imagens ilimitadas)
- Gemini Vision: Grátis
- Todas as funcionalidades: Grátis

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou PR.

## 📄 Licença

MIT

## 🎉 Créditos

Desenvolvido com ❤️ usando:
- Google Gemini API
- WhatsApp-Web.js
- React
- Node.js

---

**⭐ Se este projeto te ajudou, deixe uma estrela!**

**📱 Teste agora: `npm run dev` e `cd whatsapp-bridge && npm start`**
