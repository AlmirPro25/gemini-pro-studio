// Timeline Visual - Linha do tempo com filtros
import React, { useState, useEffect } from 'react';
import { timelineService, TimelineEvent } from '../services/timelineService';

interface TimelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  isOpen,
  onClose
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [events, typeFilter, severityFilter, searchTerm, dateRange]);

  const loadEvents = () => {
    const allEvents = timelineService.getEvents({ limit: 1000 });
    setEvents(allEvents);
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Filtro de tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.type === typeFilter);
    }

    // Filtro de severidade
    if (severityFilter !== 'all') {
      filtered = filtered.filter(e => e.severity === severityFilter);
    }

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term)
      );
    }

    // Filtro de data
    const now = Date.now();
    if (dateRange === 'today') {
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      filtered = filtered.filter(e => e.timestamp >= startOfDay);
    } else if (dateRange === 'week') {
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(e => e.timestamp >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(e => e.timestamp >= monthAgo);
    }

    setFilteredEvents(filtered);
  };

  const exportTimeline = () => {
    const data = timelineService.exportTimeline();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearTimeline = () => {
    if (confirm('Limpar toda a timeline? Esta ação não pode ser desfeita.')) {
      timelineService.clearTimeline();
      loadEvents();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return '🚨';
      case 'motion': return '🏃';
      case 'face': return '👤';
      case 'violation': return '⚠️';
      case 'behavior': return '🧠';
      case 'recording': return '🎬';
      default: return '📌';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return 'red';
      case 'motion': return 'blue';
      case 'face': return 'green';
      case 'violation': return 'orange';
      case 'behavior': return 'purple';
      case 'recording': return 'pink';
      default: return 'gray';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isOpen) return null;

  const stats = timelineService.getStats();
  const eventTypes = ['all', 'alert', 'motion', 'face', 'violation', 'behavior', 'recording'];
  const severities = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-indigo-500/50 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-indigo-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                🗓️ Timeline de Eventos
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {filteredEvents.length} de {events.length} eventos
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Buscar eventos..."
              className="w-full px-4 py-2 bg-gray-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500"
            />

            <div className="flex gap-4">
              {/* Date Range */}
              <div className="flex gap-2">
                {['today', 'week', 'month', 'all'].map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range as any)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      dateRange === range
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:text-white'
                    }`}
                  >
                    {range === 'today' ? 'Hoje' : range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Tudo'}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 bg-gray-800/50 border border-indigo-500/30 rounded-lg text-white text-sm"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'Todos os Tipos' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-1 bg-gray-800/50 border border-indigo-500/30 rounded-lg text-white text-sm"
              >
                {severities.map(sev => (
                  <option key={sev} value={sev}>
                    {sev === 'all' ? 'Todas Severidades' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </option>
                ))}
              </select>

              {/* Actions */}
              <button
                onClick={exportTimeline}
                className="px-3 py-1 bg-blue-500 rounded-lg hover:bg-blue-600 text-sm"
              >
                📥 Exportar
              </button>

              <button
                onClick={clearTimeline}
                className="px-3 py-1 bg-red-500 rounded-lg hover:bg-red-600 text-sm"
              >
                🗑️ Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Nenhum evento encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Nenhum evento registrado ainda.'}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500"></div>

              {/* Events */}
              <div className="space-y-6">
                {filteredEvents.map((event, index) => {
                  const color = getTypeColor(event.type);
                  return (
                    <div key={event.id} className="relative pl-20">
                      {/* Timeline Dot */}
                      <div className={`absolute left-6 w-5 h-5 rounded-full bg-${color}-500 border-4 border-gray-900`}></div>

                      {/* Event Card */}
                      <div className="bg-gray-800/50 border border-indigo-500/30 rounded-lg p-4 hover:border-indigo-500/50 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getTypeIcon(event.type)}</span>
                            <div>
                              <h4 className="font-semibold text-white">{event.title}</h4>
                              <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(event.severity)} text-white`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </div>

                        {/* Image */}
                        {event.imageUrl && (
                          <img
                            src={event.imageUrl}
                            alt="Evento"
                            className="w-full max-w-sm rounded-lg border border-gray-700 mt-3"
                          />
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                          <span>📅 {new Date(event.timestamp).toLocaleDateString('pt-BR')}</span>
                          <span>🕐 {new Date(event.timestamp).toLocaleTimeString('pt-BR')}</span>
                          <span className={`px-2 py-1 rounded bg-${color}-500/20 text-${color}-400`}>
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-indigo-500/30 bg-gray-900/50">
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{stats.criticalEvents}</div>
              <div className="text-xs text-gray-400">Críticos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{stats.todayEvents}</div>
              <div className="text-xs text-gray-400">Hoje</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {new Date(stats.firstEvent).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </div>
              <div className="text-xs text-gray-400">Primeiro</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {new Date(stats.lastEvent).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </div>
              <div className="text-xs text-gray-400">Último</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
