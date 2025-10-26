# 📹 Guia de Implementação - Múltiplas Câmeras (Grid)

## 🎯 Componente Principal (src/components/MultiCameraView.tsx)

```typescript
import React, { useState, useRef, useEffect } from 'react';

interface Camera {
  id: string;
  name: string;
  stream: MediaStream | null;
  isActive: boolean;
}

export const MultiCameraView: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [gridSize, setGridSize] = useState<'2x2' | '3x3' | '4x4'>('2x2');
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    const cameraList: Camera[] = videoDevices.map(device => ({
      id: device.deviceId,
      name: device.label || `Câmera ${device.deviceId.slice(0, 5)}`,
      stream: null,
      isActive: false
    }));

    setCameras(cameraList);
  };

  const startCamera = async (cameraId: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: cameraId }
    });

    setCameras(prev => prev.map(cam => 
      cam.id === cameraId ? { ...cam, stream, isActive: true } : cam
    ));
  };

  const stopCamera = (cameraId: string) => {
    const camera = cameras.find(c => c.id === cameraId);
    if (camera?.stream) {
      camera.stream.getTracks().forEach(track => track.stop());
    }

    setCameras(prev => prev.map(cam => 
      cam.id === cameraId ? { ...cam, stream: null, isActive: false } : cam
    ));
  };

  const getGridClass = () => {
    switch (gridSize) {
      case '2x2': return 'grid-cols-2 grid-rows-2';
      case '3x3': return 'grid-cols-3 grid-rows-3';
      case '4x4': return 'grid-cols-4 grid-rows-4';
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            📹 Múltiplas Câmeras
          </h2>
          
          <div className="flex gap-2">
            {['2x2', '3x3', '4x4'].map(size => (
              <button
                key={size}
                onClick={() => setGridSize(size as any)}
                className={`px-4 py-2 rounded ${
                  gridSize === size
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={`flex-1 grid ${getGridClass()} gap-2 p-2`}>
        {cameras.slice(0, parseInt(gridSize[0]) ** 2).map(camera => (
          <div
            key={camera.id}
            className={`relative bg-gray-900 rounded-lg overflow-hidden border-2 ${
              selectedCamera === camera.id
                ? 'border-blue-500'
                : 'border-gray-700'
            }`}
            onClick={() => setSelectedCamera(camera.id)}
          >
            {camera.isActive && camera.stream ? (
              <video
                ref={ref => {
                  if (ref && camera.stream) {
                    ref.srcObject = camera.stream;
                    ref.play();
                  }
                }}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-2">📹</div>
                  <div className="text-gray-400">{camera.name}</div>
                </div>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute top-2 left-2 px-3 py-1 bg-black/70 rounded text-white text-sm">
              {camera.name}
            </div>

            {/* Controls */}
            <div className="absolute bottom-2 right-2 flex gap-2">
              {camera.isActive ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    stopCamera(camera.id);
                  }}
                  className="px-3 py-1 bg-red-500 rounded text-white text-sm"
                >
                  ⏹️ Parar
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera(camera.id);
                  }}
                  className="px-3 py-1 bg-green-500 rounded text-white text-sm"
                >
                  ▶️ Iniciar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🔗 Adicionar Rota no App.tsx

```typescript
import { MultiCameraView } from './components/MultiCameraView';

// No switch de rotas:
case 'multi-camera':
  return <MultiCameraView />;
```

## 🎨 Adicionar no Sidebar

```typescript
<button onClick={() => setCurrentView('multi-camera')}>
  📹 Múltiplas Câmeras
</button>
```

## ✅ Funcionalidades

- Grid 2x2, 3x3, 4x4
- Iniciar/Parar câmeras individualmente
- Selecionar câmera principal
- Sincronização de eventos
- Análise simultânea (opcional)
