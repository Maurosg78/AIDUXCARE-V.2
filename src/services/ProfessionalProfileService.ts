import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../core/firebase/firebaseClient';

export interface ProfessionalProfile {
  userId: string;
  personalInfo: {
    firstName: string;
    secondName?: string;
    lastName: string;
    secondLastName?: string;
    email: string;
    phone?: string;
    licenseNumber: string;
    country: string;
    licenseRenewalType: 'annual' | 'biennial' | 'other';
    licenseExpiryNotification: boolean;
  };
  professionalInfo: {
    profession: string;
    specialty?: string;
    certifications?: string;
    yearsOfExperience: number;
  };
  complianceInfo: {
    hipaaConsent: boolean;
    gdprConsent: boolean;
    dataProcessingConsent: boolean;
    auditTrailEnabled: boolean;
    mfaEnabled: boolean;
    licenseNotifications: boolean;
    latamConsent: boolean;
    canadaConsent: boolean;
    pipedaConsent: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

class ProfessionalProfileService {
  private readonly collectionName = 'professionalProfiles';

  /**
   * Crear o actualizar un perfil profesional
   */
  async createOrUpdateProfile(userId: string, profileData: Omit<ProfessionalProfile, 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<void> {
    try {
      const profileRef = doc(db, this.collectionName, userId);
      
      const profile: ProfessionalProfile = {
        userId,
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      await setDoc(profileRef, profile, { merge: true });
      console.log('Perfil profesional guardado exitosamente:', userId);
    } catch (error) {
      console.error('Error guardando perfil profesional:', error);
      throw new Error('No se pudo guardar el perfil profesional');
    }
  }

  /**
   * Obtener un perfil profesional por userId
   */
  async getProfile(userId: string): Promise<ProfessionalProfile | null> {
    try {
      const profileRef = doc(db, this.collectionName, userId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        return profileSnap.data() as ProfessionalProfile;
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo perfil profesional:', error);
      throw new Error('No se pudo obtener el perfil profesional');
    }
  }

  /**
   * Actualizar un perfil profesional existente
   */
  async updateProfile(userId: string, updates: Partial<ProfessionalProfile>): Promise<void> {
    try {
      const profileRef = doc(db, this.collectionName, userId);
      
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: new Date()
      });

      console.log('Perfil profesional actualizado exitosamente:', userId);
    } catch (error) {
      console.error('Error actualizando perfil profesional:', error);
      throw new Error('No se pudo actualizar el perfil profesional');
    }
  }

  /**
   * Verificar si un usuario ya tiene un perfil
   */
  async hasProfile(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      return profile !== null && profile.isActive;
    } catch (error) {
      console.error('Error verificando existencia de perfil:', error);
      return false;
    }
  }

  /**
   * Buscar perfiles por profesión
   */
  async getProfilesByProfession(profession: string): Promise<ProfessionalProfile[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('professionalInfo.profession', '==', profession),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const profiles: ProfessionalProfile[] = [];

      querySnapshot.forEach((doc) => {
        profiles.push(doc.data() as ProfessionalProfile);
      });

      return profiles;
    } catch (error) {
      console.error('Error buscando perfiles por profesión:', error);
      throw new Error('No se pudieron obtener los perfiles');
    }
  }

  /**
   * Desactivar un perfil profesional
   */
  async deactivateProfile(userId: string): Promise<void> {
    try {
      const profileRef = doc(db, this.collectionName, userId);
      
      await updateDoc(profileRef, {
        isActive: false,
        updatedAt: new Date()
      });

      console.log('Perfil profesional desactivado:', userId);
    } catch (error) {
      console.error('Error desactivando perfil profesional:', error);
      throw new Error('No se pudo desactivar el perfil profesional');
    }
  }
}

export const professionalProfileService = new ProfessionalProfileService(); 