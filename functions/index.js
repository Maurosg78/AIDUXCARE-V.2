/**
 * 🏥 AIDUXCARE V.2 - BACKEND CLOUD FUNCTIONS
 * API REST para gestión de pacientes con Google Firestore
 * Endpoints CRUD básicos sin autenticación (Fase 1)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Crear app Express
const app = express();

// Middleware
app.use(cors({ origin: true })); // Permitir CORS para frontend
app.use(express.json());

// ============================================================================
// ENDPOINTS CRUD PARA PACIENTES
// ============================================================================

/**
 * POST /patients
 * Crear un nuevo paciente
 */
app.post('/patients', async (req, res) => {
  try {
    const { name, email, phone, birthDate, reasonForConsultation } = req.body;

    // Validación básica
    if (!name || !email || !reasonForConsultation) {
      return res.status(400).json({ 
        error: 'Campos requeridos: name, email, reasonForConsultation' 
      });
    }

    // Crear documento del paciente
    const patientData = {
      name,
      email,
      phone: phone || null,
      birthDate: birthDate || null,
      reasonForConsultation,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    };

    const docRef = await db.collection('patients').add(patientData);
    
    // Obtener el documento creado con el ID
    const createdDoc = await docRef.get();
    const responseData = {
      id: docRef.id,
      ...createdDoc.data()
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /patients/{patientId}
 * Obtener un paciente por ID
 */
app.get('/patients/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const doc = await db.collection('patients').doc(patientId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const responseData = {
      id: doc.id,
      ...doc.data()
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error getting patient:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /patients/{patientId}
 * Actualizar un paciente existente
 */
app.put('/patients/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, email, phone, birthDate, reasonForConsultation } = req.body;

    // Verificar que el paciente existe
    const doc = await db.collection('patients').doc(patientId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Actualizar campos (solo los que se envían)
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (reasonForConsultation !== undefined) updateData.reasonForConsultation = reasonForConsultation;

    await db.collection('patients').doc(patientId).update(updateData);

    // Obtener el documento actualizado
    const updatedDoc = await db.collection('patients').doc(patientId).get();
    const responseData = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /patients/{patientId}
 * Eliminar un paciente (soft delete)
 */
app.delete('/patients/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verificar que el paciente existe
    const doc = await db.collection('patients').doc(patientId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Soft delete - marcar como eliminado en lugar de eliminar físicamente
    await db.collection('patients').doc(patientId).update({
      status: 'deleted',
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /patients
 * Listar todos los pacientes activos (endpoint adicional útil)
 */
app.get('/patients', async (req, res) => {
  try {
    const snapshot = await db.collection('patients')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();

    const patients = [];
    snapshot.forEach(doc => {
      patients.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(patients);
  } catch (error) {
    console.error('Error listing patients:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================================================
// ENDPOINT DE SALUD
// ============================================================================

/**
 * GET /health
 * Health check del API
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'aiduxcare-patients-api',
    version: '1.0.0'
  });
});

// ============================================================================
// EXPORTAR CLOUD FUNCTION
// ============================================================================

exports.api = functions.https.onRequest(app); 