import React, { useState } from 'react';
import { GeminiModel } from '../types';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface GenerationOptionsModalProps {
  model: GeminiModel;
  onClose: () => void;
  onSubmit: (options: { aspectRatio: AspectRatio }) => void;
}

export const GenerationOptionsModal: React.FC<GenerationOptionsModalProps> = ({ model, onClose, onSubmit }) => {
  const isVideo = model.type === 'video';
  const availableAspectRatios: AspectRatio[] = isVideo
    ? ['16:9', '9:16']
    : ['1:1', '16:9', '9:16', '4:3', '3:4'];
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(availableAspectRatios[0]);

  const handleSubmit = () => {
    onSubmit({ aspectRatio });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-secondary rounded-lg p-6 max-w-md w-full shadow-2xl border border-border-color text-text-primary" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Generation Options for {model.name}</h2>
        
        <div className="mb-6">
            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-text-secondary mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
                {availableAspectRatios.map(ratio => (
                    <button 
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`p-2 rounded-md border text-center transition-colors ${aspectRatio === ratio ? 'bg-blue-600 border-blue-500 text-white' : 'bg-bg-tertiary border-border-color hover:border-text-tertiary'}`}
                    >
                        {ratio}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-bg-tertiary hover:bg-opacity-80 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};
