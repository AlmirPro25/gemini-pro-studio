import React from 'react';
import { Persona } from '../types';

interface TechnicalPersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onSelect: (persona: Persona) => void;
}

export const TechnicalPersonaCard: React.FC<TechnicalPersonaCardProps> = ({
  persona,
  isSelected,
  onSelect
}) => {
  const isTechnical = persona.domain && persona.capabilities;

  if (!isTechnical) return null;

  return (
    <button
      onClick={() => onSelect(persona)}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        hover:scale-105 hover:shadow-lg
        ${isSelected 
          ? 'border-purple-500 bg-purple-500/10 shadow-purple-500/20' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }
      `}
      style={{
        borderColor: isSelected ? persona.color : undefined
      }}
    >
      {/* Icon */}
      <div className="text-4xl mb-2">
        {persona.icon?.startsWith('fa-') ? (
          <i className={persona.icon}></i>
        ) : (
          persona.icon || '🤖'
        )}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-lg mb-1 text-white">
        {persona.name}
      </h3>

      {/* Domain */}
      {persona.domain && (
        <p className="text-sm text-gray-400 mb-2">
          {persona.domain}
        </p>
      )}

      {/* Capabilities */}
      {persona.capabilities && persona.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {persona.capabilities.slice(0, 3).map((capability, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded bg-gray-700/50 text-gray-300"
            >
              {capability}
            </span>
          ))}
          {persona.capabilities.length > 3 && (
            <span className="px-2 py-1 text-xs rounded bg-gray-700/50 text-gray-400">
              +{persona.capabilities.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <div 
          className="absolute top-2 right-2 w-3 h-3 rounded-full"
          style={{ backgroundColor: persona.color }}
        />
      )}
    </button>
  );
};
