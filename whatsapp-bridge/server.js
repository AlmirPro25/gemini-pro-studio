/**
 * 🔗 prox ai studio - WHATSAPP BRIDGE SERVER
 * 
 * Bridge between WhatsApp Web.js and prox ai studio
 * Allows using all platform features via WhatsApp Business
 */

require("dotenv").config();
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./database");

// ==================== CONFIGURAÇÃO ====================

const PORT = process.env.WHATSAPP_BRIDGE_PORT || 3001;
const STUDIO_URL = process.env.STUDIO_URL || "http://localhost:5173";

// ==================== EXPRESS + SOCKET.IO ====================

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Permite todas as origens
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: '*', // Permite todas as origens
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== WHATSAPP CLIENT ====================

const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

// Estado do WhatsApp
let isWhatsAppReady = false;
let qrCodeData = null;

// ==================== WHATSAPP EVENTS ====================

whatsappClient.on("qr", (qr) => {
  qrCodeData = qr;
  qrcode.generate(qr, { small: true });
  console.log("📱 QR Code gerado. Escaneie com seu WhatsApp!");

  // Envia QR para o frontend
  io.emit("whatsapp:qr", qr);
});

whatsappClient.on("ready", async () => {
  isWhatsAppReady = true;
  qrCodeData = null;
  console.log("✅ WhatsApp Client pronto!");

  // Salvar sessão no banco
  const info = whatsappClient.info;
  await db.saveSession('default', {
    phoneNumber: info?.wid?.user || null,
    status: 'connected'
  });
  
  db.logEvent('connection', 'default', 'WhatsApp conectado com sucesso');

  io.emit("whatsapp:ready");
});

whatsappClient.on("authenticated", () => {
  console.log("🔐 WhatsApp autenticado!");
  io.emit("whatsapp:authenticated");
});

whatsappClient.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação:", msg);
  io.emit("whatsapp:auth_failure", msg);
});

whatsappClient.on("disconnected", async (reason) => {
  isWhatsAppReady = false;
  console.log("⚠️ WhatsApp desconectado:", reason);
  
  // Atualizar status no banco
  await db.updateSessionStatus('default', 'disconnected');
  db.logEvent('disconnection', 'default', `WhatsApp desconectado: ${reason}`);
  
  io.emit("whatsapp:disconnected", reason);
});

// ==================== PROCESSADOR DE MENSAGENS ====================

// Importar GoogleGenAI e Modality
const { GoogleGenAI, Modality } = require("@google/genai");
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Importar funcionalidades avançadas
const {
  getUserState,
  getHelpMessage,
  getStatusMessage,
  handlePersonaCommand,
  handleThinkingCommand,
  handleResetCommand,
  handleCodeCommand,
  handleReviewCommand,
  handleCurriculoCommand,
  processWithPersona,
  analyzeCode
} = require("./enhanced-features");

// Histórico de conversas
const conversationHistory = new Map();

// Exportar para enhanced-features
module.exports.conversationHistory = conversationHistory;

// Gera imagem com Gemini (modelo grátis!)
async function generateImage(prompt) {
  try {
    console.log(`🎨 Gerando imagem com Gemini 2.0 Flash Exp (grátis): ${prompt}`);

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE]
      }
    });

    const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart && imagePart.inlineData) {
      console.log('✅ Imagem gerada com sucesso!');
      return {
        data: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType
      };
    }

    throw new Error('Nenhuma imagem encontrada na resposta');
  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    throw error;
  }
}

// Edita imagem com Gemini (modelo grátis!)
async function editImage(imageBase64, imageMimeType, prompt) {
  try {
    console.log(`✏️ Editando imagem com Gemini 2.0 Flash Exp (grátis): ${prompt}`);

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: imageMimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE]
      }
    });

    const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart && imagePart.inlineData) {
      console.log('✅ Imagem editada com sucesso!');
      return {
        data: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType
      };
    }

    throw new Error('Nenhuma imagem encontrada na resposta');
  } catch (error) {
    console.error('Erro ao editar imagem:', error);
    throw error;
  }
}

// Analisa imagem com Gemini Vision
async function analyzeImage(imageBase64, imageMimeType, question) {
  try {
    console.log(`🔍 Analisando imagem: ${question}`);

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: imageMimeType
            }
          },
          { text: question || "Descreva esta imagem em detalhes." }
        ]
      }
    });

    console.log('✅ Imagem analisada com sucesso!');
    return result.text || 'Não consegui analisar a imagem.';
  } catch (error) {
    console.error('Erro ao analisar imagem:', error);
    throw error;
  }
}

