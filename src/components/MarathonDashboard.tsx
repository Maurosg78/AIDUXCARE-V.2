import React, { useState, useEffect } from 'react';
import { MarathonOptimizationService, MarathonMetrics } from '../services/MarathonOptimizationService';

interface MarathonDashboardProps {
  refreshInterval?: number;
}

export const MarathonDashboard: React.FC<MarathonDashboardProps> = ({ 
  refreshInterval = 5000 
}) => {
  const [metrics, setMetrics] = useState<MarathonMetrics>({
    requestsPerMinute: 0,
    averageResponseTime: 0,
    successRate: 100,
    errorRate: 0,
    throughput: 0,
    activeConnections: 0,
    memoryUsage: 0,
    cpuUsage: 0
  });

  const [alerts, setAlerts] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        updateMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isRunning, refreshInterval]);

  const updateMetrics = async () => {
    try {
      // Simular métricas reales (en producción esto vendría del servicio)
      const newMetrics: MarathonMetrics = {
        requestsPerMinute: Math.floor(Math.random() * 50) + 10,
        averageResponseTime: Math.floor(Math.random() * 300) + 200,
        successRate: Math.floor(Math.random() * 10) + 90,
        errorRate: Math.floor(Math.random() * 10),
        throughput: Math.floor(Math.random() * 100) + 50,
        activeConnections: Math.floor(Math.random() * 20) + 5,
        memoryUsage: Math.floor(Math.random() * 30) + 40,
        cpuUsage: Math.floor(Math.random() * 40) + 30
      };

      setMetrics(newMetrics);
      setLastUpdate(new Date());
      checkAlerts(newMetrics);
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };

  const checkAlerts = (currentMetrics: MarathonMetrics) => {
    const newAlerts: string[] = [];

    if (currentMetrics.errorRate > 5) {
      newAlerts.push(`WARNING: Error rate high: ${currentMetrics.errorRate.toFixed(1)}%`);
    }

    if (currentMetrics.averageResponseTime > 500) {
      newAlerts.push(`🐌 Slow response time: ${currentMetrics.averageResponseTime}ms`);
    }

    if (currentMetrics.cpuUsage > 80) {
      newAlerts.push(`ACTIVE: High CPU usage: ${currentMetrics.cpuUsage}%`);
    }

    if (currentMetrics.memoryUsage > 85) {
      newAlerts.push(`💾 High memory usage: ${currentMetrics.memoryUsage}%`);
    }

    setAlerts(newAlerts);
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'RED:';
    if (value >= thresholds.warning) return 'YELLOW';
    return 'GREEN';
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">LAUNCH: Marathon Dashboard</h1>
          <p className="text-gray-400">Real-time monitoring & optimization</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            <span>{isRunning ? 'RUNNING' : 'STOPPED'}</span>
          </div>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {isRunning ? '⏸️ Pause' : '▶️ Resume'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 p-4 bg-red-900 border border-red-500 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">ALERT Active Alerts</h3>
          <div className="space-y-1">
            {alerts.map((alert, index) => (
              <div key={index} className="text-red-200">{alert}</div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Requests per Minute */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Requests/min</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.requestsPerMinute, { warning: 30, critical: 50 })}`}>
                {metrics.requestsPerMinute}
              </p>
            </div>
            <span className="text-2xl">{getStatusIcon(metrics.requestsPerMinute, { warning: 30, critical: 50 })}</span>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Response</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.averageResponseTime, { warning: 400, critical: 600 })}`}>
                {metrics.averageResponseTime}ms
              </p>
            </div>
            <span className="text-2xl">{getStatusIcon(metrics.averageResponseTime, { warning: 400, critical: 600 })}</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className={`text-2xl font-bold ${getStatusColor(100 - metrics.successRate, { warning: 5, critical: 10 })}`}>
                {metrics.successRate.toFixed(1)}%
              </p>
            </div>
            <span className="text-2xl">{getStatusIcon(100 - metrics.successRate, { warning: 5, critical: 10 })}</span>
          </div>
        </div>

        {/* Throughput */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Throughput</p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.throughput, { warning: 80, critical: 120 })}`}>
                {metrics.throughput}/s
              </p>
            </div>
            <span className="text-2xl">{getStatusIcon(metrics.throughput, { warning: 80, critical: 120 })}</span>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* CPU Usage */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">CPU Usage</h3>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                metrics.cpuUsage > 80 ? 'bg-red-500' : 
                metrics.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${metrics.cpuUsage}%` }}
            ></div>
          </div>
          <p className="text-right mt-2 text-sm">{metrics.cpuUsage}%</p>
        </div>

        {/* Memory Usage */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Memory Usage</h3>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                metrics.memoryUsage > 85 ? 'bg-red-500' : 
                metrics.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${metrics.memoryUsage}%` }}
            ></div>
          </div>
          <p className="text-right mt-2 text-sm">{metrics.memoryUsage}%</p>
        </div>

        {/* Active Connections */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Active Connections</h3>
          <div className="text-3xl font-bold text-blue-400">{metrics.activeConnections}</div>
          <p className="text-gray-400 text-sm">Current connections</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
        <span>Auto-refresh: {refreshInterval / 1000}s</span>
      </div>
    </div>
  );
}; 