import React, { useState, useEffect } from 'react';
import { ProductModal } from './ProductModal';

const BRIDGE_URL = (import.meta as any).env?.VITE_WHATSAPP_BRIDGE_URL || 'http://localhost:3001';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  videos: string[];
  active: boolean;
  sold: number;
}

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      const url = editingProduct
        ? `${BRIDGE_URL}/api/products/${editingProduct.id}`
        : `${BRIDGE_URL}/api/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingProduct(undefined);
        loadProducts();
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/products/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadProducts();
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar produto');
    }
  };

  const handleShareWhatsApp = (product: Product) => {
    const message = `🛍️ *${product.name}*\n\n${product.description}\n\n💰 *R$ ${product.price.toFixed(2)}*\n📦 Estoque: ${product.stock} unidades\n\n_Enviado via WhatsApp Business_`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <i className="fas fa-box"></i>
            Catálogo de Produtos
          </h2>
          <p className="text-text-tertiary mt-1">Gerencie seus produtos com fotos e vídeos</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(undefined);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <i className="fas fa-plus"></i>
          Novo Produto
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"></i>
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas Categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-bg-tertiary text-text-secondary'}`}
          >
            <i className="fas fa-th"></i>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-bg-tertiary text-text-secondary'}`}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {/* Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-xl border border-border-color">
          <i className="fas fa-box-open text-4xl text-text-tertiary mb-4"></i>
          <p className="text-text-secondary mb-2">Nenhum produto encontrado</p>
          <button
            onClick={() => {
              setEditingProduct(undefined);
              setIsModalOpen(true);
            }}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Criar primeiro produto
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-bg-secondary rounded-xl border border-border-color hover:border-blue-500 transition-all group overflow-hidden">
              {/* Imagem Principal */}
              <div className="relative h-48 bg-bg-tertiary">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-image text-4xl text-text-tertiary"></i>
                  </div>
                )}
                {!product.active && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                    Inativo
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                    Sem Estoque
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-text-primary line-clamp-1">{product.name}</h3>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-500 rounded">
                    {product.category}
                  </span>
                </div>

                <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-green-500">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-text-tertiary">
                    Estoque: {product.stock}
                  </span>
                </div>

                {/* Mídia */}
                <div className="flex gap-2 mb-3 text-xs text-text-tertiary">
                  {product.images.length > 0 && (
                    <span>
                      <i className="fas fa-images mr-1"></i>
                      {product.images.length}
                    </span>
                  )}
                  {product.videos.length > 0 && (
                    <span>
                      <i className="fas fa-video mr-1"></i>
                      {product.videos.length}
                    </span>
                  )}
                  {product.sold > 0 && (
                    <span>
                      <i className="fas fa-shopping-cart mr-1"></i>
                      {product.sold} vendidos
                    </span>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShareWhatsApp(product)}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    <i className="fab fa-whatsapp mr-2"></i>
                    Compartilhar
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsModalOpen(true);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-bg-secondary rounded-xl border border-border-color hover:border-blue-500 transition-all p-4 flex gap-4">
              {/* Imagem */}
              <div className="w-24 h-24 bg-bg-tertiary rounded-lg flex-shrink-0">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-image text-2xl text-text-tertiary"></i>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-text-primary">{product.name}</h3>
                    <p className="text-sm text-text-secondary line-clamp-1">{product.description}</p>
                  </div>
                  <span className="text-xl font-bold text-green-500">
                    R$ {product.price.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-tertiary mb-3">
                  <span>Estoque: {product.stock}</span>
                  <span>Vendidos: {product.sold}</span>
                  <span>{product.category}</span>
                  {product.images.length > 0 && <span>{product.images.length} fotos</span>}
                  {product.videos.length > 0 && <span>{product.videos.length} vídeos</span>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShareWhatsApp(product)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    <i className="fab fa-whatsapp mr-2"></i>
                    Compartilhar
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(undefined);
        }}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
};
