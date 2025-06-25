"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranscriptionHistory = exports.aiduxcareApi = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const clinicalNLP_1 = require("./routes/clinicalNLP");
const transcription_1 = require("./api/transcription");
Object.defineProperty(exports, "getTranscriptionHistory", { enumerable: true, get: function () { return transcription_1.getTranscriptionHistory; } });
const nlp_analysis_1 = require("./api/nlp-analysis");
admin.initializeApp();
const app = express();
// Configuración CORS más permisiva para desarrollo
app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
const patientsCollection = admin.firestore().collection("patients");
// Define la ruta POST para crear un paciente
app.post("/patients", async (req, res) => {
    try {
        const patientData = req.body;
        if (!patientData.name || !patientData.email || !patientData.phone ||
            !patientData.birthDate || !patientData.reasonForConsultation) {
            res.status(400).json({
                error: "Missing required fields",
                details: "name, email, phone, birthDate, and reasonForConsultation are required",
            });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientData.email)) {
            res.status(400).json({
                error: "Invalid email format",
            });
            return;
        }
        const phoneRegex = /^\+56\s9\s\d{4}\s\d{4}$/;
        if (!phoneRegex.test(patientData.phone)) {
            res.status(400).json({
                error: "Invalid phone format",
                details: "Phone must be in format: +56 9 XXXX XXXX",
            });
            return;
        }
        const now = admin.firestore.Timestamp.now();
        const patientRef = await patientsCollection.add(Object.assign(Object.assign({}, patientData), { createdAt: now, updatedAt: now }));
        const patientDoc = await patientRef.get();
        const patient = Object.assign({ id: patientDoc.id }, patientDoc.data());
        res.status(201).json(patient);
    }
    catch (error) {
        console.error("Error creating patient:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// Define la ruta GET para obtener todos los pacientes
app.get("/patients", async (req, res) => {
    try {
        const snapshot = await patientsCollection.get();
        const patients = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json(patients);
    }
    catch (error) {
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
        res.status(200).json(Object.assign({ id: doc.id }, doc.data()));
    }
    catch (error) {
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
        res.status(200).json(Object.assign({ id: updatedDoc.id }, updatedDoc.data()));
    }
    catch (error) {
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
    }
    catch (error) {
        console.error("Error in DELETE /patients/:id:", error);
        res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
    }
});
// === RUTAS DE TRANSCRIPCIÓN ===
app.post("/transcription", transcription_1.transcribeAudio);
app.get("/transcription/history/:sessionId", transcription_1.getTranscriptionHistory);
// === RUTAS DE NLP ===
app.post("/nlp-analysis", nlp_analysis_1.processNLPAnalysis);
app.get("/nlp-analysis/status/:sessionId", nlp_analysis_1.getNLPAnalysisStatus);
// === RUTAS DE CLINICAL NLP ===
app.use("/clinical-nlp", clinicalNLP_1.default);
// === ENDPOINT DE SALUD ===
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "aiduxcare-api-v2",
        version: "2.0.0",
        environment: "production",
    });
});
// Exporta la aplicación como Cloud Function Gen 2
exports.aiduxcareApi = (0, https_1.onRequest)({
    region: "us-east1",
    memory: "256MiB",
    cpu: 1,
    timeoutSeconds: 60,
    maxInstances: 10,
    cors: true,
}, app);
//# sourceMappingURL=index.js.map