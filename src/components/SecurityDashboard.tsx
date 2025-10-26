import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { analyzeColors, detectMotion, ColorAnalysis, MotionData } from '../services/visualAnalysisService';

interface SecurityDashboardProps {
  currentFrame: string | null;
  previousFrame: string | null;
  alerts: any[];
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  currentFrame,
  previousFrame,
  alerts
}) => {
  const [colorAnalysis, setColorAnalysis] = useState<ColorAnalysis | null>(null);
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const colorChartRef = useRef<HTMLDivElement>(null);
  const motionChartRef = useRef<HTMLDivElement>(null);
  const activityChartRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);

  // Analisar frame atual
  useEffect(() => {
    if (currentFrame) {
      analyzeCurrentFrame();
    }
  }, [currentFrame]);

  // Detectar movimento
  useEffect(() => {
    if (currentFrame && previousFrame) {
      detectFrameMotion();
    }
  }, [currentFrame, previousFrame]);

  // Atualizar gráficos
  useEffect(() => {
    if (colorAnalysis) {
      renderColorChart();
    }
  }, [colorAnalysis]);

  useEffect(() => {
    if (motionData) {
      renderMotionChart();
      renderHeatmap();
    }
  }, [motionData]);

  useEffect(() => {
    renderActivityChart();
  }, [alerts]);

  const analyzeCurrentFrame = async () => {
    if (!currentFrame) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeColors(currentFrame);
      setColorAnalysis(analysis);
    } catch (error) {
      console.error('Erro na análise de cores:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectFrameMotion = async () => {
    if (!currentFrame || !previousFrame) return;
    try {
      const motion = await detectMotion(previousFrame, currentFrame);
      setMotionData(motion);
    } catch (error) {
      console.error('Erro na detecção de movimento:', error);
    }
  };

  // Renderizar gráfico de cores com D3
  const renderColorChart = () => {
    if (!colorChartRef.current || !colorAnalysis) return;

    const container = colorChartRef.current;
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const data = colorAnalysis.dominantColors;

    const x = d3.scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.percentage) || 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Barras
    svg.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (_, i) => x(i.toString()) || 0)
      .attr('y', d => y(d.percentage))
      .attr('width', x.bandwidth())
      .attr('height', d => y(0) - y(d.percentage))
      .attr('fill', d => d.color)
      .attr('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
      });

    // Eixo Y
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .attr('color', '#9ca3af');

    // Labels
    svg.selectAll('text.label')
      .data(data)
      .join('text')
      .attr('class', 'label')
      .attr('x', (_, i) => (x(i.toString()) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.percentage) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .text(d => `${d.percentage.toFixed(1)}%`);
  };

  // Renderizar gráfico de movimento
  const renderMotionChart = () => {
    if (!motionChartRef.current || !motionData) return;

    const container = motionChartRef.current;
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = 150;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Indicador de intensidade
    const intensity = motionData.intensity * 100;
    const color = intensity > 50 ? '#ef4444' : intensity > 25 ? '#f59e0b' : '#10b981';

    svg.append('rect')
      .attr('x', 10)
      .attr('y', 50)
      .attr('width', width - 20)
      .attr('height', 30)
      .attr('fill', '#1f2937')
      .attr('rx', 5);

    svg.append('rect')
      .attr('x', 10)
      .attr('y', 50)
      .attr('width', (width - 20) * (intensity / 100))
      .attr('height', 30)
      .attr('fill', color)
      .attr('rx', 5);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 70)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(`${intensity.toFixed(1)}% Movimento`);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '12px')
      .text(`${motionData.regions.length} regiões ativas`);
  };

  // Renderizar heatmap de movimento
  const renderHeatmap = () => {
    if (!heatmapRef.current || !motionData) return;

    const canvas = heatmapRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const gridSize = 20;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    // Limpar canvas
    ctx.clearRect(0, 0, width, height);

    // Criar grid de calor
    const heatmap: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    
    motionData.regions.forEach(region => {
      const gx = Math.floor((region.x / width) * gridSize);
      const gy = Math.floor((region.y / height) * gridSize);
      
      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        heatmap[gy][gx] += region.intensity;
      }
    });

    // Renderizar células
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const intensity = Math.min(heatmap[y][x] * 10, 1);
        if (intensity > 0) {
          ctx.fillStyle = `rgba(239, 68, 68, ${intensity})`;
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }
  };

  // Renderizar gráfico de atividade
  const renderActivityChart = () => {
    if (!activityChartRef.current) return;

    const container = activityChartRef.current;
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = 150;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Dados dos últimos alertas (últimas 24h)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentAlerts = alerts.filter(a => a.timestamp > oneDayAgo);

    // Agrupar por hora
    const hourlyData = Array(24).fill(0).map((_, i) => ({
      hour: i,
      count: 0
    }));

    recentAlerts.forEach(alert => {
      const hour = new Date(alert.timestamp).getHours();
      hourlyData[hour].count++;
    });

    const x = d3.scaleLinear()
      .domain([0, 23])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(hourlyData, d => d.count) || 10])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Linha
    const line = d3.line<typeof hourlyData[0]>()
      .x(d => x(d.hour))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(hourlyData)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Pontos
    svg.selectAll('circle')
      .data(hourlyData)
      .join('circle')
      .attr('cx', d => x(d.hour))
      .attr('cy', d => y(d.count))
      .attr('r', 3)
      .attr('fill', '#8b5cf6');

    // Eixos
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => `${d}h`))
      .attr('color', '#9ca3af');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#9ca3af');
  };

  return (
    <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg">
      {/* Métricas Rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Brilho Médio</div>
          <div className="text-2xl font-bold text-white">
            {colorAnalysis ? `${(colorAnalysis.brightness * 100).toFixed(0)}%` : '--'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Movimento</div>
          <div className="text-2xl font-bold text-white">
            {motionData ? `${(motionData.intensity * 100).toFixed(1)}%` : '--'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Alertas Hoje</div>
          <div className="text-2xl font-bold text-white">
            {alerts.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}
          </div>
        </div>
      </div>

      {/* Gráfico de Cores Dominantes */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span>🎨</span> Cores Dominantes
        </h3>
        <div ref={colorChartRef} className="w-full"></div>
      </div>

      {/* Movimento */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span>🔥</span> Intensidade de Movimento
        </h3>
        <div ref={motionChartRef} className="w-full"></div>
      </div>

      {/* Heatmap */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span>🗺️</span> Mapa de Calor
        </h3>
        <canvas 
          ref={heatmapRef} 
          width={400} 
          height={300}
          className="w-full bg-black/30 rounded"
        />
      </div>

      {/* Atividade 24h */}
      <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span>📈</span> Atividade (24h)
        </h3>
        <div ref={activityChartRef} className="w-full"></div>
      </div>

      {isAnalyzing && (
        <div className="text-center text-sm text-gray-400">
          <span className="animate-pulse">Analisando...</span>
        </div>
      )}
    </div>
  );
};
