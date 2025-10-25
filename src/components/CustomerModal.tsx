/**
 * 👤 CUSTOMER MODAL
 * Modal para criar/editar clientes no CRM
 */

import React, { useState, useEffect } from 'react';

interface CustomerModalProps {
  customer?: any;
  onClose: () => void;
  onSave: (customer: any) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    phoneNumber: customer?.phone_number || '',
    name: customer?.name || '',
    email: customer?.email || '',
    status: customer?.status || 'lead',
    notes: customer?.notes || '',
    totalSpent: customer?.total_spent || 0
  });

  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(customer?.tags || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-color shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border-color p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">
            {customer ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-bg-tertiary transition-colors flex items-center justify-center text-text-tertiary"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="5511999999999"
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!customer}
            />
            {customer && (
              <p className="text-xs text-text-tertiary mt-1">
                O telefone não pode ser alterado
              </p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nome *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="João Silva"
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao@email.com"
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lead">Lead</option>
              <option value="customer">Cliente</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          {/* Total Gasto */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Total Gasto (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.totalSpent}
              onChange={(e) => setFormData({ ...formData, totalSpent: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Adicionar tag..."
                className="flex-1 bg-bg-tertiary border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-bg-tertiary text-text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o cliente..."
              rows={4}
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-bg-tertiary hover:bg-bg-hover text-text-primary py-3 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {customer ? 'Salvar Alterações' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
