# 🔌 Exemplo de Integração - Sistema de Documentos

## Integração Completa com o Gemini Pro Studio

### 1. Adicionar Personas ao Sistema

```typescript
// src/App.tsx ou src/data/personas.ts

import { documentPersonas } from './data/documentPersonas';
import { technicalPersonas } from './data/technicalPersonas';

// Combinar todas as personas
export const allPersonas = [
  ...technicalPersonas,
  ...documentPersonas
];
```

### 2. Criar Componente de Geração de Documentos

```typescript
// src/components/DocumentGenerator.tsx

import React, { useState } from 'react';
import { processUserMessage, ChatMessage } from '../services/resumeDocumentService';

export function DocumentGenerator() {
  const [documentHtml, setDocumentHtml] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (message: string) => {
    setIsProcessing(true);

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { sender: 'user', text: message }
    ];

    try {
      const result = await processUserMessage(
        newHistory,
        documentHtml,
        false // userHasPhoto
      );

      if (result.action === 'document') {
        setDocumentHtml(result.data.documentHtml || '');
        setChatHistory([
          ...newHistory,
          { sender: 'ai', text: result.data.aiResponse || '' }
        ]);
      } else if (result.action === 'chat') {
        setChatHistory([
          ...newHistory,
          { sender: 'ai', text: result.data.aiResponse || '' }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChatHistory([
        ...newHistory,
        { sender: 'ai', text: 'Erro ao processar. Tente novamente.' }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToPDF = () => {
    // Implementar exportação para PDF
    const element = document.getElementById('document-preview');
    if (element) {
      // Usar html2pdf ou similar
      console.log('Exportando para PDF...');
    }
  };

  return (
    <div className="flex h-screen">
      {/* Preview do Documento */}
      <div className="w-2/3 bg-gray-100 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white shadow-lg">
          <div
            id="document-preview"
            dangerouslySetInnerHTML={{ __html: documentHtml }}
          />
        </div>
        
        {documentHtml && (
          <div className="mt-4 text-center">
            <button
              onClick={exportToPDF}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              📄 Exportar para PDF
            </button>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="w-1/3 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">💬 Assistente de Documentos</h2>
          <p className="text-sm text-gray-600">
            Crie currículos, contratos e documentos profissionais
          </p>
        </div>

        {/* Histórico do Chat */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input de Mensagem */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
              if (input.value.trim()) {
                handleSendMessage(input.value);
                input.value = '';
              }
            }}
          >
            <div className="flex gap-2">
              <input
                name="message"
                type="text"
                placeholder="Digite sua mensagem..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </form>

          {/* Sugestões Rápidas */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleSendMessage('Crie um currículo moderno')}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
            >
              📝 Criar Currículo
            </button>
            <button
              onClick={() => handleSendMessage('Preciso de um contrato de locação')}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
            >
              ⚖️ Contrato
            </button>
            <button
              onClick={() => handleSendMessage('Criar proposta comercial')}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
            >
              💼 Proposta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. Adicionar Rota no App

```typescript
// src/App.tsx

import { DocumentGenerator } from './components/DocumentGenerator';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas existentes */}
        <Route path="/" element={<ChatView />} />
        
        {/* Nova rota de documentos */}
        <Route path="/documents" element={<DocumentGenerator />} />
      </Routes>
    </Router>
  );
}
```

### 4. Adicionar Link no Menu

```typescript
// src/components/Header.tsx

<nav>
  <Link to="/">Chat</Link>
  <Link to="/documents">📄 Documentos</Link>
  {/* outros links */}
</nav>
```

### 5. Integrar com Persona Existente

```typescript
// Usar o sistema de documentos dentro de uma persona

import { processUserMessage } from '../services/resumeDocumentService';

// Em uma persona específica
const resumeWriterPersona: Persona = {
  id: 'resume-writer',
  name: 'Resume Writer',
  domain: 'Currículos',
  prompt: '...',
  
  // Função customizada para processar mensagens
  async processMessage(message: string, context: any) {
    // Usar o serviço de documentos
    const result = await processUserMessage(
      context.chatHistory,
      context.currentDocument,
      context.hasPhoto
    );
    
    return result;
  }
};
```

## Exemplo de Fluxo Completo

### Cenário 1: Criar Currículo do Zero

```typescript
// 1. Usuário inicia conversa
handleSendMessage("Crie um currículo moderno para desenvolvedor");

