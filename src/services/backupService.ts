/**
 * 💾 BACKUP SERVICE
 * 
 * Sistema automático de backup de dados
 */

import { dbService } from './databaseService';

class BackupService {
  private backupInterval: number | null = null;
  private readonly BACKUP_KEY = 'proxaistudio-last-backup';
  private readonly BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Inicia backup automático
   */
  startAutoBackup() {
    // Fazer backup inicial
    this.createBackup();

    // Agendar backups diários
    this.backupInterval = window.setInterval(() => {
      this.createBackup();
    }, this.BACKUP_INTERVAL);

    console.log('✅ Backup automático iniciado (a cada 24h)');
  }

  /**
   * Para backup automático
   */
  stopAutoBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('⏹️ Backup automático parado');
    }
  }

  /**
   * Cria backup manual
   */
  async createBackup(): Promise<string> {
    try {
      console.log('💾 Criando backup...');

      const data = await dbService.exportData();
      const timestamp = new Date().toISOString();

      // Salvar no localStorage como backup de emergência
      try {
        localStorage.setItem(this.BACKUP_KEY, data);
        localStorage.setItem(`${this.BACKUP_KEY}-timestamp`, timestamp);
      } catch (e) {
        console.warn('⚠️ Não foi possível salvar backup no localStorage (pode estar cheio)');
      }

      // Salvar como arquivo (opcional - usuário pode baixar)
      this.saveBackupFile(data, timestamp);

      console.log('✅ Backup criado com sucesso');
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
      throw error;
    }
  }

  /**
   * Salva backup como arquivo para download
   */
  private saveBackupFile(data: string, timestamp: string) {
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `gemini-backup-${timestamp.split('T')[0]}.json`;

      // Criar link temporário
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';

      // Não fazer download automático, apenas preparar
      // O usuário pode baixar manualmente se quiser
      console.log(`📦 Backup preparado: ${filename}`);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao preparar arquivo de backup:', error);
    }
  }

  /**
   * Restaura backup
   */
  async restoreBackup(jsonData: string): Promise<void> {
    try {
      console.log('📥 Restaurando backup...');

      await dbService.importData(jsonData);

      console.log('✅ Backup restaurado com sucesso');
      
      // Recarregar página para aplicar mudanças
      window.location.reload();
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      throw error;
    }
  }

  /**
   * Restaura do último backup automático
   */
  async restoreLastBackup(): Promise<void> {
    try {
      const lastBackup = localStorage.getItem(this.BACKUP_KEY);
      
      if (!lastBackup) {
        throw new Error('Nenhum backup encontrado');
      }

      await this.restoreBackup(lastBackup);
    } catch (error) {
      console.error('❌ Erro ao restaurar último backup:', error);
      throw error;
    }
  }

  /**
   * Obtém informações do último backup
   */
  getLastBackupInfo(): { timestamp: string; size: number } | null {
    try {
      const timestamp = localStorage.getItem(`${this.BACKUP_KEY}-timestamp`);
      const data = localStorage.getItem(this.BACKUP_KEY);

      if (!timestamp || !data) {
        return null;
      }

      return {
        timestamp,
        size: new Blob([data]).size
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Exporta backup para download manual
   */
  async downloadBackup(): Promise<void> {
    try {
      const data = await this.createBackup();
      const timestamp = new Date().toISOString();
      const filename = `gemini-backup-${timestamp.split('T')[0]}.json`;

      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      console.log(`✅ Backup baixado: ${filename}`);
    } catch (error) {
      console.error('❌ Erro ao baixar backup:', error);
      throw error;
    }
  }

  /**
   * Importa backup de arquivo
   */
  async importBackupFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      await this.restoreBackup(text);
    } catch (error) {
      console.error('❌ Erro ao importar backup:', error);
      throw error;
    }
  }

  /**
   * Limpa backups antigos
   */
  clearOldBackups(): void {
    try {
      localStorage.removeItem(this.BACKUP_KEY);
      localStorage.removeItem(`${this.BACKUP_KEY}-timestamp`);
      console.log('🗑️ Backups antigos removidos');
    } catch (error) {
      console.error('Erro ao limpar backups:', error);
    }
  }

  /**
   * Verifica se precisa fazer backup
   */
  needsBackup(): boolean {
    const lastBackupTime = localStorage.getItem(`${this.BACKUP_KEY}-timestamp`);
    
    if (!lastBackupTime) {
      return true;
    }

    const lastBackup = new Date(lastBackupTime);
    const now = new Date();
    const diff = now.getTime() - lastBackup.getTime();

    return diff >= this.BACKUP_INTERVAL;
  }
}

// Singleton
export const backupService = new BackupService();

// Auto-iniciar backup automático
if (typeof window !== 'undefined') {
  backupService.startAutoBackup();
}
