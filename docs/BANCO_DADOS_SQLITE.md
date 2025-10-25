# 💾 Sistema de Banco de Dados SQLite

Sistema completo de persistência de dados usando SQLite3 para backend e IndexedDB para frontend.

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │         IndexedDB (databaseService.ts)            │  │
│  │  • Chats                                          │  │
│  │  • Projetos                                       │  │
│  │  • Biblioteca                                     │  │
│  │  • Imagens geradas                                │  │
│  │  • Personas customizadas                          │  │
│  │  • Configurações                                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (WhatsApp Bridge)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │         SQLite3 (database.js)                     │  │
│  │  • Sessões WhatsApp                               │  │
│  │  • Mensagens enviadas/recebidas                   │  │
│  │  • Contatos                                       │  │
│  │  • Grupos                                         │  │
│  │  • Logs de eventos                                │  │
│  │  • Estatísticas                                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🗄️ Backend - SQLite3

### Localização
```
whatsapp-bridge/data/whatsapp.db
```

### Tabelas

#### 1. whatsapp_sessions
Armazena informações sobre sessões WhatsApp conectadas.

```sql
CREATE TABLE whatsapp_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    status TEXT DEFAULT 'disconnected',
    qr_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_connected_at DATETIME
);
```

#### 2. contacts
Armazena contatos do WhatsApp.

```sql
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT,
    profile_pic_url TEXT,
    is_group INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. messages
Armazena todas as mensagens (enviadas e recebidas).

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    media_mimetype TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent',
    is_from_me INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(session_id)
);
```

#### 4. groups
Armazena informações sobre grupos.

```sql
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. group_members
Relaciona membros aos grupos.

```sql
CREATE TABLE group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id)
);
```

#### 6. event_logs
Registra eventos do sistema.

```sql
CREATE TABLE event_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    session_id TEXT,
    description TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### Estatísticas
```http
GET /api/stats
```
Retorna estatísticas gerais e sessões ativas.

#### Mensagens do Banco
```http
GET /api/db/messages?limit=100&offset=0
```
Lista mensagens com paginação.

#### Mensagens por Contato
```http
GET /api/db/messages/:contact?limit=100
```
Lista mensagens de um contato específico.

#### Contatos
```http
GET /api/db/contacts
```
Lista todos os contatos salvos.

#### Logs de Eventos
```http
GET /api/db/logs?limit=100&type=connection
```
Lista logs de eventos (opcional: filtrar por tipo).

#### Exportar Dados
```http
GET /api/db/export
```
Exporta todos os dados em JSON.

### Funções JavaScript

```javascript
const db = require('./database');

// Sessões
db.saveSession(sessionId, data);
db.updateSessionStatus(sessionId, 'connected');
db.getSession(sessionId);
db.getAllSessions();
db.deleteSession(sessionId);

// Mensagens
db.saveMessage(messageData);
db.getMessages(sessionId, limit, offset);
db.getMessagesByContact(sessionId, contactNumber, limit);
db.updateMessageStatus(messageId, 'delivered');

// Contatos
db.saveContact(contactData);
db.getContact(phoneNumber);
db.getAllContacts();

// Grupos
db.saveGroup(groupData);
db.addGroupMember(groupId, phoneNumber, 'admin');
db.getGroupMembers(groupId);

// Logs
db.logEvent('connection', sessionId, 'WhatsApp conectado');
db.getEventLogs(100, 'error');

// Estatísticas
db.getStats(sessionId);
```

## 🌐 Frontend - IndexedDB

### Localização
```
Browser IndexedDB: GeminiProStudio
```

### Object Stores

1. **chats** - Histórico de conversas
2. **projects** - Projetos com arquivos
3. **library** - Biblioteca de prompts/código
4. **images** - Imagens geradas
5. **personas** - Personas customizadas
6. **settings** - Configurações do app

### Uso no Código

