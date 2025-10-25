import React, { useState } from 'react';
import { Attachment } from '../types';

interface ImageViewerModalProps {
  image: Attachment;
  prompt: string;
  onClose: () => void;
  onDownload: (image: Attachment) => void;
  onUseAsReference: (image: Attachment) => void;
  onEdit?: (image: Attachment, prompt: string) => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  image,
  prompt,
  onClose,
  onDownload,
  onUseAsReference,
  onEdit,
}) => {
  const [zoom, setZoom] = useState(100);
  const [showInfo, setShowInfo] = useState(true);

  const handleDownload = () => {
    onDownload(image);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="text-white">
              <p className="font-semibold">{image.name}</p>
              <p className="text-sm text-white/60">{image.mimeType}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
              title="Mostrar/Ocultar Info"
            >
              <i className="fa-solid fa-info-circle mr-2"></i>
              Info
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
              title="Baixar"
            >
              <i className="fa-solid fa-download mr-2"></i>
              Baixar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUseAsReference(image);
                onClose();
              }}
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm"
              title="Usar como referência"
            >
              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
              Usar como Referência
            </button>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(image, prompt);
                  onClose();
                }}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors text-sm"
                title="Editar imagem"
              >
                <i className="fa-solid fa-pen-to-square mr-2"></i>
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="relative max-w-7xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`data:${image.mimeType};base64,${image.data}`}
          alt={prompt}
          style={{ 
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.2s ease-out',
          }}
          className="max-w-full max-h-[80vh] object-contain"
        />
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 rounded-lg p-2">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          title="Diminuir zoom"
        >
          <i className="fa-solid fa-minus"></i>
        </button>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          title="Resetar zoom"
        >
          {zoom}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          title="Aumentar zoom"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute bottom-4 right-4 max-w-md bg-black/80 rounded-lg p-4 text-white">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <i className="fa-solid fa-info-circle text-blue-400"></i>
            Informações
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-white/60">Prompt:</span>
              <p className="mt-1">{prompt || 'Sem prompt'}</p>
            </div>
            <div className="flex gap-4 pt-2 border-t border-white/20">
              <div>
                <span className="text-white/60">Tipo:</span>
                <p>{image.mimeType}</p>
              </div>
              <div>
                <span className="text-white/60">Nome:</span>
                <p className="truncate max-w-48">{image.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 left-4 text-white/40 text-xs">
        <p>ESC para fechar • +/- para zoom</p>
      </div>
    </div>
  );
};
