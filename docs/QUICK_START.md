# 🚀 Guia Rápido - Gemini Pro Studio

## Instalação em 3 Passos

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar API Key
Copie o arquivo de exemplo e adicione sua chave:
```bash
copy .env.example .env.local
```

Edite `.env.local` e adicione sua API key:
```
GEMINI_API_KEY=sua_chave_aqui
```

**Onde conseguir a API Key?**
👉 https://aistudio.google.com/app/apikey

### 3️⃣ Iniciar o App
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 🎯 Funcionalidades Principais

### 💬 Chat com IA
- Digite sua pergunta no campo de texto
- Use **Shift+Enter** para nova linha
- Clique em **Enviar** ou pressione **Enter**

### 🧠 Thinking Mode
- Ative o botão "Thinking Mode" no header
- A IA mostrará seu processo de raciocínio antes da resposta
- Ideal para problemas complexos

### 🎨 Gerar Imagens
1. Selecione o modelo **Imagen 4** ou **Flash Image**
2. Digite o prompt descrevendo a imagem
3. Escolha o aspect ratio (16:9, 1:1, etc.)
4. Clique em Gerar

### 🎬 Gerar Vídeos
1. Selecione o modelo **Veo 3.1 Fast**
2. Digite o prompt descrevendo o vídeo
3. (Opcional) Anexe uma imagem como referência
4. Escolha o aspect ratio
5. Aguarde a geração (pode levar alguns minutos)

### 🎤 Conversa ao Vivo
- Clique no ícone de microfone no header
- Permita acesso ao microfone
- Fale naturalmente com a IA
- A transcrição aparecerá em tempo real

### 📸 Anexar Imagens
- Clique no ícone de câmera
- Tire uma foto ou faça upload
- A imagem será enviada junto com seu prompt

### 🎙️ Transcrever Áudio
- Clique no ícone de microfone no input
- Grave sua mensagem
- O áudio será transcrito automaticamente

### 🔊 Text-to-Speech
- Passe o mouse sobre uma resposta da IA
- Clique no ícone de alto-falante
- Ouça a resposta em áudio

### 👤 Personas
Escolha uma persona especializada:
- **Gemini** - Assistente geral
- **Code Expert** - Especialista em programação
- **Creative Writer** - Escritor criativo
- **Business Consultant** - Consultor de negócios
- **UI/UX Designer** - Designer de interfaces
- **Marketing Specialist** - Especialista em marketing

### 📁 Projetos
1. Clique em "Projetos" na sidebar
2. Crie um novo projeto
3. Adicione arquivos ao contexto
4. Todas as conversas terão acesso aos arquivos do projeto

### 📚 Biblioteca
- Salve prompts frequentes
- Armazene snippets de código
- Crie personas customizadas
- Reutilize em qualquer conversa

### 🎨 Preview Interativo
Quando a IA gerar código HTML/CSS/JS:
- Clique em "Abrir Preview Interativo"
- Veja o resultado em tempo real
- Edite o código no Monaco Editor
- Abra em nova aba ou tela cheia

---

## ⚙️ Configurações Avançadas

### Ajustar Parâmetros do Modelo
Clique no ícone de engrenagem no header:
- **Temperature** (0-2): Criatividade das respostas
- **Top K** (1-100): Diversidade de tokens
- **Top P** (0-1): Probabilidade cumulativa
- **Max Tokens**: Tamanho máximo da resposta

### Atalhos de Teclado
- `Enter` - Enviar mensagem
- `Shift+Enter` - Nova linha
- `Esc` - Cancelar edição
- `Ctrl+/` - Abrir/fechar sidebar

---

## 🐛 Solução de Problemas

### "API Key not valid"
- Verifique se a chave está correta no `.env.local`
- Certifique-se de que a chave tem permissões ativas
- Gere uma nova chave se necessário

### "Quota exceeded"
- Você atingiu o limite de uso da API
- Aguarde o reset do quota ou upgrade seu plano

### Erro ao gerar vídeo
- Veo requer uma API key específica
- Verifique se sua conta tem acesso ao Veo
- Tente com um prompt mais simples

### App não carrega
```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Erro de localStorage
- O navegador pode ter atingido o limite de armazenamento
- Limpe o histórico: Settings > Clear browsing data
- O app limpará automaticamente conversas antigas

---

## 📊 Validar Instalação

Execute o script de validação:
```bash
npm run validate
```

Isso verificará:
- ✅ Todos os arquivos necessários
- ✅ Dependências instaladas
- ✅ Configuração da API key
- ✅ Sem arquivos duplicados

---

## 🆘 Precisa de Ajuda?

- 📖 Leia o [README.md](README.md) completo
- 📝 Veja o [CHANGELOG.md](CHANGELOG.md) para melhorias
- 🐛 Reporte bugs abrindo uma issue
- 💡 Sugestões são bem-vindas!

---

**Divirta-se explorando o poder do Gemini! 🚀**
