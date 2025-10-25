/**
 * 🎭 SPECIALIST ORCHESTRATOR SERVICE
 * 
 * Sistema de orquestração de múltiplos agentes especializados
 * usando Function Calling do Gemini.
 * 
 * Inspirado no sistema de currículos com comitê de especialistas.
 */

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Persona } from '../types';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// ==================== SPECIALIST DEFINITIONS ====================

export interface Specialist {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  systemPrompt: string;
}

export const SPECIALISTS: Record<string, Specialist> = {
  codeWriter: {
    id: 'code-writer',
    name: 'Code Writer',
    role: 'Especialista em Escrita de Código',
    expertise: ['código limpo', 'best practices', 'otimização', 'documentação'],
    systemPrompt: `Você é um Code Writer especialista. Sua função é:
- Escrever código limpo, eficiente e bem documentado
- Seguir best practices da linguagem
- Adicionar comentários explicativos
- Considerar edge cases
- Otimizar para legibilidade e manutenibilidade

SEMPRE forneça código funcional e testável.`
  },

  codeReviewer: {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    role: 'Revisor de Código Sênior',
    expertise: ['code review', 'qualidade', 'segurança', 'performance'],
    systemPrompt: `Você é um Code Reviewer sênior. Sua função é:
- Identificar problemas de qualidade
- Sugerir melhorias de performance
- Detectar vulnerabilidades de segurança
- Verificar conformidade com padrões
- Ser construtivo nas críticas

Forneça feedback acionável e específico.`
  },

  architect: {
    id: 'architect',
    name: 'Software Architect',
    role: 'Arquiteto de Software',
    expertise: ['arquitetura', 'design patterns', 'escalabilidade', 'integrações'],
    systemPrompt: `Você é um Software Architect. Sua função é:
- Projetar arquiteturas escaláveis
- Sugerir design patterns apropriados
- Considerar trade-offs técnicos
- Planejar integrações
- Pensar em longo prazo

Forneça visão estratégica e decisões arquiteturais fundamentadas.`
  },

  tester: {
    id: 'tester',
    name: 'QA Engineer',
    role: 'Engenheiro de Qualidade',
    expertise: ['testes', 'qa', 'automação', 'edge cases'],
    systemPrompt: `Você é um QA Engineer especialista. Sua função é:
- Criar casos de teste abrangentes
- Identificar edge cases
- Sugerir estratégias de teste
- Pensar em cenários de falha
- Garantir cobertura de testes

Seja meticuloso e pense em todos os cenários possíveis.`
  },

  documentWriter: {
    id: 'doc-writer',
    name: 'Technical Writer',
    role: 'Redator Técnico',
    expertise: ['documentação', 'tutoriais', 'explicações', 'clareza'],
    systemPrompt: `Você é um Technical Writer. Sua função é:
- Escrever documentação clara e concisa
- Criar tutoriais passo a passo
- Explicar conceitos complexos de forma simples
- Organizar informações logicamente
- Considerar diferentes níveis de conhecimento

Priorize clareza e utilidade.`
  }
};

// ==================== FUNCTION DECLARATIONS ====================

const consultSpecialistTool: FunctionDeclaration = {
  name: 'consult_specialist',
  description: 'Consulta um especialista específico para obter ajuda especializada',
  parameters: {
    type: Type.OBJECT,
    properties: {
      specialist_id: {
        type: Type.STRING,
        description: 'ID do especialista a consultar',
        enum: ['code-writer', 'code-reviewer', 'architect', 'tester', 'doc-writer']
      },
      question: {
        type: Type.STRING,
        description: 'Pergunta ou tarefa para o especialista'
      },
      context: {
        type: Type.STRING,
        description: 'Contexto adicional relevante'
      }
    },
    required: ['specialist_id', 'question']
  }
};

const collaborateSpecialistsTool: FunctionDeclaration = {
  name: 'collaborate_specialists',
  description: 'Faz múltiplos especialistas colaborarem em uma tarefa complexa',
  parameters: {
    type: Type.OBJECT,
    properties: {
      specialist_ids: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'IDs dos especialistas que devem colaborar'
      },
      task: {
        type: Type.STRING,
        description: 'Tarefa complexa que requer colaboração'
      }
    },
    required: ['specialist_ids', 'task']
  }
};

// ==================== ORCHESTRATOR ====================

export interface OrchestrationResult {
  action: 'specialist_response' | 'collaboration' | 'direct_answer';
  data: {
    response: string;
    specialist?: string;
    specialists?: string[];
    confidence?: number;
  };
}

/**
 * Orquestra consulta a especialistas
 */
