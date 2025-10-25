# 📘 Exemplos Práticos - Banco de Dados

## 🎯 Casos de Uso Comuns

### 1. Ver Histórico de Conversas (Backend)

```javascript
// No server.js ou em um script separado
const db = require('./database');

// Ver últimas 50 mensagens
const messages = db.getMessages('default', 50, 0);
console.log('Últimas mensagens:', messages);

// Ver mensagens de um contato específico
const contactMessages = db.getMessagesByContact('default', '5511999999999', 100);
console.log('Mensagens do contato:', contactMessages);

// Ver estatísticas
const stats = db.getStats('default');
console.log('Estatísticas:', stats);
// {
//   totalMessages: 1523,
//   sentMessages: 842,
//   receivedMessages: 681,
//   totalContacts: 45
// }
```

### 2. Buscar Mensagens por Palavra-Chave

```javascript
// Adicionar no database.js
const searchMessages = (sessionId, keyword, limit = 50) => {
  const stmt = db.prepare(`
    SELECT * FROM messages 
    WHERE session_id = ? 
    AND content LIKE ?
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  return stmt.all(sessionId, `%${keyword}%`, limit);
};

// Usar
const results = searchMessages('default', 'reunião', 50);
console.log('Mensagens com "reunião":', results);
```

### 3. Exportar Conversas para Análise

```javascript
// Script: export-conversations.js
const db = require('./database');
const fs = require('fs');

const exportToCSV = () => {
  const messages = db.getMessages('default', 10000, 0);
  
  let csv = 'Data,De,Para,Tipo,Conteúdo\n';
  
  messages.forEach(msg => {
    const row = [
      msg.timestamp,
      msg.from_number,
      msg.to_number,
      msg.message_type,
      `"${msg.content?.replace(/"/g, '""') || ''}"`
    ].join(',');
    csv += row + '\n';
  });
  
  fs.writeFileSync('mensagens.csv', csv);
  console.log('✅ Exportado para mensagens.csv');
};

exportToCSV();
```

### 4. Relatório Diário de Atividades

```javascript
// Adicionar no database.js
const getDailyReport = (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_from_me = 1 THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN is_from_me = 0 THEN 1 ELSE 0 END) as received,
      COUNT(DISTINCT from_number) as unique_contacts
    FROM messages 
    WHERE timestamp BETWEEN ? AND ?
  `);
  
  return stmt.get(startOfDay.toISOString(), endOfDay.toISOString());
};

// Usar
const report = getDailyReport();
console.log('Relatório de hoje:', report);
```

### 5. Top Contatos Mais Ativos

```javascript
// Adicionar no database.js
const getTopContacts = (limit = 10) => {
  const stmt = db.prepare(`
    SELECT 
      c.name,
      c.phone_number,
      COUNT(m.id) as message_count,
      MAX(m.timestamp) as last_message
    FROM contacts c
    LEFT JOIN messages m ON (c.phone_number = m.from_number OR c.phone_number = m.to_number)
    GROUP BY c.phone_number
    ORDER BY message_count DESC
    LIMIT ?
  `);
  
  return stmt.all(limit);
};

// Usar
const topContacts = getTopContacts(10);
console.log('Top 10 contatos:', topContacts);
```

### 6. Salvar Dados do Frontend no Backend

```typescript
// No frontend (React)
import { dbService } from './services/databaseService';

// Salvar chat importante
const saveImportantChat = async (chatId: string) => {
  const chat = await dbService.getChat(chatId);
  
  // Enviar para backend
  await fetch('http://localhost:3001/api/backup/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chat)
  });
  
  console.log('✅ Chat salvo no backend');
};
```

### 7. Sincronizar Imagens Geradas

```typescript
// No frontend
import { dbService } from './services/databaseService';

// Salvar imagem gerada
const saveGeneratedImage = async (prompt: string, imageData: string) => {
  await dbService.saveImage({
    id: `img_${Date.now()}`,
    prompt,
    imageData,
    mimeType: 'image/png',
    createdAt: Date.now(),
    metadata: {
      model: 'imagen-4.0',
      aspectRatio: '1:1'
    }
  });
  
  console.log('✅ Imagem salva no IndexedDB');
};

// Listar todas as imagens
const listImages = async () => {
  const images = await dbService.getAllImages();
  console.log(`Total de imagens: ${images.length}`);
  
  images.forEach(img => {
    console.log(`- ${img.prompt} (${new Date(img.createdAt).toLocaleDateString()})`);
  });
};
```

### 8. Backup Automático

