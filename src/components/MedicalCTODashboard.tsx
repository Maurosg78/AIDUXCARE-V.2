import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Eye,
  FileText,
  Lock,
  Stethoscope,
  BarChart3,
  Clock,
  RefreshCw
} from 'lucide-react';

interface MedicalMetrics {
  systemHealth: number;
  complianceScore: number;
  securityScore: number;
  safetySystemStatus: 'operational' | 'warning' | 'critical';
  hipaaCompliance: boolean;
  gdprCompliance: boolean;
  lastAudit: Date;
  criticalAlerts: number;
  auditTrailIntegrity: number;
}

interface ComplianceDetail {
  name: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  score: number;
  lastCheck: Date;
  issues: string[];
}

export const MedicalCTODashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MedicalMetrics>({
    systemHealth: 95,
    complianceScore: 92,
    securityScore: 88,
    safetySystemStatus: 'operational',
    hipaaCompliance: true,
    gdprCompliance: true,
    lastAudit: new Date(),
    criticalAlerts: 0,
    auditTrailIntegrity: 96
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Simulación de datos en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        systemHealth: Math.max(85, Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 2)),
        securityScore: Math.max(80, Math.min(100, prev.securityScore + (Math.random() - 0.5) * 1.5)),
        auditTrailIntegrity: Math.max(90, Math.min(100, prev.auditTrailIntegrity + (Math.random() - 0.5) * 1))
      }));
    }, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const complianceDetails: ComplianceDetail[] = [
    {
      name: 'HIPAA',
      status: metrics.hipaaCompliance ? 'compliant' : 'non-compliant',
      score: 95,
      lastCheck: new Date(),
      issues: []
    },
    {
      name: 'GDPR',
      status: metrics.gdprCompliance ? 'compliant' : 'warning',
      score: 88,
      lastCheck: new Date(),
      issues: ['Revisar política de retención']
    },
    {
      name: 'FDA 21 CFR Part 11',
      status: 'compliant',
      score: 92,
      lastCheck: new Date(),
      issues: []
    },
    {
      name: 'ISO 27001',
      status: 'warning',
      score: 85,
      lastCheck: new Date(),
      issues: ['Actualizar documentación de seguridad']
    }
  ];

  const handleRefreshMetrics = async () => {
    setIsLoading(true);
    try {
      // Simular llamada a API de métricas
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí se integraría con tu sistema de auditoría
      // const newMetrics = await fetchMedicalMetrics();
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runMedicalAudit = async () => {
    setIsLoading(true);
    try {
      // Integración con tu script de auditoría
      // await execAuditCommand('audit:medical');
      console.log('Ejecutando auditoría médica...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setMetrics(prev => ({ ...prev, lastAudit: new Date() }));
    } catch (error) {
      console.error('Error running audit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 90) return '#A8E6CF';
    if (score >= 75) return '#F39C12';
    return '#E74C3C';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'operational':
        return <CheckCircle className="w-4 h-4" style={{ color: '#A8E6CF' }} />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" style={{ color: '#F39C12' }} />;
      case 'non-compliant':
      case 'critical':
        return <AlertTriangle className="w-4 h-4" style={{ color: '#E74C3C' }} />;
      default:
        return <Activity className="w-4 h-4" style={{ color: '#BDC3C7' }} />;
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F7F7F7' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: '#2C3E50' }}>
              <Stethoscope className="w-8 h-8" style={{ color: '#3498DB' }} />
              Dashboard Ejecutivo - Auditoría Médica
            </h1>
            <p className="text-sm mt-1" style={{ color: '#7F8C8D' }}>
              Monitoreo en tiempo real de compliance y seguridad médica
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              style={{
                backgroundColor: getStatusColor(metrics.systemHealth),
                color: '#2C3E50'
              }}
            >
              Sistema: {metrics.systemHealth}% Saludable
            </Badge>
            <Button
              onClick={handleRefreshMetrics}
              disabled={isLoading}
              className="flex items-center gap-2"
              style={{ backgroundColor: '#3498DB', color: 'white' }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Principal - Métricas Clave */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métricas Principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#7F8C8D' }}>
                      Salud del Sistema
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#2C3E50' }}>
                      {metrics.systemHealth}%
                    </p>
                  </div>
                  <Activity className="w-6 h-6" style={{ color: getStatusColor(metrics.systemHealth) }} />
                </div>
                <Progress value={metrics.systemHealth} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#7F8C8D' }}>
                      Compliance
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#2C3E50' }}>
                      {metrics.complianceScore}%
                    </p>
                  </div>
                  <Shield className="w-6 h-6" style={{ color: getStatusColor(metrics.complianceScore) }} />
                </div>
                <Progress value={metrics.complianceScore} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#7F8C8D' }}>
                      Seguridad
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#2C3E50' }}>
                      {metrics.securityScore}%
                    </p>
                  </div>
                  <Lock className="w-6 h-6" style={{ color: getStatusColor(metrics.securityScore) }} />
                </div>
                <Progress value={metrics.securityScore} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#7F8C8D' }}>
                      Alertas Críticas
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#2C3E50' }}>
                      {metrics.criticalAlerts}
                    </p>
                  </div>
                  <AlertTriangle 
                    className="w-6 h-6" 
                    style={{ color: metrics.criticalAlerts > 0 ? '#E74C3C' : '#A8E6CF' }} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Detallado */}
          <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#2C3E50' }}>
                <FileText className="w-5 h-5" />
                Estado de Compliance Médico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceDetails.map((compliance, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg" 
                       style={{ backgroundColor: '#F8F9FA' }}>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(compliance.status)}
                      <div>
                        <h4 className="font-medium" style={{ color: '#2C3E50' }}>
                          {compliance.name}
                        </h4>
                        <p className="text-xs" style={{ color: '#7F8C8D' }}>
                          Última verificación: {compliance.lastCheck.toLocaleDateString()}
                        </p>
                        {compliance.issues.length > 0 && (
                          <div className="mt-1">
                            {compliance.issues.map((issue, i) => (
                              <p key={i} className="text-xs" style={{ color: '#F39C12' }}>
                                ⚠️ {issue}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        style={{
                          backgroundColor: getStatusColor(compliance.score),
                          color: '#2C3E50'
                        }}
                      >
                        {compliance.score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Seguridad Médica */}
          <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#2C3E50' }}>
                <Shield className="w-5 h-5" />
                Sistema de Seguridad Médica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#2C3E50' }}>
                      SafetyMonitorPanel
                    </span>
                    {getStatusIcon('operational')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#2C3E50' }}>
                      Sistema de Alertas
                    </span>
                    {getStatusIcon('operational')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#2C3E50' }}>
                      Detección de Riesgos
                    </span>
                    {getStatusIcon('operational')}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#2C3E50' }}>
                      Audit Trail
                    </span>
                    <Badge style={{ backgroundColor: getStatusColor(metrics.auditTrailIntegrity), color: '#2C3E50' }}>
                      {metrics.auditTrailIntegrity}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#2C3E50' }}>
                      Encriptación de Datos
                    </span>
                    {getStatusIcon('operational')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#2C3E50' }}>
                      Control de Acceso
                    </span>
                    {getStatusIcon('operational')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral - Acciones y Alertas */}
        <div className="space-y-6">
          {/* Acciones Rápidas */}
          <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#2C3E50' }}>
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={runMedicalAudit}
                disabled={isLoading}
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: '#3498DB', color: '#3498DB' }}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Ejecutar Auditoría Médica
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: '#A8E6CF', color: '#27AE60' }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verificar Compliance
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: '#F39C12', color: '#F39C12' }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Escaneo de Seguridad
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generar Reporte CTO
              </Button>
            </CardContent>
          </Card>

          {/* Información de Última Auditoría */}
          <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#2C3E50' }}>
                Última Auditoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#7F8C8D' }} />
                  <span className="text-sm" style={{ color: '#2C3E50' }}>
                    {metrics.lastAudit.toLocaleDateString()} a las {metrics.lastAudit.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#7F8C8D' }}>
                  Próxima auditoría programada: Mañana 03:00 AM
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tendencias */}
          <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#2C3E50' }}>
                <TrendingUp className="w-4 h-4" />
                Tendencias (7 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#7F8C8D' }}>
                    Salud del sistema
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#27AE60' }}>
                    +2.3%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#7F8C8D' }}>
                    Compliance score
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#27AE60' }}>
                    +1.1%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#7F8C8D' }}>
                    Tiempo de respuesta
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#27AE60' }}>
                    -15ms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado del Sistema */}
          <Card style={{ backgroundColor: 'white', border: '1px solid #BDC3C7' }}>
            <CardHeader>
              <CardTitle className="text-sm" style={{ color: '#2C3E50' }}>
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#7F8C8D' }}>Última actualización:</span>
                  <span style={{ color: '#2C3E50' }}>
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#7F8C8D' }}>Uptime:</span>
                  <span style={{ color: '#27AE60' }}>99.9%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#7F8C8D' }}>Alertas activas:</span>
                  <span style={{ color: metrics.criticalAlerts > 0 ? '#E74C3C' : '#27AE60' }}>
                    {metrics.criticalAlerts}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MedicalCTODashboard; 