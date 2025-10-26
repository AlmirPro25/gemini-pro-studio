# 🚀 GUIA DE DEPLOY

## Arquitetura de Deploy

```
Frontend (React) → Vercel (GRÁTIS)
Backend (WhatsApp) → Railway/Render (GRÁTIS)
```

---

## 📦 OPÇÃO 1: Frontend na Vercel

### Passo 1: Instalar Vercel CLI
```bash
npm i -g vercel
```

### Passo 2: Login
```bash
vercel login
```

### Passo 3: Deploy
```bash
vercel --prod
```

### Passo 4: Configurar Variáveis
No dashboard da Vercel:
- `VITE_WHATSAPP_BRIDGE_URL` = URL do seu backend

**Pronto!** Frontend no ar em 2 minutos.

---

## 🔧 OPÇÃO 2: Backend no Railway (RECOMENDADO)

### Por que Railway?
- ✅ Grátis (500h/mês)
- ✅ Suporta WebSocket
- ✅ Conexão persistente
- ✅ Fácil de usar

### Passo 1: Criar conta
https://railway.app/

### Passo 2: Novo Projeto
- "New Project" → "Deploy from GitHub"
- Selecione seu repositório
- Selecione pasta `whatsapp-bridge`

### Passo 3: Configurar Variáveis
```
GEMINI_API_KEY=sua_chave
WHATSAPP_BRIDGE_PORT=3001
STUDIO_URL=https://seu-app.vercel.app
```

### Passo 4: Deploy
Railway faz automaticamente!

**URL gerada:** `https://seu-app.railway.app`

---

## 🎨 OPÇÃO 3: Backend no Render

### Passo 1: Criar conta
https://render.com/

### Passo 2: Novo Web Service
- "New" → "Web Service"
- Conectar GitHub
- Selecionar repositório
- Root Directory: `whatsapp-bridge`

### Passo 3: Configurar
```
Build Command: npm install
Start Command: npm start
```

### Passo 4: Variáveis de Ambiente
```
GEMINI_API_KEY=sua_chave
WHATSAPP_BRIDGE_PORT=3001
STUDIO_URL=https://seu-app.vercel.app
```

### Passo 5: Deploy
Render faz automaticamente!

**Plano grátis:** 750h/mês

---

## 🐳 OPÇÃO 4: Docker (VPS/Cloud)

### Passo 1: Build
```bash
cd whatsapp-bridge
docker build -t whatsapp-bridge .
```

### Passo 2: Run
```bash
docker run -d \
  -p 3001:3001 \
  -e GEMINI_API_KEY=sua_chave \
  -e STUDIO_URL=https://seu-app.vercel.app \
  --name whatsapp-bridge \
  whatsapp-bridge
```

### Onde hospedar Docker:
- DigitalOcean ($5/mês)
- AWS EC2 (grátis 1 ano)
- Google Cloud Run (grátis até 2M req/mês)
- Azure Container Instances

---

## 💰 COMPARAÇÃO DE CUSTOS

| Serviço | Custo | Limite | Recomendado |
|---------|-------|--------|-------------|
| **Vercel** (Frontend) | Grátis | 100GB bandwidth | ✅ SIM |
| **Railway** (Backend) | Grátis | 500h/mês | ✅ SIM |
| **Render** (Backend) | Grátis | 750h/mês | ✅ SIM |
| **DigitalOcean** | $5/mês | Ilimitado | Para produção |
| **AWS EC2** | Grátis 1 ano | 750h/mês | Para aprender |

---

## 🎯 RECOMENDAÇÃO FINAL

### Para Começar (GRÁTIS):
1. **Frontend:** Vercel
2. **Backend:** Railway ou Render

### Para Produção:
1. **Frontend:** Vercel
2. **Backend:** DigitalOcean Droplet ($5/mês)

---

## 🔐 SEGURANÇA

### Variáveis de Ambiente
Nunca commite:
- `.env`
- `.env.local`
- API keys

### CORS
Configure no backend:
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'https://seu-app.vercel.app'
}));
```

---

## 📊 MONITORAMENTO

### Railway
- Dashboard mostra logs em tempo real
- Métricas de CPU/RAM
- Restart automático se cair

### Render
- Logs em tempo real
- Health checks
- Alertas por email

### Vercel
- Analytics integrado
- Logs de build
- Preview deployments

---

## 🐛 TROUBLESHOOTING

### Frontend não conecta no backend
- Verifique `VITE_WHATSAPP_BRIDGE_URL`
- Verifique CORS no backend
- Teste URL do backend direto

### WhatsApp não conecta
- Verifique logs do Railway/Render
- QR Code expira em 60s
- Pode precisar reescanear

### Build falha
- Verifique Node version (18+)
- Limpe cache: `npm clean-install`
- Verifique logs de erro

---

## ✅ CHECKLIST DE DEPLOY

Frontend:
- [ ] Build local funciona (`npm run build`)
- [ ] Variáveis configuradas
- [ ] Deploy na Vercel
- [ ] Teste no ar

Backend:
- [ ] Dockerfile funciona local
- [ ] Variáveis configuradas
- [ ] Deploy no Railway/Render
- [ ] WhatsApp conecta
- [ ] Teste integração

---

## 🚀 COMANDOS RÁPIDOS

### Deploy Frontend
```bash
vercel --prod
```

### Ver logs Backend (Railway)
```bash
railway logs
```

### Restart Backend (Railway)
```bash
railway restart
```

### Build Docker local
```bash
docker build -t whatsapp-bridge whatsapp-bridge/
docker run -p 3001:3001 whatsapp-bridge
```

---

**Pronto para deploy!** 🎉

Qualquer dúvida, consulte a documentação oficial:
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Render: https://render.com/docs
