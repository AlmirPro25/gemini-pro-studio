/**
 * ⚡ AUTOMATION MODAL
 * Modal para criar/editar automações
 */

import React, { useState } from 'react';

interface AutomationModalProps {
  automation?: any;
  onClose: () => void;
  onSave: (automation: any) => void;
}

export const AutomationModal: React.FC<AutomationModalProps> = ({ automation, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    triggerType: automation?.trigger_type || 'new_contact',
    triggerValue: automation?.trigger_value || '',
    actionType: automation?.action_type || 'send_message',
    actionValue: automation?.action_value || '',
    active: automation?.active !== undefined ? automation.active : true
  });

  const triggers = [
    { value: 'new_contact', label: 'Novo Contato', icon: 'fa-user-plus', description: 'Quando um novo contato envia mensagem' },
    { value: 'keyword', label: 'Palavra-chave', icon: 'fa-key', description: 'Quando mensagem contém palavra específica' },
    { value: 'time_based', label: 'Baseado em Tempo', icon: 'fa-clock', description: 'Após X dias sem resposta' },
    { value: 'status_change', label: 'Mudança de Status', icon: 'fa-exchange-alt', description: 'Quando status do cliente muda' },
    { value: 'tag_added', label: 'Tag Adicionada', icon: 'fa-tag', description: 'Quando tag específica é adicionada' }
  ];

  const actions = [
    { value: 'send_message', label: 'Enviar Mensagem', icon: 'fa-paper-plane', needsValue: true },
    { value: 'add_tag', label: 'Adicionar Tag', icon: 'fa-tag', needsValue: true },
    { value: 'change_status', label: 'Mudar Status', icon: 'fa-exchange-alt', needsValue: true },
    { value: 'assign_agent', label: 'Atribuir Agente', icon: 'fa-robot', needsValue: true },
    { value: 'send_image', label: 'Enviar Imagem', icon: 'fa-image', needsValue: true }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const messageTemplates = {
    new_contact: `Olá! 👋 Bem-vindo(a)!

Obrigado por entrar em contato. Como posso ajudar você hoje?`,
    
    keyword: `Recebi sua mensagem!

Vou te ajudar com isso. Me dê um momento...`,
    
    time_based: `Olá! 😊

Notei que faz um tempo que não conversamos. Tudo bem?

Há algo em que posso ajudar?`,
    
    status_change: `Status atualizado! ✅

Obrigado por ser nosso cliente!`,
    
    tag_added: `Marcado como importante! ⭐

Vamos dar atenção especial ao seu caso.`
  };

  const handleTriggerChange = (newTrigger: string) => {
    setFormData({
      ...formData,
      triggerType: newTrigger,
      actionValue: formData.actionType === 'send_message' ? messageTemplates[newTrigger as keyof typeof messageTemplates] : formData.actionValue
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border-color shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border-color p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {automation ? 'Editar Automação' : 'Nova Automação'}
              </h2>
              <p className="text-sm text-text-tertiary">Configure ações automáticas</p>
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
              Nome da Automação *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Boas-vindas para novos contatos"
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descrição do que esta automação faz"
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Gatilho (Trigger) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Quando executar? (Gatilho) *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {triggers.map(trigger => (
                <button
                  key={trigger.value}
                  type="button"
                  onClick={() => handleTriggerChange(trigger.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.triggerType === trigger.value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-border-color hover:border-orange-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <i className={`fas ${trigger.icon} text-xl ${
                      formData.triggerType === trigger.value ? 'text-orange-500' : 'text-text-tertiary'
                    }`}></i>
                    <div className="flex-1">
                      <p className={`font-medium mb-1 ${
                        formData.triggerType === trigger.value ? 'text-text-primary' : 'text-text-secondary'
                      }`}>
                        {trigger.label}
                      </p>
                      <p className="text-xs text-text-tertiary">{trigger.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Valor do Gatilho (se necessário) */}
          {['keyword', 'time_based', 'status_change', 'tag_added'].includes(formData.triggerType) && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {formData.triggerType === 'keyword' && 'Palavra-chave'}
                {formData.triggerType === 'time_based' && 'Dias sem resposta'}
                {formData.triggerType === 'status_change' && 'Novo status'}
                {formData.triggerType === 'tag_added' && 'Nome da tag'}
              </label>
              <input
                type={formData.triggerType === 'time_based' ? 'number' : 'text'}
                value={formData.triggerValue}
                onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                placeholder={
                  formData.triggerType === 'keyword' ? 'Ex: preço, orçamento' :
                  formData.triggerType === 'time_based' ? 'Ex: 3' :
                  formData.triggerType === 'status_change' ? 'Ex: vip' :
                  'Ex: interessado'
                }
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Ação */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              O que fazer? (Ação) *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {actions.map(action => (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, actionType: action.value })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.actionType === action.value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-border-color hover:border-orange-500/50'
                  }`}
                >
                  <i className={`fas ${action.icon} text-2xl mb-2 ${
                    formData.actionType === action.value ? 'text-orange-500' : 'text-text-tertiary'
                  }`}></i>
                  <p className={`text-sm font-medium ${
                    formData.actionType === action.value ? 'text-text-primary' : 'text-text-secondary'
                  }`}>
                    {action.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Valor da Ação */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {formData.actionType === 'send_message' && 'Mensagem a enviar *'}
              {formData.actionType === 'add_tag' && 'Tag a adicionar *'}
              {formData.actionType === 'change_status' && 'Novo status *'}
              {formData.actionType === 'assign_agent' && 'ID do agente *'}
              {formData.actionType === 'send_image' && 'URL da imagem *'}
            </label>
            {formData.actionType === 'send_message' ? (
              <textarea
                required
                value={formData.actionValue}
                onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                placeholder="Digite a mensagem..."
                rows={6}
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            ) : formData.actionType === 'change_status' ? (
              <select
                required
                value={formData.actionValue}
                onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Selecione...</option>
                <option value="lead">Lead</option>
                <option value="customer">Cliente</option>
                <option value="vip">VIP</option>
              </select>
            ) : (
              <input
                type="text"
                required
                value={formData.actionValue}
                onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                placeholder="Digite o valor..."
                className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
            <div>
              <p className="font-medium text-text-primary">Automação Ativa</p>
              <p className="text-sm text-text-tertiary">A automação será executada automaticamente</p>
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
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-lg font-medium transition-all shadow-lg"
            >
              {automation ? 'Salvar Alterações' : 'Criar Automação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