export async function orchestrateSpecialists(
  userMessage: string,
  context?: string
): Promise<OrchestrationResult> {
  const tools = [{
    functionDeclarations: [consultSpecialistTool, collaborateSpecialistsTool]
  }];

  try {
    const prompt = `Você é um Orchestrator de Especialistas. Analise a mensagem do usuário e decida:

1. Se precisa consultar UM especialista específico
2. Se precisa de COLABORAÇÃO entre múltiplos especialistas
3. Se pode responder diretamente

**MENSAGEM DO USUÁRIO:**
${userMessage}

${context ? `**CONTEXTO:**\n${context}` : ''}

**ESPECIALISTAS DISPONÍVEIS:**
- code-writer: Escreve código limpo e eficiente
- code-reviewer: Revisa código e sugere melhorias
- architect: Projeta arquiteturas e design patterns
- tester: Cria testes e identifica edge cases
- doc-writer: Escreve documentação clara

**REGRAS:**
- Use code-writer para criar código novo
- Use code-reviewer para revisar código existente
- Use architect para decisões de arquitetura
- Use tester para estratégias de teste
- Use doc-writer para documentação
- Use collaborate_specialists para tarefas que precisam de múltiplas perspectivas`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools }
    });

    const functionCall = response.functionCalls?.[0];

    if (functionCall) {
      switch (functionCall.name) {
        case 'consult_specialist':
          return await consultSpecialist(
            functionCall.args.specialist_id,
            functionCall.args.question,
            functionCall.args.context
          );

        case 'collaborate_specialists':
          return await collaborateSpecialists(
            functionCall.args.specialist_ids,
            functionCall.args.task
          );
      }
    }

    // Resposta direta
    return {
      action: 'direct_answer',
      data: {
        response: response.text || 'Como posso ajudar?'
      }
    };

  } catch (error) {
    console.error('Error in orchestrator:', error);
    return {
      action: 'direct_answer',
      data: {
        response: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
      }
    };
  }
}

/**
 * Consulta um especialista específico
 */
async function consultSpecialist(
  specialistId: string,
  question: string,
  context?: string
): Promise<OrchestrationResult> {
  const specialist = SPECIALISTS[specialistId];

  if (!specialist) {
    return {
      action: 'direct_answer',
      data: {
        response: 'Especialista não encontrado.'
      }
    };
  }

  try {
    const prompt = `${specialist.systemPrompt}

**PERGUNTA/TAREFA:**
${question}

${context ? `**CONTEXTO:**\n${context}` : ''}

Forneça sua resposta especializada.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return {
      action: 'specialist_response',
      data: {
        response: response.text || 'Sem resposta',
        specialist: specialist.name,
        confidence: 90
      }
    };

  } catch (error) {
    console.error(`Error consulting specialist ${specialistId}:`, error);
    return {
      action: 'direct_answer',
      data: {
        response: 'Erro ao consultar especialista.'
      }
    };
  }
}

/**
 * Faz múltiplos especialistas colaborarem
 */
async function collaborateSpecialists(
  specialistIds: string[],
  task: string
): Promise<OrchestrationResult> {
  const specialists = specialistIds
    .map(id => SPECIALISTS[id])
    .filter(Boolean);

  if (specialists.length === 0) {
    return {
      action: 'direct_answer',
      data: {
        response: 'Nenhum especialista válido encontrado.'
      }
    };
  }

  try {
    // Cada especialista fornece sua perspectiva
    const perspectives = await Promise.all(
      specialists.map(async (specialist) => {
        const prompt = `${specialist.systemPrompt}

**TAREFA COLABORATIVA:**
${task}

Forneça sua perspectiva como ${specialist.role}.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        return {
          specialist: specialist.name,
          perspective: response.text || ''
        };
      })
    );

    // Sintetiza as perspectivas
    const synthesis = await synthesizePerspectives(perspectives, task);

    return {
      action: 'collaboration',
      data: {
        response: synthesis,
        specialists: specialists.map(s => s.name),
        confidence: 95
      }
    };

  } catch (error) {
    console.error('Error in collaboration:', error);
    return {
      action: 'direct_answer',
      data: {
        response: 'Erro na colaboração entre especialistas.'
      }
    };
  }
}

/**
 * Sintetiza múltiplas perspectivas em uma resposta coesa
 */
async function synthesizePerspectives(
  perspectives: Array<{ specialist: string; perspective: string }>,
  task: string
): Promise<string> {
  const prompt = `Você é um Synthesizer. Sua tarefa é combinar as perspectivas de múltiplos especialistas em uma resposta coesa e acionável.

**TAREFA ORIGINAL:**
${task}

**PERSPECTIVAS DOS ESPECIALISTAS:**
${perspectives.map(p => `\n**${p.specialist}:**\n${p.perspective}`).join('\n\n')}

Sintetize essas perspectivas em uma resposta unificada que:
1. Integre os melhores insights de cada especialista
2. Resolva conflitos ou contradições
3. Forneça uma recomendação clara
4. Seja acionável e prática`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return response.text || 'Não foi possível sintetizar as perspectivas.';
  } catch (error) {
    console.error('Error synthesizing:', error);
    return perspectives.map(p => `**${p.specialist}:**\n${p.perspective}`).join('\n\n');
  }
}

/**
 * Lista todos os especialistas disponíveis
 */
export function listSpecialists() {
  return Object.values(SPECIALISTS).map(s => ({
    id: s.id,
    name: s.name,
    role: s.role,
    expertise: s.expertise
  }));
}

export default {
  orchestrateSpecialists,
  consultSpecialist,
  listSpecialists,
  SPECIALISTS
};
