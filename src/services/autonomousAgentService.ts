/**
 * 🤖 Autonomous Agent Service
 * 
 * AI agent that can see, plan, and execute complex tasks autonomously
 * Like a human using a computer, but smarter
 */

import { computerAutomationService } from './computerAutomationService';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY!);

interface TaskPlan {
  id: string;
  goal: string;
  steps: TaskStep[];
  currentStep: number;
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'paused';
  startTime: number;
  endTime?: number;
  errors: TaskError[];
  apiCallsUsed: number;
  maxApiCalls: number;
}

interface TaskStep {
  id: string;
  description: string;
  action: {
    type: 'analyze' | 'click' | 'type' | 'scroll' | 'wait' | 'verify';
    target?: string;
    value?: string;
    duration?: number;
  };
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  attempts: number;
  maxAttempts: number;
  result?: any;
  error?: string;
  screenshot?: string;
  timestamp?: number;
}

interface TaskError {
  step: string;
  error: string;
  screenshot?: string;
  timestamp: number;
  recovered: boolean;
}

interface ScreenSource {
  type: 'screen' | 'window' | 'tab';
  id: string;
  name: string;
}

class AutonomousAgentService {
  private currentPlan: TaskPlan | null = null;
  private isRunning: boolean = false;
  private selectedSource: ScreenSource | null = null;
  private visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  private planningModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // ==================== SCREEN SOURCE SELECTION ====================

  async getAvailableSources(): Promise<ScreenSource[]> {
    // Get available screens, windows, and tabs
    const sources: ScreenSource[] = [
      { type: 'screen', id: 'screen_1', name: 'Screen 1 (Primary)' },
      { type: 'screen', id: 'screen_2', name: 'Screen 2 (Secondary)' }
    ];

    // TODO: Get actual windows and tabs from system
    // This would require integration with Electron or browser APIs

    return sources;
  }

  selectSource(source: ScreenSource): void {
    this.selectedSource = source;
    console.log('📺 Selected source:', source.name);
  }

  getSelectedSource(): ScreenSource | null {
    return this.selectedSource;
  }

  // ==================== TASK PLANNING ====================

