import React, { useState } from 'react';
import { GeminiModel, Persona } from '../types';
import { GEMINI_MODELS, PERSONAS } from '../constants';

interface HeaderProps {
  selectedModel: GeminiModel;
  setSelectedModel: (model: GeminiModel) => void;
  selectedPersona: Persona;
  setSelectedPersona: (persona: Persona) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isThinkingMode: boolean;
  onToggleThinkingMode: () => void;
  liveConversationState: 'idle' | 'connecting' | 'active';
  onLiveConversationClick: () => void;
  onOpenSettings: () => void;
  onOpenMetaPersona: () => void;
  generatedPersonas?: Persona[];
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
    <label htmlFor={label} className="flex items-center cursor-pointer">
        <div className="relative">
            <input id={label} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block ${checked ? 'bg-blue-500' : 'bg-gray-600'} w-10 h-6 rounded-full transition`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
        <div className="ml-2 text-sm text-text-secondary">{label}</div>
    </label>
);


export const Header: React.FC<HeaderProps> = (props) => {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const handleModelSelect = (model: GeminiModel) => {
    props.setSelectedModel(model);
    props.setSelectedPersona(PERSONAS[0]); // Reset to general persona
    setIsModelSelectorOpen(false);
  };

  const handlePersonaSelect = (persona: Persona) => {
    props.setSelectedPersona(persona);
    props.setSelectedModel(GEMINI_MODELS.find(m => m.isPro) || GEMINI_MODELS[0]);
    setIsModelSelectorOpen(false);
  };

  const currentSelectionName = props.selectedPersona.id === 'general' ? props.selectedModel.name : props.selectedPersona.name;
  
  const getLiveButtonState = () => {
    switch(props.liveConversationState) {
        case 'connecting':
            return { text: "Conectando...", icon: "fa-spinner fa-spin", disabled: true };
        case 'active':
            return { text: "Sessão Ativa", icon: "fa-microphone-slash", disabled: false, style: "bg-red-500 hover:bg-red-600 text-white" };
        default:
            return { text: "Conversa ao Vivo", icon: "fa-microphone-lines", disabled: false };
    }
  };
  const liveButtonState = getLiveButtonState();

  return (
    <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border-color flex-shrink-0 bg-bg-primary">
      <div className="relative">
        <button 
          onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-transparent text-text-secondary hover:text-text-primary rounded-lg transition-colors text-base"
        >
          <span className="font-semibold text-lg text-text-primary">Estúdio Gemini Pro</span>
          <span className="text-text-tertiary">/</span>
          <span>{currentSelectionName}</span>
          <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isModelSelectorOpen ? 'rotate-180' : ''}`}></i>
        </button>
        {isModelSelectorOpen && (
          <div className="absolute top-full mt-2 w-80 max-h-[70vh] overflow-y-auto bg-[rgba(var(--bg-secondary-rgb),0.95)] backdrop-blur-lg rounded-lg shadow-2xl p-2 z-10 border border-border-color scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div>
              <h3 className="text-xs text-text-tertiary font-semibold px-2 py-1 sticky top-0 bg-[rgba(var(--bg-secondary-rgb),0.95)] backdrop-blur-lg z-10">Models</h3>
              {GEMINI_MODELS.map(model => (
                <button 
                  key={model.id} 
                  onClick={() => handleModelSelect(model)}
                  className={`w-full text-left p-2 rounded-lg hover:bg-bg-tertiary ${props.selectedModel.id === model.id && props.selectedPersona.id === 'general' ? 'bg-bg-tertiary' : ''}`}
                >
                  <p className="font-semibold text-sm text-text-primary">{model.name} {model.isPro && <span className="text-xs text-purple-400 ml-1">PRO</span>}</p>
                  <p className="text-xs text-text-tertiary">{model.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-2 border-t border-border-color pt-2">
              <div className="flex items-center justify-between px-2 py-1 sticky top-0 bg-[rgba(var(--bg-secondary-rgb),0.95)] backdrop-blur-lg z-10">
                <h3 className="text-xs text-text-tertiary font-semibold">Specialists Hub</h3>
                <button
                  onClick={() => {
                    setIsModelSelectorOpen(false);
                    props.onOpenMetaPersona();
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  Meta-Persona
                </button>
              </div>
               {/* Regular Personas */}
               {PERSONAS.filter(p => p.id !== 'general' && !p.domain).map(persona => (
                <button 
                  key={persona.id} 
                  onClick={() => handlePersonaSelect(persona)}
                  className={`w-full text-left p-2 rounded-lg hover:bg-bg-tertiary flex items-center gap-3 ${props.selectedPersona.id === persona.id ? 'bg-bg-tertiary' : ''}`}
                >
                  <i className={`${persona.icon} w-5 text-center text-text-secondary`}></i>
                  <span className="font-semibold text-sm text-text-primary">{persona.name}</span>
                </button>
              ))}
              
              {/* Technical Personas Section */}
              {PERSONAS.filter(p => p.domain).length > 0 && (
                <>
                  <div className="border-t border-border-color my-2"></div>
                  <h3 className="text-xs text-blue-400 font-semibold px-2 py-1 flex items-center gap-1">
                    <i className="fa-solid fa-brain"></i>
                    Neural Architect System
                  </h3>
                  {PERSONAS.filter(p => p.domain).map(persona => (
                    <button 
                      key={persona.id} 
                      onClick={() => handlePersonaSelect(persona)}
                      className={`w-full text-left p-2 rounded-lg hover:bg-bg-tertiary flex items-center gap-3 ${props.selectedPersona.id === persona.id ? 'bg-bg-tertiary' : ''}`}
                    >
                      <i className={`${persona.icon} w-5 text-center`} style={{ color: persona.color }}></i>
                      <div className="flex-1">
                        <span className="font-semibold text-sm text-text-primary block">{persona.name}</span>
                        {persona.domain && (
                          <span className="text-xs text-text-tertiary">{persona.domain}</span>
                        )}
                      </div>
                      {persona.capabilities && persona.capabilities.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {persona.capabilities.length} skills
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}
              {props.generatedPersonas && props.generatedPersonas.length > 0 && (
                <>
                  <div className="border-t border-border-color my-2"></div>
                  <h3 className="text-xs text-purple-400 font-semibold px-2 py-1 flex items-center gap-1">
                    <i className="fa-solid fa-sparkles"></i>
                    Gerados pelo Master AI
                  </h3>
                  {props.generatedPersonas.map(persona => (
                    <button 
                      key={persona.id} 
                      onClick={() => handlePersonaSelect(persona)}
                      className={`w-full text-left p-2 rounded-lg hover:bg-bg-tertiary flex items-center gap-3 ${props.selectedPersona.id === persona.id ? 'bg-bg-tertiary' : ''}`}
                    >
                      <i className={`${persona.icon} w-5 text-center text-purple-400`}></i>
                      <div className="flex-1">
                        <span className="font-semibold text-sm text-text-primary block">{persona.name}</span>
                        {persona.domain && (
                          <span className="text-xs text-text-tertiary">{persona.domain}</span>
                        )}
                      </div>
                      {persona.isTeamMember && (
                        <i className="fa-solid fa-users text-xs text-blue-400"></i>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-text-secondary">
        <ToggleSwitch checked={props.isThinkingMode} onChange={props.onToggleThinkingMode} label="Thinking Mode" />
        <button 
            onClick={props.onLiveConversationClick} 
            disabled={liveButtonState.disabled}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 transition-colors ${liveButtonState.style || 'bg-bg-tertiary text-text-secondary hover:bg-opacity-80 hover:text-text-primary'}`}
        >
            <i className={`fa-solid ${liveButtonState.icon}`}></i>
            {liveButtonState.text}
        </button>
        <button onClick={props.onToggleTheme} className="hover:text-text-primary transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-tertiary" data-tooltip={`Mudar para modo ${props.theme === 'dark' ? 'claro' : 'escuro'}`}>
            <i className={`fa-solid ${props.theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
         <button onClick={props.onOpenSettings} className="hover:text-text-primary transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-tertiary" data-tooltip="Configurações do Modelo">
            <i className="fa-solid fa-sliders text-base"></i>
        </button>
      </div>
    </div>
  );
};