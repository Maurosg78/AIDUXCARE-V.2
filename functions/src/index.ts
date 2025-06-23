import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import clinicalNLPRoutes from "./routes/clinicalNLP";
import { 
  transcribeAudio,
  getTranscriptionHistory
} from "./api/transcription";
import {
  processNLPAnalysis,
  getNLPAnalysisStatus
} from "./api/nlp-analysis";

admin.initializeApp();

const app = express();

// Configuración CORS más permisiva para desarrollo
app.use(cors({ 
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const patientsCollection = admin.firestore().collection("patients");

// Define la ruta POST para crear un paciente
app.post("/patients", async (req, res) => {
  try {
    const patientData = req.body;

    if (!patientData.name || !patientData.email || !patientData.phone || !patientData.birthDate || !patientData.reasonForConsultation) {
      res.status(400).json({
        error: "Missing required fields",
        details: "name, email, phone, birthDate, and reasonForConsultation are required"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientData.email)) {
      res.status(400).json({
        error: "Invalid email format"
      });
      return;
    }

    const phoneRegex = /^\+56\s9\s\d{4}\s\d{4}$/;
    if (!phoneRegex.test(patientData.phone)) {
      res.status(400).json({
        error: "Invalid phone format",
        details: "Phone must be in format: +56 9 XXXX XXXX"
      });
      return;
    }

    const now = admin.firestore.Timestamp.now();
    const patientRef = await patientsCollection.add({
      ...patientData,
      createdAt: now,
      updatedAt: now
    });

    const patientDoc = await patientRef.get();
    const patient = {
      id: patientDoc.id,
      ...patientDoc.data()
    };

    res.status(201).json(patient);
  } catch (error) {
    console.error("Error creating patient:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Define la ruta GET para obtener todos los pacientes
app.get("/patients", async (req, res) => {
  try {
    const snapshot = await patientsCollection.get();
    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(patients);
  } catch (error) {
    console.error("Error in GET /patients:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
  }
});

// Define la ruta GET para un paciente específico
app.get("/patients/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await patientsCollection.doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error in GET /patients/:id:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
  }
});

// Define la ruta PUT para actualizar un paciente
app.put("/patients/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    updateData.updatedAt = admin.firestore.Timestamp.now();
    await patientsCollection.doc(id).update(updateData);
    const updatedDoc = await patientsCollection.doc(id).get();
    res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error("Error in PUT /patients/:id:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
  }
});

// Define la ruta DELETE para eliminar un paciente
app.delete("/patients/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await patientsCollection.doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error("Error in DELETE /patients/:id:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
  }
});

// === RUTAS DE TRANSCRIPCIÓN ===
app.post("/transcription", transcribeAudio);
app.get("/transcription/history/:sessionId", getTranscriptionHistory);

// === RUTAS DE NLP ===
app.post("/nlp-analysis", processNLPAnalysis);
app.get("/nlp-analysis/status/:sessionId", getNLPAnalysisStatus);

// === RUTAS DE CLINICAL NLP ===
app.use("/clinical-nlp", clinicalNLPRoutes);

// === ENDPOINT DE SALUD ===
app.get("/health", (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'aiduxcare-api-v2',
    version: '2.0.0',
    environment: 'production'
  });
});

// Exporta la aplicación como Cloud Function Gen 2
export const api = onRequest({
  region: "us-east1",
  memory: "256MiB",
  cpu: 1,
  timeoutSeconds: 60,
  maxInstances: 10,
  cors: true,
}, app);

export {
  getTranscriptionHistory,
  // ... otros exports ...
}; 