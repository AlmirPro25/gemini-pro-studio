/**
 * 📄 DOCUMENT GENERATOR SERVICE
 * 
 * Sistema de geração de documentos profissionais usando
 * Function Calling e múltiplos agentes especializados.
 * 
 * Inspirado no sistema de currículos IA.
 */

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// ==================== TEMPLATES ====================

export const DOCUMENT_TEMPLATES = {
  // Contratos
  rentalContract: {
    name: 'Contrato de Locação',
    category: 'Contratos',
    description: 'Contrato de aluguel residencial ou comercial',
    template: `<div class="font-sans bg-white p-10 text-gray-800" style="min-height: 297mm; width: 210mm;">
      <h1 class="text-2xl font-bold text-center mb-8 uppercase">Contrato de Locação de Imóvel</h1>
      
      <h2 class="text-lg font-bold mt-6 mb-2">IDENTIFICAÇÃO DAS PARTES</h2>
      <p class="mb-4"><strong>LOCADOR:</strong> {{NOME_LOCADOR}}, CPF: {{CPF_LOCADOR}}</p>
      <p class="mb-4"><strong>LOCATÁRIO:</strong> {{NOME_LOCATARIO}}, CPF: {{CPF_LOCATARIO}}</p>
      
      <h2 class="text-lg font-bold mt-6 mb-2">OBJETO DA LOCAÇÃO</h2>
      <p>Imóvel situado em: {{ENDERECO_IMOVEL}}</p>
      
      <h2 class="text-lg font-bold mt-6 mb-2">PRAZO E VALOR</h2>
      <p>Prazo: {{PRAZO_MESES}} meses</p>
      <p>Valor mensal: R$ {{VALOR_ALUGUEL}}</p>
      <p>Vencimento: dia {{DIA_VENCIMENTO}} de cada mês</p>
      
      <div class="mt-20 flex justify-around">
        <div class="text-center">
          <p class="border-t-2 border-gray-700 w-64 pt-2">{{NOME_LOCADOR}}</p>
          <p>LOCADOR</p>
        </div>
        <div class="text-center">
          <p class="border-t-2 border-gray-700 w-64 pt-2">{{NOME_LOCATARIO}}</p>
          <p>LOCATÁRIO</p>
        </div>
      </div>
    </div>`
  },
  
  serviceContract: {
    name: 'Contrato de Prestação de Serviços',
    category: 'Contratos',
    description: 'Contrato para prestação de serviços profissionais',
    template: `<div class="font-sans bg-white p-10 text-gray-800" style="min-height: 297mm; width: 210mm;">
      <h1 class="text-2xl font-bold text-center mb-8 uppercase">Contrato de Prestação de Serviços</h1>
      
      <h2 class="text-lg font-bold mt-6 mb-2">PARTES</h2>
      <p class="mb-4"><strong>CONTRATANTE:</strong> {{NOME_CONTRATANTE}}</p>
      <p class="mb-4"><strong>CONTRATADO:</strong> {{NOME_CONTRATADO}}</p>
      
      <h2 class="text-lg font-bold mt-6 mb-2">OBJETO</h2>
      <p>{{OBJETO_SERVICO}}</p>
      
      <h2 class="text-lg font-bold mt-6 mb-2">VALOR E PAGAMENTO</h2>
      <p>Valor total: R$ {{VALOR_TOTAL}}</p>
      <p>Forma de pagamento: {{FORMA_PAGAMENTO}}</p>
      
      <h2 class="text-lg font-bold mt-6 mb-2">PRAZO DE ENTREGA</h2>
      <p>{{DATA_ENTREGA}}</p>
      
      <div class="mt-20 flex justify-around">
        <div class="text-center">
          <p class="border-t-2 border-gray-700 w-64 pt-2">{{NOME_CONTRATANTE}}</p>
          <p>CONTRATANTE</p>
        </div>
        <div class="text-center">
          <p class="border-t-2 border-gray-700 w-64 pt-2">{{NOME_CONTRATADO}}</p>
          <p>CONTRATADO</p>
        </div>
      </div>
    </div>`
  },
  
  // Declarações
  simpleDeclaration: {
    name: 'Declaração Simples',
    category: 'Declarações',
    description: 'Declaração para fins diversos',
    template: `<div class="font-sans bg-white p-12 text-gray-800" style="min-height: 297mm; width: 210mm;">
      <h1 class="text-2xl font-bold text-center mb-12 uppercase">Declaração</h1>
      
      <p class="text-lg leading-loose mt-10">
        Eu, {{NOME_COMPLETO}}, portador(a) do CPF nº {{CPF}}, 
        declaro para os devidos fins que {{OBJETIVO_DECLARACAO}}.
      </p>
      
      <p class="text-lg leading-loose mt-6">
        Por ser a expressão da verdade, firmo a presente declaração.
      </p>
      
      <p class="text-center mt-20">{{CIDADE}}, {{DATA_ATUAL}}.</p>
      
      <div class="mt-20 flex justify-center">
        <div class="text-center">
          <p class="border-t-2 border-gray-700 w-80 pt-2">{{NOME_COMPLETO}}</p>
        </div>
      </div>
    </div>`
  },
  
  // Recibos
  paymentReceipt: {
    name: 'Recibo de Pagamento',
    category: 'Recibos',
    description: 'Recibo de pagamento ou quitação',
    template: `<div class="font-sans bg-white p-12 text-gray-800" style="min-height: 297mm; width: 210mm;">
      <h1 class="text-2xl font-bold text-center mb-12 uppercase">Recibo de Pagamento</h1>
      
      <div class="text-right mb-10">
        <p class="text-2xl font-bold">VALOR: R$ {{VALOR_RECEBIDO}}</p>
      </div>
      
      <p class="text-lg leading-loose mt-10">
        Eu, {{NOME_RECEBEDOR}}, CPF: {{CPF_RECEBEDOR}}, 
        declaro ter recebido de {{NOME_PAGADOR}}, CPF: {{CPF_PAGADOR}}, 
        a importância de R$ {{VALOR_RECEBIDO}} ({{VALOR_EXTENSO}}), 
        referente a {{REFERENTE_A}}.
      </p>
      
      <p class="text-lg leading-loose mt-6">
        Para clareza, firmo o presente recibo, dando plena e geral quitação.
      </p>
      
      <p class="text-center mt-20">{{CIDADE}}, {{DATA_ATUAL}}.</p>
      
      <div class="mt-20 flex justify-center">
        <div class="text-center">
          <p class="border-t-2 border-gray-700 w-80 pt-2">{{NOME_RECEBEDOR}}</p>
        </div>
      </div>
    </div>`
  },
  
  // Propostas
  commercialProposal: {
    name: 'Proposta Comercial',
    category: 'Propostas',
    description: 'Proposta comercial profissional',
    template: `<div class="font-sans bg-white p-10 text-gray-800" style="min-height: 297mm; width: 210mm;">
      <header class="border-b-4 border-indigo-600 pb-4 mb-10">
        <h1 class="text-3xl font-bold text-indigo-800">{{NOME_EMPRESA}}</h1>
        <p class="text-lg text-gray-600">Proposta Comercial</p>
      </header>
      
      <div class="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 class="text-sm font-bold uppercase text-gray-500">PARA</h2>
          <p class="text-lg font-semibold">{{NOME_CLIENTE}}</p>
        </div>
        <div class="text-right">
          <h2 class="text-sm font-bold uppercase text-gray-500">PROJETO</h2>
          <p class="text-lg font-semibold">{{PROJETO_TITULO}}</p>
        </div>
      </div>
      
      <main>
        <h2 class="text-xl font-bold text-indigo-700 mb-4">1. Introdução</h2>
        <p class="text-gray-700 mb-6">{{INTRODUCAO}}</p>
        
        <h2 class="text-xl font-bold text-indigo-700 mb-4">2. Escopo</h2>
        <div class="text-gray-700 mb-6">{{ESCOPO_SERVICOS}}</div>
        
        <h2 class="text-xl font-bold text-indigo-700 mb-4">3. Investimento</h2>
        <div class="text-gray-700 mb-6">{{VALORES_INVESTIMENTO}}</div>
        
        <h2 class="text-xl font-bold text-indigo-700 mb-4">4. Validade</h2>
        <p class="text-gray-700">Válida por {{VALIDADE_PROPOSTA}} dias.</p>
      </main>
      
      <footer class="mt-16 text-center">
        <p class="text-lg font-semibold">{{NOME_RESPONSAVEL}}</p>
        <p class="text-gray-600">{{CARGO_RESPONSAVEL}}</p>
      </footer>
    </div>`
  }
};

