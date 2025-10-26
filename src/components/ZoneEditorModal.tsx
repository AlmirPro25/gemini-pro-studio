// Modal de Editor de Zonas - Desenhar polígonos com mouse
import React, { useState, useRef, useEffect } from 'react';
import { zoneMonitoringService, Zone } from '../services/zoneMonitoringService';

interface ZoneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  onZonesUpdate: () => void;
}

export const ZoneEditorModal: React.FC<ZoneEditorModalProps> = ({
  isOpen,
  onClose,
  videoRef,
  onZonesUpdate
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [editingZone, setEditingZone] = useState<Partial<Zone>>({
    name: '',
    type: 'custom',
    color: '#00ff00',
    rules: [],
    active: true
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadZones();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && canvasRef.current && videoRef.current) {
      drawCanvas();
    }
  }, [isOpen, zones, currentPoints, selectedZone]);

  const loadZones = () => {
    setZones(zoneMonitoringService.getZones());
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Desenhar vídeo
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Desenhar zonas existentes
    zones.forEach(zone => {
      ctx.save();
      ctx.strokeStyle = zone.id === selectedZone?.id ? '#ffff00' : zone.color;
      ctx.fillStyle = zone.color + '33';
      ctx.lineWidth = zone.id === selectedZone?.id ? 4 : 2;

      ctx.beginPath();
      zone.coordinates.forEach((coord, i) => {
        const x = coord.x * canvas.width;
        const y = coord.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nome da zona
      const centerX = zone.coordinates.reduce((sum, c) => sum + c.x, 0) / zone.coordinates.length * canvas.width;
      const centerY = zone.coordinates.reduce((sum, c) => sum + c.y, 0) / zone.coordinates.length * canvas.height;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, centerX, centerY);

      ctx.restore();
    });

    // Desenhar pontos da zona sendo criada
    if (currentPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = editingZone.color || '#00ff00';
      ctx.fillStyle = (editingZone.color || '#00ff00') + '33';
      ctx.lineWidth = 3;

      ctx.beginPath();
      currentPoints.forEach((point, i) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        // Desenhar ponto
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      
      if (currentPoints.length > 2) {
        ctx.closePath();
        ctx.fillStyle = (editingZone.color || '#00ff00') + '33';
        ctx.fill();
      }
      ctx.stroke();

      ctx.restore();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setCurrentPoints(prev => [...prev, { x, y }]);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPoints([]);
    setSelectedZone(null);
  };

  const finishDrawing = () => {
    if (currentPoints.length < 3) {
      alert('Uma zona precisa de pelo menos 3 pontos!');
      return;
    }

    const newZone = zoneMonitoringService.createZone({
      name: editingZone.name || `Zona ${zones.length + 1}`,
      type: editingZone.type || 'custom',
      coordinates: currentPoints,
      color: editingZone.color || '#00ff00',
      rules: editingZone.rules || [],
      active: editingZone.active !== false
    });

    setIsDrawing(false);
    setCurrentPoints([]);
    setEditingZone({
      name: '',
      type: 'custom',
      color: '#00ff00',
      rules: [],
      active: true
    });
    loadZones();
    onZonesUpdate();
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const deleteZone = (zoneId: string) => {
    if (confirm('Deletar esta zona?')) {
      zoneMonitoringService.deleteZone(zoneId);
      loadZones();
      onZonesUpdate();
      setSelectedZone(null);
    }
  };

  const toggleZone = (zone: Zone) => {
    zoneMonitoringService.updateZone(zone.id, { active: !zone.active });
    loadZones();
    onZonesUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/50 rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                🎯 Editor de Zonas
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isDrawing ? 'Clique no vídeo para adicionar pontos. Mínimo 3 pontos.' : 'Desenhe áreas para monitorar'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 p-6 flex items-center justify-center bg-black">
            <div className="relative">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="max-w-full max-h-[70vh] border-2 border-green-500/30 rounded-lg cursor-crosshair"
              />
              {isDrawing && currentPoints.length > 0 && (
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md rounded-lg p-3 border border-green-500/50">
                  <div className="text-sm text-green-400">
                    Pontos: {currentPoints.length}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {currentPoints.length < 3 ? `Faltam ${3 - currentPoints.length}` : 'Pronto para finalizar'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-green-500/30 overflow-y-auto">
            {/* Drawing Controls */}
            {isDrawing ? (
              <div className="p-4 space-y-4 border-b border-green-500/30 bg-green-900/20">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Zona</label>
                  <input
                    type="text"
                    value={editingZone.name}
                    onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                    placeholder="Ex: Entrada Principal"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-green-500/30 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                  <select
                    value={editingZone.type}
                    onChange={(e) => setEditingZone({ ...editingZone, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-green-500/30 rounded-lg text-white"
                  >
                    <option value="entrance">Entrada</option>
                    <option value="exit">Saída</option>
                    <option value="restricted">Área Restrita</option>
                    <option value="parking">Estacionamento</option>
                    <option value="queue">Fila</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cor</label>
                  <input
                    type="color"
                    value={editingZone.color}
                    onChange={(e) => setEditingZone({ ...editingZone, color: e.target.value })}
                    className="w-full h-10 bg-gray-800/50 border border-green-500/30 rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={finishDrawing}
                    disabled={currentPoints.length < 3}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    ✓ Finalizar
                  </button>
                  <button
                    onClick={cancelDrawing}
                    className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 font-medium"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-green-500/30">
                <button
                  onClick={startDrawing}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 font-medium"
                >
                  ➕ Nova Zona
                </button>
              </div>
            )}

            {/* Zones List */}
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-300">Zonas ({zones.length})</h3>
              {zones.map(zone => (
                <div
                  key={zone.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedZone?.id === zone.id
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-gray-800/50 border-gray-700 hover:border-green-500/50'
                  }`}
                  onClick={() => setSelectedZone(zone)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="font-medium text-white">{zone.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleZone(zone);
                      }}
                      className={`px-2 py-1 rounded text-xs ${
                        zone.active
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {zone.active ? '✓' : '✗'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400">
                    {zone.type} • {zone.rules.length} regras • {zone.alerts} alertas
                  </div>
                  {selectedZone?.id === zone.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteZone(zone.id);
                      }}
                      className="mt-2 w-full px-3 py-1 bg-red-500 rounded hover:bg-red-600 text-sm"
                    >
                      🗑️ Deletar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
