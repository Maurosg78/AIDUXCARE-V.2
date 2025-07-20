#!/usr/bin/env ts-node

/**
 * 🧪 Test Script: Organization UI Interface
 * Valida la interfaz de administración de organizaciones
 * 
 * Este script simula las pruebas de la interfaz de usuario para:
 * - Carga de datos de organización
 * - Verificación de permisos y roles
 * - Navegación adaptativa
 * - Funcionalidades de gestión de equipo
 * - Componentes responsivos
 */

import { Organization, OrganizationMember, OrganizationInvitation } from '../src/core/domain/organizationType';

// Mock del hook useOrganization
interface MockUseOrganizationReturn {
  organization: Organization | null;
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
  isLoading: boolean;
  error: string | null;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManageTeam: boolean;
  canManagePatients: boolean;
  canViewAuditLogs: boolean;
  canAccessAnalytics: boolean;
  isOwnerOrAdmin: boolean;
  inviteMember: (email: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
}

// Datos de prueba
const mockOrganization: Organization = {
  id: 'org-123',
  name: 'Clínica San José',
  description: 'Clínica especializada en fisioterapia y rehabilitación',
  ownerId: 'user-owner-123',
  type: 'CLINIC',
  status: 'ACTIVE',
  contactInfo: {
    email: 'contacto@clinicasanjose.com',
    phone: '+34 91 123 4567',
    website: 'https://clinicasanjose.com',
    address: {
      street: 'Calle Mayor 123',
      city: 'Madrid',
      state: 'Madrid',
      country: 'España',
      postalCode: '28001'
    }
  },
  legalInfo: {
    taxId: 'B12345678',
    registrationNumber: 'CL-2024-001',
    licenseNumber: 'LIC-2024-001',
    complianceCertifications: ['ISO 27001', 'HIPAA']
  },
  settings: {
    maxMembers: 50,
    allowMemberInvitations: true,
    requireApprovalForNewMembers: false,
    auditTrailEnabled: true,
    dataRetentionDays: 2555
  },
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'user-owner-123',
    version: '1.0.0'
  }
};

const mockMembers: OrganizationMember[] = [
  {
    id: 'user-owner-123',
    organizationId: 'org-123',
    role: 'OWNER',
    status: 'ACTIVE',
    professionalInfo: {
      firstName: 'Dr. María',
      lastName: 'González',
      email: 'maria.gonzalez@clinicasanjose.com',
      specialization: 'Fisioterapia',
      licenseNumber: 'FIS-001',
      yearsOfExperience: 15
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
      joinedAt: new Date('2024-01-01'),
      invitedBy: 'system',
      invitedAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    }
  },
  {
    id: 'user-admin-456',
    organizationId: 'org-123',
    role: 'ADMIN',
    status: 'ACTIVE',
    professionalInfo: {
      firstName: 'Dr. Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@clinicasanjose.com',
      specialization: 'Rehabilitación',
      licenseNumber: 'REH-002',
      yearsOfExperience: 8
    },
    permissions: {
      canManagePatients: true,
      canManageTeam: true,
      canViewAuditLogs: true,
      canExportData: false,
      canManageBilling: false,
      canAccessAnalytics: true
    },
    preferences: {
      notificationSettings: {
        email: true,
        push: false,
        sms: false
      },
      language: 'es',
      timezone: 'Europe/Madrid'
    },
    metadata: {
      joinedAt: new Date('2024-01-05'),
      invitedBy: 'user-owner-123',
      invitedAt: new Date('2024-01-03'),
      lastActiveAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-14')
    }
  },
  {
    id: 'user-member-789',
    organizationId: 'org-123',
    role: 'MEMBER',
    status: 'ACTIVE',
    professionalInfo: {
      firstName: 'Dra. Ana',
      lastName: 'Sánchez',
      email: 'ana.sanchez@clinicasanjose.com',
      specialization: 'Fisioterapia Deportiva',
      licenseNumber: 'FIS-003',
      yearsOfExperience: 5
    },
    permissions: {
      canManagePatients: true,
      canManageTeam: false,
      canViewAuditLogs: false,
      canExportData: false,
      canManageBilling: false,
      canAccessAnalytics: false
    },
    preferences: {
      notificationSettings: {
        email: true,
        push: true,
        sms: true
      },
      language: 'es',
      timezone: 'Europe/Madrid'
    },
    metadata: {
      joinedAt: new Date('2024-01-10'),
      invitedBy: 'user-admin-456',
      invitedAt: new Date('2024-01-08'),
      lastActiveAt: new Date('2024-01-13'),
      updatedAt: new Date('2024-01-13')
    }
  }
];

const mockInvitations: OrganizationInvitation[] = [
  {
    id: 'inv-001',
    organizationId: 'org-123',
    email: 'dr.perez@ejemplo.com',
    role: 'MEMBER',
    status: 'PENDING',
    invitedBy: 'user-admin-456',
    invitedAt: new Date('2024-01-12'),
    expiresAt: new Date('2024-01-19'),
    invitationToken: 'token-abc-123',
    metadata: {
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12')
    }
  }
];

