# AiDuxCare — Fundamento Científico

Evidencia académica que respalda decisiones de diseño clínico.
Última actualización: 10 junio 2026.

---

## 1. Inconsistencia de outputs LLM → ClinicalRedFlagDetector determinista

**Fuente:**
Cross JL, Choma MA, Onofrey JA. "Bias in medical AI: Implications
for clinical decision-making." PLOS Digital Health 3(11), noviembre 2024.
DOI: 10.1371/journal.pdig.0000651

**Decisión respaldada:**
Los LLMs producen outputs diferentes con las mismas instrucciones
en sesiones distintas. En AiDux esto se manifestó como variabilidad
en red flags (2 en una sesión, 0 en otra con el mismo transcript).

Solución implementada: ClinicalRedFlagDetector.ts — capa determinista
que corre sobre texto deidentificado, independiente del estado del LLM.
5 reglas clínicas, 23 tests unitarios.

---

## 2. Bias de dominio → gate de revisión humana obligatorio

**Fuente:**
Cross JL et al. PLOS Digital Health, 2024 (ídem).
Norori N et al. "Addressing bias in big data and AI for health care:
A call for open science." Patterns 2, octubre 2021.
DOI: 10.1016/j.patter.2021.100347

**Decisión respaldada:**
Fisioterapia MSK en español está masivamente subrepresentada en
la literatura de IA clínica (>40% de publicaciones son en radiología).
Los LLMs base tienen conocimiento limitado del dominio específico.

Solución implementada: ningún dato entra al SOAP sin confirmación
del fisioterapeuta. El chip "Usar sugerencia" y [por confirmar] son
la materialización de este principio en la UI.

---

## 3. Alert fatigue → detector quirúrgico con reglas acotadas

**Fuente:**
Ueda D et al. "Fairness of artificial intelligence in healthcare:
review and recommendations." Japanese Journal of Radiology 42:3-15,
2024. DOI: 10.1007/s11604-023-01474-3

**Decisión respaldada:**
"Rejection bias": cuando el sistema genera demasiadas alertas,
el clínico desarrolla fatiga y las ignora. Reglas reducidas y
precisas son más clínicamente útiles que outputs masivos.

Solución implementada: 5 reglas deterministas en
ClinicalRedFlagDetector.ts, no alertas generadas por el LLM.
Diseño intencionalmente acotado, no exhaustivo.

---

## 4. Arquitectura híbrida determinista + LLM → pipeline modular

**Fuente:**
Prevención de incidentes en AI clínica: "Preventing Another Tessa:
Modular Safety Middleware For Health-Adjacent AI Assistants."
arXiv:2509.07022, 2025.
npj Digital Medicine, marzo 2026.

**Decisión respaldada:**
La literatura establece "lexical fast path para redlines obvios
+ LLM policy filter" como el patrón correcto para safety en sistemas
clínicos. No solo LLM, no solo determinismo.

Solución implementada: extractores modulares (medicación,
antecedentes) + ClinicalRedFlagDetector determinista + ClinicalOutputValidator
como guard post-modelo.

---

## 5. Participant-centered development → fisio como arquitecto del sistema

**Fuente:**
Norori N et al. Patterns 2, 2021 (ídem).
OpenAPS como caso de referencia: sistema de páncreas artificial
construido por comunidad de pacientes diabéticos.

**Decisión respaldada:**
"Human bias" es el más difícil de mitigar y requiere que quien diseña
entienda el dominio. Un equipo sin formación clínica replica sesgos
invisibles. El fisioterapeuta como arquitecto es la mitigación.

Posición de AiDux: 18 años de experiencia MSK codificados en el
pipeline clínico — no interpretados por ingenieros externos.

---

## 6. Alta calidad de outputs → ClinicalOutputValidator

**Fuente:**
Sehgal A (CDAO Mayo Clinic). "Mayo Clinic's Healthy Model for AI
Success." MIT Sloan Management Review, 2024.

**Decisión respaldada:**
"You need high-quality outputs in health care or you are in big
trouble. Even using GenAI to summarize emails can get you into trouble."

Solución implementada: ClinicalOutputValidator.ts como guard
post-modelo. MED_DROPPED_BY_MODEL detectado antes de llegar a UI.

---

## 7. Dominio subrepresentado → fine-tuning futuro con datos propios

**Fuente:**
Cross JL et al. PLOS Digital Health, 2024 (ídem).
Ueda D et al. Japanese Journal of Radiology, 2024 (ídem).

**Decisión respaldada:**
Los modelos base presentan sample selection bias cuando el
paciente real difiere del dataset de entrenamiento. El piloto en
España (pacientes MSK, español coloquial, Valencia) difiere
significativamente de los datos base de Gemini 2.5 Flash.

Decisión arquitectónica: cada confirmación del fisio sobre
medicación, red flags y hallazgos clínicos produce datos de
entrenamiento de alta calidad. Cuando se alcancen 100+ sesiones
etiquetadas, evaluar fine-tuning sobre modelos especializados
(ej. bsc-bio-ehr-es para español clínico).

---

## Referencias completas

1. Cross JL, Choma MA, Onofrey JA. Bias in medical AI: Implications
   for clinical decision-making. PLOS Digit Health. 2024;3(11):e0000651.

2. Ueda D et al. Fairness of artificial intelligence in healthcare:
   review and recommendations. Jpn J Radiol. 2024;42:3-15.

3. Norori N et al. Addressing bias in big data and AI for health care:
   A call for open science. Patterns. 2021;2:100347.

4. Wong A et al. External Validation of a Widely Implemented Proprietary
   Sepsis Prediction Model in Hospitalized Patients. JAMA Intern Med.
   2021;181(8):1065.

5. MIT Sloan Management Review. Mayo Clinic's Healthy Model for AI
   Success. 2024.

6. npj Digital Medicine. Barriers and opportunities of scaling ambient
   AI scribes for clinical documentation. Marzo 2026.
