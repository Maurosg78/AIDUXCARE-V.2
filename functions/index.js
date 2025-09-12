const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

exports.analyzeTranscript = functions
  .region("northamerica-northeast1")
  .https.onRequest((request, response) => {
    cors(request, response, async () => {
      try {
        // Mock response para desarrollo
        const mockResponse = {
          motivo_consulta: "Consulta procesada exitosamente",
          hallazgos_clinicos: ["Hallazgo 1", "Hallazgo 2", "Hallazgo 3"],
          evaluaciones_fisicas_sugeridas: [
            {
              test: "Test de Lasègue",
              sensibilidad: 0.91,
              especificidad: 0.26,
              tecnica: "Elevación de pierna",
              interpretacion: "Evaluar radiculopatía"
            },
            {
              test: "Test de FABER",
              sensibilidad: 0.77,
              especificidad: 0.82,
              tecnica: "Flexión-abducción",
              interpretacion: "Evaluar sacroilíaca"
            },
            {
              test: "Test de Schober",
              sensibilidad: 0.83,
              especificidad: 0.75,
              tecnica: "Flexión lumbar",
              interpretacion: "Evaluar movilidad"
            }
          ],
          plan_tratamiento: {
            inmediato: ["Evaluación completa"],
            corto_plazo: ["Seguimiento semanal"],
            seguimiento: "1 semana"
          }
        };
        
        response.json({ 
          text: JSON.stringify(mockResponse),
          result: JSON.stringify(mockResponse)
        });
      } catch (error) {
        response.status(500).json({ error: error.message });
      }
    });
  });
