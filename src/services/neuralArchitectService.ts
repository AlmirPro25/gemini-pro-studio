/**
 * 🧠 NEURAL ARCHITECT SERVICE
 * 
 * Integração dos conceitos avançados do sistema de geração de redes neurais
 * com o sistema de personas especializadas.
 * 
 * Features aproveitadas:
 * - Schemas estruturados para respostas complexas
 * - Sistema de instruções técnicas avançadas
 * - Geração de dados de simulação
 * - Validação automática de código
 * - Meta-cognição e raciocínio adaptativo
 */

import { GoogleGenAI, Type, Part } from "@google/genai";
import { Persona, Attachment } from '../types';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// 🎯 SCHEMA PARA RESPOSTAS ESTRUTURADAS TÉCNICAS
const technicalResponseSchema = {
  type: Type.OBJECT,
  properties: {
    mainResponse: {
      type: Type.STRING,
      description: "A resposta principal completa e detalhada"
    },
    reasoning: {
      type: Type.STRING,
      description: "O raciocínio técnico por trás da solução proposta",
      nullable: true
    },
    codeExamples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          language: { type: Type.STRING },
          code: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      },
      description: "Exemplos de código com explicações",
      nullable: true
    },
    architecture: {
      type: Type.OBJECT,
      properties: {
        components: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        dataFlow: { type: Type.STRING },
        technologies: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      description: "Arquitetura da solução proposta",
      nullable: true
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Sugestões de melhorias ou alternativas",
      nullable: true
    },
    confidence: {
      type: Type.NUMBER,
      description: "Nível de confiança na solução (0-100)",
      nullable: true
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        complexity: { type: Type.STRING },
        estimatedTime: { type: Type.STRING },
        prerequisites: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      nullable: true
    }
  },
  required: ["mainResponse"]
};

// 🧠 SISTEMA DE META-COGNIÇÃO TÉCNICA
const META_COGNITIVE_INSTRUCTIONS = `
🧠 **SISTEMA DE META-COGNIÇÃO ATIVADO**

Antes de cada resposta técnica, execute este processo de auto-reflexão:

**1. ANÁLISE CONTEXTUAL:**
- Qual é a complexidade REAL do problema? (Simples/Médio/Complexo/Avançado)
- Qual é o domínio específico? (Frontend/Backend/DevOps/ML/etc)
- Quais são as restrições implícitas? (Performance/Segurança/Escalabilidade)
- Qual é o nível técnico do usuário? (Iniciante/Intermediário/Avançado)

**2. SELEÇÃO DE ESTRATÉGIA:**
- Qual abordagem é mais adequada? (Simples e direta / Arquitetura complexa)
- Quais tecnologias são REALMENTE necessárias?
- Qual é o trade-off entre simplicidade e robustez?
- Existem padrões de design aplicáveis?

**3. VALIDAÇÃO INTERNA:**
- Esta solução é REALMENTE a melhor?
- Quais são as alternativas viáveis?
- Quais são os pontos fracos desta abordagem?
- Como esta solução escala?

**4. OTIMIZAÇÃO ADAPTATIVA:**
- Como adaptar a resposta ao contexto específico?
- Quais detalhes são cruciais vs. opcionais?
- Como tornar a explicação mais clara?
- Quais exemplos práticos ajudariam?

**RESULTADO ESPERADO:**
Uma resposta que demonstra raciocínio profundo, não apenas conhecimento superficial.
`;

// 🎯 INSTRUÇÕES PARA ARQUITETURAS TÉCNICAS
const TECHNICAL_ARCHITECTURE_GUIDE = `
🏗️ **GUIA DE ARQUITETURAS TÉCNICAS**

**DETECÇÃO AUTOMÁTICA DE CONTEXTO:**

1. **Frontend/UI:**
   - React/Vue/Angular para SPAs
   - Next.js/Nuxt para SSR
   - Tailwind/Styled Components para styling
   - State management (Redux/Zustand/Pinia)

2. **Backend/API:**
   - Node.js/Express para APIs REST
   - NestJS para arquitetura enterprise
   - GraphQL para APIs flexíveis
   - tRPC para type-safety end-to-end

3. **Database:**
   - PostgreSQL para dados relacionais
   - MongoDB para dados não-estruturados
   - Redis para cache
   - Prisma/TypeORM para ORM

4. **DevOps/Infrastructure:**
   - Docker para containerização
   - Kubernetes para orquestração
   - CI/CD com GitHub Actions
   - Monitoring com Prometheus/Grafana

5. **Machine Learning:**
   - TensorFlow.js para ML no browser
   - Python + TensorFlow/PyTorch para backend
   - Hugging Face para modelos pré-treinados
   - MLOps com MLflow

**PRINCÍPIOS DE SELEÇÃO:**
- Escolha a ferramenta CERTA, não a mais popular
- Considere a curva de aprendizado
- Avalie o ecossistema e comunidade
- Pense em manutenibilidade a longo prazo
`;