// ==================== FUNCTION DECLARATIONS ====================

const createDocumentTool: FunctionDeclaration = {
  name: 'create_document',
  description: 'Cria um documento profissional (contrato, declaração, recibo, proposta). Coleta informações do usuário de forma interativa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      document_type: {
        type: Type.STRING,
        description: 'Tipo de documento a criar',
        enum: ['rentalContract', 'serviceContract', 'simpleDeclaration', 'paymentReceipt', 'commercialProposal']
      },
      collected_data: {
        type: Type.OBJECT,
        description: 'Dados coletados do usuário para preencher o documento'
      },
      next_question: {
        type: Type.STRING,
        description: 'Próxima pergunta a fazer ao usuário (se ainda faltam dados)'
      }
    },
    required: ['document_type']
  }
};

const answerQuestionTool: FunctionDeclaration = {
  name: 'answer_question',
  description: 'Responde perguntas gerais ou fornece orientações sobre documentos',
  parameters: {
    type: Type.OBJECT,
    properties: {
      response: {
        type: Type.STRING,
        description: 'Resposta para o usuário'
      }
    },
    required: ['response']
  }
};

// ==================== ORCHESTRATOR ====================

export interface DocumentGenerationResult {
  action: 'document' | 'question' | 'chat';
  data: {
    documentHtml?: string;
    documentType?: string;
    question?: string;
    response?: string;
    progress?: number; // 0-100
  };
}

