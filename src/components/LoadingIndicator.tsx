import React from 'react';

interface LoadingIndicatorProps {
  onStop: () => void;
  isThinking?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ onStop, isThinking }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 text-text-secondary">
        <div className="w-4 h-4 border-2 border-t-blue-400 border-r-blue-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold">{isThinking ? 'Gemini está pensando profundamente...' : 'Gemini está pensando...'}</span>
      </div>
       <button onClick={onStop} className="mt-4 bg-bg-tertiary hover:bg-opacity-80 text-text-secondary font-semibold py-1.5 px-3 rounded-full text-xs flex items-center gap-2 border border-border-color">
            <i className="fa-solid fa-stop text-xs"></i>
            Parar Geração
        </button>
    </div>
  );
};