// 🔍 SISTEMA DE VALIDAÇÃO DE CÓDIGO TÉCNICO
export class TechnicalCodeValidator {
  static validateCode(code: string, language: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Validações gerais
    if (code.includes('TODO') || code.includes('FIXME')) {
      issues.push('Código contém TODOs ou FIXMEs não resolvidos');
    }

    if (code.includes('console.log') && language === 'typescript') {
      suggestions.push('Considere usar um logger profissional em vez de console.log');
    }

    // Validações específicas por linguagem
    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
        if (!code.includes('try') && code.includes('await')) {
          suggestions.push('Considere adicionar try-catch para operações assíncronas');
        }
        if (code.includes('any') && language === 'typescript') {
          issues.push('Uso de tipo "any" detectado - considere tipos mais específicos');
        }
        break;

      case 'python':
        if (!code.includes('def ') && !code.includes('class ')) {
          suggestions.push('Considere organizar código em funções ou classes');
        }
        break;

      case 'sql':
        if (code.includes('SELECT *')) {
          suggestions.push('Evite SELECT * - especifique colunas necessárias');
        }
        break;
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  static generateQualityReport(code: string, language: string): string {
    const validation = this.validateCode(code, language);
    
    let report = `📊 **Relatório de Qualidade de Código (${language})**\n\n`;
    
    if (validation.isValid) {
      report += '✅ **Status:** EXCELENTE - Nenhum problema crítico encontrado!\n\n';
    } else {
      report += `⚠️ **Status:** PRECISA ATENÇÃO - ${validation.issues.length} problema(s) encontrado(s)\n\n`;
      report += '**Problemas:**\n';
      validation.issues.forEach(issue => {
        report += `  - ${issue}\n`;
      });
      report += '\n';
    }

    if (validation.suggestions.length > 0) {
      report += '💡 **Sugestões de Melhoria:**\n';
      validation.suggestions.forEach(suggestion => {
        report += `  - ${suggestion}\n`;
      });
    }

    return report;
  }
}

// 🎨 GERADOR DE EXEMPLOS PRÁTICOS
export class PracticalExampleGenerator {
  static async generateExamples(
    concept: string,
    technology: string,
    complexity: 'basic' | 'intermediate' | 'advanced'
  ): Promise<Array<{
    title: string;
    code: string;
    explanation: string;
  }>> {
    const prompt = `Gere 2-3 exemplos práticos de código para:

**Conceito:** ${concept}
**Tecnologia:** ${technology}
**Nível:** ${complexity}

Para cada exemplo, forneça:
1. Título descritivo
2. Código funcional completo
3. Explicação linha por linha

Formato JSON:
{
  "examples": [
    {
      "title": "...",
      "code": "...",
      "explanation": "..."
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{"examples":[]}');
      return result.examples || [];
    } catch (error) {
      console.error('Erro ao gerar exemplos:', error);
      return [];
    }
  }
}

// 🚀 GERAÇÃO COM RESPOSTA ESTRUTURADA
export async function generateStructuredTechnicalResponse(
  prompt: string,
  persona: Persona,
  attachments?: Attachment[]
): Promise<{
  mainResponse: string;
  reasoning?: string;
  codeExamples?: Array<{
    language: string;
    code: string;
    explanation: string;
  }>;
  architecture?: {
    components: string[];
    dataFlow: string;
    technologies: string[];
  };
  suggestions?: string[];
  confidence?: number;
  metadata?: {
    complexity: string;
    estimatedTime: string;
    prerequisites: string[];
  };
}> {
  const enhancedPrompt = `${META_COGNITIVE_INSTRUCTIONS}

${TECHNICAL_ARCHITECTURE_GUIDE}

**🎭 PERSONA ATIVA:** ${persona.name}
**EXPERTISE:** ${persona.domain || 'General'}

**TAREFA DO USUÁRIO:**
${prompt}

**INSTRUÇÕES:**
1. Execute o processo de meta-cognição
2. Analise o contexto técnico profundamente
3. Forneça uma resposta estruturada e completa
4. Inclua exemplos práticos quando relevante
5. Sugira melhorias e alternativas
6. Indique seu nível de confiança na solução

**IMPORTANTE:**
- Seja técnico mas acessível
- Forneça código funcional, não pseudocódigo
- Explique o "porquê", não apenas o "como"
- Considere trade-offs e alternativas
`;

  const parts: Part[] = [];
  
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          data: att.data,
          mimeType: att.mimeType
        }
      });
    });
  }
  
  parts.push({ text: enhancedPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      systemInstruction: persona.prompt,
      responseMimeType: "application/json",
      responseSchema: technicalResponseSchema
    }
  });

  const result = JSON.parse(response.text || '{}');
  
  // Validar código se presente
  if (result.codeExamples && result.codeExamples.length > 0) {
    result.codeExamples.forEach((example: any) => {
      const validation = TechnicalCodeValidator.validateCode(
        example.code,
        example.language
      );
      
      if (!validation.isValid || validation.suggestions.length > 0) {
        console.log(TechnicalCodeValidator.generateQualityReport(
          example.code,
          example.language
        ));
      }
    });
  }

  return result;
}

// 🎯 DETECÇÃO AUTOMÁTICA DE CONTEXTO TÉCNICO
export function detectTechnicalContext(prompt: string): {
  domain: string;
  complexity: 'simple' | 'medium' | 'complex' | 'advanced';
  technologies: string[];
  requiresCode: boolean;
  requiresArchitecture: boolean;
} {
  const lowerPrompt = prompt.toLowerCase();
  
  // Detectar domínio
  let domain = 'general';
  if (lowerPrompt.match(/react|vue|angular|frontend|ui|interface/)) {
    domain = 'frontend';
  } else if (lowerPrompt.match(/api|backend|server|database|sql/)) {
    domain = 'backend';
  } else if (lowerPrompt.match(/deploy|docker|kubernetes|ci\/cd|devops/)) {
    domain = 'devops';
  } else if (lowerPrompt.match(/ml|machine learning|ai|neural|model/)) {
    domain = 'ml';
  }

  // Detectar complexidade
  let complexity: 'simple' | 'medium' | 'complex' | 'advanced' = 'medium';
  if (lowerPrompt.match(/simples|básico|iniciante|começar/)) {
    complexity = 'simple';
  } else if (lowerPrompt.match(/avançado|complexo|enterprise|escalável/)) {
    complexity = 'advanced';
  } else if (lowerPrompt.match(/arquitetura|sistema|distribuído|microserviços/)) {
    complexity = 'complex';
  }

  // Detectar tecnologias mencionadas
  const technologies: string[] = [];
  const techKeywords = [
    'react', 'vue', 'angular', 'next.js', 'typescript', 'javascript',
    'node.js', 'express', 'nestjs', 'python', 'django', 'flask',
    'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes',
    'tensorflow', 'pytorch', 'aws', 'azure', 'gcp'
  ];
  
  techKeywords.forEach(tech => {
    if (lowerPrompt.includes(tech)) {
      technologies.push(tech);
    }
  });

  // Detectar necessidades
  const requiresCode = lowerPrompt.match(/código|implementar|criar|desenvolver|exemplo/) !== null;
  const requiresArchitecture = lowerPrompt.match(/arquitetura|estrutura|design|sistema/) !== null;

  return {
    domain,
    complexity,
    technologies,
    requiresCode,
    requiresArchitecture
  };
}

// 🎨 GERAÇÃO ADAPTATIVA BASEADA EM CONTEXTO
export async function generateAdaptiveTechnicalResponse(
  prompt: string,
  persona: Persona,
  attachments?: Attachment[]
): Promise<string> {
  // Detectar contexto automaticamente
  const context = detectTechnicalContext(prompt);
  
  console.log('🔍 Contexto detectado:', context);

  // Se requer resposta estruturada técnica
  if (context.requiresCode || context.requiresArchitecture) {
    const structured = await generateStructuredTechnicalResponse(
      prompt,
      persona,
      attachments
    );

    // Formatar resposta estruturada em markdown
    let response = structured.mainResponse;

    if (structured.reasoning) {
      response += `\n\n## 🧠 Raciocínio Técnico\n\n${structured.reasoning}`;
    }

