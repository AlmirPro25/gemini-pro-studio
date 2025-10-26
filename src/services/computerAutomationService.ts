/**
 * 🤖 Computer Automation Service
 * 
 * Controls mouse, keyboard, and screen automation via AI
 */

import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3002';

interface GridInfo {
  width: number;
  height: number;
  cols: number;
  rows: number;
  zones: string[];
  grid: Record<string, { x: number; y: number; bounds: any }>;
}

interface AutomationAction {
  target_zone: string;
  action: 'click' | 'double_click' | 'right_click' | 'type' | 'scroll_down' | 'scroll_up';
  text?: string;
  confidence: number;
  reasoning: string;
}

interface AutomationResult {
  success: boolean;
  task?: string;
  analysis?: AutomationAction;
  result?: any;
  error?: string;
  timestamp: number;
}

class ComputerAutomationService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to automation backend');
        this.connected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        this.connected = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from automation backend');
        this.connected = false;
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Get grid information
  async getGridInfo(): Promise<GridInfo> {
    const response = await fetch(`${BACKEND_URL}/api/grid`);
    if (!response.ok) throw new Error('Failed to get grid info');
    return response.json();
  }

  // Capture screenshot
  async captureScreenshot(withGrid: boolean = false): Promise<string> {
    const response = await fetch(`${BACKEND_URL}/api/screenshot?grid=${withGrid}`);
    if (!response.ok) throw new Error('Failed to capture screenshot');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Analyze screen with AI
  async analyzeScreen(task?: string, image?: string): Promise<AutomationAction> {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, image })
    });
    
    if (!response.ok) throw new Error('Failed to analyze screen');
    const data = await response.json();
    return data.analysis;
  }

  // Execute action
  async executeAction(action: AutomationAction): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });
    
    if (!response.ok) throw new Error('Failed to execute action');
    return response.json();
  }

  // Full automation cycle
  async automate(task: string): Promise<AutomationResult> {
    const response = await fetch(`${BACKEND_URL}/api/automate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task })
    });
    
    if (!response.ok) throw new Error('Failed to automate');
    return response.json();
  }

  // Get automation history
  async getHistory(): Promise<any[]> {
    const response = await fetch(`${BACKEND_URL}/api/history`);
    if (!response.ok) throw new Error('Failed to get history');
    const data = await response.json();
    return data.history;
  }

  // Clear history
  async clearHistory(): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/history`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear history');
  }

  // Move mouse to zone
  async moveMouse(zone: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/mouse/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone })
    });
    if (!response.ok) throw new Error('Failed to move mouse');
  }

  // Click at zone
  async click(zone: string, button: 'left' | 'right' = 'left', double: boolean = false): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/mouse/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone, button, double })
    });
    if (!response.ok) throw new Error('Failed to click');
  }

  // Type text
  async type(text: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/keyboard/type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('Failed to type');
  }

  // Press key
  async pressKey(key: string, modifiers: string[] = []): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/keyboard/press`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, modifiers })
    });
    if (!response.ok) throw new Error('Failed to press key');
  }

  // Socket.IO events
  onAutomationStatus(callback: (data: any) => void) {
    this.socket?.on('automation_status', callback);
  }

  onAutomationAnalysis(callback: (data: any) => void) {
    this.socket?.on('automation_analysis', callback);
  }

  onAutomationComplete(callback: (data: any) => void) {
    this.socket?.on('automation_complete', callback);
  }

  onAutomationError(callback: (data: any) => void) {
    this.socket?.on('automation_error', callback);
  }

  startAutomation(task: string) {
    this.socket?.emit('start_automation', { task });
  }

  stopAutomation() {
    this.socket?.emit('stop_automation');
  }
}

export const computerAutomationService = new ComputerAutomationService();
export type { GridInfo, AutomationAction, AutomationResult };
