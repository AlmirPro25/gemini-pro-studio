import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraModalProps {
  onClose: () => void;
  onCapture: (imageBase64: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
  }, [stream]);
  
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        onCapture(base64Data);
        stopCamera();
      }
    }
  };
  
  const handleClose = () => {
      stopCamera();
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-bg-secondary rounded-lg p-6 max-w-2xl w-full shadow-2xl border border-border-color text-text-primary" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Camera Input</h2>
        {error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
        )}
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={handleClose} className="px-4 py-2 bg-bg-tertiary hover:bg-opacity-80 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleCapture} disabled={!stream} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:bg-gray-500">
            Capture and Send
          </button>
        </div>
      </div>
    </div>
  );
};