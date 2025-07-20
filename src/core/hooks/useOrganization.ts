/**
 * 🏢 useOrganization Hook
 * Hook para gestionar organizaciones, miembros y permisos en el frontend
 */

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { OrganizationService } from '../services/OrganizationService';
import { 
  Organization, 
  OrganizationMember, 
  OrganizationInvitation,
  UserCustomClaims,
  hasPermission,
  hasRole,
  isOwnerOrAdmin,
  isIndependentProfessional
} from '../domain/organizationType';

interface UseOrganizationReturn {
  // Estado de la organización
  organization: Organization | null;
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
  isLoading: boolean;
  error: string | null;
  
  // Información del usuario actual
  user: User | null;
  userClaims: UserCustomClaims | null;
  userRole: string | null;
  userPermissions: string[];
  isOwnerOrAdmin: boolean;
  isIndependent: boolean;
  
  // Funciones de gestión
  createOrganization: (data: Omit<Organization, 'id' | 'metadata'>) => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  addMember: (email: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: 'ADMIN' | 'MEMBER') => Promise<void>;
  createInvitation: (email: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  acceptInvitation: (invitationToken: string) => Promise<void>;
  
  // Funciones de verificación de permisos
  canManageTeam: boolean;
  canManagePatients: boolean;
  canViewAuditLogs: boolean;
  canExportData: boolean;
  canManageBilling: boolean;
  canAccessAnalytics: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  
  // Funciones de utilidad
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export function useOrganization(): UseOrganizationReturn {
  const auth = getAuth();
  const organizationService = new OrganizationService();
  
  // Estado local
  const [user, setUser] = useState<User | null>(null);
  const [userClaims, setUserClaims] = useState<UserCustomClaims | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Obtener custom claims del usuario
        const token = await firebaseUser.getIdTokenResult();
        const claims = token.claims as UserCustomClaims;
        setUserClaims(claims);
        
        // Cargar datos de organización si pertenece a una
        if (claims?.organizationId) {
          await loadOrganizationData(claims.organizationId);
        } else {
          setIsLoading(false);
        }
      } else {
        setUserClaims(null);
        setOrganization(null);
        setMembers([]);
        setInvitations([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadOrganizationData = async (organizationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const [orgData, membersData, invitationsData] = await Promise.all([
        organizationService.getOrganization(organizationId),
        organizationService.getOrganizationMembers(organizationId),
        organizationService.getPendingInvitations(organizationId)
      ]);

      setOrganization(orgData);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos de la organización');
    } finally {
      setIsLoading(false);
    }
  };

  // Extraer información del usuario
  const userRole = userClaims?.role || null;
  const userPermissions = userClaims?.permissions || [];
  const isOwnerOrAdminUser = isOwnerOrAdmin(userClaims || {});
  const isIndependent = isIndependentProfessional(userClaims || {});

  // Funciones de gestión de organización
  const createOrganization = async (data: Omit<Organization, 'id' | 'metadata'>) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      setError(null);
      const newOrganization = await organizationService.createOrganization(data, user.uid);
      setOrganization(newOrganization);
      
      // Recargar datos
      if (newOrganization) {
        await loadOrganizationData(newOrganization.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando organización');
      throw err;
    }
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization || !user) throw new Error('No autorizado');

    try {
      setError(null);
      await organizationService.updateOrganization(organization.id, updates, user.uid);
      
      // Actualizar estado local
      setOrganization(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando organización');
      throw err;
    }
  };

  const addMember = async (email: string, role: 'ADMIN' | 'MEMBER') => {
    if (!organization || !user) throw new Error('No autorizado');

    try {
      setError(null);
      const invitation = await organizationService.createInvitation({
        organizationId: organization.id,
        email,
        role,
        invitedBy: user.uid,
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        invitationToken: generateInvitationToken(),
        status: 'PENDING'
      }, user.uid);

      // Actualizar lista de invitaciones
      setInvitations(prev => [...prev, invitation]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error invitando miembro');
      throw err;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!organization || !user) throw new Error('No autorizado');

    try {
      setError(null);
      await organizationService.removeMember(organization.id, memberId, user.uid);
      
      // Actualizar lista de miembros
      setMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removiendo miembro');
      throw err;
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!organization || !user) throw new Error('No autorizado');

    try {
      setError(null);
      await organizationService.updateMember(organization.id, memberId, { role: newRole }, user.uid);
      
      // Actualizar estado local
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando rol');
      throw err;
    }
  };

  const createInvitation = async (email: string, role: 'ADMIN' | 'MEMBER') => {
    return addMember(email, role); // Alias para addMember
  };

  const inviteMember = async (email: string, role: string) => {
    return addMember(email, role as 'ADMIN' | 'MEMBER'); // Alias para addMember
  };

  const acceptInvitation = async (invitationToken: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      setError(null);
      // Esta función se implementaría con Firebase Functions
      // Por ahora solo simulamos la aceptación
      console.log('Accepting invitation:', invitationToken);
      
      // Recargar datos después de aceptar
      if (userClaims?.organizationId) {
        await loadOrganizationData(userClaims.organizationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error aceptando invitación');
      throw err;
    }
  };

  // Funciones de utilidad
  const refreshData = async () => {
    if (userClaims?.organizationId) {
      await loadOrganizationData(userClaims.organizationId);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Verificaciones de permisos
  const canManageTeam = hasPermission(userClaims || {}, 'team:manage');
  const canManagePatients = hasPermission(userClaims || {}, 'patients:manage');
  const canViewAuditLogs = hasPermission(userClaims || {}, 'audit:view');
  const canExportData = hasPermission(userClaims || {}, 'data:export');
  const canManageBilling = hasPermission(userClaims || {}, 'billing:manage');
  const canAccessAnalytics = hasPermission(userClaims || {}, 'analytics:view');
  const canInviteMembers = hasPermission(userClaims || {}, 'team:manage');
  const canRemoveMembers = hasPermission(userClaims || {}, 'team:manage');

  return {
    // Estado
    organization,
    members,
    invitations,
    isLoading,
    error,
    
    // Información del usuario
    user,
    userClaims,
    userRole,
    userPermissions,
    isOwnerOrAdmin: isOwnerOrAdminUser,
    isIndependent,
    
    // Funciones de gestión
    createOrganization,
    updateOrganization,
    addMember,
    inviteMember,
    removeMember,
    updateMemberRole,
    createInvitation,
    acceptInvitation,
    
    // Permisos
    canManageTeam,
    canManagePatients,
    canViewAuditLogs,
    canExportData,
    canManageBilling,
    canAccessAnalytics,
    canInviteMembers,
    canRemoveMembers,
    
    // Utilidades
    refreshData,
    clearError
  };
}

// Función auxiliar para generar tokens de invitación
function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
} 