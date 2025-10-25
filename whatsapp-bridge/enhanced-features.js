/**
 * 🚀 FUNCIONALIDADES AVANÇADAS DO SISTEMA
 * 
 * Integração completa das funcionalidades do Gemini Pro Studio no WhatsApp
 */

// ==================== PERSONAS ESPECIALIZADAS ====================

const PERSONAS = {
  'gemini': {
    id: 'gemini',
    name: 'Gemini Pro',
    emoji: '🤖',
    prompt: 'Você é um assistente geral inteligente e prestativo. Responda de forma clara e útil.'
  },
  'ml': {
    id: 'ml',
    name: 'ML Architect',
    emoji: '🧠',
    prompt: `Você é um Arquiteto de Machine Learning sênior com expertise em:
- Arquiteturas de redes neurais (CNN, RNN, Transformers)
- Deep Learning (TensorFlow, PyTorch)
- MLOps e deployment
- Computer Vision e NLP

Forneça respostas técnicas, práticas e com exemplos de código quando relevante.`
  },
  'fullstack': {
    id: 'fullstack',
    name: 'Full Stack Architect',
    emoji: '🏗️',
    prompt: `Você é um Arquiteto Full Stack sênior com expertise em:
- Frontend (React, Vue, Next.js)
- Backend (Node.js, Python, APIs)
- Databases (SQL, NoSQL)
- Arquitetura escalável

Forneça código limpo, best practices e soluções arquiteturais.`
  },
  'devops': {
    id: 'devops',
    name: 'DevOps Engineer',
    emoji: '🚀',
    prompt: `Você é um Engenheiro DevOps sênior com expertise em:
- CI/CD (GitHub Actions, GitLab CI)
- Containerização (Docker, Kubernetes)
- Infrastructure as Code (Terraform)
- Cloud (AWS, Azure, GCP)

Forneça soluções práticas de infraestrutura e automação.`
  },
  'security': {
    id: 'security',
    name: 'Security Engineer',
    emoji: '🔒',
    prompt: `Você é um Engenheiro de Segurança sênior com expertise em:
- Application security (OWASP Top 10)
- Criptografia e autenticação
- Penetration testing
- Security best practices

Identifique vulnerabilidades e sugira correções detalhadas.`
  },
  'data': {
    id: 'data',
    name: 'Data Engineer',
    emoji: '📊',
    prompt: `Você é um Engenheiro de Dados sênior com expertise em:
- Pipelines ETL/ELT
- Data warehousing (Snowflake, BigQuery)
- Stream processing (Kafka, Spark)
- SQL e otimização de queries

Forneça soluções de dados escaláveis e eficientes.`
  },
  'code-reviewer': {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    emoji: '👁️',
    prompt: `Você é um Code Reviewer sênior com expertise em:
- Code quality e best practices
- Design patterns
- Performance e security
- Refactoring

Analise código criticamente mas construtivamente. Sugira melhorias específicas.`
  }
};

// ==================== ESTADO DOS USUÁRIOS ====================

const userStates = new Map();

function getUserState(userId) {
  if (!userStates.has(userId)) {
    userStates.set(userId, {
      persona: 'gemini',
      thinkingMode: false,
      documentSession: null,
      codeAnalysisMode: false,
      awaitingCode: false
    });
  }
  return userStates.get(userId);
}

// ==================== COMANDOS AVANÇADOS ====================

function getHelpMessage() {
  return `📱 *Gemini Pro Studio - WhatsApp*

🤖 *IA & Conversas:*
/help - Mostra esta mensagem
/status - Status do sistema
/persona [nome] - Muda especialista
/thinking - Ativa raciocínio profundo
/reset - Limpa histórico

🎨 *Imagens:*
/imagem [descrição] - Gera imagem
• Envie foto para analisar
• Envie foto + "editar:" para editar

📄 *Documentos & Código:*
/curriculo - Cria currículo
/codigo - Analisa código
/review - Revisa código

🎭 *Personas Disponíveis:*
• gemini 🤖 - Assistente geral
• ml 🧠 - Machine Learning
• fullstack 🏗️ - Full Stack
• devops 🚀 - DevOps
• security 🔒 - Segurança
• data 📊 - Engenharia de Dados
• code-reviewer 👁️ - Code Review

💡 *Exemplos:*
/persona ml
Como treinar uma rede neural?

/thinking
Explique arquitetura de microserviços

/codigo
[Cole seu código]

gera uma imagem de um gato astronauta

💬 *Dica:* Converse naturalmente!`;
}

function getStatusMessage(userId) {
  const userState = getUserState(userId);
  const persona = PERSONAS[userState.persona];
  const historySize = require('./server').conversationHistory.get(userId)?.length || 0;

  return `📊 *Status do Sistema*

${persona.emoji} *Persona Ativa:* ${persona.name}
🧠 *Modo Thinking:* ${userState.thinkingMode ? 'Ativado' : 'Desativado'}
💬 *Mensagens no histórico:* ${historySize}
📝 *Sessão de documento:* ${userState.documentSession ? 'Ativa' : 'Nenhuma'}
👁️ *Análise de código:* ${userState.codeAnalysisMode ? 'Ativa' : 'Desativada'}

✅ *WhatsApp:* Conectado
🤖 *IA:* Gemini 2.0 Flash Exp (Grátis!)
🚀 *Sistema:* Operacional

Tudo funcionando perfeitamente!`;
}

