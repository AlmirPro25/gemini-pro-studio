// Modal de Geração de Relatórios
import React, { useState } from 'react';
import { reportGeneratorService, ReportConfig } from '../services/reportGeneratorService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);

    const formData = new FormData(e.currentTarget);
    
    const config: ReportConfig = {
      title: formData.get('title') as string,
      period: {
        start: new Date(formData.get('startDate') as string).getTime(),
        end: new Date(formData.get('endDate') as string).getTime()
      },
      includeAlerts: formData.get('includeAlerts') === 'on',
      includeViolations: formData.get('includeViolations') === 'on',
      includeBehaviors: formData.get('includeBehaviors') === 'on',
      includeFaces: formData.get('includeFaces') === 'on',
      includeTimeline: formData.get('includeTimeline') === 'on',
      includeHeatmap: formData.get('includeHeatmap') === 'on',
      includeStatistics: formData.get('includeStatistics') === 'on',
      format: formData.get('format') as 'html' | 'pdf' | 'json'
    };

    try {
      const report = await reportGeneratorService.generateReport(config);
      const filename = `relatorio-${Date.now()}.${config.format}`;
      
      reportGeneratorService.downloadReport(report, filename, config.format);
      
      setTimeout(() => {
        setIsGenerating(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-indigo-500/50 rounded-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-indigo-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                📊 Gerar Relatório
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Configure e exporte relatório de segurança
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título do Relatório
            </label>
            <input
              type="text"
              name="title"
              defaultValue={`Relatório de Segurança - ${new Date().toLocaleDateString('pt-BR')}`}
              className="w-full px-4 py-2 bg-gray-800/50 border border-indigo-500/30 rounded-lg text-white"
              required
            />
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Início
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-4 py-2 bg-gray-800/50 border border-indigo-500/30 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                name="endDate"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 bg-gray-800/50 border border-indigo-500/30 rounded-lg text-white"
                required
              />
            </div>
          </div>

          {/* Incluir */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Incluir no Relatório:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'includeAlerts', label: '🚨 Alertas' },
                { name: 'includeViolations', label: '⚠️ Violações de Zona' },
                { name: 'includeBehaviors', label: '🧠 Comportamentos' },
                { name: 'includeFaces', label: '👤 Reconhecimento Facial' },
                { name: 'includeTimeline', label: '🗓️ Timeline' },
                { name: 'includeHeatmap', label: '🔥 Mapa de Calor' },
                { name: 'includeStatistics', label: '📊 Estatísticas' }
              ].map(item => (
                <label key={item.name} className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    name={item.name}
                    defaultChecked
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Formato de Exportação:
            </label>
            <div className="flex gap-4">
              {[
                { value: 'html', label: 'HTML', icon: '🌐' },
                { value: 'pdf', label: 'PDF', icon: '📄' },
                { value: 'json', label: 'JSON', icon: '📋' }
              ].map(format => (
                <label key={format.value} className="flex-1">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    defaultChecked={format.value === 'html'}
                    className="peer sr-only"
                  />
                  <div className="px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg cursor-pointer peer-checked:border-indigo-500 peer-checked:bg-indigo-500/20 hover:border-indigo-500/50 transition-all text-center">
                    <div className="text-2xl mb-1">{format.icon}</div>
                    <div className="text-sm font-medium text-white">{format.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Gerando...
                </span>
              ) : (
                '📥 Gerar e Baixar'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
