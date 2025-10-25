# 📱 Integração WhatsApp - Guia Completo

## 🎯 Visão Geral

Integração completa entre seu bot do WhatsApp e o Gemini Pro Studio, permitindo:

- ✅ Atender clientes pelo WhatsApp
- ✅ Gerar documentos e currículos via chat
- ✅ Analisar imagens enviadas
- ✅ Usar todas as personas especializadas
- ✅ Painel web para gerenciar conversas
- ✅ Comandos especiais

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO WHATSAPP                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              WHATSAPP WEB (Celular)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         WHATSAPP-WEB.JS (Puppeteer)                      │
│  - Conecta via QR Code                                   │
│  - Recebe/Envia mensagens                                │
│  - Processa mídias                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           BRIDGE SERVER (Node.js)                        │
│  - Express API (REST)                                    │
│  - Socket.IO (Real-time)                                 │
│  - Processador de Mensagens                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│        GEMINI PRO STUDIO (React + Vite)                  │
│  - Painel WhatsApp                                       │
│  - Chat Interface                                        │
│  - Gerador de Documentos                                 │
│  - Sistema de Personas                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              GEMINI API (Google)                         │
│  - Processamento de linguagem                            │
│  - Geração de imagens                                    │
│  - Análise de mídias                                     │
└─────────────────────────────────────────────────────────┘
```

## 📦 Instalação

### 1. Instalar Dependências do Bridge

```bash
cd whatsapp-bridge
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie `whatsapp-bridge/.env`:

```env
WHATSAPP_BRIDGE_PORT=3001
STUDIO_URL=http://localhost:5173
GEMINI_API_KEY=sua_chave_gemini_aqui
```

### 3. Instalar Socket.IO Client no Studio

```bash
npm install socket.io-client
```

### 4. Adicionar Variável no Studio

Crie/edite `.env` na raiz:

```env
VITE_WHATSAPP_BRIDGE_URL=http://localhost:3001
```

## 🚀 Inicialização

### Terminal 1: Bridge Server

```bash
cd whatsapp-bridge
npm start
```

Aguarde o QR Code aparecer no terminal.

### Terminal 2: Gemini Pro Studio

```bash
npm run dev
```

### Terminal 3 (Opcional): Modo Watch

```bash
cd whatsapp-bridge
npm run dev
```

## 📱 Conectar WhatsApp

### Método 1: Via Terminal

1. Inicie o bridge server
2. QR Code aparecerá no terminal
3. Abra WhatsApp no celular
4. Vá em: Menu → Aparelhos conectados → Conectar aparelho
5. Escaneie o QR Code
6. Aguarde "WhatsApp Client pronto!"

### Método 2: Via Painel Web

1. Abra o Gemini Pro Studio
2. Clique em "📱 WhatsApp" na sidebar
3. QR Code aparecerá na tela
4. Escaneie com seu WhatsApp
5. Aguarde conexão

## 💬 Usando via WhatsApp

### Comandos Disponíveis

#### `/help`
Mostra lista de comandos disponíveis

**Exemplo:**
```
Você: /help
Bot: 📱 Comandos Disponíveis:
     /help - Mostra lista de comandos
     /persona [nome] - Muda a persona ativa
     ...
```

#### `/persona [nome]`
Muda a persona ativa

**Exemplos:**
```
Você: /persona
Bot: 🎭 Persona Atual: Gemini Pro
     Personas Disponíveis:
     1. Gemini Pro
     2. ML Architect
     ...

Você: /persona 2
Bot: ✅ Persona alterada para: ML Architect

Você: /persona ML Architect
Bot: ✅ Persona alterada para: ML Architect
```

#### `/curriculo`
Inicia criação de currículo

**Fluxo:**
```
Você: /curriculo
Bot: 📄 Criação de Currículo Iniciada!
     Qual template você prefere?
     1. Modern
     2. Elegant
     3. Creative

Você: 1
Bot: Ótimo! Qual seu nome completo?

Você: João Silva
Bot: Qual sua profissão/cargo?

Você: Desenvolvedor Full Stack
Bot: [continua coletando informações...]

Bot: ✅ Documento criado com sucesso!
     Acesse o painel web para visualizar.
```

#### `/documento`
Inicia criação de documento

**Exemplo:**
```
Você: /documento
Bot: 📝 Criação de Documento Iniciada!
     Que tipo de documento você precisa?
     1. Contrato de Locação
     2. Declaração Simples
     3. Proposta Comercial

Você: 2
Bot: [inicia coleta de dados...]
```

#### `/imagem [prompt]`
Gera uma imagem

**Exemplo:**
```
Você: /imagem um gato astronauta no espaço
Bot: 🎨 Imagem gerada!
     [envia imagem]
```

#### `/status`
Mostra status do sistema

**Exemplo:**
```
Você: /status
Bot: 📊 Status do Sistema
     🎭 Persona: Gemini Pro
     💬 Mensagens no histórico: 5
     📄 Sessão ativa: Não
     ✅ Sistema operacional!
```

### Conversa Normal

Você pode conversar normalmente sem comandos:

```
Você: Como criar um componente React?
Bot: [responde usando a persona ativa]

Você: [envia imagem]
     O que tem nesta imagem?
Bot: [analisa e descreve a imagem]
```

## 🖥️ Painel Web