  async createPlan(goal: string, maxApiCalls: number = 50): Promise<TaskPlan> {
    console.log('🧠 Creating plan for:', goal);

    try {
      // Capture current screen state
      await computerAutomationService.connect();
      const screenshot = await computerAutomationService.captureScreenshot(true);

      // Ask AI to create a plan
      const prompt = `You are an autonomous AI agent that can control a computer.

GOAL: ${goal}

CURRENT SCREEN: [Screenshot attached]

Create a detailed step-by-step plan to achieve this goal. Consider:
1. What's currently visible on screen
2. What actions are needed
3. Potential errors and how to handle them
4. Verification steps

Respond in JSON format:
{
  "steps": [
    {
      "description": "Step description",
      "action": {
        "type": "analyze" | "click" | "type" | "scroll" | "wait" | "verify",
        "target": "element description (for click)",
        "value": "text to type (for type)",
        "duration": 1000 (for wait, in ms)
      },
      "maxAttempts": 3
    }
  ],
  "estimatedApiCalls": 10,
  "reasoning": "Why this plan will work"
}`;

      const result = await this.planningModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: screenshot.split(',')[1] // Remove data:image/png;base64,
          }
        }
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Failed to parse plan from AI response');
      }

      const planData = JSON.parse(jsonMatch[0]);

      // Create task plan
      const plan: TaskPlan = {
        id: `plan_${Date.now()}`,
        goal,
        steps: planData.steps.map((step: any, index: number) => ({
          id: `step_${index + 1}`,
          description: step.description,
          action: step.action,
          status: 'pending',
          attempts: 0,
          maxAttempts: step.maxAttempts || 3
        })),
        currentStep: 0,
        status: 'planning',
        startTime: Date.now(),
        errors: [],
        apiCallsUsed: 1, // Used 1 for planning
        maxApiCalls
      };

      this.currentPlan = plan;
      console.log('✅ Plan created with', plan.steps.length, 'steps');
      console.log('📊 Estimated API calls:', planData.estimatedApiCalls);

      return plan;
    } catch (error) {
      console.error('❌ Error creating plan:', error);
      throw error;
    }
  }

  getCurrentPlan(): TaskPlan | null {
    return this.currentPlan;
  }

  // ==================== TASK EXECUTION ====================

  async executePlan(): Promise<void> {
    if (!this.currentPlan) {
      throw new Error('No plan to execute');
    }

    if (this.isRunning) {
      throw new Error('Plan is already running');
    }

    this.isRunning = true;
    this.currentPlan.status = 'executing';
    console.log('🚀 Starting plan execution...');

    try {
      while (this.currentPlan.currentStep < this.currentPlan.steps.length) {
        if (!this.isRunning) {
          console.log('⏸️ Execution paused');
          this.currentPlan.status = 'paused';
          break;
        }

        const step = this.currentPlan.steps[this.currentPlan.currentStep];
        console.log(`\n📍 Step ${this.currentPlan.currentStep + 1}/${this.currentPlan.steps.length}: ${step.description}`);

        const success = await this.executeStep(step);

        if (success) {
          step.status = 'completed';
          this.currentPlan.currentStep++;
        } else {
          // Try to recover
          const recovered = await this.recoverFromError(step);
          
          if (recovered) {
            step.status = 'completed';
            this.currentPlan.currentStep++;
          } else {
            console.error('❌ Failed to recover from error');
            this.currentPlan.status = 'failed';
            this.isRunning = false;
            break;
          }
        }

        // Check API call limit
        if (this.currentPlan.apiCallsUsed >= this.currentPlan.maxApiCalls) {
          console.warn('⚠️ API call limit reached');
          this.currentPlan.status = 'paused';
          this.isRunning = false;
          break;
        }
      }

      if (this.currentPlan.currentStep >= this.currentPlan.steps.length) {
        this.currentPlan.status = 'completed';
        this.currentPlan.endTime = Date.now();
        console.log('✅ Plan completed successfully!');
        console.log(`⏱️ Time taken: ${(this.currentPlan.endTime - this.currentPlan.startTime) / 1000}s`);
        console.log(`📊 API calls used: ${this.currentPlan.apiCallsUsed}/${this.currentPlan.maxApiCalls}`);
      }
    } catch (error) {
      console.error('❌ Fatal error during execution:', error);
      this.currentPlan.status = 'failed';
      this.isRunning = false;
    }
  }

  private async executeStep(step: TaskStep): Promise<boolean> {
    step.status = 'executing';
    step.attempts++;
    step.timestamp = Date.now();

    try {
      // Capture screenshot before action
      const screenshot = await computerAutomationService.captureScreenshot(true);
      step.screenshot = screenshot;

      switch (step.action.type) {
        case 'analyze':
          return await this.executeAnalyze(step);
        
        case 'click':
          return await this.executeClick(step);
        
        case 'type':
          return await this.executeType(step);
        
        case 'scroll':
          return await this.executeScroll(step);
        
        case 'wait':
          return await this.executeWait(step);
        
        case 'verify':
          return await this.executeVerify(step);
        
        default:
          throw new Error(`Unknown action type: ${step.action.type}`);
      }
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.currentPlan!.errors.push({
        step: step.description,
        error: step.error,
        screenshot: step.screenshot,
        timestamp: Date.now(),
        recovered: false
      });

      return false;
    }
  }

  private async executeAnalyze(step: TaskStep): Promise<boolean> {
    console.log('🔍 Analyzing screen...');
    
    const screenshot = await computerAutomationService.captureScreenshot(true);
    
    const analysis = await computerAutomationService.analyzeScreen(
      step.action.target || 'Analyze current screen state'
    );

    this.currentPlan!.apiCallsUsed++;
    step.result = analysis;
    
    console.log('✅ Analysis complete');
    return true;
  }

  private async executeClick(step: TaskStep): Promise<boolean> {
    if (!step.action.target) {
      throw new Error('Click action requires target');
    }

    console.log('🖱️ Clicking:', step.action.target);
    
    const result = await computerAutomationService.automate(
      `Click on ${step.action.target}`
    );

    this.currentPlan!.apiCallsUsed++;
    step.result = result;
    
    // Wait a bit for UI to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Click executed');
    return true;
  }

  private async executeType(step: TaskStep): Promise<boolean> {
    if (!step.action.value) {
      throw new Error('Type action requires value');
    }

    console.log('⌨️ Typing:', step.action.value);
    
    await computerAutomationService.type(step.action.value);
    
    // Wait a bit for typing to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Typing complete');
    return true;
  }

  private async executeScroll(step: TaskStep): Promise<boolean> {
    console.log('📜 Scrolling...');
    
    await computerAutomationService.automate('Scroll down');
    this.currentPlan!.apiCallsUsed++;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Scroll complete');
    return true;
  }

  private async executeWait(step: TaskStep): Promise<boolean> {
    const duration = step.action.duration || 1000;
    console.log(`⏳ Waiting ${duration}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    console.log('✅ Wait complete');
    return true;
  }

  private async executeVerify(step: TaskStep): Promise<boolean> {
    console.log('✓ Verifying:', step.action.target);
    
    const screenshot = await computerAutomationService.captureScreenshot(true);
    
    const verification = await computerAutomationService.analyzeScreen(
      `Verify that: ${step.action.target}`
    );

    this.currentPlan!.apiCallsUsed++;
    step.result = verification;
    
    // Check if verification passed
    const passed = verification.confidence > 0.7;
    
    if (passed) {
      console.log('✅ Verification passed');
    } else {
      console.warn('⚠️ Verification failed');
    }
    
    return passed;
  }

  // ==================== ERROR RECOVERY ====================

  private async recoverFromError(step: TaskStep): Promise<boolean> {
    if (step.attempts >= step.maxAttempts) {
      console.error('❌ Max attempts reached for step:', step.description);
      return false;
    }

    console.log('🔄 Attempting to recover from error...');
    console.log('📸 Analyzing current screen state...');

    try {
      // Capture current state
      const screenshot = await computerAutomationService.captureScreenshot(true);

      // Ask AI how to recover
      const prompt = `You are an autonomous AI agent. A step failed during task execution.

ORIGINAL GOAL: ${this.currentPlan!.goal}
FAILED STEP: ${step.description}
ERROR: ${step.error}
ATTEMPTS: ${step.attempts}/${step.maxAttempts}

CURRENT SCREEN: [Screenshot attached]

Analyze the situation and suggest:
1. What went wrong
2. Alternative approach to achieve the same result
3. Whether to retry, skip, or abort

Respond in JSON format:
{
  "diagnosis": "What went wrong",
  "solution": "Alternative approach",
  "action": "retry" | "skip" | "abort",
  "modifiedStep": {
    "description": "New step description",
    "action": { ... }
  }
}`;

      const result = await this.visionModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: screenshot.split(',')[1]
          }
        }
      ]);

      this.currentPlan!.apiCallsUsed++;

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return false;
      }

      const recovery = JSON.parse(jsonMatch[0]);
      
      console.log('🔍 Diagnosis:', recovery.diagnosis);
      console.log('💡 Solution:', recovery.solution);
      console.log('🎯 Action:', recovery.action);

      switch (recovery.action) {
        case 'retry':
          console.log('🔄 Retrying step...');
          return await this.executeStep(step);
        
        case 'skip':
          console.log('⏭️ Skipping step...');
          step.status = 'skipped';
          return true;
        
        case 'abort':
          console.log('🛑 Aborting execution...');
          return false;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('❌ Error during recovery:', error);
      return false;
    }
  }

  // ==================== CONTROL ====================

  pauseExecution(): void {
    this.isRunning = false;
    if (this.currentPlan) {
      this.currentPlan.status = 'paused';
    }
    console.log('⏸️ Execution paused');
  }

  resumeExecution(): void {
    if (this.currentPlan && this.currentPlan.status === 'paused') {
      this.executePlan();
    }
  }

  stopExecution(): void {
    this.isRunning = false;
    if (this.currentPlan) {
      this.currentPlan.status = 'failed';
      this.currentPlan.endTime = Date.now();
    }
    console.log('🛑 Execution stopped');
  }

  isExecuting(): boolean {
    return this.isRunning;
  }

  // ==================== STATISTICS ====================

  getProgress(): number {
    if (!this.currentPlan) return 0;
    return (this.currentPlan.currentStep / this.currentPlan.steps.length) * 100;
  }

  getStatistics() {
    if (!this.currentPlan) return null;

    const completedSteps = this.currentPlan.steps.filter(s => s.status === 'completed').length;
    const failedSteps = this.currentPlan.steps.filter(s => s.status === 'failed').length;
    const totalAttempts = this.currentPlan.steps.reduce((sum, s) => sum + s.attempts, 0);

    return {
      goal: this.currentPlan.goal,
      status: this.currentPlan.status,
      progress: this.getProgress(),
      currentStep: this.currentPlan.currentStep + 1,
      totalSteps: this.currentPlan.steps.length,
      completedSteps,
      failedSteps,
      totalAttempts,
      apiCallsUsed: this.currentPlan.apiCallsUsed,
      maxApiCalls: this.currentPlan.maxApiCalls,
      errors: this.currentPlan.errors.length,
      timeElapsed: this.currentPlan.endTime 
        ? this.currentPlan.endTime - this.currentPlan.startTime
        : Date.now() - this.currentPlan.startTime
    };
  }

  // ==================== HISTORY ====================

  getExecutionHistory(): TaskPlan[] {
    const history = localStorage.getItem('autonomous_agent_history');
    return history ? JSON.parse(history) : [];
  }

  saveToHistory(): void {
    if (!this.currentPlan) return;

    const history = this.getExecutionHistory();
    history.unshift(this.currentPlan);
    
    // Keep only last 50
    if (history.length > 50) {
      history.pop();
    }

    localStorage.setItem('autonomous_agent_history', JSON.stringify(history));
  }
}

export const autonomousAgentService = new AutonomousAgentService();
export type { TaskPlan, TaskStep, TaskError, ScreenSource };
