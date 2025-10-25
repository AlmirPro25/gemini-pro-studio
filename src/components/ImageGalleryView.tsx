import React, { useState, useMemo } from 'react';
import { Message, Attachment } from '../types';

interface ImageGalleryViewProps {
  chatHistory: Message[];
  onImageClick: (image: Attachment, prompt: string) => void;
  onDownload: (image: Attachment) => void;
  onUseAsReference: (image: Attachment) => void;
}

interface GalleryImage {
  image: Attachment;
  prompt: string;
  timestamp: number;
  messageId: string;
  model?: string;
}

type SortOption = 'newest' | 'oldest' | 'model';
type FilterOption = 'all' | 'generated' | 'uploaded';

export const ImageGalleryView: React.FC<ImageGalleryViewProps> = ({
  chatHistory,
  onImageClick,
  onDownload,
  onUseAsReference,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // Extrai todas as imagens do histórico
  const allImages = useMemo(() => {
    const images: GalleryImage[] = [];
    
    chatHistory.forEach((message) => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach((attachment) => {
          if (attachment.mimeType.startsWith('image/')) {
            images.push({
              image: attachment,
              prompt: message.content,
              timestamp: parseInt(message.id.split('_')[1]) || Date.now(),
              messageId: message.id,
              model: message.role === 'model' ? 'generated' : 'uploaded',
            });
          }
        });
      }
    });
    
    return images;
  }, [chatHistory]);

  // Filtra e ordena imagens
  const filteredImages = useMemo(() => {
    let filtered = allImages;
    
    // Filtro por tipo
    if (filterBy !== 'all') {
      filtered = filtered.filter(img => img.model === filterBy);
    }
    
    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(img => 
        img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.timestamp - a.timestamp;
        case 'oldest':
          return a.timestamp - b.timestamp;
        case 'model':
          return (a.model || '').localeCompare(b.model || '');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [allImages, filterBy, searchQuery, sortBy]);

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const downloadSelected = () => {
    filteredImages
      .filter(img => selectedImages.has(img.image.name))
      .forEach(img => onDownload(img.image));
    setSelectedImages(new Set());
  };

  const downloadAll = () => {
    filteredImages.forEach(img => onDownload(img.image));
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-primary h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border-color">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <i className="fa-solid fa-images text-purple-400"></i>
              Galeria de Imagens
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {filteredImages.length} imagem(ns) encontrada(s)
            </p>
          </div>
          
          {selectedImages.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={downloadSelected}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <i className="fa-solid fa-download mr-2"></i>
                Baixar Selecionadas ({selectedImages.size})
              </button>
              <button
                onClick={() => setSelectedImages(new Set())}
                className="px-4 py-2 bg-bg-tertiary hover:bg-bg-secondary text-text-secondary rounded-lg transition-colors"
              >
                Limpar Seleção
              </button>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por prompt..."
                className="w-full pl-10 pr-4 py-2 bg-bg-tertiary text-text-primary rounded-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas</option>
            <option value="generated">Geradas pela IA</option>
            <option value="uploaded">Enviadas por mim</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Mais Recentes</option>
            <option value="oldest">Mais Antigas</option>
            <option value="model">Por Tipo</option>
          </select>

          <button
            onClick={downloadAll}
            className="px-4 py-2 bg-bg-tertiary hover:bg-bg-secondary text-text-secondary rounded-lg transition-colors"
            title="Baixar todas as imagens"
          >
            <i className="fa-solid fa-download"></i>
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <i className="fa-solid fa-images text-6xl mb-4 opacity-50"></i>
            <p className="text-lg">Nenhuma imagem encontrada</p>
            <p className="text-sm mt-2">
              {searchQuery ? 'Tente uma busca diferente' : 'Gere ou envie imagens para vê-las aqui'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredImages.map((item, index) => (
              <div
                key={`${item.messageId}-${index}`}
                className="group relative bg-bg-secondary rounded-lg overflow-hidden border border-border-color hover:border-purple-500 transition-all cursor-pointer"
              >
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(item.image.name)}
                    onChange={() => toggleImageSelection(item.image.name)}
                    className="w-5 h-5 rounded cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.model === 'generated' 
                      ? 'bg-purple-600/80 text-white' 
                      : 'bg-blue-600/80 text-white'
                  }`}>
                    {item.model === 'generated' ? 'IA' : 'Upload'}
                  </span>
                </div>

                {/* Image */}
                <div 
                  className="aspect-square overflow-hidden"
                  onClick={() => onImageClick(item.image, item.prompt)}
                >
                  <img
                    src={`data:${item.image.mimeType};base64,${item.image.data}`}
                    alt={item.prompt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs line-clamp-2 mb-2">
                    {item.prompt}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(item.image);
                      }}
                      className="flex-1 px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors"
                      title="Baixar"
                    >
                      <i className="fa-solid fa-download"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUseAsReference(item.image);
                      }}
                      className="flex-1 px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded transition-colors"
                      title="Usar como referência"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
