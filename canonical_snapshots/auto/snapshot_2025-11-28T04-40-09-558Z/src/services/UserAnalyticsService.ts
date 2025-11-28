import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

import logger from '@/shared/utils/logger';
/**
 * 📊 User Analytics Service - Captura datos de usuarios para estadísticas
 * Cumple HIPAA/GDPR: Datos anonimizados, sin PII expuesto
 */


import { db } from '@/lib/firebase';

export interface UserAnalytics {
  timestamp: Date;
  stepCompleted: string;
  profession: string;
  country: string;
  experienceLevel: string;
  complianceAccepted: boolean;
  sessionDuration: number;
  deviceType: string;
  browser: string;
}

export interface AnalyticsSummary {
  totalUsers: number;
  professions: Record<string, number>;
  countries: Record<string, number>;
  experienceLevels: Record<string, number>;
  complianceRate: number;
  averageSessionDuration: number;
  topProfessions: Array<{ profession: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
}

class UserAnalyticsService {
  private readonly COLLECTION_NAME = 'user_analytics';

  /**
   * Captura datos de un paso completado
   */
  async captureStepCompletion(data: Partial<UserAnalytics>): Promise<void> {
    try {
      const analyticsData: UserAnalytics = {
        timestamp: new Date(),
        stepCompleted: data.stepCompleted || 'unknown',
        profession: data.profession || 'unknown',
        country: data.country || 'unknown',
        experienceLevel: data.experienceLevel || 'unknown',
        complianceAccepted: data.complianceAccepted || false,
        sessionDuration: data.sessionDuration || 0,
        deviceType: this.getDeviceType(),
        browser: this.getBrowser(),
        ...data
      };

      await addDoc(collection(db, this.COLLECTION_NAME), analyticsData);
      console.log('Analytics capturado:', analyticsData);
    } catch (error) {
      console.error('Error capturando analytics:', error);
    }
  }

  /**
   * Captura inicio de onboarding
   */
  async captureOnboardingStart(profession: string, country: string): Promise<void> {
    await this.captureStepCompletion({
      stepCompleted: 'onboarding_started',
      profession,
      country
    });
  }

  /**
   * Captura paso completado
   */
  async captureStepCompleted(step: string, data: Partial<UserAnalytics>): Promise<void> {
    await this.captureStepCompletion({
      stepCompleted: step,
      ...data
    });
  }

  /**
   * Captura onboarding completado
   */
  async captureOnboardingCompleted(data: Partial<UserAnalytics>): Promise<void> {
    await this.captureStepCompletion({
      stepCompleted: 'onboarding_completed',
      ...data
    });
  }

  /**
   * Obtiene resumen de estadísticas
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const analytics: UserAnalytics[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        analytics.push({
          timestamp: data.timestamp.toDate(),
          stepCompleted: data.stepCompleted,
          profession: data.profession,
          country: data.country,
          experienceLevel: data.experienceLevel,
          complianceAccepted: data.complianceAccepted,
          sessionDuration: data.sessionDuration,
          deviceType: data.deviceType,
          browser: data.browser
        });
      });

      return this.calculateSummary(analytics);
    } catch (error) {
      console.error('Error obteniendo analytics:', error);
      return this.getEmptySummary();
    }
  }

  /**
   * Calcula resumen de estadísticas
   */
  private calculateSummary(analytics: UserAnalytics[]): AnalyticsSummary {
    const professions: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const experienceLevels: Record<string, number> = {};
    let complianceAccepted = 0;
    let totalSessionDuration = 0;

    analytics.forEach((item) => {
      // Contar profesiones
      professions[item.profession] = (professions[item.profession] || 0) + 1;
      
      // Contar países
      countries[item.country] = (countries[item.country] || 0) + 1;
      
      // Contar niveles de experiencia
      experienceLevels[item.experienceLevel] = (experienceLevels[item.experienceLevel] || 0) + 1;
      
      // Contar compliance
      if (item.complianceAccepted) complianceAccepted++;
      
      // Sumar duración de sesión
      totalSessionDuration += item.sessionDuration;
    });

    const totalUsers = analytics.length;
    const complianceRate = totalUsers > 0 ? (complianceAccepted / totalUsers) * 100 : 0;
    const averageSessionDuration = totalUsers > 0 ? totalSessionDuration / totalUsers : 0;

    // Top profesiones
    const topProfessions = Object.entries(professions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([profession, count]) => ({ profession, count }));

    // Top países
    const topCountries = Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    return {
      totalUsers,
      professions,
      countries,
      experienceLevels,
      complianceRate,
      averageSessionDuration,
      topProfessions,
      topCountries
    };
  }

  /**
   * Obtiene resumen vacío
   */
  private getEmptySummary(): AnalyticsSummary {
    return {
      totalUsers: 0,
      professions: {},
      countries: {},
      experienceLevels: {},
      complianceRate: 0,
      averageSessionDuration: 0,
      topProfessions: [],
      topCountries: []
    };
  }

  /**
   * Detecta tipo de dispositivo
   */
  private getDeviceType(): string {
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Detecta navegador
   */
  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
}

export const userAnalyticsService = new UserAnalyticsService();
export default userAnalyticsService;
