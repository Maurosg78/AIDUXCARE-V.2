/**
 * Referral Report (ES) - Section Builder
 *
 * Transforms ReferralReportData (clinical facts) into
 * ReferralReportSections (structured sections), without
 * any rendering or transport concerns.
 *
 * Rule: every statement MUST be directly derived from
 * recorded clinical data or explicit clinician input.
 */

import type { ReferralReportData, ReferralReportSections } from './types';

export function buildReferralReportEsSections(data: ReferralReportData): ReferralReportSections {
  const headerLines: string[] = [];
  const findingsLines: string[] = [];
  const treatmentLines: string[] = [];
  let alertLines: string[] | undefined;

  // Header: patient + episode
  const paciente = data.paciente;
  let headerLine = `Paciente: ${paciente.nombre}`;
  if (typeof paciente.edad === 'number') {
    headerLine += `, ${paciente.edad} años`;
  }
  headerLines.push(headerLine);

  if (data.sessionDate) {
    headerLines.push(`Fecha de sesión: ${data.sessionDate}`);
  }

  if (data.episodio?.motivoPrincipal || data.episodio?.fechaInicio) {
    let episodioLine = 'Episodio: ';
    if (data.episodio.motivoPrincipal) {
      episodioLine += data.episodio.motivoPrincipal;
    } else {
      episodioLine += 'Motivo no especificado';
    }
    if (data.episodio.fechaInicio) {
      episodioLine += `. Primera valoración: ${data.episodio.fechaInicio}.`;
    }
    headerLines.push(episodioLine);
  }

  // Diagnosis paragraph (observational wording only)
  let diagnosisParagraph: string | undefined;
  if (data.diagnosticoFuncional || data.antecedentesRelevantes) {
    let diag = 'Impresión clínica documentada por el fisioterapeuta: ';
    if (data.diagnosticoFuncional) {
      diag += data.diagnosticoFuncional.trim();
      if (!diag.endsWith('.')) diag += '.';
    } else {
      diag += 'No especificado.';
    }
    if (data.antecedentesRelevantes) {
      const antecedentes = data.antecedentesRelevantes.trim();
      if (antecedentes.length > 0) {
        diag += ` Antecedentes relevantes: ${antecedentes}`;
        if (!diag.endsWith('.')) diag += '.';
      }
    }
    diagnosisParagraph = diag;
  }

  // Evolution paragraph
  let evolutionParagraph: string | undefined;
  if (data.evolucionTextoLibre) {
    const txt = data.evolucionTextoLibre.trim();
    if (txt) {
      // If this looks like a generic neurological red flag, route it to alert instead.
      if (/compromiso neurol[oó]gico grave/i.test(txt)) {
        alertLines = [txt];
      } else {
        evolutionParagraph = `Evolución: ${txt}`;
      }
    }
  } else if (data.dolor || (data.movilidad && data.movilidad.length)) {
    const evoParts: string[] = [];
    if (data.dolor?.inicial != null && data.dolor.actual != null) {
      let part = `Desde la evaluación inicial, el dolor ha pasado de ${data.dolor.inicial}/10 a ${data.dolor.actual}/10`;
      if (data.dolor.contexto) {
        part += ` ${data.dolor.contexto}`;
      }
      part += '.';
      evoParts.push(part);
    } else if (data.dolor?.cursoTextoLibre) {
      const txt = data.dolor.cursoTextoLibre.trim();
      if (txt) evoParts.push(txt);
    }

    const firstMob = data.movilidad?.[0];
    if (firstMob?.rangoInicial && firstMob.rangoActual) {
      const part = `La movilidad de ${firstMob.segmento} ha cambiado de ${firstMob.rangoInicial} a ${firstMob.rangoActual}.`;
      evoParts.push(part);
    }

    if (evoParts.length > 0) {
      evolutionParagraph = `Evolución: ${evoParts.join(' ')}`;
    }
  }

  // Findings: dolor
  if (data.dolor?.localizacion || data.dolor?.irradiacion) {
    const parts: string[] = [];
    if (data.dolor.localizacion) parts.push(data.dolor.localizacion);
    if (data.dolor.irradiacion) parts.push(data.dolor.irradiacion);
    if (parts.length) {
      findingsLines.push(`- Dolor: ${parts.join(', ')}.`);
    }
  }

  // Findings: movilidad
  if (data.movilidad && data.movilidad.length) {
    const descr = data.movilidad
      .slice(0, 2)
      .map((m) => {
        const ranges = [m.rangoInicial, m.rangoActual].filter(Boolean).join(' → ');
        return ranges ? `${m.segmento}: ${ranges}` : m.segmento;
      })
      .join('; ');
    if (descr) {
      findingsLines.push(`- Movilidad: ${descr}.`);
    }
  }

  // Findings: tests
  if (data.tests && data.tests.length) {
    const testsDescr = data.tests
      .slice(0, 3)
      .map((t) => `${t.nombre}: ${t.resultado}`)
      .join('; ');
    if (testsDescr) {
      findingsLines.push(`- Tests clínicos: ${testsDescr}.`);
    }
  }

  // Treatment
  if (data.tratamiento?.ejercicios && data.tratamiento.ejercicios.length) {
    const val = data.tratamiento.ejercicios.slice(0, 3).join('; ');
    if (val) treatmentLines.push(`- Ejercicio terapéutico: ${val}.`);
  }
  if (data.tratamiento?.tecnicasManuales && data.tratamiento.tecnicasManuales.length) {
    const val = data.tratamiento.tecnicasManuales.slice(0, 3).join('; ');
    if (val) treatmentLines.push(`- Terapia manual / técnicas: ${val}.`);
  }
  if (data.tratamiento?.educacion && data.tratamiento.educacion.length) {
    const val = data.tratamiento.educacion.slice(0, 3).join('; ');
    if (val) treatmentLines.push(`- Educación: ${val}.`);
  }

  // Plan (must reflect only plan documented in SOAP / clinical note)
  let planParagraph: string | undefined;
  if (data.plan) {
    if (data.plan.textoLibre) {
      const txt = data.plan.textoLibre.trim();
      if (txt) planParagraph = `Plan documentado en la sesión: ${txt}`;
    } else {
      const parts: string[] = [];
      // Preserve only fields that explicitly appear in recorded plan
      if (data.plan.objetivoPrincipal) {
        let part = `Objetivo: ${data.plan.objetivoPrincipal}`;
        if (!part.endsWith('.')) part += '.';
        parts.push(part);
      }
      if (data.plan.recomendacionesRevision) {
        let part = `Revisión documentada: ${data.plan.recomendacionesRevision}`;
        if (!part.endsWith('.')) part += '.';
        parts.push(part);
      }
      if (parts.length) {
        planParagraph = `Plan: ${parts.join(' ')}`;
      }
    }
  }

  return {
    headerLines,
    alertLines,
    diagnosisParagraph,
    evolutionParagraph,
    findingsLines,
    treatmentLines,
    planParagraph,
  };
}

