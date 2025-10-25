# 📄 Sistema de Geração de Documentos e Currículos

## 🎯 Visão Geral

Sistema completo de geração de documentos profissionais integrado ao Gemini Pro Studio, com múltiplos agentes especializados e edição de fotos com IA.

## ✨ Funcionalidades

### 1. **Geração de Currículos**
- ✅ Múltiplos templates profissionais (Modern, Elegant, Creative)
- ✅ Otimização para ATS (Applicant Tracking Systems)
- ✅ Redação especializada com foco em conquistas
- ✅ Edição de fotos com IA para perfil profissional
- ✅ Personalização de cores e layout
- ✅ Exportação para PDF

### 2. **Documentos Jurídicos**
- ✅ Contratos de locação
- ✅ Contratos de prestação de serviços
- ✅ Declarações simples
- ✅ Recibos de pagamento
- ✅ Propostas comerciais

### 3. **Agentes Especializados**
- 📝 **Resume Writer** - Redação de currículos otimizados
- ⚖️ **Legal Document Specialist** - Documentos jurídicos
- 💼 **Business Proposal Writer** - Propostas comerciais
- 🎯 **Career Coach** - Orientação de carreira
- 💼 **LinkedIn Optimizer** - Otimização de perfil
- ✉️ **Cover Letter Writer** - Cartas de apresentação

## 🏗️ Arquitetura

### Componentes Principais

```
src/services/resumeDocumentService.ts
├── RESUME_TEMPLATES          # Templates de currículos
├── DOCUMENT_TEMPLATES         # Templates de documentos
├── processUserMessage()       # Orquestrador principal
├── generateResumeContent()    # Especialista em conteúdo
├── generateResumeDesign()     # Especialista em design
├── generateGenericDocument()  # Especialista em documentos
└── editUserPhoto()            # Editor de fotos com IA
```

### Fluxo de Processamento

```
Usuário
  ↓
Orchestrator (decide qual especialista chamar)
  ↓
┌─────────────────────────────────────┐
│ Especialistas (Function Calling)    │
├─────────────────────────────────────┤
│ • update_resume_content             │
│ • update_resume_design              │
│ • create_generic_document           │
│ • edit_photo                        │
└─────────────────────────────────────┘
  ↓
Resultado (documento HTML ou resposta)
```

## 🚀 Como Usar

### 1. Importar o Serviço

```typescript
import { 
  processUserMessage, 
  editUserPhoto,
  RESUME_TEMPLATES,
  DOCUMENT_TEMPLATES 
} from './services/resumeDocumentService';
```

### 2. Processar Mensagem do Usuário

```typescript
const chatHistory = [
  { sender: 'user', text: 'Crie um currículo para desenvolvedor' }
];

const result = await processUserMessage(
  chatHistory,
  currentDocumentHtml,
  userHasPhoto
);

if (result.action === 'document') {
  // Atualizar documento na UI
  setDocumentHtml(result.data.documentHtml);
  console.log(result.data.aiResponse);
}
```

### 3. Editar Foto

```typescript
const editedPhotoBase64 = await editUserPhoto(
  originalPhotoBase64,
  'image/jpeg',
  'Transform this photo into a professional headshot with neutral background'
);

if (editedPhotoBase64) {
  // Usar foto editada
  setPhotoUrl(`data:image/jpeg;base64,${editedPhotoBase64}`);
}
```

## 📋 Exemplos de Uso

### Criar Currículo

```typescript
// Usuário: "Crie um currículo moderno para mim"
const result = await processUserMessage(chatHistory, '', false);
// Retorna: Template Modern com estrutura básica

// Usuário: "Adicione minha experiência como Desenvolvedor Full Stack na Empresa X"
const result2 = await processUserMessage(chatHistory, currentHtml, false);
// Retorna: HTML atualizado com experiência adicionada
```

### Mudar Design

```typescript
// Usuário: "Mude para o template Elegant com cor azul"
const result = await processUserMessage(chatHistory, currentHtml, false);
// Retorna: Conteúdo migrado para template Elegant com cor azul
```

### Criar Documento Jurídico

```typescript
// Usuário: "Preciso de um contrato de locação"
const result = await processUserMessage(chatHistory, '', false);
// IA: "Qual o nome completo do locador?"

// Usuário: "João Silva"
const result2 = await processUserMessage(chatHistory, '', false);
// IA: "Qual o CPF do locador?"
// ... coleta todos os dados necessários

// Quando todos os dados estiverem coletados:
// Retorna: Contrato de locação completo em HTML
```

## 🎨 Templates Disponíveis

### Currículos

1. **Modern** - Design moderno com sidebar colorida
2. **Elegant** - Layout clássico e elegante
3. **Creative** - Design criativo com gradientes

### Documentos

