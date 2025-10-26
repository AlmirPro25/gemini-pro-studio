// Serviço de Notificações Desktop
// Gerencia notificações do browser e sons de alerta

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityNotification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: number;
  imageUrl?: string;
  actionUrl?: string;
  snoozedUntil?: number;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private notifications: SecurityNotification[] = [];
  private audioContext: AudioContext | null = null;
  private sounds: { [key: string]: AudioBuffer } = {};

  constructor() {
    this.checkPermission();
    this.initAudio();
  }

  // Verificar permissão
  private async checkPermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Solicitar permissão
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  // Inicializar áudio
  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.generateSounds();
    } catch (error) {
      console.error('Erro ao inicializar áudio:', error);
    }
  }

  // Gerar sons sintetizados
  private generateSounds(): void {
    if (!this.audioContext) return;

    // Som de alerta baixo
    this.sounds.low = this.createBeep(400, 0.2, 0.3);
    
    // Som de alerta médio
    this.sounds.medium = this.createBeep(600, 0.3, 0.4);
    
    // Som de alerta alto
    this.sounds.high = this.createBeep(800, 0.4, 0.5);
    
    // Som de alerta crítico (sirene)
    this.sounds.critical = this.createSiren();
  }

  // Criar beep simples
  private createBeep(frequency: number, duration: number, volume: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * volume * Math.exp(-t * 3);
    }

    return buffer;
  }

  // Criar som de sirene
  private createSiren(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 400 + Math.sin(t * 8 * Math.PI) * 400;
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.5;
    }

    return buffer;
  }

  // Tocar som
  playSound(priority: NotificationPriority): void {
    if (!this.audioContext || !this.sounds[priority]) return;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.sounds[priority];
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }

  // Enviar notificação
  async notify(
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    options?: {
      imageUrl?: string;
      actionUrl?: string;
      playSound?: boolean;
    }
  ): Promise<SecurityNotification> {
    const notification: SecurityNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      priority,
      timestamp: Date.now(),
      imageUrl: options?.imageUrl,
      actionUrl: options?.actionUrl
    };

    this.notifications.unshift(notification);

    // Tocar som se habilitado
    if (options?.playSound !== false) {
      this.playSound(priority);
    }

    // Enviar notificação desktop
    if (this.permission === 'granted') {
      const browserNotif = new Notification(title, {
        body: message,
        icon: options?.imageUrl || '/icon.png',
        badge: '/badge.png',
        tag: notification.id,
        requireInteraction: priority === 'critical',
        silent: false
      });

      browserNotif.onclick = () => {
        window.focus();
        if (options?.actionUrl) {
          window.location.href = options.actionUrl;
        }
        browserNotif.close();
      };

      // Auto-fechar após tempo baseado na prioridade
      const timeout = this.getAutoCloseTimeout(priority);
      if (timeout > 0) {
        setTimeout(() => browserNotif.close(), timeout);
      }
    }

    // Salvar no localStorage
    this.saveNotifications();

    return notification;
  }

  // Tempo de auto-fechamento baseado na prioridade
  private getAutoCloseTimeout(priority: NotificationPriority): number {
    switch (priority) {
      case 'low': return 3000;
      case 'medium': return 5000;
      case 'high': return 10000;
      case 'critical': return 0; // Não fecha automaticamente
      default: return 5000;
    }
  }

  // Snooze (adiar) notificação
  snooze(notificationId: string, minutes: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.snoozedUntil = Date.now() + (minutes * 60 * 1000);
      this.saveNotifications();
    }
  }

  // Dismiss (descartar) notificação
  dismiss(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  // Limpar todas as notificações
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Obter notificações ativas
  getActiveNotifications(): SecurityNotification[] {
    const now = Date.now();
    return this.notifications.filter(n => !n.snoozedUntil || n.snoozedUntil <= now);
  }

  // Obter todas as notificações
  getAllNotifications(): SecurityNotification[] {
    return this.notifications;
  }

  // Salvar notificações
  private saveNotifications(): void {
    try {
      localStorage.setItem('security_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
    }
  }

  // Carregar notificações
  loadNotifications(): void {
    try {
      const saved = localStorage.getItem('security_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }

  // Notificação de movimento detectado
  async notifyMotion(intensity: number, imageUrl?: string): Promise<void> {
    const priority: NotificationPriority = 
      intensity > 0.7 ? 'high' :
      intensity > 0.4 ? 'medium' : 'low';

    await this.notify(
      '🔥 Movimento Detectado',
      `Intensidade: ${(intensity * 100).toFixed(0)}%`,
      priority,
      { imageUrl, playSound: true }
    );
  }

  // Notificação de rosto desconhecido
  async notifyUnknownFace(imageUrl?: string): Promise<void> {
    await this.notify(
      '👤 Rosto Desconhecido',
      'Uma pessoa não cadastrada foi detectada',
      'high',
      { imageUrl, playSound: true }
    );
  }

  // Notificação de ameaça
  async notifyThreat(description: string, imageUrl?: string): Promise<void> {
    await this.notify(
      '🚨 AMEAÇA DETECTADA',
      description,
      'critical',
      { imageUrl, playSound: true }
    );
  }

  // Notificação de queda
  async notifyFall(imageUrl?: string): Promise<void> {
    await this.notify(
      '🤕 QUEDA DETECTADA',
      'Uma pessoa pode ter caído. Verifique imediatamente!',
      'critical',
      { imageUrl, playSound: true }
    );
  }

  // Status do serviço
  getStatus(): {
    permission: NotificationPermission;
    notificationCount: number;
    audioEnabled: boolean;
  } {
    return {
      permission: this.permission,
      notificationCount: this.notifications.length,
      audioEnabled: this.audioContext !== null
    };
  }
}

export const notificationService = new NotificationService();
