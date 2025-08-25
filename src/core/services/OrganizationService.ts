/**
 * 🏢 Organization Service
 * Servicio para gestionar organizaciones, miembros y permisos
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy
} from 'firebase/firestore';

import { db } from '../firebase/firebaseClient';
import { 
  Organization, 
  OrganizationMember, 
  OrganizationInvitation,
  ORGANIZATION_ROLES 
} from '../domain/organizationType';
import { FirestoreAuditLogger } from '../audit/FirestoreAuditLogger';

import logger from '@/shared/utils/logger';

export class OrganizationService {
  constructor() {}

  // ===== ORGANIZACIONES =====

  /**
   * Crear una nueva organización
   */
  async createOrganization(organizationData: Omit<Organization, 'id' | 'metadata'>, ownerId: string): Promise<Organization> {
    try {
      const organization: Omit<Organization, 'id'> = {
        ...organizationData,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: ownerId,
          version: '1.0'
        }
      };

      const docRef = await addDoc(collection(db, 'organizations'), organization);
      
      // Crear el miembro dueño
      const ownerMember: Omit<OrganizationMember, 'id'> = {
        organizationId: docRef.id,
        role: 'OWNER',
        status: 'ACTIVE',
        professionalInfo: {
          firstName: organizationData.name.split(' ')[0], // Placeholder
          lastName: organizationData.name.split(' ').slice(1).join(' ') || '',
          email: organizationData.contactInfo.email,
          specialization: '',
          licenseNumber: '',
          yearsOfExperience: 0
        },
        permissions: {
          canManagePatients: true,
          canManageTeam: true,
          canViewAuditLogs: true,
          canExportData: true,
          canManageBilling: true,
          canAccessAnalytics: true
        },
        preferences: {
          notificationSettings: {
            email: true,
            push: true,
            sms: false
          },
          language: 'es',
          timezone: 'Europe/Madrid'
        },
        metadata: {
          joinedAt: new Date(),
          invitedBy: ownerId,
          invitedAt: new Date(),
          lastActiveAt: new Date(),
          updatedAt: new Date()
        }
      };

      await this.addMember(docRef.id, ownerId, ownerMember);

      // Log de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'ORGANIZATION_CREATED',
        userId: ownerId,
        userRole: 'OWNER',
        metadata: {
          organizationId: docRef.id,
          organizationName: organizationData.name,
          organizationType: organizationData.type
        }
      });

      return { ...organization, id: docRef.id };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw new Error('No se pudo crear la organización');
    }
  }

  /**
   * Obtener organización por ID
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const docRef = doc(db, 'organizations', organizationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Organization;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting organization:', error);
      throw new Error('No se pudo obtener la organización');
    }
  }

  /**
   * Obtener organizaciones del usuario
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const q = query(
        collection(db, 'organizations'),
        where('ownerId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const organizations: Organization[] = [];
      
      querySnapshot.forEach((doc) => {
        organizations.push({ id: doc.id, ...doc.data() } as Organization);
      });
      
      return organizations;
    } catch (error) {
      console.error('Error getting user organizations:', error);
      throw new Error('No se pudieron obtener las organizaciones');
    }
  }

  /**
   * Actualizar organización
   */
  async updateOrganization(organizationId: string, updates: Partial<Organization>, userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'organizations', organizationId);
      await updateDoc(docRef, {
        ...updates,
        'metadata.updatedAt': new Date()
      });

      // Log de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'ORGANIZATION_UPDATED',
        userId,
        userRole: 'ADMIN',
        metadata: {
          organizationId,
          updatedFields: Object.keys(updates)
        }
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      throw new Error('No se pudo actualizar la organización');
    }
  }

  // ===== MIEMBROS =====

  /**
   * Agregar miembro a la organización
   */
  async addMember(organizationId: string, memberId: string, memberData: Omit<OrganizationMember, 'id'>): Promise<void> {
    try {
      const memberRef = doc(db, 'organizations', organizationId, 'members', memberId);
      await updateDoc(memberRef, {
        ...memberData,
        'metadata.updatedAt': new Date()
      });

      // Log de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'MEMBER_ADDED',
        userId: memberData.metadata.invitedBy,
        userRole: 'ADMIN',
        metadata: {
          organizationId,
          memberId,
          memberRole: memberData.role
        }
      });
    } catch (error) {
      console.error('Error adding member:', error);
      throw new Error('No se pudo agregar el miembro');
    }
  }

  /**
   * Obtener miembros de la organización
   */
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const q = query(
        collection(db, 'organizations', organizationId, 'members'),
        orderBy('metadata.joinedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const members: OrganizationMember[] = [];
      
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() } as OrganizationMember);
      });
      
      return members;
    } catch (error) {
      console.error('Error getting organization members:', error);
      throw new Error('No se pudieron obtener los miembros');
    }
  }

  /**
   * Obtener miembro específico
   */
  async getMember(organizationId: string, memberId: string): Promise<OrganizationMember | null> {
    try {
      const docRef = doc(db, 'organizations', organizationId, 'members', memberId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as OrganizationMember;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting member:', error);
      throw new Error('No se pudo obtener el miembro');
    }
  }

  /**
   * Actualizar miembro
   */
  async updateMember(organizationId: string, memberId: string, updates: Partial<OrganizationMember>, userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'organizations', organizationId, 'members', memberId);
      await updateDoc(docRef, {
        ...updates,
        'metadata.updatedAt': new Date()
      });

      // Log de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'MEMBER_UPDATED',
        userId,
        userRole: 'ADMIN',
        metadata: {
          organizationId,
          memberId,
          updatedFields: Object.keys(updates)
        }
      });
    } catch (error) {
      console.error('Error updating member:', error);
      throw new Error('No se pudo actualizar el miembro');
    }
  }

  /**
   * Remover miembro de la organización
   */
  async removeMember(organizationId: string, memberId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'organizations', organizationId, 'members', memberId);
      await deleteDoc(docRef);

      // Log de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'MEMBER_REMOVED',
        userId,
        userRole: 'ADMIN',
        metadata: {
          organizationId,
          memberId
        }
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('No se pudo remover el miembro');
    }
  }

  // ===== INVITACIONES =====

  /**
   * Crear invitación para nuevo miembro
   */
  async createInvitation(invitationData: Omit<OrganizationInvitation, 'id' | 'metadata'>, userId: string): Promise<OrganizationInvitation> {
    try {
      const invitation: Omit<OrganizationInvitation, 'id'> = {
        ...invitationData,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const docRef = await addDoc(collection(db, 'organizations', invitationData.organizationId, 'invitations'), invitation);

      // Log de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'INVITATION_CREATED',
        userId,
        userRole: 'ADMIN',
        metadata: {
          organizationId: invitationData.organizationId,
          invitationId: docRef.id,
          invitedEmail: invitationData.email,
          role: invitationData.role
        }
      });

      return { ...invitation, id: docRef.id };
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new Error('No se pudo crear la invitación');
    }
  }

  /**
   * Obtener invitaciones pendientes
   */
  async getPendingInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    try {
      const q = query(
        collection(db, 'organizations', organizationId, 'invitations'),
        where('status', '==', 'PENDING')
      );
      
      const querySnapshot = await getDocs(q);
      const invitations: OrganizationInvitation[] = [];
      
      querySnapshot.forEach((doc) => {
        invitations.push({ id: doc.id, ...doc.data() } as OrganizationInvitation);
      });
      
      return invitations;
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      throw new Error('No se pudieron obtener las invitaciones');
    }
  }

  // ===== PERMISOS Y ROLES =====

  /**
   * Verificar si el usuario tiene permiso
   */
  async hasPermission(userId: string, organizationId: string, requiredPermission: string): Promise<boolean> {
    try {
      const member = await this.getMember(organizationId, userId);
      if (!member) return false;

      const rolePermissions = ORGANIZATION_ROLES[member.role]?.permissions || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rolePermissions.includes(requiredPermission as any);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Verificar si el usuario es dueño o admin
   */
  async isOwnerOrAdmin(userId: string, organizationId: string): Promise<boolean> {
    try {
      const member = await this.getMember(organizationId, userId);
      if (!member) return false;

      return member.role === 'OWNER' || member.role === 'ADMIN';
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  /**
   * Obtener permisos del usuario
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    try {
      const member = await this.getMember(organizationId, userId);
      if (!member) return [];

      const permissions = ORGANIZATION_ROLES[member.role]?.permissions || [];
      return [...permissions]; // Convertir readonly array a mutable
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // ===== UTILIDADES =====

  /**
   * Obtener organizaciones donde el usuario es miembro
   */
  async getUserMemberships(userId: string): Promise<{ organization: Organization; member: OrganizationMember }[]> {
    try {
      // Buscar en todas las organizaciones donde el usuario es miembro
      const organizations = await getDocs(collection(db, 'organizations'));
      const memberships: { organization: Organization; member: OrganizationMember }[] = [];

      for (const orgDoc of organizations.docs) {
        const member = await this.getMember(orgDoc.id, userId);
        if (member) {
          const organization = { id: orgDoc.id, ...orgDoc.data() } as Organization;
          memberships.push({ organization, member });
        }
      }

      return memberships;
    } catch (error) {
      console.error('Error getting user memberships:', error);
      throw new Error('No se pudieron obtener las membresías');
    }
  }

  /**
   * Exportar datos de la organización (solo para admins)
   */
  async exportOrganizationData(organizationId: string, userId: string): Promise<{
    organization: Organization | null;
    members: Array<{
      professionalInfo: {
        firstName: string;
        lastName: string;
        specialization: string;
        yearsOfExperience: number;
      };
    }>;
    invitations: Array<{
      email: string;
      role: string;
      status: string;
      invitedAt: Date;
    }>;
    exportedAt: Date;
    exportedBy: string;
  }> {
    try {
      // Verificar permisos
      const canExport = await this.hasPermission(userId, organizationId, 'data:export');
      if (!canExport) {
        throw new Error('No tienes permisos para exportar datos');
      }

      const [organization, members, invitations] = await Promise.all([
        this.getOrganization(organizationId),
        this.getOrganizationMembers(organizationId),
        this.getPendingInvitations(organizationId)
      ]);

      const exportData = {
        organization,
        members: members.map(member => ({
          ...member,
          // Remover datos sensibles
          professionalInfo: {
            firstName: member.professionalInfo.firstName,
            lastName: member.professionalInfo.lastName,
            specialization: member.professionalInfo.specialization,
            yearsOfExperience: member.professionalInfo.yearsOfExperience
          }
        })),
        invitations: invitations.map(inv => ({
          email: inv.email,
          role: inv.role,
          status: inv.status,
          invitedAt: inv.invitedAt
        })),
        exportedAt: new Date(),
        exportedBy: userId
      };

      // Log de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'DATA_EXPORTED',
        userId,
        userRole: 'ADMIN',
        metadata: {
          organizationId,
          exportType: 'organization_data'
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return exportData as any;
    } catch (error) {
      console.error('Error exporting organization data:', error);
      throw new Error('No se pudieron exportar los datos');
    }
  }
} 