function handlePersonaCommand(userId, arg) {
  const userState = getUserState(userId);

  if (!arg) {
    const list = Object.values(PERSONAS)
      .map(p => `${p.emoji} *${p.id}* - ${p.name}`)
      .join('\n');

    return `🎭 *Persona Atual:* ${PERSONAS[userState.persona].emoji} ${PERSONAS[userState.persona].name}

*Personas Disponíveis:*
${list}

Use: /persona [id]
Exemplo: /persona ml`;
  }

  const personaId = arg.toLowerCase().trim();

  if (PERSONAS[personaId]) {
    userState.persona = personaId;
    const persona = PERSONAS[personaId];

    return `✅ *Persona alterada!*

${persona.emoji} *${persona.name}*

Agora estou especializado nesta área. Pode fazer suas perguntas!`;
  }

  return `❌ Persona não encontrada: "${arg}"

Use /persona para ver a lista completa.`;
}

function handleThinkingCommand(userId) {
  const userState = getUserState(userId);
  userState.thinkingMode = !userState.thinkingMode;

  if (userState.thinkingMode) {
    return `🧠 *Modo Thinking ATIVADO!*

Agora vou mostrar meu raciocínio passo a passo antes de responder.

Isso me ajuda a:
• Pensar mais profundamente
• Explicar meu processo
• Dar respostas mais completas

Faça sua pergunta complexa!`;
  } else {
    return `💬 *Modo Thinking DESATIVADO*

Voltei ao modo de resposta normal.

Use /thinking novamente para reativar.`;
  }
}

function handleResetCommand(userId) {
  const conversationHistory = require('./server').conversationHistory;
  conversationHistory.delete(userId);
  userStates.delete(userId);

  return `🔄 *Histórico Limpo!*

Conversa resetada. Começando do zero!

Use /status para ver o estado atual.`;
}

function handleCodeCommand(userId) {
  const userState = getUserState(userId);
  userState.codeAnalysisMode = true;
  userState.awaitingCode = true;

  return `👨‍💻 *Modo Análise de Código ATIVADO*

Agora envie seu código que eu vou analisar:

✅ Qualidade do código
✅ Best practices
✅ Possíveis bugs
✅ Sugestões de melhoria
✅ Performance
✅ Segurança

Pode enviar o código agora!`;
}

function handleReviewCommand(userId) {
  const userState = getUserState(userId);
  userState.persona = 'code-reviewer';
  userState.awaitingCode = true;

  return `👁️ *Code Review Mode ATIVADO*

${PERSONAS['code-reviewer'].emoji} Agora sou um Code Reviewer sênior.

Envie seu código que vou fazer uma revisão completa:

✅ Arquitetura
✅ Design patterns
✅ Qualidade
✅ Segurança
✅ Performance
✅ Testabilidade

Aguardando seu código...`;
}

function handleCurriculoCommand() {
  return `📄 *Criação de Currículo*

Para criar um currículo profissional completo, acesse:
🌐 http://localhost:5173

No painel web você pode:
✅ Escolher entre 6 templates profissionais
✅ Gerar conteúdo com IA
✅ Adicionar e editar foto
✅ Personalizar cores
✅ Exportar para PDF

🚀 *Em breve:* Criação de currículos direto pelo WhatsApp!

Por enquanto, use o painel web para melhor experiência.`;
}

// ==================== PROCESSAMENTO AVANÇADO ====================

async function processWithPersona(userId, message, genAI) {
  const userState = getUserState(userId);
  const persona = PERSONAS[userState.persona];
  const conversationHistory = require('./server').conversationHistory;

  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }

  const history = conversationHistory.get(userId);

  try {
    let systemPrompt = persona.prompt;

    if (userState.thinkingMode) {
      systemPrompt += `\n\n**MODO THINKING ATIVADO**: Antes de responder, mostre seu raciocínio em uma seção "## 🧠 Pensamento". Explique passo a passo como você está pensando no problema.`;
    }

    const prompt = `${systemPrompt}

**HISTÓRICO DA CONVERSA:**
${history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')}

**MENSAGEM ATUAL DO USUÁRIO:**
${message}

Responda de forma especializada e útil.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const response = result.text || 'Desculpe, não consegui processar sua mensagem.';

    // Atualiza histórico
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });

    // Limita histórico
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    return response;
  } catch (error) {
    console.error('Erro ao processar com persona:', error);
    return 'Desculpe, ocorreu um erro. Tente novamente.';
  }
}

async function analyzeCode(code, genAI) {
  try {
    const prompt = `Você é um Code Reviewer sênior. Analise este código:

\`\`\`
${code}
\`\`\`

Forneça uma análise completa:

## 📊 Qualidade Geral
[Nota de 0-10 e justificativa]

## ✅ Pontos Positivos
[Liste o que está bom]

## ⚠️ Problemas Encontrados
[Liste problemas, bugs, vulnerabilidades]

## 💡 Sugestões de Melhoria
[Sugestões específicas e práticas]

## 🔒 Segurança
[Análise de segurança]

## ⚡ Performance
[Análise de performance]

## 🧪 Testabilidade
[Como melhorar testes]

Seja específico e construtivo!`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    return result.text || 'Não consegui analisar o código.';
  } catch (error) {
    console.error('Erro ao analisar código:', error);
    throw error;
  }
}

// ==================== EXPORTS ====================

module.exports = {
  PERSONAS,
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
};
