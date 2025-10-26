// Painel de Notificações - Lista interativa de alertas
import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity'>('newest');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, filter, sortBy]);

  const loadNotifications = () => {
    let allNotifications = notificationService.getAllNotifications().map(n => ({
      ...n,
      read: (n as any).read || false,
      severity: (n as any).severity || 'low'
    }));

    // Filtrar
    if (filter === 'unread') {
      allNotifications = allNotifications.filter(n => !n.read);
    } else if (filter === 'critical') {
      allNotifications = allNotifications.filter(n => n.severity === 'critical' || n.severity === 'high');
    }

    // Ordenar
    if (sortBy === 'newest') {
      allNotifications.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortBy === 'oldest') {
      allNotifications.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortBy === 'severity') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      allNotifications.sort((a, b) => 
        (severityOrder[a.severity as keyof typeof severityOrder] || 4) - 
        (severityOrder[b.severity as keyof typeof severityOrder] || 4)
      );
    }

    setNotifications(allNotifications as any);
  };

  const markAsRead = (id: string) => {
    // Marcar como lida manualmente
    const notif = notifications.find(n => n.id === id);
    if (notif) (notif as any).read = true;
    loadNotifications();
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (!(n as any).read) (n as any).read = true;
    });
    loadNotifications();
  };

  const deleteNotification = (id: string) => {
    // Remover da lista
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    if (confirm('Limpar todas as notificações?')) {
      notificationService.clearAll();
      loadNotifications();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'from-red-500 to-red-700';
      case 'high': return 'from-orange-500 to-orange-700';
      case 'medium': return 'from-yellow-500 to-yellow-700';
      case 'low': return 'from-blue-500 to-blue-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-yellow-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                🔔 Notificações
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {notifications.length} total • {unreadCount} não lidas
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              {['all', 'unread', 'critical'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'unread' ? 'Não Lidas' : 'Críticas'}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 bg-gray-800/50 border border-yellow-500/30 rounded-lg text-white text-sm"
              >
                <option value="newest">Mais Recentes</option>
                <option value="oldest">Mais Antigas</option>
                <option value="severity">Por Severidade</option>
              </select>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1 bg-blue-500 rounded-lg hover:bg-blue-600 text-sm"
                >
                  ✓ Marcar Todas
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-3 py-1 bg-red-500 rounded-lg hover:bg-red-600 text-sm"
                >
                  🗑️ Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔕</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'Você está em dia! Nenhuma notificação no momento.'
                  : filter === 'unread'
                  ? 'Todas as notificações foram lidas.'
                  : 'Nenhuma notificação crítica.'}
              </p>
            </div>
          ) : (
            notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.read
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-gradient-to-r ' + getSeverityColor(notification.severity) + '/20 border-' + notification.severity + '-500/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl">
                    {getSeverityIcon(notification.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-300 mt-1">
                          {notification.body}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                      )}
                    </div>

                    {/* Image */}
                    {notification.imageUrl && (
                      <img
                        src={notification.imageUrl}
                        alt="Notificação"
                        className="w-full max-w-xs rounded-lg border border-gray-700 mt-2"
                      />
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>
                          {new Date(notification.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          notification.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          notification.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          notification.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {(notification.severity || 'low').toUpperCase()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600 text-xs"
                          >
                            ✓ Marcar Lida
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="px-3 py-1 bg-red-500 rounded hover:bg-red-600 text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Stats */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-yellow-500/30 bg-gray-900/50">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{notifications.length}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{unreadCount}</div>
                <div className="text-xs text-gray-400">Não Lidas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {notifications.filter((n: any) => n.severity === 'critical').length}
                </div>
                <div className="text-xs text-gray-400">Críticas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {notifications.filter((n: any) => n.severity === 'high').length}
                </div>
                <div className="text-xs text-gray-400">Altas</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
