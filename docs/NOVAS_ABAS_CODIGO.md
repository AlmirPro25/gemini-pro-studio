# Código das Novas Abas para Desktop Control

## Aba Agent (Agente Autônomo)

```tsx
{/* Agent Tab */}
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

    {/* Goal Input */}
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

    {/* Max API Calls */}
    <div>
      <label className="block text-sm font-medium text-text-tertiary mb-2">Limite de Chamadas API</label>
      <input
        type="number"
        value={maxApiCalls}
        onChange={(e) => setMaxApiCalls(parseInt(e.target.value) || 50)}
        className="w-full px-4 py-2 bg-bg-secondary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>

    {/* Action Buttons */}
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

    {/* Current Plan */}
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

    {/* Stats */}
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
```

## Aba Triggers (Triggers Visuais)

```tsx
{/* Triggers Tab */}
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

    {/* Control Buttons */}
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

    {/* Stats */}
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

    {/* Triggers List */}
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
```

## Funções Necessárias

Adicionar antes do return:

```tsx
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
```

## useEffect Adicional

Adicionar no useEffect existente:

```tsx
useEffect(() => {
  checkConnection();
  loadHistory();
  loadTriggers(); // NOVO
  
  // Update stats
  const interval = setInterval(() => {
    setAgentStats(autonomousAgentService.getStatistics());
    setTriggerStats(deepVisionAutomationService.getStatistics());
    setCurrentPlan(autonomousAgentService.getCurrentPlan());
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```
