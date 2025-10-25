import React, { useState } from 'react';
import { LibraryItem, LibraryItemType } from '../types';

interface LibraryViewProps {
  items: LibraryItem[];
  onNewItem: () => void;
  onEditItem: (item: LibraryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const getItemIcon = (type: LibraryItemType) => {
  switch (type) {
    case 'code': return 'fa-code';
    case 'prompt': return 'fa-file-lines';
    case 'persona': return 'fa-user-astronaut';
    case 'theme': return 'fa-palette';
    default: return 'fa-question-circle';
  }
};

const LibraryItemCard: React.FC<{ item: LibraryItem; onEdit: () => void; onDelete: () => void; }> = ({ item, onEdit, onDelete }) => (
  <div className="bg-bg-secondary hover:bg-bg-tertiary border border-border-color rounded-lg p-4 transition-all hover:shadow-lg flex flex-col justify-between">
    <div>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <i className={`fa-solid ${getItemIcon(item.type)} text-blue-400`}></i>
          <h3 className="font-semibold text-text-primary truncate">{item.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 text-xs text-text-tertiary hover:text-text-primary"><i className="fa-solid fa-pencil"></i></button>
          <button onClick={onDelete} className="p-1.5 text-xs text-text-tertiary hover:text-red-400"><i className="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
        {typeof item.content === 'string' ? item.content : 'Objeto de configuração complexo.'}
      </p>
    </div>
    <div className="text-xs text-text-tertiary mt-2 flex flex-wrap gap-1">
        {item.tags.map(tag => (
            <span key={tag} className="bg-bg-tertiary px-2 py-0.5 rounded">{tag}</span>
        ))}
    </div>
  </div>
);

export const LibraryView: React.FC<LibraryViewProps> = ({ items, onNewItem, onEditItem, onDeleteItem }) => {
  return (
    <div className="p-8 bg-bg-primary h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Sua Biblioteca</h1>
        <button 
            onClick={onNewItem} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
            <i className="fa-solid fa-plus"></i>
            <span>Adicionar Novo Item</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
            <i className="fa-solid fa-book-bookmark text-5xl mb-4"></i>
            <p>Sua biblioteca está vazia.</p>
            <p>Adicione prompts e snippets de código para reutilizar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(item => (
                <LibraryItemCard 
                    key={item.id} 
                    item={item} 
                    onEdit={() => onEditItem(item)}
                    onDelete={() => onDeleteItem(item.id)}
                />
            ))}
        </div>
      )}
    </div>
  );
};