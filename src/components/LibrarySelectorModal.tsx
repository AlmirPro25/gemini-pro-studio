import React, { useState, useMemo } from 'react';
import { LibraryItem, LibraryItemType } from '../types';

interface LibrarySelectorModalProps {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
  onClose: () => void;
}

const getItemIcon = (type: LibraryItemType) => {
  switch (type) {
    case 'code': return 'fa-code';
    case 'prompt': return 'fa-file-lines';
    default: return 'fa-question-circle';
  }
};

export const LibrarySelectorModal: React.FC<LibrarySelectorModalProps> = ({ items, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerCaseSearch) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearch))
    );
  }, [items, searchTerm]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-secondary rounded-lg p-6 max-w-2xl w-full shadow-2xl border border-border-color text-text-primary flex flex-col h-3/4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Selecionar da Biblioteca</h2>
        
        <div className="relative mb-4">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"></i>
            <input
                type="text"
                placeholder="Procurar por nome ou tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-tertiary border border-transparent focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-sm placeholder-text-tertiary focus:outline-none transition-colors"
                autoFocus
            />
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2">
            {filteredItems.length === 0 ? (
                <p className="text-center text-text-tertiary mt-8">Nenhum item encontrado.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {filteredItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="w-full text-left p-3 rounded-lg hover:bg-bg-tertiary bg-bg-primary border border-border-color transition-colors flex items-center gap-4"
                        >
                            <i className={`fa-solid ${getItemIcon(item.type)} w-5 text-center text-blue-400`}></i>
                            <div className="flex-grow">
                                <p className="font-semibold text-text-primary">{item.name}</p>
                                <p className="text-xs text-text-secondary line-clamp-1">{typeof item.content === 'string' ? item.content : 'Conteúdo complexo'}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-bg-tertiary hover:bg-opacity-80 rounded-lg transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
};