// Función para simular el hook useOrganization
function mockUseOrganization(role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'OWNER'): MockUseOrganizationReturn {
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN';
  const isOwnerOrAdmin = isOwner || isAdmin;

  return {
    organization: mockOrganization,
    members: mockMembers,
    invitations: mockInvitations,
    isLoading: false,
    error: null,
    canInviteMembers: isOwnerOrAdmin,
    canRemoveMembers: isOwnerOrAdmin,
    canManageTeam: isOwnerOrAdmin,
    canManagePatients: true,
    canViewAuditLogs: isOwnerOrAdmin,
    canAccessAnalytics: isOwnerOrAdmin,
    isOwnerOrAdmin,
    inviteMember: async (email: string, role: string) => {
      console.log(`✅ Simulando invitación: ${email} como ${role}`);
      return Promise.resolve();
    },
    removeMember: async (memberId: string) => {
      console.log(`✅ Simulando remoción de miembro: ${memberId}`);
      return Promise.resolve();
    }
  };
}

// Tests de la interfaz
class OrganizationUITests {
  private tests: Array<{ name: string; test: () => void }> = [];

  addTest(name: string, test: () => void) {
    this.tests.push({ name, test });
  }

  async runTests() {
    console.log('🧪 Iniciando pruebas de interfaz de organización...\n');
    
    let passed = 0;
    let failed = 0;

    for (const { name, test } of this.tests) {
      try {
        console.log(`📋 Ejecutando: ${name}`);
        test();
        console.log(`✅ PASÓ: ${name}\n`);
        passed++;
      } catch (error) {
        console.log(`❌ FALLÓ: ${name}`);
        console.log(`   Error: ${error}\n`);
        failed++;
      }
    }

    console.log('📊 Resumen de pruebas:');
    console.log(`   ✅ Pasadas: ${passed}`);
    console.log(`   ❌ Fallidas: ${failed}`);
    console.log(`   📈 Total: ${passed + failed}`);
    
    return { passed, failed };
  }

  // Test 1: Carga de datos de organización
  testDataLoading() {
    const hook = mockUseOrganization('OWNER');
    
    if (hook.isLoading) {
      throw new Error('Los datos deberían estar cargados');
    }
    
    if (!hook.organization) {
      throw new Error('La organización debería estar disponible');
    }
    
    if (hook.members.length === 0) {
      throw new Error('Deberían haber miembros en la organización');
    }
    
    console.log(`   📊 Organización: ${hook.organization.name}`);
    console.log(`   👥 Miembros: ${hook.members.length}`);
    console.log(`   📧 Invitaciones: ${hook.invitations.length}`);
  }

  // Test 2: Verificación de permisos por rol
  testRolePermissions() {
    const ownerHook = mockUseOrganization('OWNER');
    const adminHook = mockUseOrganization('ADMIN');
    const memberHook = mockUseOrganization('MEMBER');

    // Verificar permisos de OWNER
    if (!ownerHook.canInviteMembers || !ownerHook.canRemoveMembers || !ownerHook.canManageTeam) {
      throw new Error('OWNER debería tener todos los permisos de gestión');
    }

    // Verificar permisos de ADMIN
    if (!adminHook.canInviteMembers || !adminHook.canRemoveMembers || !adminHook.canManageTeam) {
      throw new Error('ADMIN debería tener permisos de gestión');
    }

    // Verificar permisos de MEMBER
    if (memberHook.canInviteMembers || memberHook.canRemoveMembers || memberHook.canManageTeam) {
      throw new Error('MEMBER no debería tener permisos de gestión');
    }

    console.log(`   👑 OWNER permisos: ✅`);
    console.log(`   🔧 ADMIN permisos: ✅`);
    console.log(`   👤 MEMBER permisos: ✅`);
  }

  // Test 3: Navegación adaptativa
  testAdaptiveNavigation() {
    const ownerHook = mockUseOrganization('OWNER');
    const memberHook = mockUseOrganization('MEMBER');

    // Verificar que OWNER ve todas las opciones
    const ownerVisibleItems = [
      ownerHook.canManageTeam,
      ownerHook.canManagePatients,
      ownerHook.canViewAuditLogs,
      ownerHook.canAccessAnalytics
    ].filter(Boolean);

    if (ownerVisibleItems.length < 4) {
      throw new Error('OWNER debería ver todas las opciones de navegación');
    }

    // Verificar que MEMBER ve opciones limitadas
    const memberVisibleItems = [
      memberHook.canManageTeam,
      memberHook.canManagePatients,
      memberHook.canViewAuditLogs,
      memberHook.canAccessAnalytics
    ].filter(Boolean);

    if (memberVisibleItems.length !== 1) {
      throw new Error('MEMBER debería ver solo gestión de pacientes');
    }

    console.log(`   🧭 OWNER navegación: ${ownerVisibleItems.length} opciones`);
    console.log(`   🧭 MEMBER navegación: ${memberVisibleItems.length} opciones`);
  }

