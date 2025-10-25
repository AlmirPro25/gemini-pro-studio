/**
 * Utilitários para compressão de imagens
 * Reduz o tamanho de imagens grandes antes de enviar para a API
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeMB: 5,
};

/**
 * Converte base64 para Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeType });
}

/**
 * Converte Blob para base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Calcula o tamanho em MB de uma string base64
 */
export function getBase64SizeMB(base64: string): number {
  const bytes = (base64.length * 3) / 4;
  return bytes / (1024 * 1024);
}

/**
 * Comprime uma imagem em base64
 */
export async function compressImage(
  base64: string,
  mimeType: string,
  options: CompressionOptions = {}
): Promise<{ data: string; mimeType: string; originalSize: number; compressedSize: number }> {
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = getBase64SizeMB(base64);
  
  // Se já está pequena o suficiente, retorna sem comprimir
  if (originalSize <= (opts.maxSizeMB || 5)) {
    return {
      data: base64,
      mimeType,
      originalSize,
      compressedSize: originalSize,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = base64ToBlob(base64, mimeType);
    const url = URL.createObjectURL(blob);
    
    img.onload = async () => {
      try {
        URL.revokeObjectURL(url);
        
        // Calcula novas dimensões mantendo aspect ratio
        let { width, height } = img;
        const maxWidth = opts.maxWidth || 1920;
        const maxHeight = opts.maxHeight || 1920;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Cria canvas e desenha imagem redimensionada
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        // Usa algoritmo de alta qualidade para redimensionamento
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converte para blob com qualidade especificada
        canvas.toBlob(
          async (compressedBlob) => {
            if (!compressedBlob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressedBase64 = await blobToBase64(compressedBlob);
            const compressedSize = getBase64SizeMB(compressedBase64);
            
            // Se ainda está muito grande, tenta com qualidade menor
            if (compressedSize > (opts.maxSizeMB || 5) && (opts.quality || 0.85) > 0.5) {
              const lowerQuality = Math.max(0.5, (opts.quality || 0.85) - 0.2);
              const result = await compressImage(base64, mimeType, {
                ...opts,
                quality: lowerQuality,
              });
              resolve(result);
            } else {
              resolve({
                data: compressedBase64,
                mimeType: compressedBlob.type,
                originalSize,
                compressedSize,
              });
            }
          },
          mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
          opts.quality || 0.85
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  images: Array<{ data: string; mimeType: string }>,
  options: CompressionOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ data: string; mimeType: string; originalSize: number; compressedSize: number }>> {
  
  const results: Array<{ data: string; mimeType: string; originalSize: number; compressedSize: number }> = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // Só comprime imagens, não PDFs ou outros arquivos
    if (image.mimeType.startsWith('image/')) {
      const compressed = await compressImage(image.data, image.mimeType, options);
      results.push(compressed);
    } else {
      results.push({
        data: image.data,
        mimeType: image.mimeType,
        originalSize: getBase64SizeMB(image.data),
        compressedSize: getBase64SizeMB(image.data),
      });
    }
    
    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }
  
  return results;
}

/**
 * Formata tamanho em MB para exibição
 */
export function formatSize(sizeMB: number): string {
  if (sizeMB < 0.1) {
    return `${(sizeMB * 1024).toFixed(0)} KB`;
  }
  return `${sizeMB.toFixed(2)} MB`;
}

/**
 * Calcula economia de espaço
 */
export function calculateSavings(originalSize: number, compressedSize: number): {
  savedMB: number;
  savedPercent: number;
} {
  const savedMB = originalSize - compressedSize;
  const savedPercent = (savedMB / originalSize) * 100;
  
  return {
    savedMB,
    savedPercent,
  };
}