/**
 * Processa mensagem do usuário e decide qual ação tomar
 */
export async function processDocumentRequest(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<DocumentGenerationResult> {
  const tools = [{
    functionDeclarations: [createDocumentTool, answerQuestionTool]
  }];

  try {
    const prompt = `Você é um Assistente de Documentos Profissionais.

**HISTÓRICO DA CONVERSA:**
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

**MENSAGEM ATUAL DO USUÁRIO:**
${userMessage}

**SUA TAREFA:**
1. Identifique se o usuário quer criar um documento específico
2. Se sim, determine qual tipo de documento
3. Colete os dados necessários fazendo perguntas claras e diretas
4. Quando tiver TODOS os dados, gere o documento

**TIPOS DE DOCUMENTOS DISPONÍVEIS:**
- rentalContract: Contrato de Locação
- serviceContract: Contrato de Prestação de Serviços
- simpleDeclaration: Declaração Simples
- paymentReceipt: Recibo de Pagamento
- commercialProposal: Proposta Comercial

**REGRAS:**
- Faça UMA pergunta de cada vez
- Seja claro e objetivo
- Nunca presuma informações
- Confirme dados importantes`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools }
    });

    const functionCall = response.functionCalls?.[0];

    if (functionCall) {
      switch (functionCall.name) {
        case 'create_document':
          return handleCreateDocument(functionCall.args);
        
        case 'answer_question':
        default:
          return {
            action: 'chat',
            data: {
              response: functionCall.args.response || 'Como posso ajudar?'
            }
          };
      }
    }

    // Fallback
    return {
      action: 'chat',
      data: {
        response: 'Posso ajudar você a criar documentos profissionais como contratos, declarações, recibos e propostas comerciais. Qual documento você precisa?'
      }
    };

  } catch (error) {
    console.error('Error in document orchestrator:', error);
    return {
      action: 'chat',
      data: {
        response: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
      }
    };
  }
}

/**
 * Manipula a criação de documento
 */
function handleCreateDocument(args: any): DocumentGenerationResult {
  const { document_type, collected_data, next_question } = args;

  // Se ainda falta coletar dados
  if (next_question) {
    return {
      action: 'question',
      data: {
        question: next_question,
        documentType: document_type,
        progress: calculateProgress(document_type, collected_data)
      }
    };
  }

  // Se tem todos os dados, gera o documento
  if (collected_data && isDataComplete(document_type, collected_data)) {
    const template = DOCUMENT_TEMPLATES[document_type as keyof typeof DOCUMENT_TEMPLATES];
    const documentHtml = fillTemplate(template.template, collected_data);

    return {
      action: 'document',
      data: {
        documentHtml,
        documentType: document_type,
        progress: 100
      }
    };
  }

  // Precisa de mais dados
  return {
    action: 'question',
    data: {
      question: getNextQuestion(document_type, collected_data),
      documentType: document_type,
      progress: calculateProgress(document_type, collected_data)
    }
  };
}

