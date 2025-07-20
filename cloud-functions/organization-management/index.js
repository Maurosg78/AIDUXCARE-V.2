/**
 * 🏢 Organization Management Cloud Functions
 * Funciones para gestionar organizaciones y custom claims de Firebase Auth
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Cloud Function: Asignar custom claims cuando se agrega un miembro
 * Se dispara cuando se crea un documento en organizations/{orgId}/members/{userId}
 */
exports.assignCustomClaims = functions.firestore
  .document('organizations/{organizationId}/members/{userId}')
  .onCreate(async (snap, context) => {
    const { organizationId, userId } = context.params;
    const memberData = snap.data();

    try {
      console.log(`Assigning custom claims for user ${userId} in organization ${organizationId}`);

      // Obtener permisos del rol
      const rolePermissions = getRolePermissions(memberData.role);
      
      // Crear custom claims
      const customClaims = {
        organizationId: organizationId,
        role: memberData.role,
        permissions: rolePermissions,
        isVerified: true
      };

      // Asignar custom claims al usuario
      await auth.setCustomUserClaims(userId, customClaims);

      console.log(`Custom claims assigned successfully for user ${userId}`);
      
      // Log de auditoría
      await logAuditEvent('CUSTOM_CLAIMS_ASSIGNED', userId, {
        organizationId,
        role: memberData.role,
        permissions: rolePermissions
      });

      return { success: true };
    } catch (error) {
      console.error('Error assigning custom claims:', error);
      throw new Error(`Failed to assign custom claims: ${error.message}`);
    }
  });

/**
 * Cloud Function: Remover custom claims cuando se elimina un miembro
 * Se dispara cuando se elimina un documento en organizations/{orgId}/members/{userId}
 */
