'use client';

import React, { useEffect, useRef } from 'react';
import { BarChart3, PieChart, TrendingUp, Activity, Target, Zap } from 'lucide-react';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

interface SimpleBarChartProps {
  data: ChartData;
  title?: string;
  height?: number;
}

export function SimpleBarChart({ data, title, height = 300 }: SimpleBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.datasets[0]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height: canvasHeight } = canvas;
    const dataset = data.datasets[0];
    const maxValue = Math.max(...dataset.data);
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = canvasHeight - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Set font
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#374151';

    // Draw bars
    const barWidth = chartWidth / data.labels.length * 0.8;
    const barSpacing = chartWidth / data.labels.length * 0.2;

    data.labels.forEach((label, index) => {
      const value = dataset.data[index];
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * (barWidth + barSpacing);
      const y = canvasHeight - padding - barHeight;

      // Draw bar
      ctx.fillStyle = Array.isArray(dataset.backgroundColor) 
        ? dataset.backgroundColor[index] || '#8b5cf6'
        : dataset.backgroundColor || '#8b5cf6';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);

      // Draw label
      ctx.fillText(label, x + barWidth / 2, canvasHeight - padding + 20);
    });

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvasHeight - padding);
    // X-axis
    ctx.moveTo(padding, canvasHeight - padding);
    ctx.lineTo(width - padding, canvasHeight - padding);
    ctx.stroke();

  }, [data]);

  return (
    <div className="my-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {title && (
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 size={20} className="text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        className="w-full max-w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

interface SimplePieChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  size?: number;
}

export function SimplePieChart({ data, title, size = 300 }: SimplePieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = size / 3;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Default colors
    const defaultColors = [
      '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'
    ];

    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const color = item.color || defaultColors[index % defaultColors.length];

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const percentage = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${percentage}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

  }, [data, size]);

  return (
    <div className="my-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {title && (
        <div className="flex items-center space-x-2 mb-4">
          <PieChart size={20} className="text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-8">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="flex-shrink-0"
        />
        <div className="flex flex-col space-y-2">
          {data.map((item, index) => {
            const defaultColors = [
              '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'
            ];
            const color = item.color || defaultColors[index % defaultColors.length];
            
            return (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {item.label}: {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  showPercentage?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  color = 'purple', 
  showPercentage = true 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600'
  };

  return (
    <div className="my-4">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel = "vs last period", 
  icon, 
  color = 'purple' 
}: MetricCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
    orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
    red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
  };

  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </div>
      {change !== undefined && (
        <div className="flex items-center space-x-1 text-sm">
          <span
            className={`inline-flex items-center ${
              isPositiveChange
                ? 'text-green-600'
                : isNegativeChange
                ? 'text-red-600'
                : 'text-gray-500'
            }`}
          >
            {isPositiveChange ? '↗' : isNegativeChange ? '↘' : '→'}
            {Math.abs(change)}%
          </span>
          <span className="text-gray-500 dark:text-gray-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

interface TimelineProps {
  events: Array<{
    date: string;
    title: string;
    description?: string;
    status?: 'completed' | 'current' | 'upcoming';
  }>;
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="my-6">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
        
        {events.map((event, index) => (
          <div key={index} className="relative flex items-start space-x-6 pb-8">
            {/* Timeline dot */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full border-4 flex items-center justify-center ${
                event.status === 'completed'
                  ? 'bg-green-600 border-green-600'
                  : event.status === 'current'
                  ? 'bg-purple-600 border-purple-600'
                  : 'bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600'
              }`}
            >
              {event.status === 'completed' && (
                <span className="text-white text-xs">✓</span>
              )}
              {event.status === 'current' && (
                <span className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {event.date}
                </span>
              </div>
              {event.description && (
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FlowchartProps {
  nodes: Array<{
    id: string;
    label: string;
    type?: 'start' | 'process' | 'decision' | 'end';
  }>;
  connections: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
}

export function SimpleFlowchart({ nodes, connections }: FlowchartProps) {
  const getNodeStyle = (type: string = 'process') => {
    const baseStyle = "px-4 py-2 border-2 text-sm font-medium text-center";
    
    switch (type) {
      case 'start':
      case 'end':
        return `${baseStyle} rounded-full bg-green-100 border-green-500 text-green-800`;
      case 'decision':
        return `${baseStyle} bg-yellow-100 border-yellow-500 text-yellow-800 transform rotate-45`;
      default:
        return `${baseStyle} rounded-lg bg-blue-100 border-blue-500 text-blue-800`;
    }
  };

  return (
    <div className="my-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center space-x-2 mb-4">
        <Activity size={20} className="text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Process Flow</h3>
      </div>
      
      {/* Simple vertical flowchart */}
      <div className="flex flex-col space-y-4 items-center">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex flex-col items-center">
            <div className={getNodeStyle(node.type)}>
              <span className={node.type === 'decision' ? 'transform -rotate-45' : ''}>
                {node.label}
              </span>
            </div>
            
            {index < nodes.length - 1 && (
              <div className="flex flex-col items-center py-2">
                <div className="w-0.5 h-6 bg-gray-400" />
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to parse data from text
export function parseChartDataFromText(text: string): ChartData | null {
  // Look for data in formats like:
  // Chart: Product Sales
  // - Product A: 150
  // - Product B: 200
  // - Product C: 100
  
  const chartMatch = text.match(/Chart:\s*(.+?)\n((?:\s*-\s*.+?:\s*\d+\n?)+)/);
  
  if (chartMatch) {
    const title = chartMatch[1].trim();
    const dataLines = chartMatch[2].trim().split('\n');
    
    const labels: string[] = [];
    const data: number[] = [];
    
    dataLines.forEach(line => {
      const match = line.match(/\s*-\s*(.+?):\s*(\d+)/);
      if (match) {
        labels.push(match[1].trim());
        data.push(parseInt(match[2]));
      }
    });
    
    if (labels.length > 0) {
      return {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
        }]
      };
    }
  }
  
  return null;
}