```javascript
// Script: auto-backup.js
const db = require('./database');
const fs = require('fs');
const path = require('path');

const createBackup = () => {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  // Exportar dados
  const data = {
    messages: db.getMessages('default', 100000, 0),
    contacts: db.getAllContacts(),
    sessions: db.getAllSessions(),
    logs: db.getEventLogs(1000),
    exportedAt: new Date().toISOString()
  };
  
  const filename = `backup-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✅ Backup criado: ${filename}`);
  
  // Limpar backups antigos (manter últimos 7 dias)
  const files = fs.readdirSync(backupDir);
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  files.forEach(file => {
    const filepath = path.join(backupDir, file);
    const stats = fs.statSync(filepath);
    
    if (stats.mtimeMs < sevenDaysAgo) {
      fs.unlinkSync(filepath);
      console.log(`🗑️ Backup antigo removido: ${file}`);
    }
  });
};

// Executar backup
createBackup();

// Agendar backup diário (adicionar no server.js)
setInterval(createBackup, 24 * 60 * 60 * 1000); // A cada 24h
```

### 9. Dashboard de Analytics

```javascript
// Adicionar endpoint no server.js
app.get('/api/analytics', async (req, res) => {
  try {
    const stats = db.getStats('default');
    const topContacts = getTopContacts(5);
    const recentLogs = db.getEventLogs(10);
    
    // Mensagens por dia (últimos 7 dias)
    const messagesPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const report = getDailyReport(date);
      messagesPerDay.push({
        date: date.toISOString().split('T')[0],
        ...report
      });
    }
    
    res.json({
      stats,
      topContacts,
      recentLogs,
      messagesPerDay
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 10. Limpar Dados Antigos

```javascript
// Script: cleanup.js
const db = require('./database');

const cleanupOldData = (daysToKeep = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const stmt = db.db.prepare(`
    DELETE FROM messages 
    WHERE timestamp < ?
  `);
  
  const result = stmt.run(cutoffDate.toISOString());
  console.log(`🗑️ ${result.changes} mensagens antigas removidas`);
  
  // Limpar logs antigos
  const logStmt = db.db.prepare(`
    DELETE FROM event_logs 
    WHERE created_at < ?
  `);
  
  const logResult = logStmt.run(cutoffDate.toISOString());
  console.log(`🗑️ ${logResult.changes} logs antigos removidos`);
  
  // Vacuum para recuperar espaço
  db.db.exec('VACUUM');
  console.log('✅ Banco de dados otimizado');
};

// Executar
cleanupOldData(90); // Manter últimos 90 dias
```

## 🔧 Ferramentas Úteis

### Ver Banco SQLite no Terminal

```bash
# Instalar sqlite3
npm install -g sqlite3

# Abrir banco
sqlite3 whatsapp-bridge/data/whatsapp.db

# Comandos úteis
.tables                    # Listar tabelas
.schema messages          # Ver estrutura da tabela
SELECT COUNT(*) FROM messages;  # Contar mensagens
.quit                     # Sair
```

### Ver IndexedDB no Navegador

1. Abrir DevTools (F12)
2. Ir em "Application" > "Storage" > "IndexedDB"
3. Expandir "GeminiProStudio"
4. Explorar os dados

### Exportar Tudo

```bash
# Backend
curl http://localhost:3001/api/db/export > backup-backend.json

# Frontend (no console do navegador)
const data = await dbService.exportData();
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'backup-frontend.json';
a.click();
```

## 📊 Queries Úteis

```sql
-- Mensagens por hora do dia
SELECT 
  strftime('%H', timestamp) as hour,
  COUNT(*) as count
FROM messages
GROUP BY hour
ORDER BY hour;

-- Contatos sem mensagens recentes (30 dias)
SELECT c.* 
FROM contacts c
LEFT JOIN messages m ON c.phone_number = m.from_number
WHERE m.timestamp < datetime('now', '-30 days')
OR m.id IS NULL;

-- Taxa de resposta
SELECT 
  COUNT(CASE WHEN is_from_me = 0 THEN 1 END) as received,
  COUNT(CASE WHEN is_from_me = 1 THEN 1 END) as sent,
  ROUND(
    CAST(COUNT(CASE WHEN is_from_me = 1 THEN 1 END) AS FLOAT) / 
    COUNT(CASE WHEN is_from_me = 0 THEN 1 END) * 100, 
    2
  ) as response_rate_percent
FROM messages;
```

## 🎓 Dicas

1. **Performance**: Use índices para queries frequentes
2. **Backup**: Faça backup regular dos dados
3. **Limpeza**: Remova dados antigos periodicamente
4. **Monitoramento**: Acompanhe o tamanho do banco
5. **Segurança**: Não exponha endpoints sensíveis publicamente
