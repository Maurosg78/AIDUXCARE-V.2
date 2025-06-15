import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";

admin.initializeApp();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const patientsCollection = admin.firestore().collection("patients");

// POST /patients
app.post("/patients", async (req: Request, res: Response) => {
  try {
    const patientData = req.body;
    if (!patientData.name || !patientData.email || !patientData.phone || !patientData.birthDate || !patientData.reasonForConsultation) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientData.email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }
    const phoneRegex = /^\+56\s9\s\d{4}\s\d{4}$/;
    if (!phoneRegex.test(patientData.phone)) {
      res.status(400).json({ error: "Invalid phone format" });
      return;
    }
    const now = admin.firestore.Timestamp.now();
    const patientRef = await patientsCollection.add({
      ...patientData,
      createdAt: now,
      updatedAt: now
    });
    const patientDoc = await patientRef.get();
    const patient = { id: patientDoc.id, ...patientDoc.data() };
    res.status(201).json(patient);
  } catch (error) {
    console.error("Error in POST /patients:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
  }
});

// GET /patients/:id
app.get("/patients/:id", async (req: Request, res: Response) => {
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

// GET /patients
app.get("/patients", async (_req: Request, res: Response) => {
  try {
    const snapshot = await patientsCollection.get();
    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(patients);
  } catch (error) {
    console.error("Error in GET /patients:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
  }
});

// PUT /patients/:id
app.put("/patients/:id", async (req: Request, res: Response) => {
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

// DELETE /patients/:id
app.delete("/patients/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await patientsCollection.doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error("Error in DELETE /patients/:id:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
  }
});

// Exportar la app de Express como Cloud Function
export const createPatient = functions.https.onRequest(app);

export const getPatient = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Normalizar la URL para ignorar query params y trailing slashes
  const url = req.url.split("?")[0].replace(/\/$/, "");
  const idMatch = url.match(/^\/patients\/(.+)$/);

  try {
    // GET /patients/{id}
    if (req.method === "GET" && idMatch) {
      const id = idMatch[1];
      const doc = await patientsCollection.doc(id).get();
      if (!doc.exists) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }
      res.status(200).json({ id: doc.id, ...doc.data() });
      return;
    }

    // GET /patients
    if (req.method === "GET" && url === "/patients") {
      const snapshot = await patientsCollection.get();
      const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(patients);
      return;
    }

    // PUT /patients/{id}
    if (req.method === "PUT" && idMatch) {
      const id = idMatch[1];
      const updateData = req.body;
      updateData.updatedAt = admin.firestore.Timestamp.now();
      await patientsCollection.doc(id).update(updateData);
      const updatedDoc = await patientsCollection.doc(id).get();
      res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
      return;
    }

    // DELETE /patients/{id}
    if (req.method === "DELETE" && idMatch) {
      const id = idMatch[1];
      await patientsCollection.doc(id).delete();
      res.status(204).send();
      return;
    }

    // Ruta no encontrada
    res.status(404).json({ error: "Not found" });
  } catch (error) {
    console.error("Error in getPatient:", error);
    res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
  }
}); 