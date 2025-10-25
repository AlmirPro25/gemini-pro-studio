# 🔧 Exemplo de Integração no ChatView

## 📋 Como Integrar o Neural Architect System no ChatView

Este guia mostra como adicionar as funcionalidades do Neural Architect System ao componente ChatView existente.

## 🎯 Passo 1: Importar Serviços

```typescript
// No início do arquivo ChatView.tsx
import {
  generateStructuredTechnicalResponse,
  generateAdaptiveTechnicalResponse,
  detectTechnicalContext,
  TechnicalCodeValidator
} from '../services/neuralArchitectService';

import { technicalPersonas } from '../data/technicalPersonas';
```

## 🎯 Passo 2: Adicionar Estado para Resposta Estruturada

```typescript
// Adicionar ao estado do componente
const [structuredResponse, setStructuredResponse] = useState<{
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
} | null>(null);

const [technicalContext, setTechnicalContext] = useState<{
  domain: string;
  complexity: string;
  technologies: string[];
  requiresCode: boolean;
  requiresArchitecture: boolean;
} | null>(null);
```

## 🎯 Passo 3: Detectar Contexto Técnico

```typescript
// Adicionar função para detectar contexto
const detectContext = (prompt: string) => {
  const context = detectTechnicalContext(prompt);
  setTechnicalContext(context);
  
  console.log('🔍 Contexto detectado:', context);
  
  return context;
};
```

## 🎯 Passo 4: Modificar Função de Envio de Mensagem