1. **Contrato de Locação** - Formato jurídico padrão
2. **Declaração Simples** - Declaração formal
3. **Proposta Comercial** - Layout profissional de negócios

## 🔧 Integração com Sistema Existente

### 1. Adicionar Personas de Documentos

```typescript
// Em src/App.tsx ou onde as personas são carregadas
import { documentPersonas } from './data/documentPersonas';

const allPersonas = [
  ...existingPersonas,
  ...documentPersonas
];
```

### 2. Criar Interface de Documentos

```typescript
// Componente exemplo
function DocumentGenerator() {
  const [documentHtml, setDocumentHtml] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleUserMessage = async (message: string) => {
    const newHistory = [...chatHistory, { sender: 'user', text: message }];
    
    const result = await processUserMessage(
      newHistory,
      documentHtml,
      false
    );

    if (result.action === 'document') {
      setDocumentHtml(result.data.documentHtml || '');
      setChatHistory([
        ...newHistory,
        { sender: 'ai', text: result.data.aiResponse || '' }
      ]);
    }
  };

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: documentHtml }} />
      <ChatInterface onSend={handleUserMessage} history={chatHistory} />
    </div>
  );
}
```

### 3. Adicionar Botão de Exportação PDF

```typescript
function exportToPDF() {
  const element = document.getElementById('document-preview');
  
  // Usando html2pdf ou similar
  html2pdf()
    .from(element)
    .set({
      margin: 0,
      filename: 'documento.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .save();
}
```

## 🎯 Casos de Uso

### 1. Criação de Currículo Completo

```
Usuário: "Crie um currículo para desenvolvedor sênior"
IA: [Cria template Modern]

Usuário: "Adicione experiência como Tech Lead na Empresa X por 3 anos"
IA: [Adiciona experiência com conquistas]

Usuário: "Mude para template Elegant com cor indigo"
IA: [Migra conteúdo para novo template]

Usuário: "Otimize para vaga de Arquiteto de Software"
IA: [Ajusta palavras-chave e foco]
```

### 2. Documento Jurídico

```
Usuário: "Preciso de um contrato de prestação de serviços"
IA: "Qual o nome do contratante?"

Usuário: "Empresa ABC Ltda"
IA: "Qual o CNPJ do contratante?"

[... coleta todos os dados ...]

IA: [Gera contrato completo]
```

### 3. Proposta Comercial

```
Usuário: "Crie uma proposta comercial para desenvolvimento de app"
IA: "Qual o nome da sua empresa?"

[... coleta informações ...]

IA: [Gera proposta profissional]
```

## 🔐 Segurança e Privacidade

- ✅ Dados processados localmente quando possível
- ✅ Nenhum dado armazenado permanentemente sem consentimento
- ✅ Documentos jurídicos incluem aviso de revisão por advogado
- ✅ Fotos processadas com IA sem armazenamento

## 📊 Métricas de Qualidade

### Currículos
- ✅ Otimização ATS: 95%+ de compatibilidade
- ✅ Concisão: Cabe em 1 página A4
- ✅ Impacto: Foco em conquistas quantificáveis

### Documentos Jurídicos
- ✅ Completude: Todos os elementos essenciais
- ✅ Clareza: Linguagem formal mas compreensível
- ✅ Conformidade: Seguindo normas vigentes

## 🚧 Próximas Melhorias

- [ ] Mais templates de currículos
- [ ] Suporte a múltiplos idiomas
- [ ] Análise de compatibilidade com vagas
- [ ] Geração de portfólio online
- [ ] Integração com LinkedIn API
- [ ] Mais tipos de documentos jurídicos
- [ ] Sistema de versionamento de documentos
- [ ] Colaboração em tempo real

## 📚 Recursos Adicionais

- [Guia de Otimização ATS](./GUIA_OTIMIZACAO_ATS.md)
- [Melhores Práticas de Currículos](./MELHORES_PRATICAS_CURRICULOS.md)
- [Templates de Documentos](./TEMPLATES_DOCUMENTOS.md)
- [API Reference](./API_REFERENCE.md)

## 🤝 Contribuindo

Para adicionar novos templates ou tipos de documentos:

1. Adicione o template em `RESUME_TEMPLATES` ou `DOCUMENT_TEMPLATES`
2. Crie a função de geração correspondente
3. Adicione o tool declaration
4. Atualize o orchestrator
5. Teste com casos de uso reais

## 📝 Notas Importantes

- **Currículos**: Sempre priorize concisão e conquistas quantificáveis
- **Documentos Jurídicos**: NUNCA faça suposições sobre dados
- **Fotos**: Sempre peça consentimento antes de editar
- **Privacidade**: Não armazene dados sensíveis sem permissão

---

**Sistema desenvolvido com ❤️ usando Gemini AI**