```typescript
import { dbService } from './services/databaseService';

// Inicializar (automático)
await dbService.init();

// Chats
await dbService.saveChat(chat);
const chat = await dbService.getChat(chatId);
const allChats = await dbService.getAllChats();
await dbService.deleteChat(chatId);

// Projetos
await dbService.saveProject(project);
const project = await dbService.getProject(projectId);
const allProjects = await dbService.getAllProjects();

// Biblioteca
await dbService.saveLibraryItem(item);
const items = await dbService.getAllLibraryItems();

// Imagens
await dbService.saveImage(imageData);
const images = await dbService.getAllImages();

// Personas
await dbService.savePersona(persona);
const personas = await dbService.getAllPersonas();

// Configurações
await dbService.saveSetting('theme', 'dark');
const theme = await dbService.getSetting('theme');

// Utilitários
await dbService.clearAll(); // Limpar tudo
const json = await dbService.exportData(); // Exportar
await dbService.importData(json); // Importar
const size = await dbService.getStorageSize(); // Tamanho usado
```

## 🔄 Sincronização

### Automática
- Frontend salva automaticamente no IndexedDB
- Backend salva automaticamente no SQLite
- Cada sistema mantém seus próprios dados

### Manual
```typescript
// Exportar dados do frontend
const frontendData = await dbService.exportData();
console.log(frontendData);

// Exportar dados do backend
fetch('http://localhost:3001/api/db/export')
  .then(r => r.json())
  .then(data => console.log(data));
```

## 📈 Monitoramento

### Ver Estatísticas (Backend)
```bash
curl http://localhost:3001/api/stats
```

### Ver Tamanho do Banco (Frontend)
```typescript
const { used, quota } = await dbService.getStorageSize();
console.log(`Usando ${used} de ${quota} bytes`);
```

### Ver Logs (Backend)
```bash
curl http://localhost:3001/api/db/logs?limit=50
```

## 🛠️ Manutenção

### Backup do Backend
```bash
# Copiar arquivo do banco
cp whatsapp-bridge/data/whatsapp.db whatsapp-bridge/data/backup-$(date +%Y%m%d).db
```

### Limpar Dados Antigos
```javascript
// No backend (database.js), adicionar função:
const cleanOldMessages = (daysOld = 30) => {
  const stmt = db.prepare(`
    DELETE FROM messages 
    WHERE timestamp < datetime('now', '-${daysOld} days')
  `);
  return stmt.run();
};
```

### Resetar Banco (Backend)
```bash
rm whatsapp-bridge/data/whatsapp.db
# Reiniciar servidor - banco será recriado
```

### Resetar Banco (Frontend)
```typescript
await dbService.clearAll();
```

## 🔒 Segurança

- ✅ Dados armazenados localmente
- ✅ Sem envio para servidores externos
- ✅ IndexedDB isolado por domínio
- ✅ SQLite com foreign keys habilitadas
- ✅ Validação de dados antes de salvar

## 📊 Performance

### Índices Criados
```sql
-- Otimização de queries
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_from ON messages(from_number);
CREATE INDEX idx_messages_to ON messages(to_number);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_contacts_phone ON contacts(phone_number);
CREATE INDEX idx_event_logs_session ON event_logs(session_id);
CREATE INDEX idx_event_logs_type ON event_logs(event_type);
```

### Paginação
Sempre use `limit` e `offset` para queries grandes:
```javascript
const messages = db.getMessages('default', 100, 0); // Primeiras 100
const nextMessages = db.getMessages('default', 100, 100); // Próximas 100
```

## 🎯 Próximos Passos

- [ ] Adicionar sincronização entre frontend e backend
- [ ] Implementar backup automático
- [ ] Adicionar compressão de imagens antigas
- [ ] Criar dashboard de analytics
- [ ] Implementar busca full-text
- [ ] Adicionar exportação para CSV/Excel

## 📝 Notas

- O banco SQLite é criado automaticamente na primeira execução
- IndexedDB é criado automaticamente no primeiro acesso
- Dados persistem mesmo após fechar o navegador/servidor
- Ideal para desenvolvimento e uso pessoal
- Para produção em escala, considere PostgreSQL/MongoDB
