# Aidux North — Copiloto Administrativo (Módulo Premium Futuro)
Market: CA | Language: en-CA | Compliance: PHIPA/PIPEDA | SoT lineage: draft for future development

---

# 1. Identidad Fundamental del Producto

Aidux North no es un EMR ni una plataforma de cobros.  
Aidux North sí es un copiloto clínico-legal que ayuda al fisioterapeuta a:
- documentar correctamente,
- cumplir estándares regulatorios,
- protegerse legalmente,
- aumentar calidad clínica,
- reducir trabajo administrativo.

El eventual módulo administrativo será un *add-on premium*, opcional, ligero y no invasivo.  
Su objetivo no será reemplazar sistemas de cobro ni agendas corporativas, sino **ayudar al fisioterapeuta a mantener su práctica en orden de forma personal e inteligente**.

---

# 2. Rol del Módulo Administrativo (Add-On Premium)

El módulo NO:
- factura,
- cobra,
- procesa pagos,
- integra bancos,
- reemplaza EMRs,
- gestiona seguros.

El módulo SÍ:
- organiza información,
- genera claridad sobre el trabajo realizado,
- estima valores (si el profesional ingresa sus tarifas),
- muestra estadísticas personales,
- ayuda a entender carga laboral y proyección mensual,
- recomienda provisiones fiscales mínimas.

Todo sin interferir con el core clínico-legal.

---

# 3. Estructura del Producto (Core + Add-On)


---

# 4. Componentes del Módulo Administrativo

## 4.1 Registro Inteligente de Práctica

Aidux infiere automáticamente:
- qué paciente fue visto,
- duración real de sesión,
- tipo de sesión (evaluación, seguimiento),
- técnicas utilizadas (ondas de choque, EPI, etc.),
- modalidad (presencial, tele, hospital).

El profesional **no debe duplicar trabajo**.

---

## 4.2 Agenda Simplificada

No es un scheduler completo.  
Solo:
- lista del día,
- marcar “visto / no acudió”,
- sugerencia de próxima sesión,
- diferencia entre planificado y realizado.

Sin multiusuario ni calendarios complejos.

---

## 4.3 Estimación Económica (Opcional)

Solo si el fisio quiere ingresar sus tarifas.

Aidux calcula:
- valor estimado por sesión según duración,
- extras aplicados,
- proyección semanal/mensual.

No cobra, no factura, no envía recibos.

---

## 4.4 Recomendaciones Fiscales Básicas

Información **orientativa**, no contable.

Ejemplos:
- Ontario: sugerencia 13% para provisión.
- Provincias con HST/GST: cálculo simple.

Sin almacenamiento contable regulado.

---

## 4.5 Panel de Práctica Profesional

Incluye:
- horas trabajadas,
- número de pacientes,
- técnicas especiales aplicadas,
- ingresos estimados,
- sugerencias de organización.

---

# 5. Filosofía del Módulo Administrativo

> **Si el profesional ya hizo el trabajo clínico, Aidux North debe hacer el trabajo administrativo por él.**

Evita doble registro y mantiene el sistema ligero.

---

# 6. Qué No Será Este Módulo (Restricciones Estratégicas)

Para mantener foco y seguridad legal:

- No procesará pagos.
- No reemplazará sistemas de facturación.
- No gestionará seguros.
- No integrará bancos.
- No almacenará datos contables regulados.
- No exportará facturas oficiales.
- No dará asesoría fiscal.

Solo proveerá **organización, análisis y claridad personal**.

---

# 7. Beneficios Estratégicos

- Real ayuda al profesional sin complejidad.
- Zero riesgo legal.
- Escalable como add-on premium.
- Mantiene clara la identidad de Aidux:
  **copiloto clínico-legal + asistente administrativo inteligente**.
- No compite con EMRs.
- No requiere certificaciones institucionales.
- Incrementa retención (stickiness) del producto.

---

# 8. Próximos Pasos (cuando el desarrollo sea aprobado)

1. Crear `ROADMAP_OPS` (documento oficial).
2. De
# 8. Próximos Pasos (cuando el desarrollo sea aprobado)

1. Crear `ROADMAP_OPS` (documento oficial).
2. Definir arquitectura ligera en `src/modules/ops/*`.
3. Diseñar UI mínima (agenda + panel de práctica).
4. Integrar inferencias con Niagara (solo metadata).
5. Definir tarifas base + extras configurables.
6. Crear panel semanal/mensual.
7. Validación con fisios reales.

---

# 9. Conclusión

Este documento establece la visión del futuro **Copiloto Administrativo de Aidux North**:

- Ligero.
- Útil.
- 100% opcional.
- No invasivo.
- Sin cruzar la línea hacia EMRs o facturación.
- Diseñado para darle al fisioterapeuta orden en toda su práctica, no solo en la parte clínica.

Queda registrado como documento oficial para desarrollo futuro.
