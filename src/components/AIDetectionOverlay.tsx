// Overlay de Detecção de IA em Tempo Real
import React, { useEffect, useRef, useState } from 'react';
import { aiDetectionService, Detection, DetectionResult } from '../services/aiDetectionService';

interface AIDetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  onDetection?: (result: DetectionResult) => void;
  detectionInterval?: number; // ms
  minConfidence?: number;
}

export const AIDetectionOverlay: React.FC<AIDetectionOverlayProps> = ({
  videoRef,
  isActive,
  onDetection,
  detectionInterval = 1000,
  minConfidence = 0.5
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDetections, setCurrentDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastDetectionTime = useRef<number>(0);
  const fpsCounter = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: Date.now() });

  const initializeModel = async () => {
    setIsLoading(true);
    const ready = await aiDetectionService.initialize();
    setIsModelReady(ready);
    setIsLoading(false);
  };

  const startDetection = React.useCallback(() => {
    const detect = async () => {
      const now = Date.now();
      
      // Controlar intervalo de detecção
      if (now - lastDetectionTime.current >= detectionInterval) {
        if (videoRef.current && canvasRef.current) {
          try {
            const result = await aiDetectionService.detectObjects(videoRef.current);
            setCurrentDetections(result.detections);
            
            if (onDetection) {
              onDetection(result);
            }
            
            lastDetectionTime.current = now;
          } catch (error) {
            console.error('Erro na detecção:', error);
          }
        }
      }

      // Desenhar overlay
      drawOverlay();

      // Calcular FPS
      updateFPS();

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [videoRef, detectionInterval, onDetection, minConfidence]);

  const stopDetection = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    initializeModel();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isActive && isModelReady) {
      startDetection();
    } else {
      stopDetection();
    }
  }, [isActive, isModelReady, startDetection, stopDetection]);

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar tamanho do canvas
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar detecções
    if (currentDetections.length > 0) {
      aiDetectionService.drawDetections(ctx, currentDetections, canvas.width, canvas.height, {
        showLabels: true,
        showConfidence: true,
        minConfidence
      });
    }
  };

  const updateFPS = () => {
    fpsCounter.current.frames++;
    const now = Date.now();
    const elapsed = now - fpsCounter.current.lastTime;

    if (elapsed >= 1000) {
      setFps(Math.round((fpsCounter.current.frames * 1000) / elapsed));
      fpsCounter.current.frames = 0;
      fpsCounter.current.lastTime = now;
    }
  };

  const getDetectionSummary = () => {
    const people = currentDetections.filter(d => d.class === 'person').length;
    const vehicles = currentDetections.filter(d => 
      ['car', 'motorcycle', 'bus', 'truck'].includes(d.class)
    ).length;
    const others = currentDetections.length - people - vehicles;

    return { people, vehicles, others, total: currentDetections.length };
  };

  const summary = getDetectionSummary();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'normal' }}
      />

      {/* Status Info */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        {isLoading ? (
          <div className="px-4 py-2 bg-yellow-500/80 backdrop-blur-md rounded-lg border border-yellow-400 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-white">Carregando IA...</span>
          </div>
        ) : isModelReady && isActive ? (
          <div className="space-y-2">
            {/* Status Badge */}
            <div className="px-4 py-2 bg-green-500/80 backdrop-blur-md rounded-lg border border-green-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">IA Ativa</span>
                <span className="text-xs text-white/80">{fps} FPS</span>
              </div>
            </div>

            {/* Detection Summary */}
            {summary.total > 0 && (
              <div className="px-4 py-3 bg-black/80 backdrop-blur-md rounded-lg border border-green-500/50 space-y-2">
                <div className="text-xs font-medium text-green-400 uppercase">Detecções</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    <div>
                      <div className="font-bold text-white">{summary.people}</div>
                      <div className="text-xs text-gray-400">Pessoas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <div className="font-bold text-white">{summary.vehicles}</div>
                      <div className="text-xs text-gray-400">Veículos</div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    Total: <span className="text-white font-bold">{summary.total}</span> objetos
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : !isModelReady ? (
          <div className="px-4 py-2 bg-red-500/80 backdrop-blur-md rounded-lg border border-red-400">
            <span className="text-sm font-medium text-white">❌ Erro ao carregar IA</span>
          </div>
        ) : null}
      </div>

      {/* Detection List (Bottom) */}
      {isActive && currentDetections.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-md rounded-lg border border-green-500/50 p-3 max-h-32 overflow-y-auto">
            <div className="text-xs font-medium text-green-400 uppercase mb-2">
              Objetos Detectados ({currentDetections.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {currentDetections
                .filter(d => d.score >= minConfidence)
                .slice(0, 10)
                .map(detection => (
                  <div
                    key={detection.id}
                    className="px-2 py-1 bg-gray-800/80 rounded border border-gray-700 text-xs"
                  >
                    <span className="font-medium text-white">{detection.class}</span>
                    <span className="text-gray-400 ml-1">
                      {Math.round(detection.score * 100)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
