/**
 * 🤖 PROX AI STUDIO - COMPUTER AUTOMATION BACKEND
 * 
 * AI-powered computer automation with vision and robotics
 * Controls mouse, keyboard, and screen based on AI analysis
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import robot from 'robotjs';
import screenshot from 'screenshot-desktop';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== CONFIGURATION ====================

const PORT = process.env.PORT || 3002;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SCREEN_WIDTH = parseInt(process.env.SCREEN_WIDTH) || 1920;
const SCREEN_HEIGHT = parseInt(process.env.SCREEN_HEIGHT) || 1080;
const GRID_COLS = parseInt(process.env.GRID_COLS) || 10;
const GRID_ROWS = parseInt(process.env.GRID_ROWS) || 8;

// ==================== EXPRESS + SOCKET.IO ====================

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ==================== GEMINI AI ====================

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp' // Melhor para visão
});

// ==================== GRID SYSTEM ====================

class ScreenGrid {
  constructor(width, height, cols, rows) {
    this.width = width;
    this.height = height;
    this.cols = cols;
    this.rows = rows;
    this.cellWidth = width / cols;
    this.cellHeight = height / rows;
    this.grid = this.generateGrid();
  }

  generateGrid() {
    const grid = {};
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const letter = letters[row];
        const number = col + 1;
        const zone = `${letter}${number}`;
        
        grid[zone] = {
          x: Math.floor(col * this.cellWidth + this.cellWidth / 2),
          y: Math.floor(row * this.cellHeight + this.cellHeight / 2),
          bounds: {
            left: Math.floor(col * this.cellWidth),
            top: Math.floor(row * this.cellHeight),
            right: Math.floor((col + 1) * this.cellWidth),
            bottom: Math.floor((row + 1) * this.cellHeight)
          }
        };
      }
    }
    
    return grid;
  }

  getZoneCoordinates(zone) {
    return this.grid[zone];
  }

  getAllZones() {
    return Object.keys(this.grid);
  }

  drawGridOnImage(imageBuffer) {
    // Desenha grid na imagem para visualização
    return sharp(imageBuffer)
      .composite(this.generateGridOverlay())
      .toBuffer();
  }

  generateGridOverlay() {
    // Gera SVG do grid
    const lines = [];
    
    // Linhas verticais
    for (let i = 1; i < this.cols; i++) {
      const x = Math.floor(i * this.cellWidth);
      lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${this.height}" stroke="rgba(255,0,0,0.3)" stroke-width="2"/>`);
    }
    
    // Linhas horizontais
    for (let i = 1; i < this.rows; i++) {
      const y = Math.floor(i * this.cellHeight);
      lines.push(`<line x1="0" y1="${y}" x2="${this.width}" y2="${y}" stroke="rgba(255,0,0,0.3)" stroke-width="2"/>`);
    }
    
    // Labels
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = Math.floor(col * this.cellWidth + 10);
        const y = Math.floor(row * this.cellHeight + 25);
        const label = `${letters[row]}${col + 1}`;
        lines.push(`<text x="${x}" y="${y}" fill="rgba(255,0,0,0.8)" font-size="16" font-weight="bold">${label}</text>`);
      }
    }
    
    const svg = `
      <svg width="${this.width}" height="${this.height}">
        ${lines.join('\n')}
      </svg>
    `;
    
    return [{ input: Buffer.from(svg), top: 0, left: 0 }];
  }
}

const screenGrid = new ScreenGrid(SCREEN_WIDTH, SCREEN_HEIGHT, GRID_COLS, GRID_ROWS);

// ==================== AUTOMATION ENGINE ====================

class AutomationEngine {
  constructor() {
    this.isRunning = false;
    this.history = [];
    this.maxHistory = 50;
  }

  async captureScreen() {
    try {
      const img = await screenshot({ format: 'png' });
      return img;
    } catch (error) {
      console.error('❌ Screenshot error:', error);
      throw error;
    }
  }

  async analyzeScreen(imageBuffer, task = null) {
    try {
      // Converte imagem para base64
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = task 
        ? `Analyze this screen and determine which zone to interact with to: ${task}

The screen is divided into a grid with zones labeled A1-A${GRID_COLS}, B1-B${GRID_COLS}, etc.

Respond in JSON format:
{
  "target_zone": "B3",
  "action": "click" | "type" | "scroll",
  "text": "text to type (if action is type)",
  "confidence": 0.95,
  "reasoning": "why this zone"
}`
        : `Analyze this screen and describe what you see. Identify clickable elements and their zones.

The screen is divided into a grid with zones labeled A1-A${GRID_COLS}, B1-B${GRID_COLS}, etc.

Respond in JSON format with all interactive elements you can identify.`;

      const result = await visionModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image
          }
        }
      ]);

      const text = result.response.text();
      
      // Extrai JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { error: 'No JSON found in response', raw: text };
    } catch (error) {
      console.error('❌ AI Analysis error:', error);
      throw error;
    }
  }

  async executeAction(action) {
    try {
      const { target_zone, action: actionType, text, confidence } = action;
      
      if (confidence < 0.7) {
        console.warn('⚠️ Low confidence action:', confidence);
      }

      const coords = screenGrid.getZoneCoordinates(target_zone);
      if (!coords) {
        throw new Error(`Invalid zone: ${target_zone}`);
      }

      console.log(`🎯 Executing ${actionType} at zone ${target_zone} (${coords.x}, ${coords.y})`);

      switch (actionType) {
        case 'click':
          robot.moveMouse(coords.x, coords.y);
          await this.sleep(100);
          robot.mouseClick();
          break;

        case 'double_click':
          robot.moveMouse(coords.x, coords.y);
          await this.sleep(100);
          robot.mouseClick('left', true);
          break;

        case 'right_click':
          robot.moveMouse(coords.x, coords.y);
          await this.sleep(100);
          robot.mouseClick('right');
          break;

        case 'type':
          robot.moveMouse(coords.x, coords.y);
          await this.sleep(100);
          robot.mouseClick();
          await this.sleep(200);
          robot.typeString(text || '');
          break;

        case 'scroll_down':
          robot.moveMouse(coords.x, coords.y);
          await this.sleep(100);
          robot.scrollMouse(0, -3);
          break;

        case 'scroll_up':
          robot.moveMouse(coords.x, coords.y);
          await this.sleep(100);
          robot.scrollMouse(0, 3);
          break;

        default:
          throw new Error(`Unknown action: ${actionType}`);
      }

      this.addToHistory({
        timestamp: Date.now(),
        action,
        success: true
      });

      return { success: true, action };
    } catch (error) {
      console.error('❌ Action execution error:', error);
      this.addToHistory({
        timestamp: Date.now(),
        action,
        success: false,
        error: error.message
      });
      throw error;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  addToHistory(entry) {
    this.history.unshift(entry);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

const automationEngine = new AutomationEngine();

// ==================== API ENDPOINTS ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'prox-automation-backend',
    version: '1.0.0'
  });
});

// Get screen grid info
app.get('/api/grid', (req, res) => {
  res.json({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    cols: GRID_COLS,
    rows: GRID_ROWS,
    zones: screenGrid.getAllZones(),
    grid: screenGrid.grid
  });
});

// Capture screenshot
app.get('/api/screenshot', async (req, res) => {
  try {
    const withGrid = req.query.grid === 'true';
    let img = await automationEngine.captureScreen();
    
    if (withGrid) {
      img = await screenGrid.drawGridOnImage(img);
    }
    
    res.set('Content-Type', 'image/png');
    res.send(img);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze screen
app.post('/api/analyze', async (req, res) => {
  try {
    const { task, image } = req.body;
    
    let imageBuffer;
    if (image) {
      // Use provided image
      imageBuffer = Buffer.from(image, 'base64');
    } else {
      // Capture screen
      imageBuffer = await automationEngine.captureScreen();
    }
    
    const analysis = await automationEngine.analyzeScreen(imageBuffer, task);
    
    res.json({
      success: true,
      analysis,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Execute action
app.post('/api/execute', async (req, res) => {
  try {
    const action = req.body;
    const result = await automationEngine.executeAction(action);
    
    res.json({
      success: true,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Full automation cycle
app.post('/api/automate', async (req, res) => {
  try {
    const { task } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }
    
    // 1. Capture screen
    console.log('📸 Capturing screen...');
    const imageBuffer = await automationEngine.captureScreen();
    
    // 2. Analyze with AI
    console.log('🤖 Analyzing with AI...');
    const analysis = await automationEngine.analyzeScreen(imageBuffer, task);
    
    // 3. Execute action
    console.log('⚡ Executing action...');
    const result = await automationEngine.executeAction(analysis);
    
    res.json({
      success: true,
      task,
      analysis,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get automation history
app.get('/api/history', (req, res) => {
  res.json({
    history: automationEngine.getHistory(),
    count: automationEngine.history.length
  });
});

// Clear history
app.delete('/api/history', (req, res) => {
  automationEngine.clearHistory();
  res.json({ success: true, message: 'History cleared' });
});

// Move mouse to zone
app.post('/api/mouse/move', (req, res) => {
  try {
    const { zone } = req.body;
    const coords = screenGrid.getZoneCoordinates(zone);
    
    if (!coords) {
      return res.status(400).json({ error: 'Invalid zone' });
    }
    
    robot.moveMouse(coords.x, coords.y);
    
    res.json({
      success: true,
      zone,
      coordinates: { x: coords.x, y: coords.y }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Click at zone
app.post('/api/mouse/click', (req, res) => {
  try {
    const { zone, button = 'left', double = false } = req.body;
    const coords = screenGrid.getZoneCoordinates(zone);
    
    if (!coords) {
      return res.status(400).json({ error: 'Invalid zone' });
    }
    
    robot.moveMouse(coords.x, coords.y);
    robot.mouseClick(button, double);
    
    res.json({
      success: true,
      zone,
      coordinates: { x: coords.x, y: coords.y },
      button,
      double
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Type text
app.post('/api/keyboard/type', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    robot.typeString(text);
    
    res.json({
      success: true,
      text,
      length: text.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Press key
app.post('/api/keyboard/press', (req, res) => {
  try {
    const { key, modifiers = [] } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    robot.keyTap(key, modifiers);
    
    res.json({
      success: true,
      key,
      modifiers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SOCKET.IO EVENTS ====================

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('start_automation', async (data) => {
    try {
      const { task } = data;
      console.log('🚀 Starting automation:', task);
      
      socket.emit('automation_status', { status: 'running', task });
      
      // Capture and analyze
      const imageBuffer = await automationEngine.captureScreen();
      const analysis = await automationEngine.analyzeScreen(imageBuffer, task);
      
      socket.emit('automation_analysis', analysis);
      
      // Execute
      const result = await automationEngine.executeAction(analysis);
      
      socket.emit('automation_complete', { success: true, result });
    } catch (error) {
      socket.emit('automation_error', { error: error.message });
    }
  });

  socket.on('stop_automation', () => {
    automationEngine.isRunning = false;
    socket.emit('automation_status', { status: 'stopped' });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ==================== START SERVER ====================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🤖 PROX AI STUDIO - AUTOMATION BACKEND               ║
╠════════════════════════════════════════════════════════╣
║  Status: ✅ Running                                    ║
║  Port: ${PORT}                                            ║
║  Frontend: ${FRONTEND_URL}                    ║
║                                                        ║
║  Grid: ${GRID_COLS}x${GRID_ROWS} (${screenGrid.getAllZones().length} zones)                              ║
║  Screen: ${SCREEN_WIDTH}x${SCREEN_HEIGHT}                                  ║
║                                                        ║
║  🎯 Ready to automate your computer!                  ║
╚════════════════════════════════════════════════════════╝
  `);
});

export { automationEngine, screenGrid };