// Processa mensagem com IA
async function processMessageWithAI(userId, message, media) {
  // Verifica se é comando
  if (message.startsWith('/')) {
    return await handleCommand(userId, message);
  }

  // Detecção inteligente de pedidos de imagem
  const lowerMessage = message.toLowerCase();
  const imageKeywords = [
    'gera uma imagem', 'gerar imagem', 'cria uma imagem', 'criar imagem',
    'faz uma imagem', 'fazer imagem', 'desenha', 'desenhar',
    'imagem de', 'imagem do', 'imagem da', 'foto de', 'foto do', 'foto da',
    'me mostra', 'mostre', 'quero ver', 'quero uma imagem'
  ];

  const isImageRequest = imageKeywords.some(keyword => lowerMessage.includes(keyword));

  if (isImageRequest) {
    // Remove as palavras-chave e pega só a descrição
    let prompt = message;
    imageKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      prompt = prompt.replace(regex, '').trim();
    });

    // Remove palavras extras
    prompt = prompt.replace(/^(de|do|da|um|uma|o|a)\s+/gi, '').trim();

    if (prompt.length > 3) {
      console.log(`🎨 Pedido de imagem detectado: "${prompt}"`);
      return 'generating_image:' + prompt;
    }
  }

  // Verifica se está aguardando código
  const userState = getUserState(userId);

  if (userState.awaitingCode) {
    userState.awaitingCode = false;
    userState.codeAnalysisMode = false;

    try {
      const analysis = await analyzeCode(message, genAI);
      return analysis;
    } catch (error) {
      return 'Erro ao analisar código. Tente novamente.';
    }
  }

  // Processa com persona ativa
  return await processWithPersona(userId, message, genAI);
}

// Manipula comandos
async function handleCommand(userId, command) {
  const [cmd, ...args] = command.split(' ');
  const arg = args.join(' ');

  switch (cmd.toLowerCase()) {
    case '/help':
      return getHelpMessage();

    case '/status':
      return getStatusMessage(userId);

    case '/persona':
      return handlePersonaCommand(userId, arg);

    case '/thinking':
      return handleThinkingCommand(userId);

    case '/reset':
      return handleResetCommand(userId);

    case '/codigo':
    case '/code':
      return handleCodeCommand(userId);

    case '/review':
      return handleReviewCommand(userId);

    case '/curriculo':
      return handleCurriculoCommand();

    case '/help_old':
      return `📱 *Comandos Disponíveis:*

/help - Mostra esta mensagem
/imagem [descrição] - Gera imagem com IA
/status - Status do sistema
/persona [nome] - Muda persona ativa
/curriculo - Info sobre currículos
/documento - Info sobre documentos

🎨 *Recursos de Imagem:*
• Envie /imagem [descrição] para gerar
• Envie uma foto para analisar
• Envie foto + texto para editar

💡 *Exemplos:*
/imagem um gato astronauta no espaço
[Enviar foto] O que tem nesta imagem?
[Enviar foto] Editar: remover fundo

💬 *Dica:* Você também pode conversar normalmente comigo!`;

    case '/status':
      const historySize = conversationHistory.get(userId)?.length || 0;
      return `📊 *Status do Sistema*

✅ WhatsApp: Conectado
🤖 IA: Gemini 2.5 Flash
💬 Mensagens no histórico: ${historySize}
🚀 Sistema: Operacional

Tudo funcionando perfeitamente!`;

    case '/curriculo':
      return `📄 *Criação de Currículo*

Para criar um currículo profissional, acesse o painel web:
http://localhost:5173

Lá você pode:
✅ Escolher entre 6 templates
✅ Gerar com IA
✅ Adicionar foto
✅ Exportar para PDF

Em breve você poderá criar currículos direto pelo WhatsApp!`;

    case '/documento':
      return `📝 *Criação de Documentos*

Acesse o painel web para criar:
- Contratos de locação
- Declarações simples
- Propostas comerciais
- Recibos

URL: http://localhost:5173

Em breve disponível pelo WhatsApp!`;

    case '/imagem':
      if (!arg) {
        return '❌ Forneça uma descrição.\nExemplo: /imagem um gato astronauta no espaço';
      }
      // Gera imagem (retorna mensagem, a imagem será enviada depois)
      return 'generating_image:' + arg;

    case '/persona':
      return `🎭 *Personas Disponíveis:*

1. Gemini Pro - Assistente geral
2. ML Architect - Especialista em Machine Learning
3. Full Stack Architect - Arquitetura de software
4. DevOps Engineer - CI/CD e infraestrutura
5. Data Engineer - Pipelines de dados
6. Security Engineer - Segurança
7. Performance Engineer - Otimização
8. AI Researcher - Pesquisa em IA

Use: /persona [número ou nome]

Acesse o painel web para usar todas as personas:
http://localhost:5173`;

    default:
      return `❌ Comando desconhecido: ${cmd}

Use /help para ver comandos disponíveis.`;
  }
}

