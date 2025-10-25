import React, { useState } from 'react';
import { Persona } from '../types';
import { createSpecialistOnDemand, createSpecialistTeam, suggestSpecialists } from '../services/metaPersonaService';

interface MetaPersonaModalProps {
  onClose: () => void;
  onSelectPersona: (persona: Persona) => void;
  conversationContext?: string[];
}

export const MetaPersonaModal: React.FC<MetaPersonaModalProps> = ({
  onClose,
  onSelectPersona,
  conversationContext = []
}) => {
  const [mode, setMode] = useState<'create' | 'team' | 'suggest'>('create');
  const [request, setRequest] = useState('');
  const [teamSize, setTeamSize] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPersonas, setGeneratedPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSpecialist = async () => {
    if (!request.trim()) {
      setError('Por favor, descreva o que você precisa');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const specialist = await createSpecialistOnDemand(request, conversationContext);
      setGeneratedPersonas([specialist]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar especialista');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!request.trim()) {
      setError('Por favor, descreva o problema complexo');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const team = await createSpecialistTeam(request, teamSize);
      setGeneratedPersonas(team);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar equipe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggest = async () => {
    if (conversationContext.length === 0) {
      setError('Nenhum contexto de conversa disponível');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const suggestions = await suggestSpecialists(conversationContext);
      setGeneratedPersonas(suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sugerir especialistas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAndClose = (persona: Persona) => {
    onSelectPersona(persona);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border-color shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border-color bg-gradient-to-r from-purple-600/20 to-blue-600/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
                Meta-Persona AI
              </h2>
              <p className="text-text-secondary text-sm mt-1">
                O Master AI cria especialistas perfeitos sob demanda
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 p-4 bg-bg-tertiary/50 border-b border-border-color">
          <button
            onClick={() => { setMode('create'); setGeneratedPersonas([]); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mode === 'create'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <i className="fa-solid fa-user-plus mr-2"></i>
            Criar Especialista
          </button>
          <button
            onClick={() => { setMode('team'); setGeneratedPersonas([]); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mode === 'team'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            <i className="fa-solid fa-users mr-2"></i>
            Criar Equipe
          </button>
          <button
            onClick={() => { setMode('suggest'); setGeneratedPersonas([]); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              mode === 'suggest'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
            }`}
            disabled={conversationContext.length === 0}
          >
            <i className="fa-solid fa-lightbulb mr-2"></i>
            Sugerir
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  O que você precisa?
                </label>
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="Ex: Preciso de um especialista em otimização de algoritmos de machine learning para reduzir o tempo de treinamento..."
                  className="w-full h-32 bg-bg-tertiary text-text-primary p-3 rounded-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <button
                onClick={handleCreateSpecialist}
                disabled={isLoading || !request.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Master AI criando especialista...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    Criar Especialista
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'team' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Descreva o problema complexo
                </label>
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="Ex: Preciso desenvolver uma arquitetura de microserviços escalável com foco em segurança, performance e observabilidade..."
                  className="w-full h-32 bg-bg-tertiary text-text-primary p-3 rounded-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Tamanho da equipe: {teamSize} especialistas
                </label>
                <input
                  type="range"
                  min="2"
                  max="5"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleCreateTeam}
                disabled={isLoading || !request.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Master AI montando equipe...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-users"></i>
                    Criar Equipe de {teamSize}
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'suggest' && (
            <div className="space-y-4">
              <div className="bg-bg-tertiary/50 p-4 rounded-lg border border-border-color">
                <p className="text-text-secondary text-sm">
                  <i className="fa-solid fa-info-circle mr-2 text-blue-400"></i>
                  O Master AI analisará sua conversa e sugerirá especialistas relevantes para aprofundar ou explorar tópicos relacionados.
                </p>
              </div>
              <button
                onClick={handleSuggest}
                disabled={isLoading}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Analisando conversa...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lightbulb"></i>
                    Sugerir Especialistas
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg">
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          )}

          {/* Generated Personas */}
          {generatedPersonas.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <i className="fa-solid fa-sparkles text-yellow-400"></i>
                {mode === 'team' ? 'Equipe Criada' : 'Especialista Criado'}
              </h3>
              {generatedPersonas.map((persona, index) => (
                <div
                  key={persona.id}
                  className="bg-bg-tertiary p-4 rounded-lg border border-border-color hover:border-purple-500 transition-all cursor-pointer group"
                  onClick={() => handleSelectAndClose(persona)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                      <i className={persona.icon}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-text-primary group-hover:text-purple-400 transition-colors">
                          {persona.name}
                          {persona.isTeamMember && (
                            <span className="ml-2 text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded">
                              {persona.teamRole}
                            </span>
                          )}
                        </h4>
                        <i className="fa-solid fa-arrow-right text-text-tertiary group-hover:text-purple-400 transition-colors"></i>
                      </div>
                      {persona.domain && (
                        <p className="text-sm text-purple-400 mt-1">
                          <i className="fa-solid fa-tag mr-1"></i>
                          {persona.domain}
                        </p>
                      )}
                      {persona.reasoning && (
                        <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                          {persona.reasoning}
                        </p>
                      )}
                      {persona.capabilities && persona.capabilities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {persona.capabilities.slice(0, 3).map((cap, i) => (
                            <span
                              key={i}
                              className="text-xs bg-bg-secondary text-text-tertiary px-2 py-1 rounded"
                            >
                              {cap}
                            </span>
                          ))}
                          {persona.capabilities.length > 3 && (
                            <span className="text-xs text-text-tertiary">
                              +{persona.capabilities.length - 3} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
