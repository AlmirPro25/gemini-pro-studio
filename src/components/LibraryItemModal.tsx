import React, { useState, useEffect, useRef } from 'react';
import { LibraryItem, LibraryItemType } from '../types';

interface LibraryItemModalProps {
  item: LibraryItem | null;
  onSave: (item: LibraryItem) => void;
  onClose: () => void;
}

export const LibraryItemModal: React.FC<LibraryItemModalProps> = ({ item, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<LibraryItemType>('code');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setType(item.type);
      setContent(typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2));
      setTags(item.tags.join(', '));
    } else {
      // Reset for new item
      setName('');
      setType('code');
      setContent('');
      setTags('');
    }
  }, [item]);
  
  useEffect(() => {
    if (type === 'code' && editorRef.current && window.monaco && !monacoInstanceRef.current) {
        window.require(['vs/editor/editor.main'], () => {
             monacoInstanceRef.current = window.monaco.editor.create(editorRef.current, {
                value: content,
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 14,
            });
            monacoInstanceRef.current.onDidChangeModelContent(() => {
                setContent(monacoInstanceRef.current.getValue());
            });
        });
    }
     return () => {
      monacoInstanceRef.current?.dispose();
      monacoInstanceRef.current = null;
    };
  }, [type]);

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      alert('Nome e conteúdo são obrigatórios.');
      return;
    }
    onSave({
      id: item?.id || `lib_${Date.now()}`,
      name: name.trim(),
      type,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: item?.createdAt || Date.now()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-secondary rounded-lg p-6 max-w-2xl w-full shadow-2xl border border-border-color text-text-primary flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{item ? 'Editar Item' : 'Novo Item da Biblioteca'}</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-bg-tertiary p-2 rounded-md border border-border-color focus:outline-none focus:border-blue-500" />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
          <select value={type} onChange={e => setType(e.target.value as LibraryItemType)} className="w-full bg-bg-tertiary p-2 rounded-md border border-border-color focus:outline-none focus:border-blue-500">
            <option value="code">Snippet de Código</option>
            <option value="prompt">Prompt</option>
          </select>
        </div>

        <div className="mb-4 flex-grow min-h-48">
          <label className="block text-sm font-medium text-text-secondary mb-1">Conteúdo</label>
          {type === 'code' ? (
             <div className="h-48 border border-border-color rounded-md" ref={editorRef}></div>
          ) : (
            <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-48 bg-bg-tertiary p-2 rounded-md border border-border-color focus:outline-none focus:border-blue-500 resize-none" />
          )}
        </div>

         <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-1">Tags (separadas por vírgula)</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-bg-tertiary p-2 rounded-md border border-border-color focus:outline-none focus:border-blue-500" />
        </div>

        <div className="flex justify-end gap-4 mt-auto">
          <button onClick={onClose} className="px-4 py-2 bg-bg-tertiary hover:bg-opacity-80 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  );
};