// ==================== MENSAGENS RECEBIDAS ====================

whatsappClient.on("message", async (msg) => {
  if (msg.fromMe) return;

  const chat = await msg.getChat();
  const contact = await msg.getContact();

  // Ignora grupos (opcional)
  if (chat.isGroup) return;

  console.log(`📨 Mensagem de ${contact.pushname}: ${msg.body}`);

  // Salvar contato no banco
  try {
    await db.saveContact({
      phoneNumber: msg.from,
      name: contact.pushname || contact.name || null,
      profilePicUrl: await contact.getProfilePicUrl().catch(() => null),
      isGroup: false
    });
  } catch (error) {
    console.error('Erro ao salvar contato:', error);
  }

  // Prepara dados da mensagem
  const messageData = {
    id: msg.id._serialized,
    from: msg.from,
    fromName: contact.pushname || contact.name || msg.from,
    body: msg.body,
    timestamp: msg.timestamp,
    hasMedia: msg.hasMedia,
    type: msg.type,
    isForwarded: msg.isForwarded
  };

  // Salvar mensagem recebida no banco
  try {
    await db.saveMessage({
      messageId: msg.id._serialized,
      sessionId: 'default',
      from: msg.from,
      to: whatsappClient.info?.wid?.user || 'me',
      type: msg.type,
      content: msg.body,
      timestamp: new Date(msg.timestamp * 1000).toISOString(),
      status: 'received',
      isFromMe: false
    });
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }

  // Se tem mídia (imagem, áudio, etc)
  if (msg.hasMedia) {
    try {
      const media = await msg.downloadMedia();
      messageData.media = {
        mimetype: media.mimetype,
        data: media.data,
        filename: media.filename
      };
    } catch (error) {
      console.error("Erro ao baixar mídia:", error);
    }
  }

  // Envia para o frontend (Studio)
  io.emit("whatsapp:message", messageData);

  // Processa mensagem com IA
  try {
    // Se tem imagem anexada
    if (messageData.media && messageData.media.mimetype.startsWith('image/')) {
      console.log('📸 Imagem recebida, processando...');

      // Se tem texto junto, analisa ou edita
      if (msg.body && msg.body.trim()) {
        const lowerBody = msg.body.toLowerCase();

        // Verifica se é pedido de edição
        if (lowerBody.includes('editar') || lowerBody.includes('modificar') || lowerBody.includes('mudar')) {
          await msg.reply('🎨 Editando sua imagem...');

          try {
            const editedImage = await editImage(
              messageData.media.data,
              messageData.media.mimetype,
              msg.body
            );

            const media = new MessageMedia(
              editedImage.mimeType,
              editedImage.data
            );

            await whatsappClient.sendMessage(msg.from, media, {
              caption: '✅ Imagem editada com sucesso!'
            });

            console.log(`✅ Imagem editada enviada para ${contact.pushname}`);
          } catch (error) {
            await msg.reply('❌ Erro ao editar imagem. Tente novamente.');
          }
        } else {
          // Analisa a imagem
          await msg.reply('🔍 Analisando sua imagem...');

          try {
            const analysis = await analyzeImage(
              messageData.media.data,
              messageData.media.mimetype,
              msg.body
            );

            await msg.reply(analysis);
            console.log(`✅ Análise enviada para ${contact.pushname}`);
          } catch (error) {
            await msg.reply('❌ Erro ao analisar imagem. Tente novamente.');
          }
        }
      } else {
        // Só imagem, sem texto - analisa
        await msg.reply('🔍 Analisando sua imagem...');

        try {
          const analysis = await analyzeImage(
            messageData.media.data,
            messageData.media.mimetype,
            'Descreva esta imagem em detalhes.'
          );

          await msg.reply(analysis);
          console.log(`✅ Análise enviada para ${contact.pushname}`);
        } catch (error) {
          await msg.reply('❌ Erro ao analisar imagem. Tente novamente.');
        }
      }

      return; // Não processa mais nada
    }

    // Processa mensagem de texto normal
    const response = await processMessageWithAI(
      msg.from,
      msg.body,
      messageData.media
    );

    // Verifica se é comando de geração de imagem
    if (response.startsWith('generating_image:')) {
      const prompt = response.replace('generating_image:', '');
      await msg.reply('🎨 Gerando sua imagem...\n\nIsso pode levar alguns segundos.');

      try {
        const generatedImage = await generateImage(prompt);

        const media = new MessageMedia(
          generatedImage.mimeType,
          generatedImage.data
        );

        await whatsappClient.sendMessage(msg.from, media, {
          caption: `✅ Imagem gerada!\n\nPrompt: ${prompt}`
        });

        console.log(`✅ Imagem gerada enviada para ${contact.pushname}`);
      } catch (error) {
        await msg.reply('❌ Erro ao gerar imagem. Tente novamente com outra descrição.');
      }
    } else {
      // Envia resposta normal
      await msg.reply(response);
      console.log(`✅ Resposta enviada para ${contact.pushname}`);
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    await msg.reply('Desculpe, ocorreu um erro. Tente novamente.');
  }
});

// ==================== API ENDPOINTS ====================

// Status do WhatsApp
app.get("/api/status", (req, res) => {
  res.json({
    ready: isWhatsAppReady,
    hasQR: !!qrCodeData,
    uptime: process.uptime()
  });
});

// Obter QR Code atual
app.get("/api/qr", (req, res) => {
  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else if (isWhatsAppReady) {
    res.json({ message: "WhatsApp já está conectado" });
  } else {
    res.status(404).json({ error: "QR Code não disponível" });
  }
});

// Enviar mensagem
app.post("/api/send", async (req, res) => {
  const { to, message, mediaBase64, mediaMimetype } = req.body;

  if (!isWhatsAppReady) {
    return res.status(503).json({ error: "WhatsApp não está pronto" });
  }

  try {
    // Formata número se necessário
    const chatId = to.includes("@c.us") ? to : `${to}@c.us`;

    let sentMessage;
    if (mediaBase64 && mediaMimetype) {
      // Envia com mídia
      const media = new MessageMedia(mediaMimetype, mediaBase64);
      sentMessage = await whatsappClient.sendMessage(chatId, media, { caption: message });
    } else {
      // Envia só texto
      sentMessage = await whatsappClient.sendMessage(chatId, message);
    }

    // Salvar mensagem enviada no banco
    try {
      await db.saveMessage({
        messageId: sentMessage.id._serialized,
        sessionId: 'default',
        from: whatsappClient.info?.wid?.user || 'me',
        to: to,
        type: mediaBase64 ? 'media' : 'text',
        content: message,
        mediaUrl: mediaBase64 ? 'base64' : null,
        mediaMimetype: mediaMimetype || null,
        timestamp: new Date().toISOString(),
        status: 'sent',
        isFromMe: true
      });
    } catch (dbError) {
      console.error('Erro ao salvar mensagem no banco:', dbError);
    }

    res.json({ success: true, message: "Mensagem enviada" });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar áudio (PTT - Push to Talk)
const fs = require('fs');
const path = require('path');
const os = require('os');

app.post("/api/send-audio", async (req, res) => {
  const { to, audioBase64 } = req.body;

  if (!isWhatsAppReady) {
    return res.status(503).json({ error: "WhatsApp não está pronto" });
  }

  try {
    console.log(`🎤 Enviando áudio para ${to}...`);
    
    // Formata número se necessário
    const chatId = to.includes("@c.us") ? to : `${to}@c.us`;

    // Remove prefixo data:audio/ogg se existir
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    
    console.log(`📦 Tamanho do áudio: ${(base64Data.length / 1024).toFixed(2)} KB (base64)`);

    // Cria MessageMedia sem sendAudioAsVoice (envia como arquivo de áudio normal)
    const media = new MessageMedia('audio/ogg', base64Data, 'audio.ogg');
    
    // Envia como arquivo de áudio normal (não PTT)
    const sentMessage = await whatsappClient.sendMessage(chatId, media);

    console.log(`✅ Áudio enviado com sucesso!`);

    // Salvar no banco
    try {
      await db.saveMessage({
        messageId: sentMessage.id._serialized,
        sessionId: 'default',
        from: whatsappClient.info?.wid?.user || 'me',
        to: to,
        type: 'audio',
        content: '[Áudio]',
        mediaMimetype: 'audio/ogg',
        timestamp: new Date().toISOString(),
        status: 'sent',
        isFromMe: true
      });
    } catch (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
    }

    res.json({ success: true, message: "Áudio enviado" });
  } catch (error) {
    console.error("❌ Erro ao enviar áudio:", error);
    res.status(500).json({ error: error.message });
  }
});

// Listar chats
app.get("/api/chats", async (req, res) => {
  if (!isWhatsAppReady) {
    return res.status(503).json({ error: "WhatsApp não está pronto" });
  }

  try {
    const chats = await whatsappClient.getChats();
    const chatList = await Promise.all(
      chats
        .filter(chat => !chat.isGroup) // Apenas conversas individuais
        .slice(0, 50) // Limita a 50
        .map(async (chat) => {
          const contact = await chat.getContact();
          const lastMessage = chat.lastMessage;

          return {
            id: chat.id._serialized,
            name: contact.pushname || contact.name || chat.name,
            lastMessage: lastMessage ? lastMessage.body : "",
            timestamp: lastMessage ? lastMessage.timestamp : 0,
            unreadCount: chat.unreadCount
          };
        })
    );

    res.json(chatList);
  } catch (error) {
    console.error("Erro ao listar chats:", error);
    res.status(500).json({ error: error.message });
  }
});

// Obter foto de perfil do contato
app.get("/api/profile-pic/:chatId", async (req, res) => {
  const { chatId } = req.params;

  if (!isWhatsAppReady) {
    return res.status(503).json({ error: "WhatsApp não está pronto" });
  }

  try {
    const contact = await whatsappClient.getContactById(chatId);
    const profilePicUrl = await contact.getProfilePicUrl();
    
    if (profilePicUrl) {
      res.json({ profilePicUrl });
    } else {
      res.status(404).json({ error: "Foto de perfil não disponível" });
    }
  } catch (error) {
    console.error("Erro ao obter foto de perfil:", error);
    res.status(404).json({ error: "Foto de perfil não disponível" });
  }
});

// Obter histórico de mensagens
app.get("/api/messages/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  if (!isWhatsAppReady) {
    return res.status(503).json({ error: "WhatsApp não está pronto" });
  }

  try {
    const chat = await whatsappClient.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit });

    // Processa mensagens e baixa mídia
    const messageList = await Promise.all(messages.map(async (msg) => {
      const messageData = {
        id: msg.id._serialized,
        body: msg.body,
        fromMe: msg.fromMe,
        timestamp: msg.timestamp,
        hasMedia: msg.hasMedia,
        type: msg.type,
        media: null
      };

      // Se tem mídia, baixa
      if (msg.hasMedia) {
        try {
          console.log(`📥 Baixando mídia da mensagem ${msg.id._serialized}...`);
          const media = await msg.downloadMedia();
          
          if (media) {
            messageData.media = {
              mimetype: media.mimetype,
              data: media.data,
              filename: media.filename
            };
            console.log(`✅ Mídia baixada: ${media.mimetype}`);
          }
        } catch (mediaError) {
          console.error(`❌ Erro ao baixar mídia:`, mediaError);
          // Continua sem a mídia
        }
      }

      return messageData;
    }));

    console.log(`✅ ${messageList.length} mensagens carregadas (${messageList.filter(m => m.hasMedia).length} com mídia)`);
    res.json(messageList);
  } catch (error) {
    console.error("Erro ao obter mensagens:", error);
    res.status(500).json({ error: error.message });
  }
});

