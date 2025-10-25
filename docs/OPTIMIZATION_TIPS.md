# 🚀 Dicas de Otimização

## Performance

### 1. Lazy Loading de Componentes
```typescript
// Ao invés de:
import { LibraryView } from './components/LibraryView';

// Use:
const LibraryView = React.lazy(() => import('./components/LibraryView'));
```

### 2. Virtual Scrolling para Mensagens
Para históricos muito longos, considere usar `react-window`:
```bash
npm install react-window
```

### 3. Debounce em Inputs
```typescript
import { useMemo } from 'react';
import debounce from 'lodash.debounce';

const debouncedSearch = useMemo(
  () => debounce((value) => setSearchTerm(value), 300),
  []
);
```

### 4. Compressão de Imagens
Antes de salvar imagens no localStorage:
```typescript
const compressImage = async (base64: string): Promise<string> => {
  const img = new Image();
  img.src = base64;
  await img.decode();
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Reduzir tamanho mantendo aspect ratio
  const maxWidth = 800;
  const scale = maxWidth / img.width;
  canvas.width = maxWidth;
  canvas.height = img.height * scale;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
};
```

## Acessibilidade

### 1. Adicionar ARIA Labels
```typescript
<button 
  aria-label="Enviar mensagem"
  aria-disabled={isLoading}
>
  <i className="fa-solid fa-paper-plane" />
</button>
```

### 2. Navegação por Teclado
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') handleClose();
  if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
};
```

### 3. Focus Management
```typescript
useEffect(() => {
  if (isModalOpen) {
    modalRef.current?.focus();
  }
}, [isModalOpen]);
```

## SEO e Meta Tags

Adicione no `index.html`:
```html
<meta name="description" content="Interface completa para Gemini AI">
<meta name="keywords" content="gemini, ai, chatbot, image generation">
<meta property="og:title" content="Gemini Pro Studio">
<meta property="og:description" content="Chat com IA, geração de imagens e vídeos">
<meta property="og:image" content="/og-image.png">
```

## Segurança

### 1. Content Security Policy
Adicione no `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; 
               style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;">
```

### 2. Sanitização de HTML
```typescript
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput);
```

### 3. Rate Limiting
```typescript
const rateLimiter = {
  requests: 0,
  resetTime: Date.now() + 60000,
  
  canMakeRequest(): boolean {
    if (Date.now() > this.resetTime) {
      this.requests = 0;
      this.resetTime = Date.now() + 60000;
    }
    
    if (this.requests >= 10) {
      return false;
    }
    
    this.requests++;
    return true;
  }
};
```

## Monitoramento

### 1. Error Tracking com Sentry
```bash
npm install @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 2. Analytics
```typescript
const trackEvent = (eventName: string, properties?: object) => {
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }
};

// Uso:
trackEvent('message_sent', { model: selectedModel.id });
```

### 3. Performance Monitoring
```typescript
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
};
```

## Build Optimization

### 1. Code Splitting
No `vite.config.ts`:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'gemini-vendor': ['@google/genai'],
          'editor': ['monaco-editor'],
        }
      }
    }
  }
});
```

### 2. Compression
```bash
npm install vite-plugin-compression
```

```typescript
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress' })
  ]
});
```

### 3. Tree Shaking
Certifique-se de importar apenas o necessário:
```typescript
// ❌ Ruim
import * as _ from 'lodash';

// ✅ Bom
import debounce from 'lodash/debounce';
```

## Caching

### 1. Service Worker
Crie `public/sw.js`:
```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/index.js',
        '/assets/index.css'
      ]);
    })
  );
});
```

### 2. IndexedDB para Dados Grandes
```typescript
import { openDB } from 'idb';

const db = await openDB('gemini-studio', 1, {
  upgrade(db) {
    db.createObjectStore('chats');
    db.createObjectStore('images');
  }
});

// Salvar
await db.put('chats', chatData, chatId);

// Recuperar
const chat = await db.get('chats', chatId);
```

## Testing

### 1. Unit Tests
```bash
npm install -D vitest @testing-library/react
```

```typescript
import { render, screen } from '@testing-library/react';
import { Message } from './Message';

test('renders message content', () => {
  render(<Message message={{ content: 'Hello' }} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### 2. E2E Tests
```bash
npm install -D playwright
```

```typescript
import { test, expect } from '@playwright/test';

test('send message', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('textarea', 'Hello AI');
  await page.click('button[type="submit"]');
  await expect(page.locator('.message')).toContainText('Hello AI');
});
```

## Deploy

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
Crie `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

**Implemente essas otimizações gradualmente e meça o impacto!** 📊
