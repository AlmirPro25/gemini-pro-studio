# 💾 Guia de Implementação - Backend (API + Banco)

## 📦 Setup Inicial

```bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv sqlite3 jsonwebtoken bcryptjs multer
npm install -D typescript @types/express @types/node ts-node nodemon
```

## 🔧 Estrutura

```
backend/
├── src/
│   ├── server.ts
│   ├── config/
│   │   └── database.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── zones.ts
│   │   └── reports.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── eventsController.ts
│   │   └── zonesController.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Event.ts
│   │   └── Zone.ts
│   └── middleware/
│       └── auth.ts
├── uploads/
├── package.json
└── tsconfig.json
```

## 🚀 Server Principal (src/server.ts)

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import authRoutes from './routes/auth';
import eventsRoutes from './routes/events';
import zonesRoutes from './routes/zones';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/zones', zonesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Initialize
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
  });
});
```

## 💾 Database (src/config/database.ts)

```typescript
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./deepvision.db');

export const initDatabase = async () => {
  const run = promisify(db.run.bind(db));

  // Users
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events
  await run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      video_url TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Zones
  await run(`
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      coordinates TEXT NOT NULL,
      rules TEXT,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database initialized');
};

export default db;
```

## 🔐 Auth Routes (src/routes/auth.ts)

```typescript
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
    [email, hashedPassword, name],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email já existe' });
      }

      const token = jwt.sign(
        { userId: this.lastID },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      res.json({ token, userId: this.lastID });
    }
  );
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user: any) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      res.json({ token, userId: user.id, name: user.name });
    }
  );
});

export default router;
```

## 📊 Events Routes (src/routes/events.ts)

```typescript
import express from 'express';
import db from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all events
router.get('/', authMiddleware, (req, res) => {
  const { limit = 100, type, severity } = req.query;

  let query = 'SELECT * FROM events WHERE 1=1';
  const params: any[] = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create event
router.post('/', authMiddleware, (req, res) => {
  const { type, severity, title, description, image_url, metadata } = req.body;

  db.run(
    `INSERT INTO events (type, severity, title, description, image_url, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [type, severity, title, description, image_url, JSON.stringify(metadata)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

export default router;
```

## 🔗 Frontend Integration

```typescript
// src/services/apiService.ts
const API_URL = 'http://localhost:3001/api';

export const apiService = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async getEvents(token: string) {
    const res = await fetch(`${API_URL}/events`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async createEvent(token: string, event: any) {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(event)
    });
    return res.json();
  }
};
```

## 🚀 Executar

```bash
# Backend
cd backend
npm run dev

# Frontend
npm run dev
```

## ✅ Funcionalidades

- Autenticação JWT
- CRUD de eventos
- CRUD de zonas
- Upload de vídeos
- API REST completa
- Banco SQLite
