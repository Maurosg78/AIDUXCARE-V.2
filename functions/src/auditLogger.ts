import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Inicializar Firebase Admin si no está inicializado
if (getApps().length === 0) {
  initializeApp();
}

export interface AuditLogEntry {
  action: string;
  userId: string;
  timestamp: Date;
  status: 'success' | 'error';
  details?: Record<string, any>;
  error?: string;
}

export const writeAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const db = getFirestore();
    
    await db.collection('audit_logs').add({
      ...entry,
      timestamp: entry.timestamp,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error al escribir log de auditoría:', error);
    // No lanzamos el error para no interrumpir el flujo principal
  }
};

export const getAuditLogs = async (
  userId?: string,
  action?: string,
  limit: number = 100
): Promise<AuditLogEntry[]> => {
  try {
    const db = getFirestore();
    let query = db.collection('audit_logs').orderBy('timestamp', 'desc').limit(limit);
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (action) {
      query = query.where('action', '==', action);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        action: data.action || 'unknown',
        userId: data.userId || 'unknown',
        timestamp: data.timestamp || new Date(),
        status: data.status || 'success',
        details: data.details,
        error: data.error
      } as AuditLogEntry;
    });
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    return [];
  }
};


