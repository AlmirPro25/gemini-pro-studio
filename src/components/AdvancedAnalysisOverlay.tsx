// Overlay Avançado - Integra todos os 6 serviços (incluindo PoseNet)
import React, { useEffect, useRef, useState } from 'react';
import { zoneMonitoringService, ZoneViolation } from '../services/zoneMonitoringService';
import { heatmapService } from '../services/heatmapService';
import { behaviorAnalysisService, BehaviorDetection } from '../services/behaviorAnalysisService';
import { objectTrackingService, TrackedObject } from '../services/objectTrackingService';
import { poseDetectionService, PoseDetectionResult } from '../services/poseDetectionService';
import { Detection } from '../services/aiDetectionService';

interface AdvancedAnalysisOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  detections: Detection[];
  isActive: boolean;
  showZones?: boolean;
  showHeatmap?: boolean;
  showTracks?: boolean;
  onViolation?: (violation: ZoneViolation) => void;
  onBehavior?: (behavior: BehaviorDetection) => void;
}

export const AdvancedAnalysisOverlay: React.FC<AdvancedAnalysisOverlayProps> = ({
  videoRef,
  detections,
  isActive,
  showZones = true,
  showHeatmap = false,
  showTracks = true,
  onViolation,
  onBehavior
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [violations, setViolations] = useState<ZoneViolation[]>([]);
  const [behaviors, setBehaviors] = useState<BehaviorDetection[]>([]);
  const [trackedObjects, setTrackedObjects] = useState<TrackedObject[]>([]);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(null);
  const [poseInitialized, setPoseInitialized] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Inicializar PoseNet
    if (isActive && !poseInitialized) {
      poseDetectionService.initialize().then(success => {
        setPoseInitialized(success);
      });
    }
  }, [isActive, poseInitialized]);

  useEffect(() => {
    if (isActive) {
      startAnalysis();
    } else {
      stopAnalysis();
    }
    return () => stopAnalysis();
  }, [isActive, detections, showZones, showHeatmap, showTracks]);

  const startAnalysis = () => {
    const analyze = () => {
      if (detections.length > 0) {
        processDetections();
      }
      drawOverlay();
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    analyze();
  };

  const stopAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const processDetections = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    // Capturar frame atual para análises
    const frameUrl = captureFrame();
    if (!frameUrl) return;

    // 0. Detecção de Pose (PoseNet) - Detecção de Quedas
    if (poseInitialized && video.readyState === 4) {
      const pose = await poseDetectionService.detectPose(video);
      if (pose) {
        setPoseResult(pose);
        
        // Alerta de queda detectada
        if (pose.isFalling) {
          onBehavior?.({
            id: `fall_${Date.now()}`,
            patternId: 'posenet_fall',
            patternName: 'Queda Detectada',
            description: 'Pessoa caiu e pode precisar de ajuda',
            severity: 'critical',
            confidence: pose.score,
            timestamp: Date.now(),
            duration: 0,
            imageUrl: '',
            location: { x: 0, y: 0 },
            resolved: false
          });
        }
      }
    }

    // 1. Análise de Zonas
    if (showZones) {
      const newViolations = zoneMonitoringService.analyzeFrame(
        detections.map(d => ({
          ...d,
          center: d.center,
          type: d.class
        })),
        frameUrl
      );

      if (newViolations.length > 0) {
        setViolations(prev => [...newViolations, ...prev].slice(0, 10));
        newViolations.forEach(v => onViolation?.(v));
      }
    }

    // 2. Atualizar Heatmap
    detections
      .filter(d => d.class === 'person')
      .forEach(d => {
        heatmapService.addHeatPoint(d.center.x, d.center.y, 1);
      });

    // 3. Análise de Comportamento
    const newBehaviors = behaviorAnalysisService.analyzeFrame(
      detections.map(d => ({
        id: d.id,
        type: d.class,
        x: d.center.x,
        y: d.center.y,
        center: d.center
      })),
      frameUrl
    );

    if (newBehaviors.length > 0) {
      setBehaviors(prev => [...newBehaviors, ...prev].slice(0, 10));
      newBehaviors.forEach(b => onBehavior?.(b));
    }

    // 4. Rastreamento de Objetos
    if (showTracks) {
      const tracked = objectTrackingService.trackObjects(
        detections.map(d => ({
          id: d.id,
          type: d.class,
          x: d.center.x,
          y: d.center.y
        }))
      );
      setTrackedObjects(tracked);
    }
  };

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    if (!video) return null;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return tempCanvas.toDataURL('image/jpeg', 0.8);
  };

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenhar Heatmap (se ativo)
    if (showHeatmap) {
      heatmapService.drawHeatmap(ctx, canvas.width, canvas.height, {
        startTime: Date.now() - 3600000, // última hora
        radius: 50,
        opacity: 0.4
      });
    }

    // 2. Desenhar Zonas (se ativo)
    if (showZones) {
      zoneMonitoringService.drawZones(ctx, canvas.width, canvas.height);
    }

    // 3. Desenhar Trilhas (se ativo)
    if (showTracks && trackedObjects.length > 0) {
      objectTrackingService.drawTracks(ctx, canvas.width, canvas.height);
    }

    // 4. Desenhar Pose (PoseNet)
    if (poseResult && poseInitialized) {
      poseDetectionService.drawPose(ctx, poseResult);
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'normal', zIndex: 10 }}
      />

      {/* Alertas de Violação */}
      {violations.length > 0 && (
        <div className="absolute top-20 right-4 space-y-2 pointer-events-auto z-20">
          {violations.slice(0, 3).map(violation => (
            <div
              key={violation.id}
              className={`px-4 py-3 rounded-lg border backdrop-blur-md animate-pulse ${
                violation.severity === 'critical' ? 'bg-red-500/90 border-red-400' :
                violation.severity === 'high' ? 'bg-orange-500/90 border-orange-400' :
                'bg-yellow-500/90 border-yellow-400'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">
                    {violation.zoneName}
                  </div>
                  <div className="text-xs text-white/90 mt-1">
                    {violation.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alertas de Comportamento */}
      {behaviors.length > 0 && (
        <div className="absolute top-20 left-4 space-y-2 pointer-events-auto z-20">
          {behaviors.slice(0, 3).map(behavior => (
            <div
              key={behavior.id}
              className={`px-4 py-3 rounded-lg border backdrop-blur-md ${
                behavior.severity === 'critical' ? 'bg-red-500/90 border-red-400' :
                behavior.severity === 'high' ? 'bg-orange-500/90 border-orange-400' :
                'bg-purple-500/90 border-purple-400'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl">🧠</span>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">
                    {behavior.patternName}
                  </div>
                  <div className="text-xs text-white/90 mt-1">
                    {Math.round(behavior.confidence * 100)}% confiança
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info de Objetos Rastreados */}
      {showTracks && trackedObjects.length > 0 && (
        <div className="absolute bottom-20 right-4 pointer-events-auto z-20">
          <div className="px-4 py-3 bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/50">
            <div className="text-xs font-medium text-cyan-400 uppercase mb-2">
              Rastreamento
            </div>
            <div className="space-y-1">
              {trackedObjects.slice(0, 5).map(obj => (
                <div key={obj.id} className="text-xs text-white flex items-center justify-between gap-3">
                  <span>{obj.type}</span>
                  <span className="text-cyan-400">
                    {Math.abs(obj.velocity.x).toFixed(1)} m/s
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
