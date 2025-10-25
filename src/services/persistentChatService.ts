/**
 * 💬 PERSISTENT CHAT SERVICE
 * 
 * Mantém sessões de chat com contexto persistente e
 * schemas estruturados para respostas especializadas.
 */

import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Persona } from '../types';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Cache de sessões de chat ativas
const activeSessions = new Map<string, Chat>();

/**
 * Schema para respostas estruturadas de chat
 */
const structuredChatSchema = {
  type: Type.OBJECT,
  properties: {
    response: {
      type: Type.STRING,
      description: "A resposta principal"
    },
    codeBlocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          language: { type: Type.STRING },
          code: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      },
      description: "Blocos de código na resposta",
      nullable: true
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Sugestões de próximas perguntas",
      nullable: true
    },
    resources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      },
      description: "Recursos e links úteis",
      nullable: true
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        confidence: { type: Type.NUMBER },
        complexity: { type: Type.STRING },
        estimatedReadTime: { type: Type.STRING }
      },
      nullable: true
    }
  },
  required: ["response"]
};

export interface StructuredChatResponse {
  response: string;
  codeBlocks?: Array<{
    language: string;
    code: string;
    explanation: string;
  }>;
  suggestions?: string[];
  resources?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  metadata?: {
    confidence: number;
    complexity: string;
    estimatedReadTime: string;
  };
}

/**
 * Cria ou recupera uma sessão de chat persistente
 */
export function getOrCreateChatSession(
  sessionId: string,
  persona: Persona,
  useStructuredResponse: boolean = false
): Chat {
  // Verificar se já existe uma sessão ativa
  if (activeSessions.has(sessionId)) {
    return activeSessions.get(sessionId)!;
  }

  // Criar nova sessão
  const config: any = {
    systemInstruction: persona.prompt,
    temperature: 0.7,
  };

  // Adicionar schema estruturado se solicitado
  if (useStructuredResponse) {
    config.responseMimeType = "application/json";
    config.responseSchema = structuredChatSchema;
  }

  const session = ai.chats.create({
    model: 'gemini-2.5-flash',
    config
  });

  // Armazenar no cache
  activeSessions.set(sessionId, session);

  return session;
}

/**
 * Envia mensagem em uma sessão de chat persistente
 */
export async function sendMessageInSession(
  sessionId: string,
  message: string,
  persona: Persona,
  useStructuredResponse: boolean = false
): Promise<string | StructuredChatResponse> {
  try {
    const session = getOrCreateChatSession(sessionId, persona, useStructuredResponse);
    
    const response = await session.sendMessage({ message });
    
    if (useStructuredResponse) {
      return JSON.parse(response.text || '{}') as StructuredChatResponse;
    }
    
    return response.text || '';
  } catch (error) {
    console.error('Error sending message in session:', error);
    throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Limpa uma sessão de chat
 */
export function clearChatSession(sessionId: string): void {
  activeSessions.delete(sessionId);
}

/**
 * Limpa todas as sessões de chat
 */
export function clearAllChatSessions(): void {
  activeSessions.clear();
}

/**
 * Lista todas as sessões ativas
 */
export function getActiveSessions(): string[] {
  return Array.from(activeSessions.keys());
}

/**
 * Cria uma sessão de chat especializada para código
 */
export async function createCodeChatSession(
  sessionId: string,
  language: string,
  context?: string
): Promise<Chat> {
  const codePersona: Persona = {
    id: 'code-chat',
    name: 'Code Assistant',
    icon: 'fa-code',
    prompt: `You are an expert ${language} developer. ${context || ''}

**YOUR ROLE:**
- Help with ${language} code
- Explain concepts clearly
- Provide working examples
- Suggest best practices
- Debug issues
- Optimize code

**RESPONSE STYLE:**
- Be concise but thorough
- Always provide code examples
- Explain the "why" not just the "how"
- Suggest improvements
- Consider edge cases

**CODE QUALITY:**
- Write production-ready code
- Include error handling
- Add helpful comments
- Follow ${language} conventions
- Consider performance`
  };

  return getOrCreateChatSession(sessionId, codePersona, true);
}

/**
 * Cria uma sessão de chat especializada para debugging
 */
export async function createDebugChatSession(
  sessionId: string,
  errorContext: string
): Promise<Chat> {
  const debugPersona: Persona = {
    id: 'debug-chat',
    name: 'Debug Assistant',
    icon: 'fa-bug',
    prompt: `You are an expert debugger helping to solve this issue:

${errorContext}

**YOUR APPROACH:**
1. Analyze the error carefully
2. Identify root cause
3. Suggest fixes
4. Explain why it happened
5. Prevent future occurrences

**DEBUGGING STEPS:**
- Ask clarifying questions if needed
- Provide step-by-step debugging process
- Suggest tools and techniques
- Explain error messages
- Offer multiple solutions

**RESPONSE FORMAT:**
- Clear problem identification
- Root cause analysis
- Concrete solutions
- Prevention strategies
- Testing recommendations`
  };

  return getOrCreateChatSession(sessionId, debugPersona, true);
}

/**
 * Cria uma sessão de chat especializada para arquitetura
 */
export async function createArchitectureChatSession(
  sessionId: string,
  projectContext: string
): Promise<Chat> {
  const architectPersona: Persona = {
    id: 'architecture-chat',
    name: 'Architecture Assistant',
    icon: 'fa-building',
    prompt: `You are a senior software architect helping with:

${projectContext}

**YOUR EXPERTISE:**
- System design
- Architecture patterns
- Scalability
- Performance
- Security
- Best practices

**APPROACH:**
1. Understand requirements
2. Propose architecture
3. Explain trade-offs
4. Consider alternatives
5. Plan implementation

**DELIVERABLES:**
- Architecture diagrams (described)
- Component breakdown
- Technology recommendations
- Implementation roadmap
- Risk assessment`
  };

  return getOrCreateChatSession(sessionId, architectPersona, true);
}

/**
 * Exporta histórico de uma sessão
 */
export async function exportSessionHistory(
  sessionId: string
): Promise<{
  sessionId: string;
  messageCount: number;
  exportedAt: string;
}> {
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Note: O Google GenAI SDK não expõe o histórico diretamente
  // Esta é uma implementação placeholder
  return {
    sessionId,
    messageCount: 0, // Seria obtido do histórico real
    exportedAt: new Date().toISOString()
  };
}

/**
 * Cria uma sessão multi-turn para tarefas complexas
 */
export async function createMultiTurnSession(
  sessionId: string,
  task: string,
  steps: string[]
): Promise<{
  session: Chat;
  currentStep: number;
  totalSteps: number;
}> {
  const multiTurnPersona: Persona = {
    id: 'multi-turn',
    name: 'Multi-Turn Assistant',
    icon: 'fa-tasks',
    prompt: `You are helping with a multi-step task:

**Task:** ${task}

**Steps:**
${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**YOUR ROLE:**
- Guide through each step
- Provide clear instructions
- Check understanding
- Offer help when stuck
- Celebrate progress

**APPROACH:**
- One step at a time
- Clear explanations
- Practical examples
- Encourage questions
- Build confidence`
  };

  const session = getOrCreateChatSession(sessionId, multiTurnPersona, true);

  return {
    session,
    currentStep: 0,
    totalSteps: steps.length
  };
}

export default {
  getOrCreateChatSession,
  sendMessageInSession,
  clearChatSession,
  clearAllChatSessions,
  getActiveSessions,
  createCodeChatSession,
  createDebugChatSession,
  createArchitectureChatSession,
  exportSessionHistory,
  createMultiTurnSession
};
