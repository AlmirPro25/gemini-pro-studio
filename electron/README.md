# 🖥️ Gemini Pro Studio - Electron App

App desktop completo com sistema de licenças, auto-update e WhatsApp Bridge integrado.

## 🚀 Desenvolvimento

### Instalar Dependências

```bash
cd electron
npm install
```

### Rodar em Desenvolvimento

```bash
# Terminal 1: Rodar Vite dev server
cd ..
npm run dev

# Terminal 2: Rodar Electron
cd electron
npm run dev
```

## 📦 Build

### Windows

```bash
npm run build:win
```

Gera:
- `Gemini-Pro-Studio-Setup-1.0.0.exe` (Instalador)
- `Gemini-Pro-Studio-Portable-1.0.0.exe` (Portátil)

### macOS

```bash
npm run build:mac
```

Gera:
- `Gemini-Pro-Studio-1.0.0.dmg` (Instalador)
- `Gemini-Pro-Studio-1.0.0-mac.zip` (ZIP)

### Linux

```bash
npm run build:linux
```

Gera:
- `Gemini-Pro-Studio-1.0.0.AppImage`
- `gemini-pro-studio_1.0.0_amd64.deb`
- `gemini-pro-studio-1.0.0.x86_64.rpm`

## 🔑 Sistema de Licenças

### Tipos de Licença

**Free (Grátis)**
- 1 agente IA
- 100 conversas/mês
- Funcionalidades básicas

**Pro (R$ 49/mês)**
- 5 agentes IA
- Conversas ilimitadas
- WhatsApp Integration
- Todas as funcionalidades

**Enterprise (R$ 199/mês)**
- Agentes ilimitados
- White label
- API access
- Suporte dedicado

### Formato da Chave

```
GPRO-XXXX-XXXX-XXXX
```

Exemplo: `GPRO-A1B2-C3D4-E5F6`

### Ativar Licença

No app:
1. Clique no ícone da bandeja
2. "Ativar Licença"
3. Cole a chave
4. Pronto!

Ou via código:
```javascript
await window.electronAPI.activateLicense('GPRO-XXXX-XXXX-XXXX', 'pro');
```

## 🎯 Funcionalidades

### Tray Icon
- Minimiza para bandeja
- Menu de contexto
- Notificações
- Status do WhatsApp Bridge

### WhatsApp Bridge
- Inicia automaticamente (se licença permitir)
- Controle via tray icon
- Logs em tempo real

### Auto-Update
- Verifica atualizações automaticamente
- Download em background
- Instala ao reiniciar

### Deep Links
- `geminipro://` protocol
- Abrir conversas específicas
- Integração com outros apps

## 📁 Estrutura

```
electron/
├── main.js              # Processo principal
├── preload.js           # Bridge segura
├── package.json         # Config do Electron
├── icon.png             # Ícone do app
├── tray-icon.png        # Ícone da bandeja
└── build/               # Assets para build
    ├── icon.ico         # Windows
    ├── icon.icns        # macOS
    └── icon.png         # Linux
```

## 🔒 Segurança

- Context Isolation ✅
- Node Integration desabilitado ✅
- Preload script seguro ✅
- CSP headers ✅
- Sandbox mode ✅

## 📊 Tamanho dos Builds

- Windows: ~150MB (instalador), ~200MB (instalado)
- macOS: ~180MB (DMG), ~220MB (instalado)
- Linux: ~160MB (AppImage)

## 🚀 Distribuição

### GitHub Releases

1. Crie release no GitHub
2. Faça upload dos instaladores
3. Auto-update funcionará automaticamente

### Site Próprio

1. Hospede os instaladores
2. Configure `publish` no package.json
3. Implemente servidor de updates

## 💡 Dicas

### Reduzir Tamanho

```json
"build": {
  "asar": true,
  "compression": "maximum"
}
```

### Debug

```bash
# Ver logs
npm run dev

# Inspecionar
Ctrl+Shift+I (no app)
```

### Assinatura de Código

**Windows:**
```bash
# Precisa de certificado
electron-builder --win --publish never
```

**macOS:**
```bash
# Precisa de Apple Developer Account
electron-builder --mac --publish never
```

## 🎓 Próximos Passos

1. [ ] Adicionar ícones (icon.png, icon.ico, icon.icns)
2. [ ] Configurar auto-update server
3. [ ] Implementar sistema de licenças no backend
4. [ ] Adicionar analytics
5. [ ] Criar landing page
6. [ ] Setup CI/CD para builds automáticos

## 📚 Recursos

- [Electron Docs](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [Auto Update](https://www.electron.build/auto-update)

---

**🎉 App pronto para distribuição!**
