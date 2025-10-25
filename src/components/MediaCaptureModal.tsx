import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Attachment } from '../types';

interface MediaCaptureModalProps {
  onClose: () => void;
  onCapture: (attachments: Attachment[]) => void;
}

type CaptureMode = 'camera' | 'upload' | 'screenshot';

export const MediaCaptureModal: React.FC<MediaCaptureModalProps> = ({ onClose, onCapture }) => {
  const [mode, setMode] = useState<CaptureMode>('upload');
  const [capturedImages, setCapturedImages] = useState<Attachment[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: 1920, height: 1080 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
  }, [stream]);
  
  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, startCamera, stopCamera]);

  const handleCameraCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64Data = dataUrl.split(',')[1];
        
        const newImage: Attachment = {
          name: `camera_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          data: base64Data,
        };
        
        setCapturedImages(prev => [...prev, newImage]);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: Attachment[] = [];
      
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(file);
          });
          
          newImages.push({
            name: file.name,
            mimeType: file.type,
            data: base64,
          });
        }
      }
      
      setCapturedImages(prev => [...prev, ...newImages]);
      e.target.value = '';
    }
  };

  const handleScreenshot = async () => {
    try {
      // @ts-ignore - displayMedia pode não estar tipado corretamente
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true
      });
      
      const video = document.createElement('video');
      video.srcObject = screenStream;
      video.play();
      
      // Aguarda o vídeo carregar
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        
        const newImage: Attachment = {
          name: `screenshot_${Date.now()}.png`,
          mimeType: 'image/png',
          data: base64Data,
        };
        
        setCapturedImages(prev => [...prev, newImage]);
      }
      
      screenStream.getTracks().forEach(track => track.stop());
      setError(null);
    } catch (err) {
      console.error("Error capturing screenshot:", err);
      setError("Não foi possível capturar a tela. Permissão negada ou não suportado.");
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (capturedImages.length > 0) {
      onCapture(capturedImages);
      stopCamera();
      onClose();
    }
  };
  
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === 'upload') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (mode === 'upload') {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      
      const newImages: Attachment[] = [];
      for (const file of imageFiles) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(file);
        });
        
        newImages.push({
          name: file.name,
          mimeType: file.type,
          data: base64,
        });
      }
      
      setCapturedImages(prev => [...prev, ...newImages]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-bg-secondary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border-color shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-border-color flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Adicionar Imagens</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 p-4 bg-bg-tertiary/50 border-b border-border-color">
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <i className="fa-solid fa-upload mr-2"></i>
            Upload
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mode === 'camera'
                ? 'bg-blue-600 text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <i className="fa-solid fa-camera mr-2"></i>
            Câmera
          </button>
          <button
            onClick={() => setMode('screenshot')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mode === 'screenshot'
                ? 'bg-blue-600 text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <i className="fa-solid fa-desktop mr-2"></i>
            Screenshot
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4">
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          )}

          {mode === 'upload' && (
            <div 
              className="space-y-4"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-12 border-2 border-dashed rounded-lg transition-all text-text-secondary hover:text-text-primary ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-500/20 scale-105' 
                    : 'border-border-color hover:border-blue-500 hover:bg-blue-500/10'
                }`}
              >
                <i className={`fa-solid fa-cloud-arrow-up text-4xl mb-3 ${isDragging ? 'text-blue-400 animate-bounce' : ''}`}></i>
                <p className="text-lg font-medium">
                  {isDragging ? 'Solte as imagens aqui!' : 'Clique para selecionar imagens'}
                </p>
                <p className="text-sm mt-1">ou arraste e solte aqui</p>
              </button>
            </div>
          )}

          {mode === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
              </div>
              <button
                onClick={handleCameraCapture}
                disabled={!stream}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                <i className="fa-solid fa-camera mr-2"></i>
                Capturar Foto
              </button>
            </div>
          )}

          {mode === 'screenshot' && (
            <div className="space-y-4">
              <div className="text-center py-12">
                <i className="fa-solid fa-desktop text-6xl text-text-tertiary mb-4"></i>
                <p className="text-text-secondary mb-6">
                  Capture a tela do seu computador para enviar ao Gemini
                </p>
                <button
                  onClick={handleScreenshot}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-camera-retro mr-2"></i>
                  Capturar Tela
                </button>
              </div>
            </div>
          )}

          {/* Captured Images Preview */}
          {capturedImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text-secondary mb-3">
                Imagens Capturadas ({capturedImages.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {capturedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`data:${img.mimeType};base64,${img.data}`}
                      alt={img.name}
                      className="w-full h-32 object-cover rounded-lg border border-border-color"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fa-solid fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-color flex justify-between items-center">
          <p className="text-sm text-text-tertiary">
            {capturedImages.length} imagem(ns) selecionada(s)
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-bg-tertiary hover:bg-opacity-80 rounded-lg transition-colors text-text-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={capturedImages.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              <i className="fa-solid fa-paper-plane mr-2"></i>
              Adicionar ao Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
