import React, { useState, useEffect, useRef } from 'react';
import { autonomousAgentService, TaskPlan, TaskStep, ScreenSource } from '../services/autonomousAgentService';

export const AutonomousAgentView: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [maxApiCalls, setMaxApiCalls] = useState(50);
  const [currentPlan, setCurrentPlan] = useState<TaskPlan | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [sources, setSources] = useState<ScreenSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<ScreenSource | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TaskPlan[]>([]);
  
  const statsInterval = useRef<number | null>(null);

  useEffect(() => {
    loadSources();
    loadHistory();
    
    // Update stats every second
    statsInterval.current = window.setInterval(() => {
      const newStats = autonomousAgentService.getStatistics();
      if (newStats) {
        setStats(newStats);
        setCurrentPlan(autonomousAgentService.getCurrentPlan());
      }
    }, 1000);

    return () => {
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
      }
    };
  }, []);

  const loadSources = async () => {
    const availableSources = await autonomousAgentService.getAvailableSources();
    setSources(availableSources);
    
    // Select primary screen by default
    if (availableSources.length > 0) {
      autonomousAgentService.selectSource(availableSources[0]);
      setSelectedSource(availableSources[0]);
    }
  };

  const loadHistory = () => {
    setHistory(autonomousAgentService.getExecutionHistory());
  };

  const handleCreatePlan = async () => {
    if (!goal.trim()) {
      alert('Please enter a goal');
      return;
    }

    setIsCreatingPlan(true);
    try {
      const plan = await autonomousAgentService.createPlan(goal, maxApiCalls);
      setCurrentPlan(plan);
      setStats(autonomousAgentService.getStatistics());
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan: ' + (error as Error).message);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleExecute = async () => {
    if (!currentPlan) return;
    
    try {
      await autonomousAgentService.executePlan();
      autonomousAgentService.saveToHistory();
      loadHistory();
    } catch (error) {
      console.error('Error executing plan:', error);
      alert('Execution error: ' + (error as Error).message);
    }
  };

  const handlePause = () => {
    autonomousAgentService.pauseExecution();
  };

  const handleResume = () => {
    autonomousAgentService.resumeExecution();
  };

  const handleStop = () => {
    autonomousAgentService.stopExecution();
    autonomousAgentService.saveToHistory();
    loadHistory();
  };

  const handleSourceChange = (source: ScreenSource) => {
    autonomousAgentService.selectSource(source);
    setSelectedSource(source);
  };

  const handleLoadFromHistory = (plan: TaskPlan) => {
    setGoal(plan.goal);
    setMaxApiCalls(plan.maxApiCalls);
    setShowHistory(false);
  };

  const quickGoals = [
    "Open YouTube and search for Prox AI Studio",
    "Open Google and search for AI news",
    "Open Gmail and check inbox",
    "Open Twitter and post a tweet",
    "Open VS Code and create new file"
  ];

  return (
    <div className="flex flex-col h-full bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="p-6 border-b border-border-color">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Autonomous Agent
            </h1>
            <p className="text-text-secondary mt-1">AI that sees, plans, and acts like a human</p>
          </div>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-bg-secondary border border-border-color rounded-lg hover:bg-bg-tertiary transition-all duration-200 flex items-center gap-2"
          >
            <i className="fa-solid fa-history"></i>
            History
          </button>
        </div>

        {/* Screen Source Selector */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-text-tertiary font-medium">Screen Source:</label>
          <div className="flex gap-2">
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => handleSourceChange(source)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedSource?.id === source.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                    : 'bg-bg-secondary border border-border-color hover:bg-bg-tertiary'
                }`}
              >
                <i className={`fa-solid ${source.type === 'screen' ? 'fa-desktop' : source.type === 'window' ? 'fa-window-maximize' : 'fa-browser'} mr-2`}></i>
                {source.name}
              </button>
            ))}
          </div>
        </div>

        {/* Goal Input */}
        <div className="space-y-3">
          <div>
            <label className="text-sm text-text-tertiary font-medium mb-2 block">What do you want the AI to do?</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Example: Open YouTube and search for Prox AI Studio"
              className="w-full bg-bg-secondary border border-border-color rounded-xl p-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-cyan-500 transition-all duration-200 resize-none"
              rows={3}
            />
          </div>

          {/* Quick Goals */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-text-tertiary">Quick goals:</span>
            {quickGoals.map((quickGoal, idx) => (
              <button
                key={idx}
                onClick={() => setGoal(quickGoal)}
                className="text-xs px-3 py-1 bg-bg-tertiary border border-border-color rounded-full hover:bg-bg-secondary hover:border-cyan-500 transition-all duration-200"
              >
                {quickGoal}
              </button>
            ))}
          </div>

          {/* Settings */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-tertiary">Max API Calls:</label>
              <input
                type="number"
                value={maxApiCalls}
                onChange={(e) => setMaxApiCalls(parseInt(e.target.value))}
                className="w-20 bg-bg-secondary border border-border-color rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-cyan-500"
                min={1}
                max={200}
              />
            </div>

            <button
              onClick={handleCreatePlan}
              disabled={isCreatingPlan || !goal.trim()}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreatingPlan ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Creating Plan...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-brain"></i>
                  Create Plan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Plan & Execution */}
        {!showHistory ? (
          <div className="flex-1 flex">
            {/* Steps List */}
            <div className="w-1/2 border-r border-border-color overflow-y-auto p-6">
              {currentPlan ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-2">{currentPlan.goal}</h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full font-medium ${
                        currentPlan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        currentPlan.status === 'executing' ? 'bg-blue-500/20 text-blue-400' :
                        currentPlan.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        currentPlan.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {currentPlan.status.toUpperCase()}
                      </span>
                      <span className="text-text-tertiary">
                        {currentPlan.steps.length} steps
                      </span>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-3">
                    {currentPlan.steps.map((step, idx) => (
                      <StepCard
                        key={step.id}
                        step={step}
                        index={idx}
                        isCurrent={idx === currentPlan.currentStep}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                  <i className="fa-solid fa-robot text-6xl mb-4 opacity-20"></i>
                  <p className="text-lg">No plan yet</p>
                  <p className="text-sm mt-2">Enter a goal and click "Create Plan"</p>
                </div>
              )}
            </div>

            {/* Stats & Controls */}
            <div className="w-1/2 overflow-y-auto p-6">
              {stats ? (
                <>
                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-text-tertiary">{Math.round(stats.progress)}%</span>
                    </div>
                    <div className="w-full bg-bg-tertiary rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <StatCard
                      icon="fa-list-check"
                      label="Steps"
                      value={`${stats.currentStep}/${stats.totalSteps}`}
                      color="cyan"
                    />
                    <StatCard
                      icon="fa-check-circle"
                      label="Completed"
                      value={stats.completedSteps}
                      color="green"
                    />
                    <StatCard
                      icon="fa-cloud"
                      label="API Calls"
                      value={`${stats.apiCallsUsed}/${stats.maxApiCalls}`}
                      color="purple"
                    />
                    <StatCard
                      icon="fa-clock"
                      label="Time"
                      value={`${Math.round(stats.timeElapsed / 1000)}s`}
                      color="orange"
                    />
                    <StatCard
                      icon="fa-redo"
                      label="Attempts"
                      value={stats.totalAttempts}
                      color="blue"
                    />
                    <StatCard
                      icon="fa-exclamation-triangle"
                      label="Errors"
                      value={stats.errors}
                      color="red"
                    />
                  </div>

                  {/* Controls */}
                  <div className="space-y-3">
                    {stats.status === 'planning' && (
                      <button
                        onClick={handleExecute}
                        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-play"></i>
                        Start Execution
                      </button>
                    )}

                    {stats.status === 'executing' && (
                      <button
                        onClick={handlePause}
                        className="w-full px-6 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-pause"></i>
                        Pause Execution
                      </button>
                    )}

                    {stats.status === 'paused' && (
                      <button
                        onClick={handleResume}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-play"></i>
                        Resume Execution
                      </button>
                    )}

                    {(stats.status === 'executing' || stats.status === 'paused') && (
                      <button
                        onClick={handleStop}
                        className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-stop"></i>
                        Stop Execution
                      </button>
                    )}

                    {stats.status === 'completed' && (
                      <div className="p-6 bg-green-500/10 border-2 border-green-500/30 rounded-xl text-center">
                        <i className="fa-solid fa-check-circle text-4xl text-green-400 mb-3"></i>
                        <p className="text-lg font-bold text-green-400">Execution Completed!</p>
                        <p className="text-sm text-text-tertiary mt-2">
                          Completed in {Math.round(stats.timeElapsed / 1000)}s with {stats.apiCallsUsed} API calls
                        </p>
                      </div>
                    )}

                    {stats.status === 'failed' && (
                      <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-center">
                        <i className="fa-solid fa-times-circle text-4xl text-red-400 mb-3"></i>
                        <p className="text-lg font-bold text-red-400">Execution Failed</p>
                        <p className="text-sm text-text-tertiary mt-2">
                          {stats.errors} error(s) occurred
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Errors */}
                  {currentPlan && currentPlan.errors.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-bold mb-3 text-red-400">Errors</h3>
                      <div className="space-y-2">
                        {currentPlan.errors.map((error, idx) => (
                          <div key={idx} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm">
                            <div className="font-medium text-red-400">{error.step}</div>
                            <div className="text-text-tertiary mt-1">{error.error}</div>
                            {error.recovered && (
                              <div className="text-green-400 text-xs mt-1">✓ Recovered</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                  <i className="fa-solid fa-chart-line text-6xl mb-4 opacity-20"></i>
                  <p className="text-lg">No statistics yet</p>
                  <p className="text-sm mt-2">Create and execute a plan to see stats</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* History View */
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Execution History</h2>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                <i className="fa-solid fa-history text-6xl mb-4 opacity-20"></i>
                <p className="text-lg">No history yet</p>
                <p className="text-sm mt-2">Execute plans to build history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((plan, idx) => (
                  <HistoryCard
                    key={idx}
                    plan={plan}
                    onLoad={() => handleLoadFromHistory(plan)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StepCard: React.FC<{ step: TaskStep; index: number; isCurrent: boolean }> = ({ step, index, isCurrent }) => {
  const getStatusColor = () => {
    switch (step.status) {
      case 'completed': return 'border-green-500 bg-green-500/10';
      case 'executing': return 'border-blue-500 bg-blue-500/10 animate-pulse';
      case 'failed': return 'border-red-500 bg-red-500/10';
      case 'skipped': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-border-color bg-bg-secondary';
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed': return 'fa-check-circle text-green-400';
      case 'executing': return 'fa-spinner fa-spin text-blue-400';
      case 'failed': return 'fa-times-circle text-red-400';
      case 'skipped': return 'fa-forward text-yellow-400';
      default: return 'fa-circle text-gray-400';
    }
  };

  const getActionIcon = () => {
    switch (step.action.type) {
      case 'analyze': return 'fa-search';
      case 'click': return 'fa-mouse-pointer';
      case 'type': return 'fa-keyboard';
      case 'scroll': return 'fa-arrows-up-down';
      case 'wait': return 'fa-clock';
      case 'verify': return 'fa-check-double';
      default: return 'fa-bolt';
    }
  };

  return (
    <div className={`border-2 rounded-xl p-4 transition-all duration-200 ${getStatusColor()} ${isCurrent ? 'ring-2 ring-cyan-500' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <i className={`fa-solid ${getActionIcon()} text-cyan-400`}></i>
            <span className="font-medium text-text-primary">{step.description}</span>
          </div>
          {step.action.target && (
            <div className="text-sm text-text-tertiary mb-1">
              Target: {step.action.target}
            </div>
          )}
          {step.action.value && (
            <div className="text-sm text-text-tertiary mb-1">
              Value: {step.action.value}
            </div>
          )}
          {step.attempts > 0 && (
            <div className="text-xs text-text-tertiary">
              Attempts: {step.attempts}/{step.maxAttempts}
            </div>
          )}
          {step.error && (
            <div className="text-xs text-red-400 mt-2">
              Error: {step.error}
            </div>
          )}
        </div>
        <i className={`fa-solid ${getStatusIcon()}`}></i>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => {
  const colorClasses = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    red: 'text-red-400'
  };

  return (
    <div className="bg-bg-secondary border border-border-color rounded-xl p-4">
      <div className="flex items-center gap-3">
        <i className={`fa-solid ${icon} text-2xl ${colorClasses[color as keyof typeof colorClasses]}`}></i>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-text-tertiary">{label}</div>
        </div>
      </div>
    </div>
  );
};

const HistoryCard: React.FC<{ plan: TaskPlan; onLoad: () => void }> = ({ plan, onLoad }) => {
  const duration = plan.endTime ? plan.endTime - plan.startTime : 0;

  return (
    <div className="bg-bg-secondary border border-border-color rounded-xl p-4 hover:border-cyan-500 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary mb-1">{plan.goal}</h3>
          <div className="flex items-center gap-3 text-sm text-text-tertiary">
            <span>{plan.steps.length} steps</span>
            <span>•</span>
            <span>{Math.round(duration / 1000)}s</span>
            <span>•</span>
            <span>{plan.apiCallsUsed} API calls</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          plan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
          plan.status === 'failed' ? 'bg-red-500/20 text-red-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {plan.status}
        </span>
      </div>
      <button
        onClick={onLoad}
        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        Load this goal →
      </button>
    </div>
  );
};
