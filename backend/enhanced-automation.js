/**
 * 🚀 PROX AI STUDIO - ENHANCED AUTOMATION BACKEND
 * 
 * Integração completa: Computer Control + DeepVision AI
 * - Controle de mouse e teclado (RobotJS)
 * - Análise visual avançada (Gemini Vision)
 * - Detecção de objetos e faces
 * - Rastreamento em tempo real
 * - Automação inteligente
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

dotenv.config();

// ==================== CONFIGURATION ====================

const PORT = process.env.AUTOMATION_PORT || 3003;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SCREEN_WIDTH = parseInt(process.env.SCREEN_WIDTH) || 1920;
const SCREEN_HEIGHT = parseInt(process.env.SCREEN_HEIGHT) || 1080;

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
  model: 'gemini-2.0-flash-exp'
});

// ==================== DEEPVISION INTEGRATION ====================

class DeepVisionEngine {
  constructor() {
    this.detectionHistory = [];
    this.trackedObjects = new Map();
    this.activeMonitoring = false;
  }

  async detectObjects(imageBuffer, targetObjects = []) {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = targetObjects.length > 0
        ? `Detect and locate these objects in the image: ${targetObjects.join(', ')}

Return JSON with detected objects:
{
  "detections": [
    {
      "object": "object name",
      "confidence": 0.95,
      "position": { "x": 500, "y": 300 },
      "bounds": { "left": 450, "top": 250, "right": 550, "bottom": 350 },
      "description": "brief description"
    }
  ]
}`
        : `Analyze this image and detect all significant objects, UI elements, and interactive components.

Return JSON format:
{
  "detections": [
    {
      "object": "object name",
      "type": "button|icon|text|image|window",
      "confidence": 0.95,
      "position": { "x": 500, "y": 300 },
      "bounds": { "left": 450, "top": 250, "right": 550, "bottom": 350 },
      "clickable": true,
      "description": "what this element does"
    }
  ],
  "scene_description": "overall scene description"
}`;

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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        this.updateDetectionHistory(data);
        return data;
      }
      
      return { detections: [], error: 'No detections found' };
    } catch (error) {
      console.error('❌ Object detection error:', error);
      throw error;
    }
  }

  async detectFaces(imageBuffer) {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = `Detect all human faces in this image.

Return JSON format:
{
  "faces": [
    {
      "id": 1,
      "position": { "x": 500, "y": 300 },
      "bounds": { "left": 450, "top": 250, "right": 550, "bottom": 350 },
      "confidence": 0.95,
      "attributes": {
        "emotion": "happy|sad|neutral|surprised|angry",
        "age_estimate": "20-30",
        "gender_estimate": "male|female",
        "looking_at": "camera|away"
      }
    }
  ]
}`;

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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { faces: [] };
    } catch (error) {
      console.error('❌ Face detection error:', error);
      throw error;
    }
  }

  async analyzeScene(imageBuffer, context = '') {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = context
        ? `Analyze this scene in the context of: ${context}

Provide detailed analysis in JSON:
{
  "scene_type": "desktop|application|website|game",
  "main_elements": ["element1", "element2"],
  "suggested_actions": [
    {
      "action": "click|type|scroll",
      "target": "element description",
      "position": { "x": 500, "y": 300 },
      "reason": "why this action"
    }
  ],
  "insights": "what's happening in the scene"
}`
        : `Provide a comprehensive analysis of this screen/scene.

Include:
- What application/website is shown
- Main UI elements and their purposes
- Possible user actions
- Current state/context

Return detailed JSON format.`;

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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { error: 'Analysis failed', raw: text };
    } catch (error) {
      console.error('❌ Scene analysis error:', error);
      throw error;
    }
  }

  updateDetectionHistory(detection) {
    this.detectionHistory.push({
      timestamp: Date.now(),
      detection
    });

    // Manter apenas últimas 100 detecções
    if (this.detectionHistory.length > 100) {
      this.detectionHistory.shift();
    }
  }

  getDetectionHistory(limit = 10) {
    return this.detectionHistory.slice(-limit);
  }
}

// ==================== COMPUTER CONTROL ====================

class ComputerController {
  constructor() {
    this.actionHistory = [];
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

  moveMouse(x, y, smooth = true) {
    try {
      if (smooth) {
        const current = robot.getMousePos();
        const steps = 10;
        const dx = (x - current.x) / steps;
        const dy = (y - current.y) / steps;

        for (let i = 0; i < steps; i++) {
          robot.moveMouse(
            Math.round(current.x + dx * i),
            Math.round(current.y + dy * i)
          );
          robot.setMouseDelay(2);
        }
      }
      
      robot.moveMouse(x, y);
      this.logAction('move_mouse', { x, y });
      return { success: true, x, y };
    } catch (error) {
      console.error('❌ Mouse move error:', error);
      throw error;
    }
  }

  click(x = null, y = null, button = 'left', double = false) {
    try {
      if (x !== null && y !== null) {
        this.moveMouse(x, y);
      }
      
      robot.mouseClick(button, double);
      this.logAction('click', { x, y, button, double });
      return { success: true };
    } catch (error) {
      console.error('❌ Click error:', error);
      throw error;
    }
  }

  type(text, delay = 50) {
    try {
      robot.setKeyboardDelay(delay);
      robot.typeString(text);
      this.logAction('type', { text, length: text.length });
      return { success: true, text };
    } catch (error) {
      console.error('❌ Type error:', error);
      throw error;
    }
  }

  pressKey(key, modifiers = []) {
    try {
      if (modifiers.length > 0) {
        robot.keyTap(key, modifiers);
      } else {
        robot.keyTap(key);
      }
      this.logAction('press_key', { key, modifiers });
      return { success: true, key, modifiers };
    } catch (error) {
      console.error('❌ Key press error:', error);
      throw error;
    }
  }

  scroll(direction = 'down', amount = 3) {
    try {
      const magnitude = direction === 'down' ? -amount : amount;
      robot.scrollMouse(0, magnitude);
      this.logAction('scroll', { direction, amount });
      return { success: true, direction, amount };
    } catch (error) {
      console.error('❌ Scroll error:', error);
      throw error;
    }
  }

  logAction(type, data) {
    this.actionHistory.push({
      timestamp: Date.now(),
      type,
      data
    });

    if (this.actionHistory.length > 100) {
      this.actionHistory.shift();
    }
  }

  getActionHistory(limit = 10) {
    return this.actionHistory.slice(-limit);
  }
}

// ==================== UNIFIED AUTOMATION ENGINE ====================

class UnifiedAutomationEngine {
  constructor() {
    this.deepVision = new DeepVisionEngine();
    this.controller = new ComputerController();
    this.activeTasks = new Map();
  }

  async executeSmartAction(goal) {
    try {
      console.log(`🎯 Executing smart action: ${goal}`);
      
      // 1. Capturar tela
      const screenshot = await this.controller.captureScreen();
      
      // 2. Analisar cena
      const analysis = await this.deepVision.analyzeScene(screenshot, goal);
      
      // 3. Executar ação sugerida
      if (analysis.suggested_actions && analysis.suggested_actions.length > 0) {
        const action = analysis.suggested_actions[0];
        
        switch (action.action) {
          case 'click':
            await this.controller.click(action.position.x, action.position.y);
            break;
          case 'type':
            await this.controller.type(action.text || '');
            break;
          case 'scroll':
            await this.controller.scroll(action.direction || 'down');
            break;
        }
        
        return {
          success: true,
          action: action.action,
          analysis,
          message: `Executed: ${action.reason}`
        };
      }
      
      return {
        success: false,
        analysis,
        message: 'No suitable action found'
      };
    } catch (error) {
      console.error('❌ Smart action error:', error);
      throw error;
    }
  }

  async findAndClick(objectDescription) {
    try {
      console.log(`🔍 Finding and clicking: ${objectDescription}`);
      
      // Capturar e detectar
      const screenshot = await this.controller.captureScreen();
      const detections = await this.deepVision.detectObjects(screenshot, [objectDescription]);
      
      if (detections.detections && detections.detections.length > 0) {
        const target = detections.detections[0];
        await this.controller.click(target.position.x, target.position.y);
        
        return {
          success: true,
          target,
          message: `Clicked on ${target.object}`
        };
      }
      
      return {
        success: false,
        message: `Object not found: ${objectDescription}`
      };
    } catch (error) {
      console.error('❌ Find and click error:', error);
      throw error;
    }
  }
}

// ==================== INITIALIZE ====================

const engine = new UnifiedAutomationEngine();

// ==================== API ENDPOINTS ====================

// Screenshot
app.post('/api/screenshot', async (req, res) => {
  try {
    const img = await engine.controller.captureScreen();
    const base64 = img.toString('base64');
    res.json({ success: true, image: base64 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mouse control
app.post('/api/mouse/move', async (req, res) => {
  try {
    const { x, y, smooth } = req.body;
    const result = engine.controller.moveMouse(x, y, smooth);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/mouse/click', async (req, res) => {
  try {
    const { x, y, button, double } = req.body;
    const result = engine.controller.click(x, y, button, double);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Keyboard control
app.post('/api/keyboard/type', async (req, res) => {
  try {
    const { text, delay } = req.body;
    const result = engine.controller.type(text, delay);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/keyboard/press', async (req, res) => {
  try {
    const { key, modifiers } = req.body;
    const result = engine.controller.pressKey(key, modifiers);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DeepVision endpoints
app.post('/api/vision/detect-objects', async (req, res) => {
  try {
    const { targets } = req.body;
    const screenshot = await engine.controller.captureScreen();
    const detections = await engine.deepVision.detectObjects(screenshot, targets);
    res.json({ success: true, detections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/vision/detect-faces', async (req, res) => {
  try {
    const screenshot = await engine.controller.captureScreen();
    const faces = await engine.deepVision.detectFaces(screenshot);
    res.json({ success: true, faces });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/vision/analyze-scene', async (req, res) => {
  try {
    const { context } = req.body;
    const screenshot = await engine.controller.captureScreen();
    const analysis = await engine.deepVision.analyzeScene(screenshot, context);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Smart actions
app.post('/api/smart/execute', async (req, res) => {
  try {
    const { goal } = req.body;
    const result = await engine.executeSmartAction(goal);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/smart/find-and-click', async (req, res) => {
  try {
    const { object } = req.body;
    const result = await engine.findAndClick(object);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// History
app.get('/api/history/actions', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ 
    success: true, 
    history: engine.controller.getActionHistory(limit) 
  });
});

app.get('/api/history/detections', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ 
    success: true, 
    history: engine.deepVision.getDetectionHistory(limit) 
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Prox AI Studio - Enhanced Automation',
    features: [
      'Computer Control (Mouse/Keyboard)',
      'DeepVision Object Detection',
      'Face Detection',
      'Scene Analysis',
      'Smart Actions'
    ]
  });
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('execute_action', async (data) => {
    try {
      const result = await engine.executeSmartAction(data.goal);
      socket.emit('action_result', result);
    } catch (error) {
      socket.emit('action_error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ==================== START SERVER ====================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 PROX AI STUDIO - ENHANCED AUTOMATION BACKEND          ║
╠════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                              ║
║  Frontend: ${FRONTEND_URL}                    ║
║                                                            ║
║  Features:                                                 ║
║  ✅ Computer Control (RobotJS)                            ║
║  ✅ DeepVision Object Detection                           ║
║  ✅ Face Detection & Analysis                             ║
║  ✅ Scene Understanding                                   ║
║  ✅ Smart Actions                                         ║
║                                                            ║
║  Endpoints:                                                ║
║  POST /api/screenshot                                      ║
║  POST /api/mouse/move                                      ║
║  POST /api/mouse/click                                     ║
║  POST /api/keyboard/type                                   ║
║  POST /api/vision/detect-objects                           ║
║  POST /api/vision/detect-faces                             ║
║  POST /api/vision/analyze-scene                            ║
║  POST /api/smart/execute                                   ║
║  POST /api/smart/find-and-click                            ║
║                                                            ║
║  Ready to automate! 🎯                                    ║
╚════════════════════════════════════════════════════════════╝
  `);
});
