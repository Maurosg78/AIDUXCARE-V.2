/**
 * 🏥 Professional Profile Service - Gestión de Perfiles Profesionales
 * Cumple HIPAA/GDPR: Cifrado, auditoría, consentimiento explícito, trazabilidad completa
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/firebaseClient';
import { FirestoreAuditLogger } from '../audit/FirestoreAuditLogger';
import { 
  ProfessionalProfile, 
  ProfessionalSpecialization, 
  SPECIALIZATIONS,
  validateProfessionalProfile 
} from '../domain/professionalType';
import { encryptMetadata, decryptMetadata } from '../security/encryption';

export class ProfessionalProfileService {
  private static collectionName = 'professional_profiles';

  /**
   * Crear perfil profesional con auditoría completa
   */
  static async createProfile(
    profile: Omit<ProfessionalProfile, 'id' | 'metadata'>,
    createdBy: string
  ): Promise<string> {
    try {
      // Validar perfil antes de crear
      const validation = validateProfessionalProfile(profile as ProfessionalProfile);
      if (!validation.isValid) {
        throw new Error(`Perfil inválido: ${validation.errors.join(', ')}`);
      }

      // Cifrar datos sensibles
      const encryptedProfile = await this.encryptSensitiveData(profile);

      // Crear metadata
      const metadata = {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        version: 1,
        isActive: true
      };

      // Generar ID único
      const profileId = `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Guardar en Firestore
      const docRef = doc(db, this.collectionName, profileId);
      await setDoc(docRef, {
        ...encryptedProfile,
        id: profileId,
        metadata
      });

      // Registrar evento de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'professional_profile_created',
        userId: createdBy,
        userRole: profile.systemAccess.role,
        metadata: {
          profileId,
          specialization: profile.professionalInfo.specialization.name,
          country: profile.personalInfo.country,
          licenseNumber: profile.personalInfo.licenseNumber.substring(0, 4) + '***' // Parcial para auditoría
        }
      });

      console.log('✅ Perfil profesional creado exitosamente:', profileId);
      return profileId;

    } catch (error) {
      console.error('❌ Error al crear perfil profesional:', error);
      throw new Error(`Failed to create professional profile: ${error}`);
    }
  }

  /**
   * Obtener perfil profesional por ID
   */
  static async getProfileById(profileId: string, requestingUserId: string): Promise<ProfessionalProfile | null> {
    try {
      const docRef = doc(db, this.collectionName, profileId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Descifrar datos sensibles
      const decryptedProfile = await this.decryptSensitiveData(data);

      // Registrar acceso para auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'professional_profile_accessed',
        userId: requestingUserId,
        userRole: decryptedProfile.systemAccess.role,
        metadata: {
          profileId,
          accessedBy: requestingUserId,
          accessType: 'read'
        }
      });

      return decryptedProfile as ProfessionalProfile;

    } catch (error) {
      console.error('❌ Error al obtener perfil profesional:', error);
      throw new Error(`Failed to get professional profile: ${error}`);
    }
  }

  /**
   * Obtener perfil por userId (Firebase Auth)
   */
  static async getProfileByUserId(userId: string): Promise<ProfessionalProfile | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('metadata.isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      // Descifrar datos sensibles
      const decryptedProfile = await this.decryptSensitiveData(data);

      return decryptedProfile as ProfessionalProfile;

    } catch (error) {
      console.error('❌ Error al obtener perfil por userId:', error);
      throw new Error(`Failed to get profile by userId: ${error}`);
    }
  }

  /**
   * Actualizar perfil profesional
   */
  static async updateProfile(
    profileId: string,
    updates: Partial<ProfessionalProfile>,
    updatedBy: string
  ): Promise<void> {
    try {
      // Obtener perfil actual
      const currentProfile = await this.getProfileById(profileId, updatedBy);
      if (!currentProfile) {
        throw new Error('Perfil no encontrado');
      }

      // Validar actualizaciones
      const updatedProfile = { ...currentProfile, ...updates };
      const validation = validateProfessionalProfile(updatedProfile);
      if (!validation.isValid) {
        throw new Error(`Perfil inválido después de actualización: ${validation.errors.join(', ')}`);
      }

      // Cifrar datos sensibles actualizados
      const encryptedUpdates = await this.encryptSensitiveData(updates);

      // Actualizar metadata
      const metadata = {
        ...currentProfile.metadata,
        updatedAt: new Date(),
        updatedBy,
        version: currentProfile.metadata.version + 1
      };

      // Actualizar en Firestore
      const docRef = doc(db, this.collectionName, profileId);
      await updateDoc(docRef, {
        ...encryptedUpdates,
        metadata
      });

      // Registrar evento de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'professional_profile_updated',
        userId: updatedBy,
        userRole: currentProfile.systemAccess.role,
        metadata: {
          profileId,
          updatedBy,
          updatedFields: Object.keys(updates),
          version: metadata.version
        }
      });

      console.log('✅ Perfil profesional actualizado exitosamente:', profileId);

    } catch (error) {
      console.error('❌ Error al actualizar perfil profesional:', error);
      throw new Error(`Failed to update professional profile: ${error}`);
    }
  }

  /**
   * Obtener especializaciones disponibles
   */
  static async getAvailableSpecializations(): Promise<ProfessionalSpecialization[]> {
    try {
      // Por ahora retornamos las especializaciones predefinidas
      // En el futuro esto podría venir de Firestore con configuración dinámica
      return SPECIALIZATIONS;
    } catch (error) {
      console.error('❌ Error al obtener especializaciones:', error);
      throw new Error(`Failed to get specializations: ${error}`);
    }
  }

  /**
   * Verificar si un profesional tiene permisos específicos
   */
  static async hasPermission(
    profileId: string,
    permission: string,
    requestingUserId: string
  ): Promise<boolean> {
    try {
      const profile = await this.getProfileById(profileId, requestingUserId);
      if (!profile) {
        return false;
      }

      return profile.systemAccess.permissions.includes(permission) || 
             profile.systemAccess.role === 'OWNER';

    } catch (error) {
      console.error('❌ Error al verificar permisos:', error);
      return false;
    }
  }

  /**
   * Cifrar datos sensibles del perfil
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static async encryptSensitiveData(profile: Partial<ProfessionalProfile>): Promise<any> {
    const encryptedProfile = { ...profile };

    // Cifrar información personal sensible
    if (profile.personalInfo) {
      encryptedProfile.personalInfo = {
        ...profile.personalInfo,
        licenseNumber: await encryptMetadata(profile.personalInfo.licenseNumber),
        phone: profile.personalInfo.phone ? await encryptMetadata(profile.personalInfo.phone) : undefined
      };
    }

    // Cifrar certificaciones
    if (profile.professionalInfo?.certifications) {
      encryptedProfile.professionalInfo = {
        ...profile.professionalInfo,
        certifications: await Promise.all(
          profile.professionalInfo.certifications.map(async (cert) => ({
            ...cert,
            credentialId: await encryptMetadata(cert.credentialId)
          }))
        )
      };
    }

    return encryptedProfile;
  }

  /**
   * Descifrar datos sensibles del perfil
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static async decryptSensitiveData(data: any): Promise<any> {
    const decryptedData = { ...data };

    // Descifrar información personal sensible
    if (data.personalInfo) {
      decryptedData.personalInfo = {
        ...data.personalInfo,
        licenseNumber: await decryptMetadata(data.personalInfo.licenseNumber),
        phone: data.personalInfo.phone ? await decryptMetadata(data.personalInfo.phone) : undefined
      };
    }

    // Descifrar certificaciones
    if (data.professionalInfo?.certifications) {
      decryptedData.professionalInfo = {
        ...data.professionalInfo,
        certifications: await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.professionalInfo.certifications.map(async (cert: any) => ({
            ...cert,
            credentialId: await decryptMetadata(cert.credentialId)
          }))
        )
      };
    }

    return decryptedData;
  }

  /**
   * Exportar perfil para auditoría (sin datos sensibles)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async exportProfileForAudit(profileId: string): Promise<any> {
    try {
      const profile = await this.getProfileById(profileId, 'AUDIT_SYSTEM');
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }

      // Crear versión para auditoría sin datos sensibles
      const auditProfile = {
        id: profile.id,
        personalInfo: {
          firstName: profile.personalInfo.firstName,
          lastName: profile.personalInfo.lastName,
          email: profile.personalInfo.email,
          country: profile.personalInfo.country,
          state: profile.personalInfo.state,
          city: profile.personalInfo.city,
          licenseNumber: '***' + profile.personalInfo.licenseNumber.slice(-4), // Solo últimos 4 dígitos
          licenseExpiry: profile.personalInfo.licenseExpiry
        },
        professionalInfo: {
          specialization: profile.professionalInfo.specialization.name,
          yearsOfExperience: profile.professionalInfo.yearsOfExperience,
          practiceType: profile.professionalInfo.practiceType,
          languages: profile.professionalInfo.languages
        },
        compliance: profile.compliance,
        systemAccess: {
          role: profile.systemAccess.role,
          lastLoginAt: profile.systemAccess.lastLoginAt
        },
        metadata: profile.metadata
      };

      return auditProfile;

    } catch (error) {
      console.error('❌ Error al exportar perfil para auditoría:', error);
      throw new Error(`Failed to export profile for audit: ${error}`);
    }
  }
} 