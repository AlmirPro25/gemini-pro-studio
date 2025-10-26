// Serviço de Análise Visual com D3.js
// Processa imagens Base64 e extrai dados para visualização

export interface PixelData {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ColorAnalysis {
  dominantColors: { color: string; percentage: number; count: number }[];
  brightness: number;
  contrast: number;
  colorfulness: number;
}

export interface MotionData {
  intensity: number;
  regions: { x: number; y: number; intensity: number }[];
  totalMovement: number;
}

export interface ActivityData {
  timestamp: number;
  peopleCount: number;
  movementLevel: number;
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Converter Base64 para ImageData
export const base64ToImageData = (base64: string): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64.includes(',') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
};

// Analisar cores dominantes
export const analyzeColors = async (base64: string): Promise<ColorAnalysis> => {
  const imageData = await base64ToImageData(base64);
  const pixels = imageData.data;
  
  // Mapa de cores (agrupando cores similares)
  const colorMap: { [key: string]: number } = {};
  let totalBrightness = 0;
  let totalSaturation = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    // Agrupar cores similares (reduzir precisão)
    const rGroup = Math.floor(r / 32) * 32;
    const gGroup = Math.floor(g / 32) * 32;
    const bGroup = Math.floor(b / 32) * 32;
    const key = `${rGroup},${gGroup},${bGroup}`;
    
    colorMap[key] = (colorMap[key] || 0) + 1;
    
    // Calcular brilho (luminância)
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    totalBrightness += brightness;
    
    // Calcular saturação
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    totalSaturation += saturation;
  }
  
  const pixelCount = pixels.length / 4;
  
  // Top 10 cores dominantes
  const dominantColors = Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([color, count]) => ({
      color: `rgb(${color})`,
      percentage: (count / pixelCount) * 100,
      count
    }));
  
  return {
    dominantColors,
    brightness: totalBrightness / pixelCount,
    contrast: calculateContrast(pixels),
    colorfulness: totalSaturation / pixelCount
  };
};

// Calcular contraste
const calculateContrast = (pixels: Uint8ClampedArray): number => {
  let sum = 0;
  let sumSq = 0;
  const count = pixels.length / 4;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const brightness = (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255;
    sum += brightness;
    sumSq += brightness * brightness;
  }
  
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  return Math.sqrt(variance);
};

// Detectar movimento entre dois frames
export const detectMotion = async (frame1: string, frame2: string): Promise<MotionData> => {
  const [imageData1, imageData2] = await Promise.all([
    base64ToImageData(frame1),
    base64ToImageData(frame2)
  ]);
  
  const pixels1 = imageData1.data;
  const pixels2 = imageData2.data;
  const width = imageData1.width;
  const height = imageData1.height;
  
  // Dividir em grid 10x10 para análise regional
  const gridSize = 10;
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);
  const regions: { x: number; y: number; intensity: number }[] = [];
  
  let totalMovement = 0;
  
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let cellMovement = 0;
      let cellPixels = 0;
      
      for (let y = gy * cellHeight; y < (gy + 1) * cellHeight && y < height; y++) {
        for (let x = gx * cellWidth; x < (gx + 1) * cellWidth && x < width; x++) {
          const i = (y * width + x) * 4;
          
          // Diferença de brilho
          const brightness1 = (pixels1[i] * 0.299 + pixels1[i + 1] * 0.587 + pixels1[i + 2] * 0.114) / 255;
          const brightness2 = (pixels2[i] * 0.299 + pixels2[i + 1] * 0.587 + pixels2[i + 2] * 0.114) / 255;
          const diff = Math.abs(brightness1 - brightness2);
          
          cellMovement += diff;
          cellPixels++;
        }
      }
      
      const intensity = cellPixels > 0 ? cellMovement / cellPixels : 0;
      totalMovement += cellMovement;
      
      if (intensity > 0.05) { // Threshold para considerar movimento
        regions.push({
          x: gx * cellWidth + cellWidth / 2,
          y: gy * cellHeight + cellHeight / 2,
          intensity
        });
      }
    }
  }
  
  return {
    intensity: totalMovement / (width * height),
    regions,
    totalMovement
  };
};

// Criar heatmap de movimento
export const createMotionHeatmap = (motionData: MotionData, width: number, height: number): number[][] => {
  const gridSize = 20;
  const heatmap: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
  
  motionData.regions.forEach(region => {
    const gx = Math.floor((region.x / width) * gridSize);
    const gy = Math.floor((region.y / height) * gridSize);
    
    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
      heatmap[gy][gx] += region.intensity;
    }
  });
  
  return heatmap;
};

// Analisar atividade ao longo do tempo
export const analyzeActivity = (frames: string[], timestamps: number[]): ActivityData[] => {
  // Placeholder - seria implementado com análise real
  return timestamps.map((timestamp, i) => ({
    timestamp,
    peopleCount: Math.floor(Math.random() * 5),
    movementLevel: Math.random(),
    alertLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
  }));
};

// Extrair estatísticas de imagem
export const extractImageStats = async (base64: string) => {
  const imageData = await base64ToImageData(base64);
  const pixels = imageData.data;
  
  let rSum = 0, gSum = 0, bSum = 0;
  let rMin = 255, gMin = 255, bMin = 255;
  let rMax = 0, gMax = 0, bMax = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    rSum += r; gSum += g; bSum += b;
    rMin = Math.min(rMin, r); gMin = Math.min(gMin, g); bMin = Math.min(bMin, b);
    rMax = Math.max(rMax, r); gMax = Math.max(gMax, g); bMax = Math.max(bMax, b);
  }
  
  const pixelCount = pixels.length / 4;
  
  return {
    mean: {
      r: rSum / pixelCount,
      g: gSum / pixelCount,
      b: bSum / pixelCount
    },
    range: {
      r: rMax - rMin,
      g: gMax - gMin,
      b: bMax - bMin
    },
    dimensions: {
      width: imageData.width,
      height: imageData.height
    }
  };
};
