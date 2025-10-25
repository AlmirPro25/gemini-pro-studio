# 📱 Guia Rápido - WhatsApp Integration

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Instalar (1 min)

```bash
cd whatsapp-bridge
npm install
```

### 2️⃣ Configurar (1 min)

```bash
cp .env.example .env
```

Edite `.env` e adicione sua API key:
```env
GEMINI_API_KEY=sua_chave_aqui
```

### 3️⃣ Iniciar (1 min)

```bash
npm start
```

### 4️⃣ Conectar WhatsApp (2 min)

1. QR Code aparece no terminal
2. Abra WhatsApp no celular
3. Menu → Aparelhos conectados
4. Escaneie o QR Code
5. ✅ Pronto!

## 💬 Testar

Envie para seu WhatsApp:

```
/help
```

Resposta:
```
📱 Comandos Disponíveis:
/help - Mostra lista de comandos
/persona [nome] - Muda a persona ativa
/curriculo - Inicia criação de currículo
...
```

## 🎯 Exemplos Rápidos

### Criar Currículo

```
Você: /curriculo
Bot: Qual template? (1-Modern, 2-Elegant, 3-Creative)

Você: 1
Bot: Qual seu nome completo?

Você: João Silva
Bot: [continua...]
```

### Mudar Persona

```
Você: /persona ML Architect
Bot: ✅ Persona alterada para: ML Architect

Você: Como treinar uma rede neural?
Bot: [responde como especialista em ML]
```

### Gerar Imagem

```
Você: /imagem um gato astronauta
Bot: 🎨 Imagem gerada!
[envia imagem]
```

### Analisar Imagem

```
Você: [envia foto]
     O que tem nesta imagem?
Bot: [analisa e descreve]
```

## 🖥️ Painel Web

### Acessar

1. Abra Gemini Pro Studio
2. Clique em "📱 WhatsApp"
3. Veja todas as conversas
4. Envie mensagens pelo painel

## 🔧 Comandos Úteis

```bash
# Iniciar
npm start

# Modo desenvolvimento (auto-reload)
npm run dev

# Limpar sessão (se der problema)
rm -rf .wwebjs_auth
npm start

# Ver logs
# (já aparecem no terminal)
```

## 🐛 Problemas Comuns

### QR não aparece
```bash
rm -rf .wwebjs_auth
npm start
```

### Desconecta
- Mantenha WhatsApp aberto no celular
- Verifique internet

### Mensagens não chegam
- Verifique se bridge está rodando
- Veja logs no terminal

## 📊 Status

Verificar se está funcionando:

```
Você: /status
Bot: 📊 Status do Sistema
     🎭 Persona: Gemini Pro
     💬 Mensagens: 5
     ✅ Sistema operacional!
```

## 🎓 Próximos Passos

1. ✅ Teste todos os comandos
2. ✅ Crie um currículo via WhatsApp
3. ✅ Experimente diferentes personas
4. ✅ Analise imagens
5. ✅ Use o painel web

## 💡 Dicas

- Use `/help` para ver comandos
- Converse normalmente (sem comandos)
- Envie imagens para análise
- Use painel web para gerenciar múltiplas conversas

## 📚 Documentação Completa

- **Guia Completo**: `docs/INTEGRACAO_WHATSAPP.md`
- **README Técnico**: `whatsapp-bridge/README.md`

---

**Pronto! Agora você tem WhatsApp + IA integrados! 🎉**
