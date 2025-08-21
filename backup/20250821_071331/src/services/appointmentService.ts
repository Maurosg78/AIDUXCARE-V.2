import { collection, doc, setDoc, getDocs, query, where, orderBy, serverTimestamp, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PatientService from './patientService';

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

  /**
   * Obtener citas en un rango de fechas
   */
  public static async getAppointments(dateRange: AppointmentDateRange): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        appointmentsRef,
        where('dateTime', '>=', dateRange.start.toISOString()),
        where('dateTime', '<=', dateRange.end.toISOString()),
        orderBy('dateTime')
      );

      const snapshot = await getDocs(q);
      const appointments: Appointment[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const patient = await PatientService.getPatientById(data.patientId);
        
        appointments.push({
          id: doc.id,
          patientId: data.patientId,
          patientName: patient?.fullName || 'Paciente desconocido',
          dateTime: data.dateTime,
          duration: data.duration || 30,
          status: data.status || 'scheduled',
          notes: data.notes,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      }

      return appointments;
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
      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      const newAppointmentRef = doc(appointmentsRef);

      const appointmentData = {
        ...data,
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
      const appointmentRef = doc(db, this.COLLECTION_NAME, id);
      await setDoc(appointmentRef, {
        ...data,
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
      const appointmentRef = doc(db, this.COLLECTION_NAME, id);
      await setDoc(appointmentRef, {
        status,
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
      const appointmentsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        appointmentsRef,
        where('patientId', '==', patientId),
        orderBy('dateTime', 'desc')
      );

      const snapshot = await getDocs(q);
      const appointments: Appointment[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const patient = await PatientService.getPatientById(data.patientId);
        
        appointments.push({
          id: doc.id,
          patientId: data.patientId,
          patientName: patient?.fullName || 'Paciente desconocido',
          dateTime: data.dateTime,
          duration: data.duration || 30,
          status: data.status || 'scheduled',
          notes: data.notes,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      }

      return appointments;
    } catch (error) {
      console.error('Error obteniendo citas del paciente:', error);
      throw new Error('Error al obtener citas del paciente');
    }
  }
}

export const appointmentService = AppointmentService;
