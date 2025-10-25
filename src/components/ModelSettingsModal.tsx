import React, { useState, useEffect } from 'react';
import { GenerationConfig } from '../types';

interface ModelSettingsModalProps {
  config: GenerationConfig;
  onSave: (newConfig: GenerationConfig) => void;
  onClose: () => void;
}

const SliderInput: React.FC<{
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}> = ({ label, description, value, onChange, min, max, step }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-20 bg-bg-tertiary p-2 text-center rounded-md border border-border-color focus:outline-none focus:border-blue-500"
      />
    </div>
    <p className="text-xs text-text-tertiary mt-2">{description}</p>
  </div>
);


export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({ config, onSave, onClose }) => {
  const [currentConfig, setCurrentConfig] = useState(config);

  useEffect(() => {
    setCurrentConfig(config);
  }, [config]);

  const handleSave = () => {
    onSave(currentConfig);
    onClose();
  };
  
  const updateConfig = (key: keyof GenerationConfig, value: number) => {
    setCurrentConfig(prev => ({...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-secondary rounded-lg p-6 max-w-2xl w-full shadow-2xl border border-border-color text-text-primary" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Configurações do Modelo</h2>
            <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">&times;</button>
        </div>
        
        <SliderInput 
            label="Temperatura"
            description="Controla a aleatoriedade. Valores mais baixos para respostas mais diretas, valores mais altos para mais criatividade."
            value={currentConfig.temperature}
            onChange={(v) => updateConfig('temperature', v)}
            min={0} max={1} step={0.01}
        />
        
        <SliderInput 
            label="Top-K"
            description="Filtra as palavras menos prováveis. Um valor de 1 significa que apenas a palavra mais provável é escolhida."
            value={currentConfig.topK}
            onChange={(v) => updateConfig('topK', v)}
            min={1} max={100} step={1}
        />

        <SliderInput 
            label="Top-P"
            description="Seleciona palavras com base na probabilidade acumulada. Ajuda a evitar palavras muito raras."
            value={currentConfig.topP}
            onChange={(v) => updateConfig('topP', v)}
            min={0} max={1} step={0.01}
        />

        <SliderInput 
            label="Máximo de Tokens de Saída"
            description="Define o comprimento máximo da resposta gerada."
            value={currentConfig.maxOutputTokens}
            onChange={(v) => updateConfig('maxOutputTokens', v)}
            min={1} max={8192} step={1}
        />

        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="px-4 py-2 bg-bg-tertiary hover:bg-opacity-80 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
