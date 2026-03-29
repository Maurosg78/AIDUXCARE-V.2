import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

import PatientService from './patientService';

import logger from '@/shared/utils/logger';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  dateTime: string;
  duration: number; // en minutos
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentData {
  patientId: string;
  dateTime: string;
  duration: number;
  notes?: string;
}

export interface AppointmentDateRange {
  start: Date;
  end: Date;
}

export class AppointmentService {
  private static readonly COLLECTION_NAME = 'appointments';

  /** ISO string from legacy `date` (Timestamp) or modern `dateTime` (string). */
  private static appointmentDateTimeISO(data: DocumentData): string {
    if (typeof data.dateTime === 'string' && data.dateTime.length > 0) {
      return data.dateTime;
    }
    const d = data.date;
    if (d && typeof (d as { toDate?: () => Date }).toDate === 'function') {
      return (d as { toDate: () => Date }).toDate().toISOString();
    }
    return new Date().toISOString();
  }

  private static async snapshotToAppointments(
    snapshotDocs: QueryDocumentSnapshot[],
  ): Promise<Appointment[]> {
    const appointments: Appointment[] = [];
    for (const docSnap of snapshotDocs) {
      const data = docSnap.data();
      const patient = await PatientService.getPatientById(data.patientId);
      const dateTime = this.appointmentDateTimeISO(data);
      appointments.push({
        id: docSnap.id,
        patientId: data.patientId,
        patientName: patient?.fullName || 'Paciente desconocido',
        dateTime,
        duration: data.duration || 30,
        status: data.status || 'scheduled',
        notes: data.notes,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    }
    return appointments;
  }

  /**
   * Obtener citas en un rango de fechas
   * Incluye documentos modernos (`userId` + `dateTime`) y legacy (`clinicianUid` email + `date` Timestamp).
   */
  public static async getAppointments(dateRange: AppointmentDateRange): Promise<Appointment[]> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error('Usuario no autenticado');
      }

      const email = auth.currentUser?.email?.trim();
      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      const startIso = dateRange.start.toISOString();
      const endIso = dateRange.end.toISOString();
      const startTs = Timestamp.fromDate(dateRange.start);
      const endTs = Timestamp.fromDate(dateRange.end);

      const byId = new Map<string, QueryDocumentSnapshot>();

      const qModern = query(
        appointmentsRef,
        where('userId', '==', uid),
        where('dateTime', '>=', startIso),
        where('dateTime', '<=', endIso),
        orderBy('dateTime'),
      );

      try {
        const snap = await getDocs(qModern);
        snap.docs.forEach((d) => byId.set(d.id, d));
      } catch (e) {
        logger.warn('[AppointmentService] getAppointments modern query failed', e);
      }

      if (email) {
        const qLegacy = query(
          appointmentsRef,
          where('clinicianUid', '==', email),
          where('date', '>=', startTs),
          where('date', '<=', endTs),
          orderBy('date'),
        );
        try {
          const snapL = await getDocs(qLegacy);
          snapL.docs.forEach((d) => byId.set(d.id, d));
        } catch (e) {
          logger.warn('[AppointmentService] getAppointments legacy query failed (index may be building)', e);
        }
      }

      const merged = Array.from(byId.values());
      merged.sort(
        (a, b) =>
          this.appointmentDateTimeISO(a.data()).localeCompare(this.appointmentDateTimeISO(b.data())),
      );

      return await this.snapshotToAppointments(merged);
    } catch (error) {
      console.error('Error obteniendo citas:', error);
      throw new Error('Error al obtener citas');
    }
  }

  /**
   * Crear nueva cita
   */
  public static async createAppointment(data: CreateAppointmentData): Promise<string> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error('Usuario no autenticado');
      }

      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      const newAppointmentRef = doc(appointmentsRef);

      const appointmentData = {
        ...data,
        userId: uid,
        status: 'scheduled',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(newAppointmentRef, appointmentData);
      return newAppointmentRef.id;
    } catch (error) {
      console.error('Error creando cita:', error);
      throw new Error('Error al crear cita');
    }
  }

  /**
   * Obtener cita por ID
   */
  public static async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      const q = query(appointmentsRef, where('__name__', '==', id));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const docSnapshot = snapshot.docs[0];
      const data = docSnapshot.data() as DocumentData;
      
      return {
        id: docSnapshot.id,
        patientId: data.patientId as string,
        patientName: data.patientName as string,
        dateTime: data.dateTime as string,
        duration: data.duration as number,
        status: (data.status as AppointmentStatus) || 'scheduled',
        notes: data.notes as string,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error obteniendo cita:', error);
      throw new Error('Error al obtener cita');
    }
  }

  /**
   * Actualizar cita
   */
  public static async updateAppointment(id: string, data: Partial<CreateAppointmentData>): Promise<void> {
    try {
      const uid = auth.currentUser?.uid;
      const appointmentRef = doc(db, this.COLLECTION_NAME, id);
      await setDoc(appointmentRef, {
        ...data,
        ...(uid ? { userId: uid } : {}),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error actualizando cita:', error);
      throw new Error('Error al actualizar cita');
    }
  }

  /**
   * Cambiar estado de cita
   */
  public static async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    try {
      const uid = auth.currentUser?.uid;
      const appointmentRef = doc(db, this.COLLECTION_NAME, id);
      await setDoc(appointmentRef, {
        status,
        ...(uid ? { userId: uid } : {}),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error actualizando estado de cita:', error);
      throw new Error('Error al actualizar estado de cita');
    }
  }

  /**
   * Obtener citas de un paciente
   */
  public static async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error('Usuario no autenticado');
      }

      const email = auth.currentUser?.email?.trim();
      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      const byId = new Map<string, QueryDocumentSnapshot>();

      const qModern = query(
        appointmentsRef,
        where('patientId', '==', patientId),
        where('userId', '==', uid),
        orderBy('dateTime', 'desc'),
      );
      try {
        const snap = await getDocs(qModern);
        snap.docs.forEach((d) => byId.set(d.id, d));
      } catch (e) {
        logger.warn('[AppointmentService] getAppointmentsByPatient modern query failed', e);
      }

      if (email) {
        const qLegacy = query(
          appointmentsRef,
          where('patientId', '==', patientId),
          where('clinicianUid', '==', email),
          orderBy('date', 'desc'),
        );
        try {
          const snapL = await getDocs(qLegacy);
          snapL.docs.forEach((d) => byId.set(d.id, d));
        } catch (e) {
          logger.warn(
            '[AppointmentService] getAppointmentsByPatient legacy query failed (index may be building)',
            e,
          );
        }
      }

      const merged = Array.from(byId.values());
      merged.sort(
        (a, b) =>
          this.appointmentDateTimeISO(b.data()).localeCompare(this.appointmentDateTimeISO(a.data())),
      );

      return await this.snapshotToAppointments(merged);
    } catch (error) {
      console.error('Error obteniendo citas del paciente:', error);
      throw new Error('Error al obtener citas del paciente');
    }
  }
}

export const appointmentService = AppointmentService;
