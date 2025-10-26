import React, { useState, useEffect } from 'react';
import { deepVisionAutomationService, VisionTrigger } from '../services/deepVisionAutomationService';

export const DeepVisionAutomationPanel: React.FC = () => {
  const [triggers, setTriggers] = useState<VisionTrigger[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState({ total: 0, enabled: 0, disabled: 0, recentlyTriggered: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadTriggers();
    updateStats();
    setIsMonitoring(deepVisionAutomationService.isActive());

    const interval = setInterval(() => {
      loadTriggers();
      updateStats();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadTriggers = () => {
    setTriggers(deepVisionAutomationService.getAllTriggers());
  };

  const updateStats = () => {
    setStats(deepVisionAutomationService.getStatistics());
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
    if (confirm('Delete this trigger?')) {
      deepVisionAutomationService.removeTrigger(id);
      loadTriggers();
    }
  };

  const handleCreatePresets = () => {
    deepVisionAutomationService.createPresetTriggers();
    loadTriggers();
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary text-text-primary p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DeepVision Automation
            </h1>
            <p className="text-text-secondary mt-1">AI Vision + Computer Control</p>
          </div>
          
          <div className="flex gap-3">
            {isMonitoring ? (
              <button
                onClick={handleStopMonitoring}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <i className="fa-solid fa-stop"></i>
                Stop Monitoring
              </button>
            ) : (
              <button
                onClick={handleStartMonitoring}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <i className="fa-solid fa-play"></i>
                Start Monitoring
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-bg-secondary p-4 rounded-xl border border-border-color">
            <div className="text-2xl font-bold text-purple-400">{stats.total}</div>
            <div className="text-sm text-text-tertiary">Total Triggers</div>
          </div>
          <div className="bg-bg-secondary p-4 rounded-xl border border-border-color">
            <div className="text-2xl font-bold text-green-400">{stats.enabled}</div>
            <div className="text-sm text-text-tertiary">Enabled</div>
          </div>
          <div className="bg-bg-secondary p-4 rounded-xl border border-border-color">
            <div className="text-2xl font-bold text-gray-400">{stats.disabled}</div>
            <div className="text-sm text-text-tertiary">Disabled</div>
          </div>
          <div className="bg-bg-secondary p-4 rounded-xl border border-border-color">
            <div className="text-2xl font-bold text-orange-400">{stats.recentlyTriggered}</div>
            <div className="text-sm text-text-tertiary">Recently Triggered</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleCreatePresets}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
          Create Preset Triggers
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          New Custom Trigger
        </button>
      </div>

      {/* Triggers List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {triggers.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <i className="fa-solid fa-robot text-6xl mb-4 opacity-20"></i>
            <p className="text-lg">No triggers yet</p>
            <p className="text-sm mt-2">Create preset triggers to get started</p>
          </div>
        ) : (
          triggers.map(trigger => (
            <TriggerCard
              key={trigger.id}
              trigger={trigger}
              onToggle={(enabled) => handleToggleTrigger(trigger.id, enabled)}
              onDelete={() => handleDeleteTrigger(trigger.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const TriggerCard: React.FC<{
  trigger: VisionTrigger;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}> = ({ trigger, onToggle, onDelete }) => {
  const getConditionIcon = (type: string) => {
    switch (type) {
      case 'object_detected': return 'fa-cube';
      case 'face_recognized': return 'fa-face-smile';
      case 'pose_detected': return 'fa-person';
      case 'behavior_detected': return 'fa-brain';
      case 'zone_entered': return 'fa-location-dot';
      default: return 'fa-circle';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'click': return 'fa-mouse-pointer';
      case 'type': return 'fa-keyboard';
      case 'open_app': return 'fa-window-maximize';
      case 'send_notification': return 'fa-bell';
      case 'record_video': return 'fa-video';
      case 'take_screenshot': return 'fa-camera';
      case 'run_script': return 'fa-code';
      default: return 'fa-bolt';
    }
  };

  const timeSinceTriggered = trigger.lastTriggered 
    ? Math.floor((Date.now() - trigger.lastTriggered) / 1000)
    : null;

  return (
    <div className={`bg-bg-secondary rounded-xl border-2 ${trigger.enabled ? 'border-green-500/30' : 'border-border-color'} p-4 transition-all duration-200 hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-text-primary">{trigger.name}</h3>
            {trigger.enabled && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                Active
              </span>
            )}
            {timeSinceTriggered !== null && timeSinceTriggered < 60 && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                Triggered {timeSinceTriggered}s ago
              </span>
            )}
          </div>
          
          {/* Conditions */}
          <div className="mb-3">
            <div className="text-xs text-text-tertiary mb-1">CONDITIONS:</div>
            <div className="flex flex-wrap gap-2">
              {trigger.conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-bg-tertiary rounded-lg text-sm">
                  <i className={`fa-solid ${getConditionIcon(cond.type)} text-purple-400`}></i>
                  <span className="text-text-secondary">{cond.value}</span>
                  <span className="text-text-tertiary text-xs">({Math.round(cond.confidence * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="text-xs text-text-tertiary mb-1">ACTIONS:</div>
            <div className="flex flex-wrap gap-2">
              {trigger.actions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-bg-tertiary rounded-lg text-sm">
                  <i className={`fa-solid ${getActionIcon(action.type)} text-cyan-400`}></i>
                  <span className="text-text-secondary">{action.type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={() => onToggle(!trigger.enabled)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              trigger.enabled 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }`}
            title={trigger.enabled ? 'Disable' : 'Enable'}
          >
            <i className={`fa-solid ${trigger.enabled ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
            title="Delete"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      {/* Cooldown */}
      <div className="text-xs text-text-tertiary">
        Cooldown: {trigger.cooldown / 1000}s
      </div>
    </div>
  );
};
