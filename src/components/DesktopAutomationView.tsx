import React, { useState, useEffect, useRef } from 'react';
import { autonomousAgentService, TaskPlan } from '../services/autonomousAgentService';
import { deepVisionAutomationService, VisionTrigger } from '../services/deepVisionAutomationService';

interface DetectedObject {
  object: string;
  confidence: number;
  position: { x: number; y: number };
  bounds: { left: number; top: number; right: number; bottom: number };
  clickable?: boolean;
  description?: string;
}

interface ActionHistory {
  timestamp: number;
  type: string;
  data: any;
  success: boolean;
}

export const DesktopAutomationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'smart' | 'manual' | 'vision' | 'agent' | 'triggers' | 'history'>('smart');
  const [isConnected, setIsConnected] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Smart Actions
  const [smartGoal, setSmartGoal] = useState('');
  const [smartResult, setSmartResult] = useState<any>(null);
  
  // Manual Control
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [textToType, setTextToType] = useState('');
  
  // Vision
  const [objectToFind, setObjectToFind] = useState('');
  const [visionResult, setVisionResult] = useState<any>(null);
  
  // Agent (NOVO)
  const [agentGoal, setAgentGoal] = useState('');
  const [maxApiCalls, setMaxApiCalls] = useState(50);
  const [currentPlan, setCurrentPlan] = useState<TaskPlan | null>(null);
  const [agentStats, setAgentStats] = useState<any>(null);
  
  // Triggers (NOVO)
  const [triggers, setTriggers] = useState<VisionTrigger[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [triggerStats, setTriggerStats] = useState({ total: 0, enabled: 0, disabled: 0, recentlyTriggered: 0 });

  const BACKEND_URL = 'http://localhost:3003';

  useEffect(() => {
    checkConnection();
    loadHistory();
    loadTriggers();
    
    // Update stats every second
    const interval = setInterval(() => {
      const newAgentStats = autonomousAgentService.getStatistics();
      if (newAgentStats) {
        setAgentStats(newAgentStats);
        setCurrentPlan(autonomousAgentService.getCurrentPlan());
      }
      setTriggerStats(deepVisionAutomationService.getStatistics());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const captureScreen = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/screenshot`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setScreenshot(`data:image/png;base64,${data.image}`);
      }
    } catch (error) {
      console.error('Screenshot error:', error);
    }
  };

  const executeSmartAction = async () => {
    if (!smartGoal.trim()) return;
    
    setIsExecuting(true);
    setSmartResult(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/smart/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: smartGoal })
      });
      
      const result = await response.json();
      setSmartResult(result);
      loadHistory();
      
      if (result.success) {
        setTimeout(captureScreen, 500);
      }
    } catch (error) {
      console.error('Smart action error:', error);
      setSmartResult({ success: false, error: 'Connection failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  const findAndClick = async () => {
    if (!objectToFind.trim()) return;
    
    setIsExecuting(true);
    setVisionResult(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/smart/find-and-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object: objectToFind })
      });
      
      const result = await response.json();
      setVisionResult(result);
      loadHistory();
      
      if (result.success) {
        setTimeout(captureScreen, 500);
      }
    } catch (error) {
      console.error('Find and click error:', error);
      setVisionResult({ success: false, error: 'Connection failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  const detectObjects = async () => {
    setIsExecuting(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/vision/detect-objects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: [] })
      });
      
      const result = await response.json();
      if (result.success && result.detections.detections) {
        setDetectedObjects(result.detections.detections);
      }
      
      await captureScreen();
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const moveMouse = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/mouse/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: mouseX, y: mouseY, smooth: true })
      });
      loadHistory();
    } catch (error) {
      console.error('Mouse move error:', error);
    }
  };

  const clickMouse = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/mouse/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: mouseX, y: mouseY })
      });
      loadHistory();
      setTimeout(captureScreen, 500);
    } catch (error) {
      console.error('Click error:', error);
    }
  };

  const typeText = async () => {
    if (!textToType.trim()) return;
    
    try {
      await fetch(`${BACKEND_URL}/api/keyboard/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToType, delay: 50 })
      });
      loadHistory();
      setTextToType('');
    } catch (error) {
      console.error('Type error:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/history/actions?limit=20`);
      const data = await response.json();
      if (data.success) {
        setActionHistory(data.history);
      }
    } catch (error) {
      console.error('History load error:', error);
    }
  };

  // ==================== AGENT FUNCTIONS ====================

  const handleCreatePlan = async () => {
    if (!agentGoal.trim()) {
      alert('Digite um objetivo');
      return;
    }

    setIsExecuting(true);
    try {
      const plan = await autonomousAgentService.createPlan(agentGoal, maxApiCalls);
      setCurrentPlan(plan);
      setAgentStats(autonomousAgentService.getStatistics());
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Falha ao criar plano: ' + (error as Error).message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!currentPlan) return;
    
    try {
      await autonomousAgentService.executePlan();
      autonomousAgentService.saveToHistory();
    } catch (error) {
      console.error('Error executing plan:', error);
      alert('Erro na execução: ' + (error as Error).message);
    }
  };

  // ==================== TRIGGERS FUNCTIONS ====================

  const loadTriggers = () => {
    setTriggers(deepVisionAutomationService.getAllTriggers());
    setTriggerStats(deepVisionAutomationService.getStatistics());
  };

  const handleStartMonitoring = () => {
    deepVisionAutomationService.startMonitoring(1000);
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    deepVisionAutomationService.stopMonitoring();
    setIsMonitoring(false);
  };

  const handleToggleTrigger = (id: string, enabled: boolean) => {
    if (enabled) {
      deepVisionAutomationService.enableTrigger(id);
    } else {
      deepVisionAutomationService.disableTrigger(id);
    }
    loadTriggers();
  };

  const handleDeleteTrigger = (id: string) => {
    if (confirm('Deletar este trigger?')) {
      deepVisionAutomationService.removeTrigger(id);
      loadTriggers();
    }
  };

  const handleCreatePresets = () => {
    deepVisionAutomationService.createPresetTriggers();
    loadTriggers();
  };

  const quickActions = [
    { label: 'Abrir Bloco de Notas', goal: 'Abrir o Bloco de Notas' },
    { label: 'Abrir Chrome', goal: 'Abrir o Google Chrome' },
    { label: 'Abrir Calculadora', goal: 'Abrir a Calculadora' },
    { label: 'Minimizar Tudo', goal: 'Minimizar todas as janelas' },
  ];

  return (
    <div className="flex flex-col h-full bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="p-6 border-b border-border-color bg-gradient-to-r from-bg-secondary to-bg-primary">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <i className="fa-solid fa-desktop text-blue-500"></i>
              Desktop Control Pro
            </h1>
            <p className="text-text-secondary mt-1">Sistema Unificado de Automação Inteligente</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium">{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
            
            <button
              onClick={captureScreen}
              disabled={!isConnected}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <i className="fa-solid fa-camera"></i>
              Capturar Tela
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {[
            { id: 'smart', label: 'Ações Inteligentes', icon: 'fa-brain' },
            { id: 'manual', label: 'Controle Manual', icon: 'fa-hand-pointer' },
            { id: 'vision', label: 'Visão AI', icon: 'fa-eye' },
            { id: 'agent', label: 'Agente Autônomo', icon: 'fa-robot' },
            { id: 'triggers', label: 'Triggers Visuais', icon: 'fa-bolt' },
            { id: 'history', label: 'Histórico', icon: 'fa-history' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-secondary'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Controls */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-border-color">
          {/* Smart Actions Tab */}
          {activeTab === 'smart' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
                  Ações Inteligentes
                </h2>
                <p className="text-text-secondary text-sm mb-4">
                  Descreva o que você quer fazer e a IA executa automaticamente
                </p>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">Ações Rápidas</label>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSmartGoal(action.goal)}
                      className="px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary border border-border-color rounded-lg text-left transition-all duration-200"
                    >
                      <div className="text-sm font-medium">{action.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Goal */}
              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">Ou descreva sua ação</label>
                <textarea
                  value={smartGoal}
                  onChange={(e) => setSmartGoal(e.target.value)}
                  placeholder="Ex: Abrir o Chrome e pesquisar por 'Prox AI Studio'"
                  className="w-full px-4 py-3 bg-bg-secondary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>

              <button
                onClick={executeSmartAction}
                disabled={!isConnected || isExecuting || !smartGoal.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
              >
                {isExecuting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Executando...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play"></i>
                    Executar Ação
                  </>
                )}
              </button>

              {/* Result */}
              {smartResult && (
                <div className={`p-4 rounded-lg border ${smartResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className={`fa-solid ${smartResult.success ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'}`}></i>
                    <span className="font-bold">{smartResult.success ? 'Sucesso!' : 'Erro'}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{smartResult.message || smartResult.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Manual Control Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-gamepad text-blue-400"></i>
                  Controle Manual
                </h2>
                <p className="text-text-secondary text-sm mb-4">
                  Controle direto do mouse e teclado
                </p>
              </div>

              {/* Mouse Control */}
              <div className="p-4 bg-bg-secondary rounded-lg border border-border-color">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-mouse text-blue-400"></i>
                  Controle do Mouse
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Posição X</label>
                    <input
                      type="number"
                      value={mouseX}
                      onChange={(e) => setMouseX(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">Posição Y</label>
                    <input
                      type="number"
                      value={mouseY}
                      onChange={(e) => setMouseY(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={moveMouse}
                    disabled={!isConnected}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-all duration-200"
                  >
                    <i className="fa-solid fa-arrows-alt mr-2"></i>
                    Mover
                  </button>
                  <button
                    onClick={clickMouse}
                    disabled={!isConnected}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-all duration-200"
                  >
                    <i className="fa-solid fa-hand-pointer mr-2"></i>
                    Clicar
                  </button>
                </div>
              </div>

              {/* Keyboard Control */}
              <div className="p-4 bg-bg-secondary rounded-lg border border-border-color">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-keyboard text-green-400"></i>
                  Controle do Teclado
                </h3>
                
                <div className="mb-3">
                  <label className="block text-xs text-text-tertiary mb-1">Texto para Digitar</label>
                  <input
                    type="text"
                    value={textToType}
                    onChange={(e) => setTextToType(e.target.value)}
                    placeholder="Digite o texto aqui..."
                    className="w-full px-3 py-2 bg-bg-primary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={typeText}
                  disabled={!isConnected || !textToType.trim()}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-all duration-200"
                >
                  <i className="fa-solid fa-keyboard mr-2"></i>
                  Digitar Texto
                </button>
              </div>
            </div>
          )}

          {/* Vision Tab */}
          {activeTab === 'vision' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-eye text-purple-400"></i>
                  Visão AI
                </h2>
                <p className="text-text-secondary text-sm mb-4">
                  Detecte e interaja com elementos visuais na tela
                </p>
              </div>

              {/* Find and Click */}
              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">Encontrar e Clicar</label>
                <input
                  type="text"
                  value={objectToFind}
                  onChange={(e) => setObjectToFind(e.target.value)}
                  placeholder="Ex: botão de salvar, ícone do Chrome, campo de busca"
                  className="w-full px-4 py-3 bg-bg-secondary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                />
                
                <button
                  onClick={findAndClick}
                  disabled={!isConnected || isExecuting || !objectToFind.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Procurando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-crosshairs"></i>
                      Encontrar e Clicar
                    </>
                  )}
                </button>
              </div>

              {/* Detect All Objects */}
              <button
                onClick={detectObjects}
                disabled={!isConnected || isExecuting}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-radar"></i>
                Detectar Todos os Objetos
              </button>

              {/* Vision Result */}
              {visionResult && (
                <div className={`p-4 rounded-lg border ${visionResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className={`fa-solid ${visionResult.success ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'}`}></i>
                    <span className="font-bold">{visionResult.success ? 'Encontrado!' : 'Não Encontrado'}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{visionResult.message}</p>
                  {visionResult.target && (
                    <div className="mt-2 text-xs text-text-tertiary">
                      Posição: ({visionResult.target.position.x}, {visionResult.target.position.y})
                    </div>
                  )}
                </div>
              )}

              {/* Detected Objects */}
              {detectedObjects.length > 0 && (
                <div className="p-4 bg-bg-secondary rounded-lg border border-border-color">
                  <h3 className="font-bold mb-3">Objetos Detectados ({detectedObjects.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {detectedObjects.map((obj, idx) => (
                      <div key={idx} className="p-3 bg-bg-primary rounded-lg border border-border-color">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{obj.object}</span>
                          <span className="text-xs text-green-400">{(obj.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Posição: ({obj.position.x}, {obj.position.y})
                        </div>
                        {obj.description && (
                          <div className="text-xs text-text-secondary mt-1">{obj.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agent Tab - NOVO */}
          {activeTab === 'agent' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-robot text-purple-400"></i>
                  Agente Autônomo
                </h2>
                <p className="text-text-secondary text-sm mb-4">
                  Planejamento e execução automática de tarefas complexas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">Objetivo da Tarefa</label>
                <textarea
                  value={agentGoal}
                  onChange={(e) => setAgentGoal(e.target.value)}
                  placeholder="Ex: Abrir Excel, criar nova planilha e salvar como 'Relatório'"
                  className="w-full px-4 py-3 bg-bg-secondary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-tertiary mb-2">Limite de Chamadas API</label>
                <input
                  type="number"
                  value={maxApiCalls}
                  onChange={(e) => setMaxApiCalls(parseInt(e.target.value) || 50)}
                  className="w-full px-4 py-2 bg-bg-secondary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreatePlan}
                  disabled={!isConnected || isExecuting || !agentGoal.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold transition-all duration-200"
                >
                  <i className="fa-solid fa-lightbulb mr-2"></i>
                  Criar Plano
                </button>
                
                {currentPlan && (
                  <button
                    onClick={handleExecutePlan}
                    disabled={!isConnected || isExecuting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold transition-all duration-200"
                  >
                    <i className="fa-solid fa-play mr-2"></i>
                    Executar Plano
                  </button>
                )}
              </div>

              {currentPlan && (
                <div className="p-4 bg-bg-secondary rounded-lg border border-border-color">
                  <h3 className="font-bold mb-3">Plano de Execução</h3>
                  <div className="space-y-2">
                    {currentPlan.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-bg-primary rounded">
                        <span className="text-sm font-medium text-purple-400">#{idx + 1}</span>
                        <span className="text-sm flex-1">{step.description}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          step.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          step.status === 'executing' ? 'bg-blue-500/20 text-blue-400' :
                          step.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {agentStats && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-bg-secondary rounded-lg border border-border-color">
                    <div className="text-lg font-bold text-purple-400">{agentStats.apiCallsUsed}/{agentStats.maxApiCalls}</div>
                    <div className="text-xs text-text-tertiary">API Calls</div>
                  </div>
                  <div className="p-3 bg-bg-secondary rounded-lg border border-border-color">
                    <div className="text-lg font-bold text-green-400">{agentStats.successfulActions}</div>
                    <div className="text-xs text-text-tertiary">Sucessos</div>
                  </div>
                  <div className="p-3 bg-bg-secondary rounded-lg border border-border-color">
                    <div className="text-lg font-bold text-red-400">{agentStats.failedActions}</div>
                    <div className="text-xs text-text-tertiary">Falhas</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Triggers Tab - NOVO */}
          {activeTab === 'triggers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-bolt text-yellow-400"></i>
                  Triggers Visuais
                </h2>
                <p className="text-text-secondary text-sm mb-4">
                  Automação baseada em detecção visual contínua
                </p>
              </div>

              <div className="flex gap-3">
                {isMonitoring ? (
                  <button
                    onClick={handleStopMonitoring}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg font-bold transition-all duration-200"
                  >
                    <i className="fa-solid fa-stop mr-2"></i>
                    Parar Monitoramento
                  </button>
                ) : (
                  <button
                    onClick={handleStartMonitoring}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold transition-all duration-200"
                  >
                    <i className="fa-solid fa-play mr-2"></i>
                    Iniciar Monitoramento
                  </button>
                )}
                
                <button
                  onClick={handleCreatePresets}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all duration-200"
                >
                  <i className="fa-solid fa-magic mr-2"></i>
                  Criar Presets
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-bg-secondary rounded-lg border border-border-color">
                  <div className="text-lg font-bold text-blue-400">{triggerStats.total}</div>
                  <div className="text-xs text-text-tertiary">Total</div>
                </div>
                <div className="p-3 bg-bg-secondary rounded-lg border border-border-color">
                  <div className="text-lg font-bold text-green-400">{triggerStats.enabled}</div>
                  <div className="text-xs text-text-tertiary">Ativos</div>
                </div>
                <div className="p-3 bg-bg-secondary rounded-lg border border-border-color">
                  <div className="text-lg font-bold text-gray-400">{triggerStats.disabled}</div>
                  <div className="text-xs text-text-tertiary">Inativos</div>
                </div>
                <div className="p-3 bg-bg-secondary rounded-lg border border-border-color">
                  <div className="text-lg font-bold text-yellow-400">{triggerStats.recentlyTriggered}</div>
                  <div className="text-xs text-text-tertiary">Ativados</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-text-tertiary">Triggers Configurados</h3>
                {triggers.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    <i className="fa-solid fa-inbox text-4xl mb-2"></i>
                    <p>Nenhum trigger configurado</p>
                    <p className="text-sm mt-1">Clique em "Criar Presets" para começar</p>
                  </div>
                ) : (
                  triggers.map((trigger) => (
                    <div key={trigger.id} className="p-4 bg-bg-secondary rounded-lg border border-border-color">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${trigger.enabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                          <span className="font-medium">{trigger.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTrigger(trigger.id, !trigger.enabled)}
                            className={`px-3 py-1 text-xs rounded ${
                              trigger.enabled 
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                            }`}
                          >
                            {trigger.enabled ? 'Ativo' : 'Inativo'}
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(trigger.id)}
                            className="px-3 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-text-secondary">
                        {trigger.conditions.length} condições • {trigger.actions.length} ações
                      </div>
                      {trigger.lastTriggered && (
                        <div className="text-xs text-text-tertiary mt-1">
                          Último ativado: {new Date(trigger.lastTriggered).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
                  Histórico de Ações
                </h2>
                <p className="text-text-secondary text-sm mb-4">
                  Últimas {actionHistory.length} ações executadas
                </p>
              </div>

              <div className="space-y-2">
                {actionHistory.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    <i className="fa-solid fa-inbox text-4xl mb-2"></i>
                    <p>Nenhuma ação executada ainda</p>
                  </div>
                ) : (
                  actionHistory.map((action, idx) => (
                    <div key={idx} className="p-3 bg-bg-secondary rounded-lg border border-border-color">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{action.type.replace('_', ' ')}</span>
                        <span className="text-xs text-text-tertiary">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary">
                        {JSON.stringify(action.data)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Screenshot */}
        <div className="w-1/2 p-6 bg-bg-secondary">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <i className="fa-solid fa-image text-blue-400"></i>
                Visualização da Tela
              </h3>
              {screenshot && (
                <button
                  onClick={() => setScreenshot(null)}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200"
                >
                  <i className="fa-solid fa-times mr-1"></i>
                  Limpar
                </button>
              )}
            </div>

            <div className="flex-1 bg-bg-primary rounded-lg border-2 border-dashed border-border-color flex items-center justify-center overflow-hidden">
              {screenshot ? (
                <img 
                  src={screenshot} 
                  alt="Screenshot" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-text-tertiary">
                  <i className="fa-solid fa-camera text-6xl mb-4 opacity-50"></i>
                  <p className="text-lg font-medium">Nenhuma captura ainda</p>
                  <p className="text-sm mt-2">Clique em "Capturar Tela" para visualizar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
