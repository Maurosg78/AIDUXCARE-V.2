/**
 * 🏢 Organization Types
 * Modelos de datos para organizaciones (clínicas) y sistema de roles
 */

export interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // ID del dueño en Firebase Auth
  type: 'CLINIC' | 'HOSPITAL' | 'PRIVATE_PRACTICE' | 'RESEARCH_CENTER';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';
  
  // Información de contacto
  contactInfo: {
    email: string;
    phone?: string;
    website?: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  
  // Información legal
  legalInfo: {
    taxId?: string;
    registrationNumber?: string;
    licenseNumber?: string;
    complianceCertifications: string[];
  };
  
  // Configuración de la organización
  settings: {
    maxMembers: number;
    allowMemberInvitations: boolean;
    requireApprovalForNewMembers: boolean;
    auditTrailEnabled: boolean;
    dataRetentionDays: number;
  };
  
  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    version: string;
  };
}

export interface OrganizationMember {
  id: string; // userId de Firebase Auth
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  
  // Información del profesional
  professionalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string;
    licenseNumber?: string;
    yearsOfExperience?: number;
  };
  
  // Permisos específicos
  permissions: {
    canManagePatients: boolean;
    canManageTeam: boolean;
    canViewAuditLogs: boolean;
    canExportData: boolean;
    canManageBilling: boolean;
    canAccessAnalytics: boolean;
  };
  
  // Configuración personal
  preferences: {
    notificationSettings: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    language: string;
    timezone: string;
  };
  
  // Metadata
  metadata: {
    joinedAt: Date;
    invitedBy: string;
    invitedAt: Date;
    lastActiveAt: Date;
    updatedAt: Date;
  };
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  
  // Información del invitador
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  
  // Token de invitación
  invitationToken: string;
  
  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}

// Tipos para Firebase Auth Custom Claims
export interface UserCustomClaims {
  organizationId?: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'INDEPENDENT';
  permissions?: string[];
  isVerified?: boolean;
}

// Tipos para permisos
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'PATIENT_MANAGEMENT' | 'TEAM_MANAGEMENT' | 'ORGANIZATION_MANAGEMENT' | 'AUDIT' | 'BILLING' | 'ANALYTICS';
  resource: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';
}

// Roles predefinidos con permisos
export const ORGANIZATION_ROLES = {
  OWNER: {
    name: 'Propietario',
    description: 'Dueño de la organización con todos los permisos',
    permissions: [
      'organization:manage',
      'team:manage',
      'patients:manage',
      'audit:view',
      'billing:manage',
      'analytics:view',
      'data:export'
    ]
  },
  ADMIN: {
    name: 'Administrador',
    description: 'Administrador con permisos de gestión de equipo y pacientes',
    permissions: [
      'team:manage',
      'patients:manage',
      'audit:view',
      'analytics:view'
    ]
  },
  MEMBER: {
    name: 'Miembro',
    description: 'Profesional con permisos básicos para gestionar pacientes',
    permissions: [
      'patients:manage'
    ]
  }
} as const;

// Función para verificar permisos
export function hasPermission(userClaims: UserCustomClaims, requiredPermission: string): boolean {
  if (!userClaims.permissions) return false;
  return userClaims.permissions.includes(requiredPermission);
}

// Función para verificar rol
export function hasRole(userClaims: UserCustomClaims, requiredRole: string): boolean {
  return userClaims.role === requiredRole;
}

// Función para verificar si es dueño o admin
export function isOwnerOrAdmin(userClaims: UserCustomClaims): boolean {
  return userClaims.role === 'OWNER' || userClaims.role === 'ADMIN';
}

// Función para verificar si es profesional independiente
export function isIndependentProfessional(userClaims: UserCustomClaims): boolean {
  return userClaims.role === 'INDEPENDENT' || !userClaims.organizationId;
} 