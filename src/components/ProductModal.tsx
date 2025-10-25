import React, { useState, useEffect, useRef } from 'react';

interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  videos: string[];
  active: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: (product: Product) => void;
}

const CATEGORIES = [
  'Eletrônicos',
  'Roupas',
  'Alimentos',
  'Bebidas',
  'Cosméticos',
  'Livros',
  'Esportes',
  'Casa e Decoração',
  'Automotivo',
  'Outros'
];

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'Outros',
    images: [],
    videos: [],
    active: true
  });

  const [priceInput, setPriceInput] = useState('0');
  const [stockInput, setStockInput] = useState('0');

  const [isEditingImage, setIsEditingImage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setPriceInput(product.price.toString());
      setStockInput(product.stock.toString());
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: 'Outros',
        images: [],
        videos: [],
        active: true
      });
      setPriceInput('0');
      setStockInput('0');
    }
  }, [product, isOpen]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const compressed = await compressImage(file);
      newImages.push(compressed);
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newVideos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          newVideos.push(event.target.result as string);
          if (newVideos.length === files.length) {
            setFormData(prev => ({
              ...prev,
              videos: [...prev.videos, ...newVideos]
            }));
          }
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleEditImage = async () => {
    if (selectedImageIndex === null || !imagePrompt) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/gemini/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: formData.images[selectedImageIndex],
          prompt: imagePrompt,
          model: 'gemini-2.0-flash-exp'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newImages = [...formData.images];
        newImages[selectedImageIndex] = data.editedImage;
        setFormData(prev => ({ ...prev, images: newImages }));
        setIsEditingImage(false);
        setImagePrompt('');
      }
    } catch (error) {
      console.error('Erro ao editar imagem:', error);
      alert('Erro ao editar imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Produto: ${formData.name}. ${imagePrompt}`,
          model: 'imagen-4.0-generate-001'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.image]
        }));
        setImagePrompt('');
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Erro ao gerar imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border-color">
        <div className="sticky top-0 bg-bg-secondary border-b border-border-color p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <i className="fas fa-box"></i>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Preço (R$) *
              </label>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  const value = parseFloat(e.target.value);
                  setFormData({ ...formData, price: isNaN(value) ? 0 : value });
                }}
                step="0.01"
                min="0"
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Estoque *
              </label>
              <input
                type="number"
                value={stockInput}
                onChange={(e) => {
                  setStockInput(e.target.value);
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, stock: isNaN(value) ? 0 : value });
                }}
                min="0"
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-text-secondary">Produto Ativo</span>
              </label>
            </div>
          </div>

          {/* Imagens */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-secondary">
                <i className="fas fa-images mr-2"></i>
                Imagens do Produto
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingImage(true);
                    setSelectedImageIndex(null);
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                >
                  <i className="fas fa-magic mr-2"></i>
                  Gerar com IA
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Produto ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border-color"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageIndex(idx);
                          setIsEditingImage(true);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Editor de Imagem com IA */}
            {isEditingImage && (
              <div className="bg-bg-tertiary border border-border-color rounded-lg p-4 mb-3">
                <h3 className="text-sm font-medium text-text-primary mb-3">
                  {selectedImageIndex !== null ? '✨ Editar Imagem com IA' : '🎨 Gerar Imagem com IA'}
                </h3>
                {selectedImageIndex !== null && (
                  <img
                    src={formData.images[selectedImageIndex]}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={selectedImageIndex !== null
                    ? "Descreva como quer editar a imagem (ex: 'remover fundo', 'adicionar brilho', 'mudar cor para azul')"
                    : "Descreva a imagem do produto (ex: 'foto profissional de um smartphone preto em fundo branco')"}
                  rows={3}
                  className="w-full bg-bg-secondary border border-border-color rounded-lg px-4 py-2 text-text-primary mb-3"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectedImageIndex !== null ? handleEditImage : handleGenerateImage}
                    disabled={isGenerating || !imagePrompt}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Processando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic mr-2"></i>
                        {selectedImageIndex !== null ? 'Editar' : 'Gerar'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingImage(false);
                      setSelectedImageIndex(null);
                      setImagePrompt('');
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vídeos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-secondary">
                <i className="fas fa-video mr-2"></i>
                Vídeos do Produto
              </label>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                <i className="fas fa-upload mr-2"></i>
                Upload Vídeo
              </button>
            </div>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
            />

            {formData.videos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.videos.map((video, idx) => (
                  <div key={idx} className="relative group">
                    <video
                      src={video}
                      className="w-full h-32 object-cover rounded-lg border border-border-color"
                      controls
                    />
                    <button
                      type="button"
                      onClick={() => removeVideo(idx)}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-border-color">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {product ? 'Atualizar' : 'Criar'} Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
