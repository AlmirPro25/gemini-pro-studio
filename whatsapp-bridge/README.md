# 📱 WhatsApp Bridge - Integração com Gemini Pro Studio

Ponte entre WhatsApp Web.js e Gemini Pro Studio, permitindo usar todas as funcionalidades do app via WhatsApp.

## 🚀 Funcionalidades

- ✅ Conectar WhatsApp via QR Code
- ✅ Receber e enviar mensagens
- ✅ Suporte a imagens e mídias
- ✅ Integração com todas as personas
- ✅ Geração de documentos e currículos via WhatsApp
- ✅ Comandos especiais
- ✅ Painel web para gerenciar conversas

## 📦 Instalação

```bash
cd whatsapp-bridge
npm install
```

## ⚙️ Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis:
```env
WHATSAPP_BRIDGE_PORT=3001
STUDIO_URL=http://localhost:5173
GEMINI_API_KEY=sua_chave_aqui
```

## 🎯 Como Usar

### 1. Iniciar o Bridge

```bash
npm start
```

### 2. Conectar WhatsApp

- O servidor irá gerar um QR Code no terminal
- Escaneie com seu WhatsApp
- Aguarde a mensagem "WhatsApp Client pronto!"

### 3. Acessar Painel Web

- Abra o Gemini Pro Studio
- Clique em "📱 WhatsApp" na sidebar
- Gerencie suas conversas pelo painel

## 💬 Comandos Disponíveis

Use estes comandos no WhatsApp:

- `/help` - Mostra lista de comandos
- `/persona [nome]` - Muda a persona ativa
- `/curriculo` - Inicia criação de currículo
- `/documento` - Inicia criação de documento
- `/imagem [prompt]` - Gera uma imagem
- `/status` - Mostra status do sistema

## 📡 API Endpoints

### GET /api/status
Retorna status do WhatsApp

### GET /api/qr
Retorna QR Code atual (se disponível)

### POST /api/send
Envia mensagem
```json
{
  "to": "5511999999999@c.us",
  "message": "Olá!",
  "mediaBase64": "...",
  "mediaMimetype": "image/jpeg"
}
```

### GET /api/chats
Lista conversas recentes

### GET /api/messages/:chatId
Obtém histórico de mensagens

### POST /api/disconnect
Desconecta WhatsApp

## 🔌 Socket.IO Events

### Cliente → Servidor
- `disconnect` - Cliente desconectou

### Servidor → Cliente
- `whatsapp:qr` - QR Code gerado
- `whatsapp:ready` - WhatsApp conectado
- `whatsapp:authenticated` - Autenticado
- `whatsapp:auth_failure` - Falha na autenticação
- `whatsapp:disconnected` - Desconectado
- `whatsapp:message` - Nova mensagem recebida
- `whatsapp:status` - Status atual

## 🏗️ Arquitetura

```
WhatsApp Web
     ↓
WhatsApp-Web.js
     ↓
Bridge Server (Express + Socket.IO)
     ↓
Gemini Pro Studio (React)
     ↓
Gemini API
```

## 📝 Exemplo de Uso

### Criar Currículo via WhatsApp

1. Envie: `/curriculo`
2. Responda as perguntas da IA
3. Receba confirmação
4. Acesse o painel web para visualizar e exportar

### Conversar com Persona

1. Envie: `/persona ML Architect`
2. Converse normalmente
3. A IA responderá como o especialista selecionado

### Gerar Imagem

1. Envie: `/imagem um gato astronauta no espaço`
2. Aguarde processamento
3. Receba a imagem gerada

## 🛠️ Desenvolvimento

### Modo de Desenvolvimento

```bash
npm run dev
```

### Estrutura de Arquivos

```
whatsapp-bridge/
├── server.js          # Servidor principal
├── package.json       # Dependências
├── .env.example       # Exemplo de configuração
└── README.md          # Este arquivo
```

## 🔒 Segurança

- ⚠️ Nunca compartilhe seu `.env`
- ⚠️ Use HTTPS em produção
- ⚠️ Implemente autenticação adicional se necessário
- ⚠️ Limite rate de mensagens para evitar ban

## 🐛 Troubleshooting

### QR Code não aparece
- Verifique se a porta 3001 está livre
- Reinicie o servidor

### WhatsApp desconecta
- Verifique conexão com internet
- Reescaneie o QR Code

### Mensagens não chegam
- Verifique se o Socket.IO está conectado
- Veja logs do servidor

## 📚 Recursos

- [WhatsApp Web.js Docs](https://wwebjs.dev/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Express Docs](https://expressjs.com/)

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou PR.

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para integrar WhatsApp com Gemini Pro Studio**
