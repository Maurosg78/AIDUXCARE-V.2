import { analyzeWithVertexProxy } from './vertex-ai-service-firebase';
import type { CertificateEsData } from '@/types/certificate.es';

function extractGeneratedText(responseData: unknown): string {
  const rawResponse = responseData as Record<string, unknown> | null;
  const textValue = typeof rawResponse?.text === 'string' ? rawResponse.text : null;
  const directString = typeof responseData === 'string' ? responseData : null;
  const candidates = rawResponse?.candidates as Array<Record<string, unknown>> | undefined;
  const firstCandidate = candidates?.[0];
  const firstContent = firstCandidate?.content as Record<string, unknown> | undefined;
  const parts = firstContent?.parts as Array<Record<string, unknown>> | undefined;
  const firstPart = parts?.[0];
  const partText = typeof firstPart?.text === 'string' ? firstPart.text : null;
  const resolvedText = textValue || directString || partText || '';
  const trimmedText = resolvedText.trim();

  return trimmedText;
}

function parseCertificateBody(rawText: string): string {
  const trimmedText = rawText.trim();

  try {
    const parsed = JSON.parse(trimmedText) as {
      certificado_clinico_cuerpo?: string;
      certificado_clinico?: { cuerpo?: string } | string;
      cuerpo?: string;
    };
    const flatKey = typeof parsed.certificado_clinico_cuerpo === 'string' ? parsed.certificado_clinico_cuerpo : null;
    const nestedKey = typeof parsed.certificado_clinico === 'object' && parsed.certificado_clinico !== null && typeof parsed.certificado_clinico.cuerpo === 'string' ? parsed.certificado_clinico.cuerpo : null;
    const stringDirectKey = typeof parsed.certificado_clinico === 'string' ? parsed.certificado_clinico : null;
    const directKey = typeof parsed.cuerpo === 'string' ? parsed.cuerpo : null;
    const resolvedBody = flatKey ?? nestedKey ?? stringDirectKey ?? directKey ?? trimmedText;
    const cleanText = resolvedBody.replace(/\\n/g, '\n');

    return cleanText;
  } catch {
    const cleanText = trimmedText.replace(/\\n/g, '\n');

    return cleanText;
  }
}

export async function generateCertificateBodyEs(
  data: CertificateEsData,
  soapAssessment: string,
): Promise<string> {
  const prompt = `Eres un asistente clínico para fisioterapeutas en España.
Genera el cuerpo de un certificado clínico en español formal.
Responde ÚNICAMENTE con el texto del certificado. Sin JSON, sin llaves, sin comillas, sin estructura. Solo el texto clínico directamente.
Tono: directo, causa-efecto. NO uses lenguaje legal ni notarial.
Máximo 120 palabras.
Estructura: 1 párrafo contexto clínico + 1 párrafo indicaciones/restricciones.
No inventes datos no presentes en el SOAP.
No incluyas encabezado, firma, fecha, nombre del paciente, nombre del fisioterapeuta, número de colegiado ni institución destinataria.
No empieces con "El presente certificado se emite..." ni con fórmulas de identificación nominal. Ese bloque lo compone el frontend.
No uses siglas en inglés (WAD, ROM, AINE, HEP, etc.). Usa siempre el término en español: WAD → cervicalgia post-traumática, ROM → rango de movimiento, HEP → programa de ejercicios en casa, AINE → antiinflamatorio no esteroideo.

TIPO: ${data.tipo}
PACIENTE: ${data.paciente.nombre}
INSTITUCIÓN DESTINATARIA: ${data.institucionDestinataria}
DETALLES ESPECÍFICOS: ${data.detallesEspecificos}
VALORACIÓN CLÍNICA (SOAP): ${soapAssessment}`;
  const traceId = `certificate-es|${data.tipo}|${Date.now()}`;
  const response = await analyzeWithVertexProxy({
    action: 'analyze',
    prompt,
    traceId,
    market: 'ES',
  });
  const rawText = extractGeneratedText(response);
  const generatedText = parseCertificateBody(rawText);
  const fallbackText = 'No se pudo generar el borrador del certificado.';
  const resolvedText = generatedText || fallbackText;

  return resolvedText;
}