// Desconectar WhatsApp
app.post("/api/disconnect", async (req, res) => {
  try {
    await whatsappClient.destroy();
    res.json({ success: true, message: "WhatsApp desconectado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SOCKET.IO EVENTS ====================

io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado ao Socket.IO");

  // Envia status atual
  socket.emit("whatsapp:status", {
    ready: isWhatsAppReady,
    hasQR: !!qrCodeData
  });

  // Se tem QR, envia
  if (qrCodeData) {
    socket.emit("whatsapp:qr", qrCodeData);
  }

  socket.on("disconnect", () => {
    console.log("🔌 Cliente desconectado");
  });
});

// ==================== INICIALIZAÇÃO ====================

// Inicia WhatsApp Client
console.log("🚀 Iniciando WhatsApp Client...");
// ==================== ENDPOINTS DE BANCO DE DADOS ====================

// Obter estatísticas
app.get("/api/stats", async (req, res) => {
  try {
    const stats = db.getStats('default');
    const sessions = db.getAllSessions();
    res.json({ stats, sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter mensagens do banco
app.get("/api/db/messages", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const messages = db.getMessages('default', limit, offset);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter mensagens por contato
app.get("/api/db/messages/:contact", async (req, res) => {
  try {
    const { contact } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const messages = db.getMessagesByContact('default', contact, limit);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter todos os contatos
app.get("/api/db/contacts", async (req, res) => {
  try {
    const contacts = db.getAllContacts();
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter logs de eventos
app.get("/api/db/logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const eventType = req.query.type || null;
    const logs = db.getEventLogs(limit, eventType);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar dados do banco
app.get("/api/db/export", async (req, res) => {
  try {
    const messages = db.getMessages('default', 10000, 0);
    const contacts = db.getAllContacts();
    const sessions = db.getAllSessions();
    const logs = db.getEventLogs(1000);
    const customers = db.getAllCustomers();
    
    res.json({
      exportedAt: new Date().toISOString(),
      messages,
      contacts,
      sessions,
      logs,
      customers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ENDPOINTS CRM ====================

// Obter todos os clientes
app.get("/api/crm/customers", async (req, res) => {
  try {
    const status = req.query.status || null;
    const customers = db.getAllCustomers(status);
    
    // Adicionar tags para cada cliente
    const customersWithTags = customers.map(customer => ({
      ...customer,
      tags: db.getCustomerTags(customer.phone_number)
    }));
    
    res.json({ customers: customersWithTags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter um cliente específico
app.get("/api/crm/customers/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const customer = db.getCustomer(phone);
    
    if (!customer) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    
    const tags = db.getCustomerTags(phone);
    const interactions = db.getCustomerInteractions(phone);
    
    res.json({ 
      customer: {
        ...customer,
        tags,
        interactions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar/Atualizar cliente
app.post("/api/crm/customers", async (req, res) => {
  try {
    const customerData = req.body;
    db.saveCustomer(customerData);
    
    res.json({ success: true, message: "Cliente salvo com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status do cliente
app.patch("/api/crm/customers/:phone/status", async (req, res) => {
  try {
    const { phone } = req.params;
    const { status } = req.body;
    
    db.updateCustomerStatus(phone, status);
    db.addCustomerInteraction(phone, 'status_change', `Status alterado para ${status}`);
    
    res.json({ success: true, message: "Status atualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar tag ao cliente
app.post("/api/crm/customers/:phone/tags", async (req, res) => {
  try {
    const { phone } = req.params;
    const { tag } = req.body;
    
    db.addCustomerTag(phone, tag);
    
    res.json({ success: true, message: "Tag adicionada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remover tag do cliente
app.delete("/api/crm/customers/:phone/tags/:tag", async (req, res) => {
  try {
    const { phone, tag } = req.params;
    
    db.removeCustomerTag(phone, tag);
    
    res.json({ success: true, message: "Tag removida" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adicionar interação
app.post("/api/crm/customers/:phone/interactions", async (req, res) => {
  try {
    const { phone } = req.params;
    const { type, description } = req.body;
    
    db.addCustomerInteraction(phone, type, description);
    
    res.json({ success: true, message: "Interação registrada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar clientes
app.get("/api/crm/search", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Parâmetro 'q' é obrigatório" });
    }
    
    const customers = db.searchCustomers(q);
    
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar cliente
app.delete("/api/crm/customers/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    
    db.deleteCustomer(phone);
    
    res.json({ success: true, message: "Cliente deletado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ENDPOINTS AGENTES IA ====================

// Obter todos os agentes
app.get("/api/agents", async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const agents = db.getAllAgents(activeOnly);
    
    // Adicionar estatísticas para cada agente
    const agentsWithStats = agents.map(agent => {
      const stats = db.getAgentStats(agent.id);
      return stats;
    });
    
    res.json({ agents: agentsWithStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter um agente específico
app.get("/api/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const agent = db.getAgentStats(id);
    
    if (!agent) {
      return res.status(404).json({ error: "Agente não encontrado" });
    }
    
    const conversations = db.getAgentConversations(id);
    
    res.json({ 
      agent: {
        ...agent,
        conversations
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar agente
app.post("/api/agents", async (req, res) => {
  try {
    const agentData = req.body;
    const result = db.saveAgent(agentData);
    
    res.json({ 
      success: true, 
      message: "Agente criado com sucesso",
      agentId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar agente
app.put("/api/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const agentData = req.body;
    
    db.updateAgent(id, agentData);
    
    res.json({ success: true, message: "Agente atualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle status do agente
app.patch("/api/agents/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    
    db.toggleAgentStatus(id);
    
    res.json({ success: true, message: "Status atualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar agente
app.delete("/api/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    db.deleteAgent(id);
    
    res.json({ success: true, message: "Agente deletado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar conversa com agente
app.post("/api/agents/:id/conversations", async (req, res) => {
  try {
    const { id } = req.params;
    const { customerPhone } = req.body;
    
    const result = db.startAgentConversation(id, customerPhone);
    
    res.json({ 
      success: true, 
      conversationId: result.lastInsertRowid 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finalizar conversa
app.patch("/api/agents/conversations/:conversationId/end", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { satisfactionRating, notes } = req.body;
    
    db.endAgentConversation(conversationId, satisfactionRating, notes);
    
    res.json({ success: true, message: "Conversa finalizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ENDPOINTS AUTOMAÇÕES ====================

// Obter todas as automações
app.get("/api/automations", async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const automations = db.getAllAutomations(activeOnly);
    
    // Adicionar estatísticas
    const automationsWithStats = automations.map(automation => {
      const stats = db.getAutomationStats(automation.id);
      return stats;
    });
    
    res.json({ automations: automationsWithStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter uma automação específica
app.get("/api/automations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const automation = db.getAutomationStats(id);
    
    if (!automation) {
      return res.status(404).json({ error: "Automação não encontrada" });
    }
    
    const logs = db.getAutomationLogs(id);
    
    res.json({ 
      automation: {
        ...automation,
        logs
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar automação
app.post("/api/automations", async (req, res) => {
  try {
    const automationData = req.body;
    const result = db.saveAutomation(automationData);
    
    res.json({ 
      success: true, 
      message: "Automação criada com sucesso",
      automationId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar automação
app.put("/api/automations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const automationData = req.body;
    
    db.updateAutomation(id, automationData);
    
    res.json({ success: true, message: "Automação atualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle status da automação
app.patch("/api/automations/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    
    db.toggleAutomationStatus(id);
    
    res.json({ success: true, message: "Status atualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar automação
app.delete("/api/automations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    db.deleteAutomation(id);
    
    res.json({ success: true, message: "Automação deletada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Executar automação manualmente
app.post("/api/automations/:id/execute", async (req, res) => {
  try {
    const { id } = req.params;
    const { customerPhone } = req.body;
    
    const automation = db.getAutomation(id);
    if (!automation) {
      return res.status(404).json({ error: "Automação não encontrada" });
    }
    
    // Executar ação
    await executeAutomationAction(automation, customerPhone);
    
    res.json({ success: true, message: "Automação executada" });
  } catch (error) {
    console.error('Erro ao executar automação:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ENGINE DE AUTOMAÇÕES ====================

async function executeAutomationAction(automation, customerPhone) {
  try {
    const chatId = customerPhone.includes("@c.us") ? customerPhone : `${customerPhone}@c.us`;
    
    switch (automation.action_type) {
      case 'send_message':
        await whatsappClient.sendMessage(chatId, automation.action_value);
        break;
        
      case 'send_image':
        // Implementar envio de imagem
        break;
        
      case 'add_tag':
        db.addCustomerTag(customerPhone, automation.action_value);
        break;
        
      case 'change_status':
        db.updateCustomerStatus(customerPhone, automation.action_value);
        break;
        
      default:
        throw new Error(`Tipo de ação desconhecido: ${automation.action_type}`);
    }
    
    db.logAutomationExecution(automation.id, customerPhone, true);
    console.log(`✅ Automação "${automation.name}" executada para ${customerPhone}`);
  } catch (error) {
    db.logAutomationExecution(automation.id, customerPhone, false, error.message);
    console.error(`❌ Erro ao executar automação "${automation.name}":`, error);
    throw error;
  }
}

// Verificar automações periodicamente
setInterval(() => {
  try {
    const timeBasedAutomations = db.getAutomationsByTrigger('time_based');
    timeBasedAutomations.forEach(automation => {
      // Implementar lógica de verificação de tempo
    });
  } catch (error) {
    console.error('Erro ao verificar automações:', error);
  }
}, 60000);

// ==================== ENDPOINTS VENDAS ====================

// Produtos
app.get("/api/products", (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const products = db.getAllProducts(activeOnly);
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/products", (req, res) => {
  try {
    const result = db.saveProduct(req.body);
    res.json({ success: true, productId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/products/:id", (req, res) => {
  try {
    db.updateProduct(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/products/:id", (req, res) => {
  try {
    db.deleteProduct(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vendas
app.get("/api/sales", (req, res) => {
  try {
    const status = req.query.status || null;
    const sales = db.getAllSales(status);
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/sales/stats", (req, res) => {
  try {
    const stats = db.getSalesStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/sales", (req, res) => {
  try {
    const { sale, items } = req.body;
    const result = db.createSale(sale);
    const saleId = result.lastInsertRowid;
    
    items.forEach(item => {
      db.addSaleItem(saleId, item.productId, item.quantity, item.price);
    });
    
    // Atualizar total gasto do cliente
    const customer = db.getCustomer(sale.customerPhone);
    if (customer) {
      db.saveCustomer({
        phoneNumber: sale.customerPhone,
        name: customer.name,
        email: customer.email,
        status: customer.status,
        totalSpent: (customer.total_spent || 0) + sale.total,
        notes: customer.notes
      });
    }
    
    res.json({ success: true, saleId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/sales/:id/status", (req, res) => {
  try {
    db.updateSaleStatus(req.params.id, req.body.status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROTAS DE EQUIPE ====================

// Obter todos os membros da equipe
app.get("/api/team/members", (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.department) filters.department = req.query.department;
    if (req.query.role) filters.role = req.query.role;
    
    const members = db.getAllTeamMembers(filters);
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter um membro específico
app.get("/api/team/members/:id", (req, res) => {
  try {
    const member = db.getTeamMember(req.params.id);
    if (!member) {
      return res.status(404).json({ error: "Membro não encontrado" });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar ou atualizar membro
app.post("/api/team/members", (req, res) => {
  try {
    const memberData = req.body;
    
    // Verificar se já existe por email
    const existing = db.getTeamMemberByEmail(memberData.email);
    
    if (existing) {
      // Atualizar
      db.updateTeamMember(existing.id, memberData);
      res.json({ success: true, id: existing.id, updated: true });
    } else {
      // Criar novo
      const result = db.saveTeamMember(memberData);
      res.json({ success: true, id: result.lastInsertRowid, updated: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar membro
app.put("/api/team/members/:id", (req, res) => {
  try {
    db.updateTeamMember(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar membro
app.delete("/api/team/members/:id", (req, res) => {
  try {
    db.deleteTeamMember(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter estatísticas da equipe
app.get("/api/team/stats", (req, res) => {
  try {
    const stats = db.getTeamStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter performance da equipe
app.get("/api/team/performance", (req, res) => {
  try {
    const filters = {};
    if (req.query.member_id) filters.member_id = req.query.member_id;
    if (req.query.month) filters.month = req.query.month;
    
    const performance = db.getAllTeamPerformance(filters);
    res.json({ performance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Salvar performance
app.post("/api/team/performance", (req, res) => {
  try {
    db.saveTeamPerformance(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROTAS DE IMAGEM COM IA ====================

// Editar imagem com Gemini
app.post("/api/gemini/edit-image", async (req, res) => {
  try {
    const { image, prompt, model } = req.body;
    
    // Aqui você integraria com a API do Gemini
    // Por enquanto, retorna a imagem original
    res.json({ 
      success: true, 
      editedImage: image,
      message: "Edição de imagem com IA (implementar integração com Gemini)"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gerar imagem com Imagen
app.post("/api/gemini/generate-image", async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    // Aqui você integraria com a API do Imagen
    res.json({ 
      success: true, 
      image: "data:image/png;base64,...",
      message: "Geração de imagem com IA (implementar integração com Imagen)"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gerar dados de exemplo para equipe
app.post("/api/team/generate-sample-data", (req, res) => {
  try {
    // Dados de exemplo
    const sampleMembers = [
      {
        name: 'João Silva',
        email: 'joao.silva@empresa.com',
        phone: '(11) 98765-4321',
        role: 'Gerente de Vendas',
        department: 'Vendas',
        permissions: ['Visualizar CRM', 'Editar Clientes', 'Criar Vendas', 'Aprovar Descontos', 'Gerenciar Equipe', 'Relatórios Avançados'],
        commission_rate: 3,
        monthly_goal: 50000,
        status: 'active',
        hire_date: '2023-01-15'
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@empresa.com',
        phone: '(11) 98765-4322',
        role: 'Vendedor',
        department: 'Vendas',
        permissions: ['Visualizar CRM', 'Criar Vendas'],
        commission_rate: 5,
        monthly_goal: 20000,
        status: 'active',
        hire_date: '2023-03-20'
      },
      {
        name: 'Pedro Costa',
        email: 'pedro.costa@empresa.com',
        phone: '(11) 98765-4323',
        role: 'Vendedor',
        department: 'Vendas',
        permissions: ['Visualizar CRM', 'Criar Vendas'],
        commission_rate: 5,
        monthly_goal: 18000,
        status: 'active',
        hire_date: '2023-05-10'
      }
    ];
    
    const memberIds = [];
    sampleMembers.forEach(member => {
      const result = db.saveTeamMember(member);
      memberIds.push(result.lastInsertRowid);
    });
    
    // Gerar performance dos últimos 3 meses
    const months = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }
    
    memberIds.forEach(memberId => {
      const member = db.getTeamMember(memberId);
      months.forEach(month => {
        const goalCompletion = 70 + Math.random() * 50; // 70-120%
        const revenue = (member.monthly_goal * goalCompletion) / 100;
        const salesCount = Math.floor(revenue / 500);
        const commission = (revenue * member.commission_rate) / 100;
        const rating = goalCompletion >= 100 ? 5 : goalCompletion >= 80 ? 4 : 3;
        
        db.saveTeamPerformance({
          member_id: memberId,
          month: month,
          sales_count: salesCount,
          revenue: revenue,
          commission: commission,
          goal_completion: goalCompletion,
          rating: rating,
          notes: goalCompletion >= 100 ? 'Ótimo desempenho!' : 'Bom desempenho'
        });
      });
    });
    
    res.json({ success: true, membersCreated: memberIds.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

whatsappClient.initialize();

// Inicia servidor
server.listen(PORT, () => {
  console.log(`✅ WhatsApp Bridge rodando na porta ${PORT}`);
  console.log(`📡 Studio URL: ${STUDIO_URL}`);
  console.log(`💾 Banco de dados SQLite inicializado`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️ Encerrando WhatsApp Bridge...");
  await whatsappClient.destroy();
  process.exit(0);
});