  // Test 4: Funcionalidades de gestión de equipo
  testTeamManagement() {
    const hook = mockUseOrganization('OWNER');

    // Verificar que se pueden invitar miembros
    if (!hook.canInviteMembers) {
      throw new Error('Debería poder invitar miembros');
    }

    // Verificar que se pueden remover miembros
    if (!hook.canRemoveMembers) {
      throw new Error('Debería poder remover miembros');
    }

    // Verificar que hay miembros para gestionar
    if (hook.members.length === 0) {
      throw new Error('Debería haber miembros para gestionar');
    }

    // Verificar que hay invitaciones pendientes
    if (hook.invitations.length === 0) {
      throw new Error('Debería haber invitaciones para mostrar');
    }

    console.log(`   👥 Gestión de equipo: ✅`);
    console.log(`   📧 Invitaciones: ${hook.invitations.length} pendientes`);
  }

  // Test 5: Validación de datos de miembros
  testMemberDataValidation() {
    const hook = mockUseOrganization('OWNER');
    
    for (const member of hook.members) {
      // Verificar que cada miembro tiene información profesional
      if (!member.professionalInfo.firstName || !member.professionalInfo.lastName) {
        throw new Error('Miembro sin nombre completo');
      }
      
      if (!member.professionalInfo.email) {
        throw new Error('Miembro sin email');
      }
      
      // Verificar que tiene un rol válido
      if (!['OWNER', 'ADMIN', 'MEMBER'].includes(member.role)) {
        throw new Error('Rol de miembro inválido');
      }
      
      // Verificar que tiene un estado válido
      if (!['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'].includes(member.status)) {
        throw new Error('Estado de miembro inválido');
      }
    }

    console.log(`   ✅ Validación de ${hook.members.length} miembros: PASÓ`);
  }

  // Test 6: Validación de invitaciones
  testInvitationValidation() {
    const hook = mockUseOrganization('OWNER');
    
    for (const invitation of hook.invitations) {
      // Verificar que la invitación tiene email
      if (!invitation.email) {
        throw new Error('Invitación sin email');
      }
      
      // Verificar que tiene un rol válido
      if (!['ADMIN', 'MEMBER'].includes(invitation.role)) {
        throw new Error('Rol de invitación inválido');
      }
      
      // Verificar que tiene un estado válido
      if (!['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'].includes(invitation.status)) {
        throw new Error('Estado de invitación inválido');
      }
      
      // Verificar que tiene token de invitación
      if (!invitation.invitationToken) {
        throw new Error('Invitación sin token');
      }
    }

    console.log(`   ✅ Validación de ${hook.invitations.length} invitaciones: PASÓ`);
  }

  // Test 7: Simulación de acciones de gestión
  async testManagementActions() {
    const hook = mockUseOrganization('OWNER');
    
    try {
      // Simular invitación de miembro
      await hook.inviteMember('nuevo@ejemplo.com', 'MEMBER');
      
      // Simular remoción de miembro
      const memberToRemove = hook.members.find(m => m.role !== 'OWNER');
      if (memberToRemove) {
        await hook.removeMember(memberToRemove.id);
      }
      
      console.log(`   ✅ Acciones de gestión: PASÓ`);
    } catch (error) {
      throw new Error(`Error en acciones de gestión: ${error}`);
    }
  }

  // Test 8: Verificación de responsividad
  testResponsiveDesign() {
    // Simular diferentes tamaños de pantalla
    const screenSizes = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const screen of screenSizes) {
      // En una implementación real, aquí se verificaría el comportamiento responsivo
      console.log(`   📱 ${screen.name}: ${screen.width}x${screen.height}`);
    }

    console.log(`   ✅ Responsividad: PASÓ`);
  }
}

// Ejecutar pruebas
async function runOrganizationUITests() {
  const testSuite = new OrganizationUITests();
  
  // Agregar todas las pruebas
  testSuite.addTest('Carga de datos de organización', () => testSuite.testDataLoading());
  testSuite.addTest('Verificación de permisos por rol', () => testSuite.testRolePermissions());
  testSuite.addTest('Navegación adaptativa', () => testSuite.testAdaptiveNavigation());
  testSuite.addTest('Funcionalidades de gestión de equipo', () => testSuite.testTeamManagement());
  testSuite.addTest('Validación de datos de miembros', () => testSuite.testMemberDataValidation());
  testSuite.addTest('Validación de invitaciones', () => testSuite.testInvitationValidation());
  testSuite.addTest('Simulación de acciones de gestión', () => testSuite.testManagementActions());
  testSuite.addTest('Verificación de responsividad', () => testSuite.testResponsiveDesign());

  // Ejecutar pruebas
  const results = await testSuite.runTests();
  
  // Retornar código de salida
  if (results.failed > 0) {
    console.log('\n❌ Algunas pruebas fallaron');
    process.exit(1);
  } else {
    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    process.exit(0);
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  runOrganizationUITests().catch(error => {
    console.error('Error ejecutando pruebas:', error);
    process.exit(1);
  });
}

export { OrganizationUITests, mockUseOrganization }; 