/**
 * Preenche template com dados
 */
function fillTemplate(template: string, data: Record<string, any>): string {
  let filled = template;
  
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    filled = filled.replace(new RegExp(placeholder, 'g'), String(value));
  }
  
  return filled;
}

/**
 * Verifica se todos os dados necessários foram coletados
 */
function isDataComplete(documentType: string, data: Record<string, any>): boolean {
  const requiredFields: Record<string, string[]> = {
    rentalContract: ['NOME_LOCADOR', 'CPF_LOCADOR', 'NOME_LOCATARIO', 'CPF_LOCATARIO', 'ENDERECO_IMOVEL', 'VALOR_ALUGUEL'],
    serviceContract: ['NOME_CONTRATANTE', 'NOME_CONTRATADO', 'OBJETO_SERVICO', 'VALOR_TOTAL'],
    simpleDeclaration: ['NOME_COMPLETO', 'CPF', 'OBJETIVO_DECLARACAO'],
    paymentReceipt: ['NOME_RECEBEDOR', 'CPF_RECEBEDOR', 'NOME_PAGADOR', 'VALOR_RECEBIDO'],
    commercialProposal: ['NOME_EMPRESA', 'NOME_CLIENTE', 'PROJETO_TITULO', 'INTRODUCAO']
  };

  const required = requiredFields[documentType] || [];
  return required.every(field => data[field]);
}

/**
 * Retorna próxima pergunta a fazer
 */
function getNextQuestion(documentType: string, data: Record<string, any>): string {
  const questions: Record<string, Array<{ field: string; question: string }>> = {
    rentalContract: [
      { field: 'NOME_LOCADOR', question: 'Qual o nome completo do locador (proprietário)?' },
      { field: 'CPF_LOCADOR', question: 'Qual o CPF do locador?' },
      { field: 'NOME_LOCATARIO', question: 'Qual o nome completo do locatário (inquilino)?' },
      { field: 'CPF_LOCATARIO', question: 'Qual o CPF do locatário?' },
      { field: 'ENDERECO_IMOVEL', question: 'Qual o endereço completo do imóvel?' },
      { field: 'VALOR_ALUGUEL', question: 'Qual o valor mensal do aluguel?' }
    ],
    simpleDeclaration: [
      { field: 'NOME_COMPLETO', question: 'Qual seu nome completo?' },
      { field: 'CPF', question: 'Qual seu CPF?' },
      { field: 'OBJETIVO_DECLARACAO', question: 'O que você deseja declarar?' }
    ]
  };

  const docQuestions = questions[documentType] || [];
  
  for (const q of docQuestions) {
    if (!data[q.field]) {
      return q.question;
    }
  }

  return 'Preciso de mais informações. Pode me fornecer os detalhes?';
}

/**
 * Calcula progresso da coleta de dados
 */
function calculateProgress(documentType: string, data: Record<string, any>): number {
  const requiredFields: Record<string, string[]> = {
    rentalContract: ['NOME_LOCADOR', 'CPF_LOCADOR', 'NOME_LOCATARIO', 'CPF_LOCATARIO', 'ENDERECO_IMOVEL', 'VALOR_ALUGUEL'],
    serviceContract: ['NOME_CONTRATANTE', 'NOME_CONTRATADO', 'OBJETO_SERVICO', 'VALOR_TOTAL'],
    simpleDeclaration: ['NOME_COMPLETO', 'CPF', 'OBJETIVO_DECLARACAO'],
    paymentReceipt: ['NOME_RECEBEDOR', 'CPF_RECEBEDOR', 'NOME_PAGADOR', 'VALOR_RECEBIDO'],
    commercialProposal: ['NOME_EMPRESA', 'NOME_CLIENTE', 'PROJETO_TITULO', 'INTRODUCAO']
  };

  const required = requiredFields[documentType] || [];
  const collected = required.filter(field => data[field]).length;
  
  return Math.round((collected / required.length) * 100);
}

/**
 * Lista todos os tipos de documentos disponíveis
 */
export function listAvailableDocuments() {
  return Object.entries(DOCUMENT_TEMPLATES).map(([key, value]) => ({
    id: key,
    name: value.name,
    category: value.category,
    description: value.description
  }));
}

export default {
  processDocumentRequest,
  listAvailableDocuments,
  DOCUMENT_TEMPLATES
};