    if (structured.architecture) {
      response += `\n\n## 🏗️ Arquitetura\n\n`;
      response += `**Componentes:**\n${structured.architecture.components.map(c => `- ${c}`).join('\n')}\n\n`;
      response += `**Fluxo de Dados:**\n${structured.architecture.dataFlow}\n\n`;
      response += `**Tecnologias:**\n${structured.architecture.technologies.map(t => `- ${t}`).join('\n')}`;
    }

    if (structured.codeExamples && structured.codeExamples.length > 0) {
      response += `\n\n## 💻 Exemplos de Código\n\n`;
      structured.codeExamples.forEach((example, index) => {
        response += `### ${index + 1}. ${example.explanation}\n\n`;
        response += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
      });
    }

    if (structured.suggestions && structured.suggestions.length > 0) {
      response += `\n\n## 💡 Sugestões\n\n`;
      response += structured.suggestions.map(s => `- ${s}`).join('\n');
    }

    if (structured.metadata) {
      response += `\n\n## 📊 Metadados\n\n`;
      response += `- **Complexidade:** ${structured.metadata.complexity}\n`;
      response += `- **Tempo Estimado:** ${structured.metadata.estimatedTime}\n`;
      if (structured.metadata.prerequisites.length > 0) {
        response += `- **Pré-requisitos:** ${structured.metadata.prerequisites.join(', ')}\n`;
      }
    }

    if (structured.confidence) {
      response += `\n\n---\n*Confiança na solução: ${structured.confidence}%*`;
    }

    return response;
  }

  // Resposta padrão para contextos não-técnicos
  const parts: Part[] = [];
  
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          data: att.data,
          mimeType: att.mimeType
        }
      });
    });
  }
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      systemInstruction: persona.prompt
    }
  });

  return response.text;
}

export default {
  generateStructuredTechnicalResponse,
  generateAdaptiveTechnicalResponse,
  detectTechnicalContext,
  TechnicalCodeValidator,
  PracticalExampleGenerator
};
