// Serviço de Geração de Relatórios
// Cria relatórios detalhados em PDF/HTML sobre eventos de segurança

export interface ReportConfig {
  title: string;
  period: {
    start: number;
    end: number;
  };
  includeAlerts: boolean;
  includeViolations: boolean;
  includeBehaviors: boolean;
  includeFaces: boolean;
  includeTimeline: boolean;
  includeHeatmap: boolean;
  includeStatistics: boolean;
  format: 'html' | 'pdf' | 'json';
}

export interface ReportData {
  config: ReportConfig;
  generatedAt: number;
  summary: {
    totalAlerts: number;
    totalViolations: number;
    totalBehaviors: number;
    totalFaces: number;
    criticalEvents: number;
  };
  alerts?: any[];
  violations?: any[];
  behaviors?: any[];
  faces?: any[];
  timeline?: any[];
  statistics?: any;
}

class ReportGeneratorService {
  async generateReport(config: ReportConfig): Promise<string> {
    const reportData = await this.collectData(config);
    
    switch (config.format) {
      case 'html':
        return this.generateHTML(reportData);
      case 'json':
        return JSON.stringify(reportData, null, 2);
      case 'pdf':
        return this.generatePDF(reportData);
      default:
        return this.generateHTML(reportData);
    }
  }

  private async collectData(config: ReportConfig): Promise<ReportData> {
    const data: ReportData = {
      config,
      generatedAt: Date.now(),
      summary: {
        totalAlerts: 0,
        totalViolations: 0,
        totalBehaviors: 0,
        totalFaces: 0,
        criticalEvents: 0
      }
    };

    // Coletar dados de diferentes serviços
    if (config.includeAlerts) {
      const alerts = JSON.parse(localStorage.getItem('security_alerts') || '[]');
      data.alerts = alerts.filter((a: any) => 
        a.timestamp >= config.period.start && a.timestamp <= config.period.end
      );
      data.summary.totalAlerts = data.alerts.length;
    }

    return data;
  }

  private generateHTML(data: ReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.config.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; }
    .section { background: white; margin: 20px 0; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .stat { display: inline-block; margin: 10px 20px; text-align: center; }
    .stat-value { font-size: 36px; font-weight: bold; color: #667eea; }
    .stat-label { color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎥 ${data.config.title}</h1>
    <p>Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
    <p>Período: ${new Date(data.config.period.start).toLocaleDateString('pt-BR')} - ${new Date(data.config.period.end).toLocaleDateString('pt-BR')}</p>
  </div>

  <div class="section">
    <h2>📊 Resumo Executivo</h2>
    <div class="stat">
      <div class="stat-value">${data.summary.totalAlerts}</div>
      <div class="stat-label">Alertas</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.summary.totalViolations}</div>
      <div class="stat-label">Violações</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.summary.criticalEvents}</div>
      <div class="stat-label">Eventos Críticos</div>
    </div>
  </div>

  ${data.alerts ? `
  <div class="section">
    <h2>🚨 Alertas</h2>
    <p>Total de alertas no período: ${data.alerts.length}</p>
  </div>
  ` : ''}

  <div class="section">
    <p style="text-align: center; color: #666;">
      Relatório gerado por DeepVision AI Security System
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private generatePDF(data: ReportData): string {
    // Simplificado - retorna HTML que pode ser convertido para PDF
    return this.generateHTML(data);
  }

  downloadReport(content: string, filename: string, format: string): void {
    const blob = new Blob([content], { 
      type: format === 'json' ? 'application/json' : 'text/html' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const reportGeneratorService = new ReportGeneratorService();