// 2. IA cria template inicial
// documentHtml = <template Modern com estrutura básica>

// 3. Usuário adiciona informações
handleSendMessage("Meu nome é João Silva, sou Desenvolvedor Full Stack");

// 4. IA atualiza conteúdo
// documentHtml = <template atualizado com nome e cargo>

// 5. Usuário adiciona experiência
handleSendMessage("Trabalhei 3 anos na Empresa X como Tech Lead");

// 6. IA adiciona experiência otimizada
// documentHtml = <template com experiência formatada>

// 7. Usuário muda design
handleSendMessage("Mude para template Elegant com cor azul");

// 8. IA migra conteúdo
// documentHtml = <template Elegant com todo o conteúdo>

// 9. Usuário exporta
exportToPDF();
```

### Cenário 2: Criar Contrato

```typescript
// 1. Usuário solicita contrato
handleSendMessage("Preciso de um contrato de locação");

// 2. IA inicia coleta de dados
// aiResponse: "Qual o nome completo do locador?"

// 3. Usuário fornece dados
handleSendMessage("João Silva");

// 4. IA continua coleta
// aiResponse: "Qual o CPF do locador?"

// ... processo continua até coletar todos os dados

// 5. IA gera contrato completo
// documentHtml = <contrato preenchido>

// 6. Usuário exporta
exportToPDF();
```

## Integração com Sistema de Agentes

```typescript
// Usar o sistema de documentos com o orchestrator existente

import { orchestrateSpecialists } from './services/specialistOrchestrator';
import { processUserMessage } from './services/resumeDocumentService';

async function handleMessage(message: string, context: any) {
  // Primeiro, verificar se é relacionado a documentos
  if (isDocumentRelated(message)) {
    return await processUserMessage(
      context.chatHistory,
      context.currentDocument,
      context.hasPhoto
    );
  }
  
  // Caso contrário, usar orchestrator normal
  return await orchestrateSpecialists(message, context);
}

function isDocumentRelated(message: string): boolean {
  const keywords = [
    'currículo', 'resume', 'cv',
    'contrato', 'declaração', 'recibo',
    'proposta', 'documento'
  ];
  
  return keywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
}
```

## Testes

```typescript
// src/services/__tests__/resumeDocumentService.test.ts

import { processUserMessage } from '../resumeDocumentService';

describe('Resume Document Service', () => {
  it('should create resume from scratch', async () => {
    const result = await processUserMessage(
      [{ sender: 'user', text: 'Crie um currículo moderno' }],
      '',
      false
    );
    
    expect(result.action).toBe('document');
    expect(result.data.documentHtml).toContain('Seu Nome');
  });

  it('should update resume content', async () => {
    const result = await processUserMessage(
      [
        { sender: 'user', text: 'Crie um currículo' },
        { sender: 'user', text: 'Meu nome é João Silva' }
      ],
      '<div>Template inicial</div>',
      false
    );
    
    expect(result.data.documentHtml).toContain('João Silva');
  });

  it('should change template', async () => {
    const result = await processUserMessage(
      [{ sender: 'user', text: 'Mude para template Elegant' }],
      '<div>Conteúdo atual</div>',
      false
    );
    
    expect(result.action).toBe('document');
  });
});
```

## Performance e Otimização

```typescript
// Debounce para evitar múltiplas chamadas
import { debounce } from 'lodash';

const debouncedProcess = debounce(async (message: string) => {
  return await processUserMessage(/* ... */);
}, 500);

// Cache de templates
const templateCache = new Map();

function getTemplate(name: string) {
  if (!templateCache.has(name)) {
    templateCache.set(name, RESUME_TEMPLATES[name]);
  }
  return templateCache.get(name);
}

// Lazy loading de componentes
const DocumentGenerator = lazy(() => import('./components/DocumentGenerator'));
```

---

**Sistema pronto para uso! 🚀**
