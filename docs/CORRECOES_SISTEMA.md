# 🔧 Correções do Sistema

## ✅ Problemas Corrigidos

### 1. **CORS Error** ❌→✅
**Problema:** Access-Control-Allow-Origin bloqueando requisições

**Causa:** Servidor configurado apenas para porta 5173, mas frontend rodando na 3000

**Solução:**
```javascript
// whatsapp-bridge/server.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', STUDIO_URL],
  credentials: true
}));
```

### 2. **413 Payload Too Large** ❌→✅
**Problema:** Imagens muito grandes causando erro 413

**Causa:** Limite padrão do Express (100kb)

**Solução:**
```javascript
// Aumentar limite
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Comprimir imagens no frontend
const compressImage = (file) => {
  // Reduz para max 800x800
  // Qualidade JPEG 70%
  // Reduz tamanho em ~80%
};
```

### 3. **NaN Values** ❌→✅
**Problema:** Campos numéricos mostrando NaN

**Causa:** parseFloat/parseInt de strings vazias

**Solução:**
```javascript
// Usar estados separados para input
const [priceInput, setPriceInput] = useState('0');

// Validar antes de converter
const value = parseFloat(e.target.value);
setFormData({ ...formData, price: isNaN(value) ? 0 : value });
```

### 4. **404 Not Found** ❌→✅
**Problema:** APIs retornando 404

**Causa:** Servidor não está rodando

**Solução:**
```bash
cd whatsapp-bridge
npm start
```

---

## 🚀 Como Iniciar o Sistema

### Passo 1: Iniciar Backend
```bash
cd whatsapp-bridge
npm install  # Primeira vez
npm start
```

**Deve aparecer:**
```
✅ WhatsApp Bridge rodando na porta 3001
📡 Studio URL: http://localhost:5173
💾 Banco de dados SQLite inicializado
```

### Passo 2: Iniciar Frontend
```bash
# Em outro terminal
npm run dev
```

**Deve aparecer:**
```
VITE v6.x.x ready in xxx ms
➜ Local: http://localhost:3000
```

### Passo 3: Acessar
```
http://localhost:3000
```

---

## 🔍 Verificar se Está Funcionando

### 1. Backend Rodando
```bash
curl http://localhost:3001/api/stats
```

**Deve retornar JSON com estatísticas**

### 2. CORS Funcionando
Abrir console do navegador (F12)
- ❌ Se ver erros de CORS: Backend não está rodando
- ✅ Se não ver erros: Tudo OK

### 3. APIs Respondendo
No painel admin, verificar:
- Dashboard carrega métricas
- CRM lista clientes
- Produtos aparecem
- Equipe carrega

---

## 🐛 Problemas Comuns

### Erro: "Cannot GET /"
**Causa:** Backend não está rodando
**Solução:** `cd whatsapp-bridge && npm start`

### Erro: "EADDRINUSE: address already in use"
**Causa:** Porta 3001 já está em uso
**Solução:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Erro: "Module not found"
**Causa:** Dependências não instaladas
**Solução:**
```bash
cd whatsapp-bridge
npm install
```

### Imagens não aparecem
**Causa:** Base64 muito grande
**Solução:** Sistema já comprime automaticamente

### Banco de dados vazio
**Causa:** Primeira vez rodando
**Solução:** Usar botões "Gerar Dados de Exemplo"

---

## 📊 Monitoramento

### Ver Logs do Backend
```bash
cd whatsapp-bridge
npm start
# Logs aparecem no terminal
```

### Ver Logs do Frontend
```
F12 → Console
```

### Ver Banco de Dados
```bash
cd whatsapp-bridge/data
sqlite3 whatsapp.db
.tables
SELECT * FROM products;
```

---

## 🎯 Checklist de Funcionamento

- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Sem erros de CORS no console
- [ ] APIs respondendo (sem 404)
- [ ] Dashboard carregando métricas
- [ ] Produtos podem ser criados
- [ ] Imagens são comprimidas
- [ ] Banco SQLite criado

---

## 💡 Dicas

### Performance
- Imagens são comprimidas automaticamente
- Máximo 800x800 pixels
- Qualidade JPEG 70%
- Reduz ~80% do tamanho

### Desenvolvimento
- Use `npm run dev` para hot reload
- Backend reinicia automaticamente
- Frontend atualiza ao salvar

### Produção
- Aumentar limite se necessário: `limit: '100mb'`
- Usar CDN para imagens grandes
- Implementar upload para S3/Cloudinary

---

## 🔧 Configurações Avançadas

### Aumentar Limite de Upload
```javascript
// whatsapp-bridge/server.js
app.use(express.json({ limit: '100mb' }));
```

### Adicionar Mais Portas ao CORS
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://seu-dominio.com'
  ]
}));
```

### Comprimir Mais
```javascript
// Reduzir qualidade
canvas.toDataURL('image/jpeg', 0.5); // 50%

// Reduzir tamanho
const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;
```

---

## ✅ Sistema Funcionando

Quando tudo estiver OK, você verá:

**Backend:**
```
✅ WhatsApp Bridge rodando na porta 3001
📡 Studio URL: http://localhost:5173
💾 Banco de dados SQLite inicializado
```

**Frontend:**
```
VITE v6.x.x ready in xxx ms
➜ Local: http://localhost:3000
```

**Console (F12):**
```
💾 Carregando dados do IndexedDB...
✅ Dados salvos no IndexedDB
📊 Dados carregados: X chats, Y projetos, Z itens
```

**Sem erros de:**
- ❌ CORS
- ❌ 404
- ❌ 413
- ❌ NaN

---

## 🎉 Tudo Funcionando!

Agora você pode:
- ✅ Criar produtos com fotos
- ✅ Editar imagens com IA
- ✅ Gerenciar equipe
- ✅ Fazer vendas
- ✅ Usar CRM
- ✅ Configurar automações

**Sistema 100% operacional!** 🚀

---

**Desenvolvido com 💙**
**Outubro 2025**