```typescript
const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
  // ... código existente ...

  try {
    // Detectar contexto técnico
    const context = detectContext(content);
    
    // Verificar se é uma persona técnica
    const isTechnicalPersona = technicalPersonas.some(
      p => p.id === currentPersona?.id
    );

    let response: string;

    if (isTechnicalPersona && (context.requiresCode || context.requiresArchitecture)) {
      // Usar geração estruturada para personas técnicas
      console.log('🧠 Usando geração estruturada...');
      
      const structured = await generateStructuredTechnicalResponse(
        content,
        currentPersona!,
        attachments
      );
      
      setStructuredResponse(structured);
      
      // Formatar resposta estruturada em markdown
      response = formatStructuredResponse(structured);
    } else {
      // Usar geração adaptativa (detecta automaticamente)
      console.log('🎯 Usando geração adaptativa...');
      
      response = await generateAdaptiveTechnicalResponse(
        content,
        currentPersona!,
        attachments
      );
    }

    // Validar código se presente
    if (response.includes('```')) {
      validateCodeInResponse(response);
    }

    // ... resto do código existente ...
  } catch (error) {
    // ... tratamento de erro ...
  }
};
```

## 🎯 Passo 5: Função para Formatar Resposta Estruturada

```typescript
const formatStructuredResponse = (structured: any): string => {
  let markdown = structured.mainResponse;

  if (structured.reasoning) {
    markdown += `\n\n## 🧠 Raciocínio Técnico\n\n${structured.reasoning}`;
  }

  if (structured.architecture) {
    markdown += `\n\n## 🏗️ Arquitetura\n\n`;
    markdown += `**Componentes:**\n${structured.architecture.components.map((c: string) => `- ${c}`).join('\n')}\n\n`;
    markdown += `**Fluxo de Dados:**\n${structured.architecture.dataFlow}\n\n`;
    markdown += `**Tecnologias:**\n${structured.architecture.technologies.map((t: string) => `- ${t}`).join('\n')}`;
  }

  if (structured.codeExamples && structured.codeExamples.length > 0) {
    markdown += `\n\n## 💻 Exemplos de Código\n\n`;
    structured.codeExamples.forEach((example: any, index: number) => {
      markdown += `### ${index + 1}. ${example.explanation}\n\n`;
      markdown += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
    });
  }

  if (structured.suggestions && structured.suggestions.length > 0) {
    markdown += `\n\n## 💡 Sugestões\n\n`;
    markdown += structured.suggestions.map((s: string) => `- ${s}`).join('\n');
  }

  if (structured.confidence) {
    markdown += `\n\n---\n*Confiança na solução: ${structured.confidence}%*`;
  }

  return markdown;
};
```

## 🎯 Passo 6: Função para Validar Código

```typescript
const validateCodeInResponse = (response: string) => {
  // Extrair blocos de código
  const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const language = match[1];
    const code = match[2];
    
    // Validar código
    const validation = TechnicalCodeValidator.validateCode(code, language);
    
    if (!validation.isValid || validation.suggestions.length > 0) {
      const report = TechnicalCodeValidator.generateQualityReport(code, language);
      console.log(report);
      
      // Opcional: Mostrar aviso na UI
      if (!validation.isValid) {
        console.warn(`⚠️ Código ${language} contém problemas:`, validation.issues);
      }
    }
  }
};
```

## 🎯 Passo 7: Adicionar Indicador de Contexto na UI

```typescript
// Adicionar componente para mostrar contexto detectado
const TechnicalContextIndicator = () => {
  if (!technicalContext) return null;

  return (
    <div className="technical-context-indicator">
      <div className="context-badge">
        <span className="context-label">Domínio:</span>
        <span className="context-value">{technicalContext.domain}</span>
      </div>
      <div className="context-badge">
        <span className="context-label">Complexidade:</span>
        <span className="context-value">{technicalContext.complexity}</span>
      </div>
      {technicalContext.technologies.length > 0 && (
        <div className="context-badge">
          <span className="context-label">Tecnologias:</span>
          <span className="context-value">
            {technicalContext.technologies.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};
```

## 🎯 Passo 8: Adicionar Seletor de Persona Técnica

```typescript
// Adicionar ao componente de seleção de persona
const TechnicalPersonaSelector = () => {
  return (
    <div className="technical-personas">
      <h3>🧠 Personas Técnicas</h3>
      <div className="persona-grid">
        {technicalPersonas.map(persona => (
          <button
            key={persona.id}
            className={`persona-card ${currentPersona?.id === persona.id ? 'active' : ''}`}
            onClick={() => setCurrentPersona(persona)}
            style={{ borderColor: persona.color }}
          >
            <span className="persona-icon">{persona.icon}</span>
            <span className="persona-name">{persona.name}</span>
            <span className="persona-description">{persona.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

## 🎯 Passo 9: Adicionar Visualização de Resposta Estruturada

```typescript
// Componente para visualizar resposta estruturada
const StructuredResponseView = ({ response }: { response: any }) => {
  if (!response) return null;

  return (
    <div className="structured-response">
      {/* Confiança */}
      {response.confidence && (
        <div className="confidence-meter">
          <span>Confiança: {response.confidence}%</span>
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ width: `${response.confidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Arquitetura */}
      {response.architecture && (
        <div className="architecture-section">
          <h3>🏗️ Arquitetura</h3>
          <div className="architecture-grid">
            <div className="architecture-item">
              <h4>Componentes</h4>
              <ul>
                {response.architecture.components.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="architecture-item">
              <h4>Fluxo de Dados</h4>
              <p>{response.architecture.dataFlow}</p>
            </div>
            <div className="architecture-item">
              <h4>Tecnologias</h4>
              <ul>
                {response.architecture.technologies.map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Exemplos de Código */}
      {response.codeExamples && response.codeExamples.length > 0 && (
        <div className="code-examples-section">
          <h3>💻 Exemplos de Código</h3>
          {response.codeExamples.map((example: any, i: number) => (
            <div key={i} className="code-example">
              <h4>{example.explanation}</h4>
              <pre>
                <code className={`language-${example.language}`}>
                  {example.code}
                </code>
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Sugestões */}
      {response.suggestions && response.suggestions.length > 0 && (
        <div className="suggestions-section">
          <h3>💡 Sugestões</h3>
          <ul>
            {response.suggestions.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

## 🎯 Passo 10: Adicionar CSS

```css
/* Adicionar ao arquivo de estilos */

.technical-context-indicator {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.context-badge {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.context-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.context-value {
  color: rgba(255, 255, 255, 0.9);
}

.technical-personas {
  margin: 1rem 0;
}

.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.persona-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.persona-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.persona-card.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: currentColor;
}

.persona-icon {
  font-size: 2rem;
}

.persona-name {
  font-weight: 600;
  font-size: 1rem;
}

.persona-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.structured-response {
  margin-top: 1rem;
}

.confidence-meter {
  margin-bottom: 1rem;
}

.confidence-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #3B82F6);
  transition: width 0.3s ease;
}

.architecture-section,
.code-examples-section,
.suggestions-section {
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
}

.architecture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.architecture-item h4 {
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.code-example {
  margin-top: 1rem;
}

.code-example h4 {
  margin-bottom: 0.5rem;
}

.code-example pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.suggestions-section ul {
  list-style: none;
  padding: 0;
}

.suggestions-section li {
  padding: 0.5rem;
  margin: 0.5rem 0;
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #10B981;
  border-radius: 0.25rem;
}
```

## 🎯 Exemplo Completo de Uso

```typescript
// Exemplo de uso completo no ChatView.tsx

import React, { useState } from 'react';
import {
  generateStructuredTechnicalResponse,
  generateAdaptiveTechnicalResponse,
  detectTechnicalContext,
  TechnicalCodeValidator
} from '../services/neuralArchitectService';
import { technicalPersonas } from '../data/technicalPersonas';

const ChatView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [structuredResponse, setStructuredResponse] = useState<any>(null);
  const [technicalContext, setTechnicalContext] = useState<any>(null);

  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Detectar contexto técnico
      const context = detectTechnicalContext(content);
      setTechnicalContext(context);

      // Verificar se é persona técnica
      const isTechnicalPersona = technicalPersonas.some(
        p => p.id === currentPersona?.id
      );

      let response: string;

      if (isTechnicalPersona && (context.requiresCode || context.requiresArchitecture)) {
        // Geração estruturada
        const structured = await generateStructuredTechnicalResponse(
          content,
          currentPersona!,
          attachments
        );
        
        setStructuredResponse(structured);
        response = formatStructuredResponse(structured);
      } else {
        // Geração adaptativa
        response = await generateAdaptiveTechnicalResponse(
          content,
          currentPersona!,
          attachments
        );
      }

      // Validar código
      if (response.includes('```')) {
        validateCodeInResponse(response);
      }

      // Adicionar resposta do assistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      // Tratamento de erro...
    }
  };

  return (
    <div className="chat-view">
      {/* Seletor de Persona Técnica */}
      <TechnicalPersonaSelector />

      {/* Indicador de Contexto */}
      <TechnicalContextIndicator />

      {/* Mensagens */}
      <div className="messages">
        {messages.map(message => (
          <MessageComponent key={message.id} message={message} />
        ))}
      </div>

      {/* Resposta Estruturada */}
      {structuredResponse && (
        <StructuredResponseView response={structuredResponse} />
      )}

      {/* Input de Mensagem */}
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
};

export default ChatView;
```

## 🎯 Testes

```typescript
// Exemplo de teste
describe('Neural Architect Integration', () => {
  it('should detect technical context', () => {
    const context = detectTechnicalContext(
      'Como criar uma API REST com Node.js e TypeScript?'
    );
    
    expect(context.domain).toBe('backend');
    expect(context.requiresCode).toBe(true);
    expect(context.technologies).toContain('node.js');
    expect(context.technologies).toContain('typescript');
  });

  it('should validate code', () => {
    const code = `
      async function fetchData() {
        const response = await fetch('/api/data');
        return response.json();
      }
    `;
    
    const validation = TechnicalCodeValidator.validateCode(code, 'typescript');
    
    expect(validation.suggestions).toContain(
      'Considere adicionar try-catch para operações assíncronas'
    );
  });

  it('should generate structured response for technical persona', async () => {
    const mlArchitect = technicalPersonas.find(p => p.id === 'ml-architect');
    
    const response = await generateStructuredTechnicalResponse(
      'Como criar um modelo de classificação de imagens?',
      mlArchitect!
    );
    
    expect(response.mainResponse).toBeDefined();
    expect(response.architecture).toBeDefined();
    expect(response.codeExamples).toBeDefined();
  });
});
```

## 🚀 Resultado Final

Com essa integração, o ChatView terá:

✅ **Detecção automática de contexto técnico**
✅ **Respostas estruturadas para personas técnicas**
✅ **Validação automática de código**
✅ **Visualização rica de arquiteturas**
✅ **Exemplos de código com explicações**
✅ **Sugestões de melhorias**
✅ **Indicador de confiança**
✅ **UI profissional e intuitiva**

---

**Criado com 🧠 pelo Neural Architect System**