### Acessar

1. Abra o Gemini Pro Studio
2. Clique em "📱 WhatsApp" na sidebar

### Funcionalidades

#### Lista de Conversas
- Veja todas as conversas ativas
- Contador de mensagens não lidas
- Última mensagem de cada chat

#### Área de Mensagens
- Histórico completo da conversa
- Suporte a imagens e mídias
- Timestamps
- Indicador de mensagens enviadas/recebidas

#### Enviar Mensagens
- Digite e envie mensagens
- Suporte a emojis
- Indicador de "enviando..."

#### Status de Conexão
- Indicador visual (verde = conectado)
- Reconexão automática
- Alertas de desconexão

## 🎨 Casos de Uso

### 1. Atendimento ao Cliente

```
Cliente: Olá, preciso de um orçamento
Você: [via painel web] Olá! Claro, vou te ajudar.
      Use /documento para criar uma proposta comercial.

Cliente: /documento
Bot: [inicia criação de proposta]
```

### 2. Geração de Currículos

```
Cliente: Preciso de um currículo urgente
Você: Use /curriculo e eu te ajudo!

Cliente: /curriculo
Bot: [cria currículo interativamente]
```

### 3. Análise de Imagens

```
Cliente: [envia foto de um produto]
         O que você acha deste design?

Bot: [analisa imagem com Gemini Vision]
     Vejo um design moderno com...
```

### 4. Consultoria Técnica

```
Cliente: Como implementar autenticação JWT?
Você: /persona Full Stack Architect

Cliente: [repete pergunta]
Bot: [responde como arquiteto especializado]
```

## 🔧 Configuração Avançada

### Personalizar Respostas

Edite `src/services/whatsappIntegrationService.ts`:

```typescript
// Adicionar novo comando
case '/meucomando':
  return this.meuMetodoCustomizado(userId, arg);
```

### Adicionar Novos Comandos

```typescript
export const WHATSAPP_COMMANDS = {
  // ... comandos existentes
  '/meucomando': 'Descrição do comando'
};
```

### Customizar Personas

Edite `src/constants.ts` para adicionar novas personas.

### Integrar com Banco de Dados

Modifique `WhatsAppMessageProcessor` para salvar em DB:

```typescript
private async handleConversation(userId: string, message: string) {
  // Salvar no banco
  await db.saveMessage(userId, message);
  
  // ... resto do código
}
```

## 🐛 Troubleshooting

### QR Code não aparece

**Problema:** Bridge inicia mas não mostra QR

**Solução:**
```bash
# Limpar sessão antiga
rm -rf whatsapp-bridge/.wwebjs_auth

# Reiniciar
npm start
```

### WhatsApp desconecta frequentemente

**Problema:** Conexão cai após alguns minutos

**Solução:**
- Verifique conexão com internet
- Mantenha WhatsApp aberto no celular
- Não use WhatsApp Web em outro lugar simultaneamente

### Mensagens não chegam no painel

**Problema:** Mensagens aparecem no WhatsApp mas não no painel

**Solução:**
```bash
# Verificar se Socket.IO está conectado
# No console do navegador:
console.log(socket.connected)

# Reiniciar bridge e studio
```

### Erro ao gerar documento

**Problema:** `/curriculo` ou `/documento` falha

**Solução:**
- Verifique se `GEMINI_API_KEY` está configurada
- Veja logs do bridge: `npm start`
- Teste no painel web primeiro

### Imagens não são enviadas

**Problema:** `/imagem` não funciona

**Solução:**
- Verifique quota da API Gemini
- Teste geração de imagem no painel web
- Veja logs de erro no bridge

## 📊 Monitoramento

### Logs do Bridge

```bash
cd whatsapp-bridge
npm start

# Logs mostram:
# - Mensagens recebidas
# - Comandos executados
# - Erros de API
# - Status de conexão
```

### Logs do Studio

Abra DevTools (F12) no navegador:
- Console: Erros JavaScript
- Network: Requisições HTTP
- Application: LocalStorage

### Métricas

Adicione ao `server.js`:

```javascript
let messageCount = 0;
let errorCount = 0;

whatsappClient.on("message", async (msg) => {
  messageCount++;
  console.log(`📊 Total de mensagens: ${messageCount}`);
  // ...
});
```

## 🚀 Deploy em Produção

### 1. Preparar Bridge

```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
cd whatsapp-bridge
pm2 start server.js --name whatsapp-bridge

# Salvar configuração
pm2 save
pm2 startup
```

### 2. Configurar HTTPS

Use nginx como reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name seu-dominio.com;

    location /whatsapp/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### 3. Variáveis de Produção

```env
WHATSAPP_BRIDGE_PORT=3001
STUDIO_URL=https://seu-dominio.com
GEMINI_API_KEY=sua_chave_producao
NODE_ENV=production
```

### 4. Monitoramento

```bash
# Ver logs
pm2 logs whatsapp-bridge

# Monitorar recursos
pm2 monit

# Restart automático
pm2 restart whatsapp-bridge
```

## 📚 Recursos Adicionais

- [WhatsApp Web.js Docs](https://wwebjs.dev/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Gemini API Docs](https://ai.google.dev/docs)

## 🤝 Suporte

Problemas? Abra uma issue ou entre em contato!

---

**Sistema completo e pronto para uso! 🎉**
