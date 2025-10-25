# 🎤 Correção: Envio de Áudio WhatsApp

## Problema Identificado

**Erro:** `Evaluation failed: b`

### Causa
O erro ocorria ao tentar enviar áudios grandes via base64 diretamente no Puppeteer. O WhatsApp Web.js tem limitações ao processar strings base64 muito grandes através do `page.evaluate()`.

## Solução Implementada

### 1. Novo Endpoint Específico para Áudio

Criado endpoint `/api/send-audio` que:
- Salva o áudio temporariamente no sistema de arquivos
- Usa `MessageMedia.fromFilePath()` ao invés de base64 direto
- Remove o arquivo temporário após o envio
- Envia como PTT (Push to Talk) com `sendAudioAsVoice: true`

```javascript
// whatsapp-bridge/server.js
app.post("/api/send-audio", async (req, res) => {
  const { to, audioBase64 } = req.body;
  
  // Salva temporariamente
  const tempFilePath = path.join(os.tmpdir(), `audio_${Date.now()}.ogg`);
  fs.writeFileSync(tempFilePath, base64Data, 'base64');
  
  // Cria mídia do arquivo
  const media = MessageMedia.fromFilePath(tempFilePath);
  
  // Envia como áudio de voz
  await whatsappClient.sendMessage(chatId, media, {
    sendAudioAsVoice: true
  });
  
  // Remove arquivo temporário
  fs.unlinkSync(tempFilePath);
});
```

### 2. Frontend Atualizado

O `WhatsAppBusinessPanel.tsx` agora usa o novo endpoint:

```typescript
const response = await fetch(`${BRIDGE_URL}/api/send-audio`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: selectedChat!.id,
    audioBase64: base64
  })
});
```

## Vantagens da Solução

✅ **Sem limite de tamanho**: Arquivos grandes não causam mais erro  
✅ **Mais rápido**: Puppeteer não precisa processar base64 gigante  
✅ **Mais confiável**: Usa API nativa do WhatsApp Web.js  
✅ **Limpo**: Remove arquivos temporários automaticamente  
✅ **PTT correto**: Áudio aparece como mensagem de voz no WhatsApp  

## Fluxo Completo

1. **Usuário grava áudio** → Segurar botão do microfone
2. **Frontend converte** → Blob para base64
3. **Envia para backend** → POST `/api/send-audio`
4. **Backend salva temporariamente** → `/tmp/audio_123456.ogg`
5. **Cria MessageMedia** → Do arquivo salvo
6. **Envia via WhatsApp** → Como PTT (áudio de voz)
7. **Remove arquivo** → Limpeza automática
8. **Salva no banco** → Histórico completo

## Testado e Funcionando

- ✅ Áudios curtos (< 10s)
- ✅ Áudios médios (10-60s)
- ✅ Áudios longos (> 60s)
- ✅ Cancelamento de gravação
- ✅ Interface igual ao WhatsApp
- ✅ Aparece como áudio de voz no celular

## Próximos Passos

- [ ] Adicionar compressão de áudio (opcional)
- [ ] Suporte a outros formatos (mp3, m4a)
- [ ] Limite de tempo máximo (ex: 5 minutos)
- [ ] Indicador de progresso para áudios grandes
