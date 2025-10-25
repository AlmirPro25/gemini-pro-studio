import React, { useState } from 'react';
import { Persona } from '../types';

interface PersonaInfoBannerProps {
  persona: Persona;
}

export const PersonaInfoBanner: React.FC<PersonaInfoBannerProps> = ({ persona }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!persona.isGenerated) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
          <i className={persona.icon}></i>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                {persona.name}
                <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded">
                  <i className="fa-solid fa-sparkles mr-1"></i>
                  Gerado pelo Master AI
                </span>
                {persona.isTeamMember && (
                  <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded">
                    <i className="fa-solid fa-users mr-1"></i>
                    {persona.teamRole}
                  </span>
                )}
              </h3>
              {persona.domain && (
                <p className="text-sm text-purple-400 mt-1">
                  <i className="fa-solid fa-tag mr-1"></i>
                  {persona.domain}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-3 text-sm">
              {persona.reasoning && (
                <div>
                  <p className="text-text-tertiary font-medium mb-1">
                    <i className="fa-solid fa-lightbulb mr-1"></i>
                    Por que este especialista?
                  </p>
                  <p className="text-text-secondary">{persona.reasoning}</p>
                </div>
              )}

              {persona.capabilities && persona.capabilities.length > 0 && (
                <div>
                  <p className="text-text-tertiary font-medium mb-2">
                    <i className="fa-solid fa-star mr-1"></i>
                    Capacidades Principais
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {persona.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="text-xs bg-bg-tertiary text-text-secondary px-2 py-1 rounded border border-border-color"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {persona.communicationStyle && (
                <div>
                  <p className="text-text-tertiary font-medium mb-1">
                    <i className="fa-solid fa-comments mr-1"></i>
                    Estilo de Comunicação
                  </p>
                  <p className="text-text-secondary">{persona.communicationStyle}</p>
                </div>
              )}

              <div className="pt-2 border-t border-border-color">
                <p className="text-xs text-text-tertiary">
                  <i className="fa-solid fa-clock mr-1"></i>
                  Criado em {new Date(persona.createdAt || Date.now()).toLocaleString('pt-BR')}
                  {persona.refinedAt && (
                    <span className="ml-2">
                      • Refinado em {new Date(persona.refinedAt).toLocaleString('pt-BR')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