exports.removeCustomClaims = functions.firestore
  .document('organizations/{organizationId}/members/{userId}')
  .onDelete(async (snap, context) => {
    const { organizationId, userId } = context.params;

    try {
      console.log(`Removing custom claims for user ${userId} from organization ${organizationId}`);

      // Remover custom claims (establecer como profesional independiente)
      const customClaims = {
        organizationId: null,
        role: 'INDEPENDENT',
        permissions: ['patients:manage'],
        isVerified: true
      };

      await auth.setCustomUserClaims(userId, customClaims);

      console.log(`Custom claims removed successfully for user ${userId}`);
      
      // Log de auditoría
      await logAuditEvent('CUSTOM_CLAIMS_REMOVED', userId, {
        organizationId,
        previousRole: snap.data()?.role
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing custom claims:', error);
      throw new Error(`Failed to remove custom claims: ${error.message}`);
    }
  });

/**
 * Cloud Function: Actualizar custom claims cuando se actualiza un miembro
 * Se dispara cuando se actualiza un documento en organizations/{orgId}/members/{userId}
 */
exports.updateCustomClaims = functions.firestore
  .document('organizations/{organizationId}/members/{userId}')
  .onUpdate(async (change, context) => {
    const { organizationId, userId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Solo actualizar si cambió el rol
    if (beforeData.role === afterData.role) {
      return { success: true, message: 'No role change detected' };
    }

    try {
      console.log(`Updating custom claims for user ${userId} in organization ${organizationId}`);

      // Obtener nuevos permisos del rol
      const rolePermissions = getRolePermissions(afterData.role);
      
      // Actualizar custom claims
      const customClaims = {
        organizationId: organizationId,
        role: afterData.role,
        permissions: rolePermissions,
        isVerified: true
      };

      await auth.setCustomUserClaims(userId, customClaims);

      console.log(`Custom claims updated successfully for user ${userId}`);
      
      // Log de auditoría
      await logAuditEvent('CUSTOM_CLAIMS_UPDATED', userId, {
        organizationId,
        previousRole: beforeData.role,
        newRole: afterData.role,
        newPermissions: rolePermissions
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating custom claims:', error);
      throw new Error(`Failed to update custom claims: ${error.message}`);
    }
  });

/**
 * Cloud Function: Procesar invitaciones
 * Se dispara cuando se crea una invitación
 */
exports.processInvitation = functions.firestore
  .document('organizations/{organizationId}/invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    const { organizationId, invitationId } = context.params;
    const invitationData = snap.data();

    try {
      console.log(`Processing invitation ${invitationId} for organization ${organizationId}`);

      // Aquí se podría enviar un email con el link de invitación
      // Por ahora solo logueamos la acción
      
      // Log de auditoría
      await logAuditEvent('INVITATION_PROCESSED', invitationData.invitedBy, {
        organizationId,
        invitationId,
        invitedEmail: invitationData.email,
        role: invitationData.role
      });

      return { success: true };
    } catch (error) {
      console.error('Error processing invitation:', error);
      throw new Error(`Failed to process invitation: ${error.message}`);
    }
  });

/**
 * Cloud Function: Aceptar invitación
 * HTTP endpoint para aceptar invitaciones
 */
exports.acceptInvitation = functions.https.onCall(async (data, context) => {
  const { invitationToken } = data;
  const userId = context.auth?.uid;

  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!invitationToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Invitation token is required');
  }

  try {
    console.log(`Processing invitation acceptance for user ${userId}`);

    // Buscar la invitación por token
    const invitationsRef = db.collectionGroup('invitations');
    const query = invitationsRef.where('invitationToken', '==', invitationToken);
    const snapshot = await query.get();

    if (snapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Invitation not found or expired');
    }

    const invitationDoc = snapshot.docs[0];
    const invitationData = invitationDoc.data();
    const organizationId = invitationDoc.ref.parent.parent?.id;

    if (!organizationId) {
      throw new functions.https.HttpsError('internal', 'Organization not found');
    }

    // Verificar que la invitación esté pendiente
    if (invitationData.status !== 'PENDING') {
      throw new functions.https.HttpsError('failed-precondition', 'Invitation is not pending');
    }

    // Verificar que no haya expirado
    if (invitationData.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError('failed-precondition', 'Invitation has expired');
    }

    // Obtener información del usuario
    const userRecord = await auth.getUser(userId);
    
    // Crear el miembro
    const memberData = {
      organizationId,
      role: invitationData.role,
      status: 'ACTIVE',
      professionalInfo: {
        firstName: userRecord.displayName?.split(' ')[0] || '',
        lastName: userRecord.displayName?.split(' ').slice(1).join(' ') || '',
        email: userRecord.email || '',
        specialization: '',
        licenseNumber: '',
        yearsOfExperience: 0
      },
      permissions: getDefaultPermissions(invitationData.role),
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
        invitedBy: invitationData.invitedBy,
        invitedAt: invitationData.invitedAt.toDate(),
        lastActiveAt: new Date(),
        updatedAt: new Date()
      }
    };

    // Agregar miembro a la organización
    await db.collection('organizations').doc(organizationId)
      .collection('members').doc(userId).set(memberData);

    // Actualizar estado de la invitación
    await invitationDoc.ref.update({
      status: 'ACCEPTED',
      'metadata.updatedAt': new Date()
    });

    console.log(`Invitation accepted successfully for user ${userId}`);

    return { 
      success: true, 
      organizationId,
      role: invitationData.role 
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===== FUNCIONES AUXILIARES =====

/**
 * Obtener permisos según el rol
 */
function getRolePermissions(role) {
  const rolePermissions = {
    OWNER: [
      'organization:manage',
      'team:manage',
      'patients:manage',
      'audit:view',
      'billing:manage',
      'analytics:view',
      'data:export'
    ],
    ADMIN: [
      'team:manage',
      'patients:manage',
      'audit:view',
      'analytics:view'
    ],
    MEMBER: [
      'patients:manage'
    ],
    INDEPENDENT: [
      'patients:manage'
    ]
  };

  return rolePermissions[role] || [];
}

/**
 * Obtener permisos por defecto según el rol
 */
function getDefaultPermissions(role) {
  const defaultPermissions = {
    OWNER: {
      canManagePatients: true,
      canManageTeam: true,
      canViewAuditLogs: true,
      canExportData: true,
      canManageBilling: true,
      canAccessAnalytics: true
    },
    ADMIN: {
      canManagePatients: true,
      canManageTeam: true,
      canViewAuditLogs: true,
      canExportData: false,
      canManageBilling: false,
      canAccessAnalytics: true
    },
    MEMBER: {
      canManagePatients: true,
      canManageTeam: false,
      canViewAuditLogs: false,
      canExportData: false,
      canManageBilling: false,
      canAccessAnalytics: false
    }
  };

  return defaultPermissions[role] || defaultPermissions.MEMBER;
}

/**
 * Log de auditoría
 */
async function logAuditEvent(type, userId, metadata) {
  try {
    await db.collection('audit_logs').add({
      type,
      userId,
      userRole: 'SYSTEM',
      metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

module.exports = {
  assignCustomClaims: exports.assignCustomClaims,
  removeCustomClaims: exports.removeCustomClaims,
  updateCustomClaims: exports.updateCustomClaims,
  processInvitation: exports.processInvitation,
  acceptInvitation: exports.acceptInvitation
}; 