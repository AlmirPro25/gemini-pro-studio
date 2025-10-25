/**
 * 🤖 AGENT MODAL
 * Modal para criar/editar agentes IA
 */

import React, { useState } from 'react';

interface AgentModalProps {
  agent?: any;
  onClose: () => void;
  onSave: (agent: any) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({ agent, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    type: agent?.type || 'support',
    prompt: agent?.prompt || '',
    active: agent?.active !== undefined ? agent.active : true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const agentTypes = [
    { value: 'support', label: 'Suporte Técnico', icon: 'fa-headset' },
    { value: 'sales', label: 'Vendas', icon: 'fa-shopping-cart' },
    { value: 'service', label: 'Atendimento', icon: 'fa-comments' },
    { value: 'marketing', label: 'Marketing', icon: 'fa-bullhorn' },
    { value: 'custom', label: 'Personalizado', icon: 'fa-cog' }
  ];

  const promptTemplates: Record<string, string> = {
    support: `Você é um assistente de suporte técnico especializado.

Suas responsabilidades:
- Resolver problemas técnicos
- Explicar funcionalidades
- Guiar usuários passo a passo
- Ser paciente e claro

Tom: Profissional, prestativo e didático.`,
    
    sales: `Você é um vendedor especializado e consultivo.

Suas responsabilidades:
- Entender necessidades do cliente
- Apresentar soluções adequadas
- Responder dúvidas sobre produtos
- Fechar vendas de forma natural

Tom: Amigável, persuasivo e consultivo.`,
    
    service: `Você é um atendente cordial e eficiente.

Suas responsabilidades:
- Dar boas-vindas aos clientes
- Responder perguntas gerais
- Direcionar para setores específicos
- Manter satisfação do cliente

Tom: Cordial, rápido e eficiente.`,
    
    marketing: `Você é um especialista em marketing e engajamento.

Suas responsabilidades:
- Apresentar promoções e novidades
- Engajar clientes
- Coletar feedback
- Fortalecer relacionamento

Tom: Entusiasmado, criativo e engajador.`,
    
    custom: ''
  };

  const handleTypeChange = (newType: string) => {
    setFormData({
      ...formData,
      type: newType,
      prompt: promptTemplates[newType] || formData.prompt
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border-color shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border-color p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-robot text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {agent ? 'Editar Agente' : 'Novo Agente IA'}
              </h2>
              <p className="text-sm text-text-tertiary">Configure seu assistente inteligente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-bg-tertiary transition-colors flex items-center justify-center text-text-tertiary"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nome do Agente *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Assistente de Vendas"
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Tipo de Agente *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {agentTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === type.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-border-color hover:border-purple-500/50'
                  }`}
                >
                  <i className={`fas ${type.icon} text-2xl mb-2 ${
                    formData.type === type.value ? 'text-purple-500' : 'text-text-tertiary'
                  }`}></i>
                  <p className={`text-sm font-medium ${
                    formData.type === type.value ? 'text-text-primary' : 'text-text-secondary'
                  }`}>
                    {type.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Prompt do Sistema *
            </label>
            <p className="text-xs text-text-tertiary mb-2">
              Define como o agente se comporta e responde
            </p>
            <textarea
              required
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Descreva como o agente deve se comportar..."
              rows={12}
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
            />
            <p className="text-xs text-text-tertiary mt-2">
              {formData.prompt.length} caracteres
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
            <div>
              <p className="font-medium text-text-primary">Agente Ativo</p>
              <p className="text-sm text-text-tertiary">O agente pode atender conversas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
            </label>
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
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-lg font-medium transition-all shadow-lg"
            >
              {agent ? 'Salvar Alterações' : 'Criar Agente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
