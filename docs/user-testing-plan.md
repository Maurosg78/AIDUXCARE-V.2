# Plan de User Testing - AiDuxCare MVP
## Validación con Fisioterapeutas Reales

**Fecha de Inicio**: Inmediato (Junio 2025)  
**Estado del MVP**: ✅ Listo para Testing  
**Objetivo Principal**: Validar propuesta de valor y calidad de IA local

---

## 1. Objetivos de Testing

### 1.1 Objetivos Primarios
🎯 **Validar Propuesta de Valor Central**: "Facilitar el trabajo del fisio y asegurar la práctica"  
🎯 **Evaluar Calidad de IA Local**: Precisión de Ollama Llama 3.2 en contexto clínico real  
🎯 **Medir Usabilidad**: Interfaz, flujo de trabajo, curva de aprendizaje  
🎯 **Identificar Gaps Críticos**: Funcionalidades faltantes o problemáticas  

### 1.2 Objetivos Secundarios
📊 **Performance en Condiciones Reales**: Latencia, estabilidad, manejo de errores  
📊 **Diferenciación vs Competencia**: Ventajas percibidas del approach local  
📊 **Modelo de Negocio**: Disposición a pagar, features premium deseados  
📊 **Roadmap Validation**: Priorización de mejoras basada en feedback real  

---

## 2. Selección de Participantes

### 2.1 Perfil Target (3-5 Fisioterapeutas)
**Criterios de Inclusión**:
- ✅ **Fisioterapeutas activos** con práctica privada (enfoque MVP)
- ✅ **2+ años experiencia** clínica mínima
- ✅ **Familiaridad básica** con tecnología (smartphone, apps)
- ✅ **Disponibilidad** para 3-4 sesiones de testing (2 semanas)
- ✅ **Interés** en innovación y herramientas digitales

**Diversidad Deseable**:
- **Especialidades**: Ortopédica, deportiva, neurológica, geriátrica
- **Settings**: Consulta privada, clínica multidisciplinar, domicilio
- **Experiencia Tech**: Desde básica hasta avanzada
- **Edad**: 25-55 años (representativo del mercado)

### 2.2 Reclutamiento
**Estrategias**:
1. **Red Profesional de Mauricio**: Contactos directos en fisioterapia
2. **Colegios Profesionales**: Fisioterapeutas colegiados locales
3. **LinkedIn/Redes**: Búsqueda targeted de fisios innovadores
4. **Centros de Fisioterapia**: Outreach directo a clínicas
5. **Eventos/Congresos**: Networking en eventos de fisioterapia

**Incentivos**:
- 🎁 **Acceso gratuito** a AiDuxCare por 6 meses post-lanzamiento
- 🎁 **Créditos beta**: Influencia en roadmap de desarrollo
- 🎁 **Compensación**: 50-100€ por participación completa
- 🎁 **Networking**: Conexión con otros fisios innovadores

---

## 3. Metodología de Testing

### 3.1 Estructura del Testing (Por Participante)

**Duración Total**: 2 semanas por fisioterapeuta  
**Sesiones**: 4 sesiones de 1-2 horas cada una

#### **Sesión 1: Onboarding y Primera Impresión** (90 minutos)
- **Setup Técnico** (30 min): Instalación Ollama, configuración app
- **Demo Guiado** (30 min): Walkthrough de funcionalidades principales
- **Primera Prueba** (30 min): Sesión simulada con caso clínico simple

#### **Sesión 2: Testing con Casos Reales** (120 minutos)
- **Caso Clínico Real 1** (60 min): Paciente ortopédico típico
- **Caso Clínico Real 2** (60 min): Paciente con complejidad moderada
- **Feedback Inmediato** (15 min): Impresiones tras cada caso

#### **Sesión 3: Testing Avanzado y Edge Cases** (90 minutos)
- **Caso Complejo** (45 min): Paciente multisistémico o complicado
- **Testing de Límites** (30 min): Transcripciones largas, ruido, interrupciones
- **Features Específicos** (15 min): Agentes, sugerencias, alertas

#### **Sesión 4: Feedback Estructurado y Roadmap** (60 minutos)
- **Entrevista en Profundidad** (45 min): Cuestionario completo
- **Priorización Features** (15 min): Votación de mejoras deseadas

### 3.2 Casos de Uso para Testing

#### **Caso 1: Sesión Ortopédica Estándar**
**Paciente**: Dolor lumbar crónico, 45 años, oficinista
**Duración**: 45-60 minutos
**Incluye**: Anamnesis, exploración física, ejercicios, educación
**Testing**: Transcripción completa, generación SOAP, sugerencias

#### **Caso 2: Sesión Deportiva con Seguimiento**
**Paciente**: Lesión ligamentaria rodilla, deportista 28 años
**Duración**: 60 minutos
**Incluye**: Evaluación funcional, ejercicios específicos, planning return-to-sport
**Testing**: Entidades complejas, terminología específica, protocolos

#### **Caso 3: Sesión Neurológica Compleja**
**Paciente**: ACV reciente, hemiplejia, 65 años
**Duración**: 75 minutos
**Incluye**: Evaluación neurológica, ejercicios adaptativos, coordinación familiar
**Testing**: Contexto clínico complejo, múltiples intervenciones

#### **Caso 4: Edge Case - Sesión Interrumpida**
**Escenario**: Sesión con múltiples interrupciones, ruido de fondo
**Testing**: Robustez del STT, manejo de pausas, recuperación de contexto

---

## 4. Métricas y KPIs de Testing

### 4.1 Métricas Cuantitativas

#### **Performance Técnico**
- ⏱️ **Latencia STT**: Tiempo transcripción por minuto de audio
- ⏱️ **Tiempo Generación SOAP**: Segundos desde transcripción a nota completa
- ⏱️ **Tiempo Total Pipeline**: Audio → SOAP → Agentes → UI
- 📊 **Precisión Transcripción**: % palabras correctas vs transcripción manual
- 📊 **Calidad SOAP**: Scoring médico de notas generadas (1-10)
- 🔧 **Error Rate**: Fallos técnicos, crashes, timeouts

#### **Usabilidad (SUS Score + Custom)**
- 🎯 **Task Success Rate**: % tareas completadas sin ayuda
- ⏱️ **Time to Complete**: Minutos por tarea específica
- 🔄 **Learning Curve**: Mejora entre sesión 1 y 4
- 😊 **Satisfaction Score**: NPS específico por feature

### 4.2 Métricas Cualitativas

#### **Value Proposition Validation**
```
Escala 1-10 para cada afirmación:
- "AiDuxCare ahorra tiempo significativo en documentación"
- "Las notas SOAP generadas son precisas y útiles"
- "Las sugerencias de agentes mejoran mi práctica clínica"
- "Confío en la privacidad del sistema local"
- "Recomendaría AiDuxCare a colegas"
```

#### **Feature Prioritization**
```
Ranking de importancia (1-10):
- Precisión de transcripción
- Calidad de notas SOAP
- Sugerencias de tratamiento
- Alertas de seguridad
- Interfaz de usuario
- Velocidad del sistema
- Integración con otros software
- Features mobile
```

---

## 5. Instrumentos de Recolección de Datos

### 5.1 Formularios de Feedback

#### **Formulario Post-Sesión (Después de cada caso)**
```
CASO CLÍNICO: [Describir]
DURACIÓN TOTAL: [minutos]

TRANSCRIPCIÓN:
- Precisión: 1-10
- Velocidad: 1-10  
- Manejo interrupciones: 1-10
- Comentarios: [texto libre]

NOTA SOAP GENERADA:
- Precisión médica: 1-10
- Completitud: 1-10
- Utilidad clínica: 1-10
- ¿Requirió edición? Si/No + detalles

SUGERENCIAS DE AGENTES:
- Relevancia: 1-10
- Seguridad: 1-10
- Novedad/valor añadido: 1-10
- Comentarios específicos: [texto]

EXPERIENCIA GENERAL:
- Facilidad de uso: 1-10
- Ahorro de tiempo: 1-10
- Mejora calidad práctica: 1-10
- ¿Usarías en práctica real? Si/No/Tal vez
```

#### **Entrevista Final Estructurada (Sesión 4)**
```
SECCIÓN A: PROPUESTA DE VALOR
1. ¿Cuál es el mayor beneficio que ves en AiDuxCare?
2. ¿Qué problema principal resuelve en tu práctica?
3. ¿Cómo compara con tu método actual de documentación?
4. ¿Qué tan importante es que sea completamente local/privado?

SECCIÓN B: USABILIDAD Y WORKFLOW
5. ¿Cómo integrarías AiDuxCare en tu rutina diaria?
6. ¿Qué feature falta que sería crítico para ti?
7. ¿Qué cambiarías de la interfaz actual?
8. ¿Cuál es la curva de aprendizaje que experimentaste?

SECCIÓN C: CALIDAD CLÍNICA
9. ¿Confías en la precisión de las transcripciones?
10. ¿Las notas SOAP reflejan adecuadamente las sesiones?
11. ¿Las sugerencias de agentes son clínicamente relevantes?
12. ¿Detectaste algún error o sugerencia incorrecta?

SECCIÓN D: MODELO DE NEGOCIO
13. ¿Estarías dispuesto/a a pagar por AiDuxCare?
14. ¿Cuánto considerarías justo mensualmente?
15. ¿Qué features justificarían un precio premium?
16. ¿Preferirías suscripción o pago único?

SECCIÓN E: COMPETENCIA Y POSICIONAMIENTO
17. ¿Conoces otras herramientas similares?
18. ¿Qué ventaja ves en el approach local vs cloud?
19. ¿Cómo describirías AiDuxCare a un colega?
20. ¿Qué objeciones podrían tener otros fisioterapeutas?
```

### 5.2 Métodos de Observación

#### **Session Recording (Con Consentimiento)**
- 🎥 **Screen Recording**: Interacción con UI, navegación, errores
- 🎤 **Think-Aloud Protocol**: Verbalización de pensamientos durante uso
- 📊 **Analytics Tracking**: Clicks, tiempo en páginas, abandono de tareas
- 📝 **Observer Notes**: Frustraciones, confusiones, momentos "aha"

#### **Technical Logging**
- ⚙️ **Performance Logs**: Latencias reales, errores de sistema
- 🔍 **Error Tracking**: Screenshots automáticos en fallos
- 📈 **Usage Patterns**: Features más/menos utilizados
- 💾 **Data Quality**: Ejemplos de inputs/outputs para análisis

---

## 6. Logística y Coordinación

### 6.1 Setup Técnico por Participante

#### **Requisitos Previos**
- 💻 **Hardware**: Mac/PC con 8GB+ RAM (preferible 16GB)
- 🌐 **Conexión**: Internet estable para instalación inicial
- 🎧 **Audio**: Micrófono de calidad (headset recomendado)
- 🕐 **Tiempo**: 30-45 min para setup inicial

#### **Instalación Guiada**
```bash
# Script de instalación automatizada
1. Instalar Ollama: brew install ollama
2. Descargar modelo: ollama pull llama3.2:3b
3. Clonar AiDuxCare: git clone [repo]
4. Setup ambiente: npm install && npm run dev
5. Test funcionalidad: npm run test:ollama
```

#### **Support Channel**
- 📱 **WhatsApp/Telegram**: Soporte inmediato durante testing
- 📧 **Email**: Para issues no urgentes
- 🔗 **Video Call**: Sesiones de troubleshooting si necesario

### 6.2 Timeline de Ejecución

#### **Semana 1-2: Reclutamiento**
- Identificación y contacto inicial con fisioterapeutas
- Screening y selección final de 3-5 participantes
- Scheduling de sesiones individuales

#### **Semana 3-6: Testing Activo** 
- Ejecución de 4 sesiones por participante
- Recolección de datos en tiempo real
- Iteraciones menores basadas en feedback crítico

#### **Semana 7: Análisis y Síntesis**
- Procesamiento de datos cuantitativos
- Análisis cualitativo de entrevistas
- Identificación de patrones y insights

#### **Semana 8: Informe y Recomendaciones**
- Informe ejecutivo de resultados
- Roadmap actualizado basado en findings
- Presentación a stakeholders

---

## 7. Análisis de Resultados

### 7.1 Criterios de Éxito del MVP

#### **Métricas de Éxito Mínimo**
✅ **SUS Score > 70**: Usabilidad aceptable  
✅ **NPS > 0**: Recomendación neta positiva  
✅ **Task Success Rate > 80%**: Completitud de tareas principales  
✅ **SOAP Quality Score > 7/10**: Calidad clínica aceptable  
✅ **Willingness to Pay > 60%**: Viabilidad comercial  

#### **Métricas de Éxito Excepcional**
🏆 **SUS Score > 85**: Usabilidad excelente  
🏆 **NPS > 50**: Evangelistas activos  
🏆 **Zero Critical Bugs**: Estabilidad técnica completa  
🏆 **SOAP Quality Score > 8.5/10**: Calidad médica superior  
🏆 **Willingness to Pay > 80%**: Market-fit fuerte  

### 7.2 Framework de Decisiones Post-Testing

#### **Escenario 1: Éxito Excepcional (Score > 85%)**
**Decisión**: Acelerar go-to-market
**Acciones**: 
- Preparar lanzamiento beta público
- Iniciar Fase 2 de escalamiento (Whisper + Multi-user)
- Buscar funding para aceleración comercial

#### **Escenario 2: Éxito Mínimo (Score 70-85%)**
**Decisión**: Optimizar basado en feedback
**Acciones**:
- Implementar mejoras críticas identificadas
- Segunda ronda de testing con fixes
- Roadmap adjustado a findings

#### **Escenario 3: Necesita Mejoras (Score 50-70%)**
**Decisión**: Pivots menores necesarios
**Acciones**:
- Rediseño de features problemáticos
- Ajuste de propuesta de valor
- Testing adicional pre-launch

#### **Escenario 4: Replanteamiento (Score < 50%)**
**Decisión**: Revisión fundamental
**Acciones**:
- Análisis profundo de fallos
- Posible pivot de approach técnico
- Revalidación de market-fit

---

## 8. Deliverables del User Testing

### 8.1 Informes Ejecutivos

#### **Informe Intermedio (Semana 5)**
- Findings preliminares y tendencias
- Issues críticos que requieren acción inmediata
- Ajustes menores para sesiones restantes

#### **Informe Final (Semana 8)**
- Executive Summary para CTO/stakeholders
- Análisis detallado cuantitativo y cualitativo
- Recommendations específicas y priorizadas
- Roadmap actualizado con timelines

### 8.2 Assets para Marketing/Ventas

#### **Case Studies**
- Testimonios video de fisioterapeutas
- Casos de uso específicos documentados
- Métricas de ROI y ahorro de tiempo

#### **Product Demo Refinado**
- Demo actualizado basado en feedback
- Flows optimizados para onboarding
- Features highlights más relevantes

---

## 9. Consideraciones Éticas y Legales

### 9.1 Consentimiento Informado
- ✅ **Consentimiento grabación**: Audio/video de sesiones
- ✅ **Uso de datos**: Análisis interno y mejoras de producto
- ✅ **Anonimización**: Protección identidad participantes
- ✅ **Derecho retiro**: Posibilidad de abandonar en cualquier momento

### 9.2 Privacidad de Datos Médicos
- 🔒 **GDPR Compliance**: Manejo según regulación europea
- 🔒 **Datos locales**: Todo procesamiento en dispositivo participante
- 🔒 **No transmisión**: Datos clínicos no salen del device
- 🔒 **Borrado post-testing**: Limpieza completa tras finalización

### 9.3 Responsabilidad Clínica
- ⚖️ **Disclaimer médico**: AiDuxCare como asistente, no reemplazo del juicio clínico
- ⚖️ **Supervisión profesional**: Fisioterapeuta mantiene responsabilidad clínica total
- ⚖️ **Casos simulados**: Preferencia por casos simulados vs pacientes reales para minimizar riesgos

---

## 10. Next Steps Inmediatos

### 10.1 Acciones para Mauricio (Semana 1)
1. **Identificar red de contactos** fisioterapeutas potenciales
2. **Crear calendario** de disponibilidad para sesiones
3. **Preparar incentivos** y compensation structure
4. **Definir casos clínicos** reales/simulados a utilizar

### 10.2 Acciones para Claude (Semana 1) 
1. **Finalizar script instalación** automatizada Ollama
2. **Crear guías usuario** para fisioterapeutas no-técnicos
3. **Implementar analytics** básicos para tracking de uso
4. **Preparar formularios** digitales para feedback collection

### 10.3 Recursos Necesarios
- 💰 **Budget**: 500-1000€ para compensación participantes
- ⏰ **Tiempo Mauricio**: 20-30 horas spread over 8 semanas
- 💻 **Tech Setup**: Scripts instalación + documentación soporte

---

**ESTADO**: ✅ PLAN APROBADO - LISTO PARA EJECUCIÓN INMEDIATA

**CONTACTO URGENTE**: Iniciar outreach fisioterapeutas esta semana para comenzar testing ASAP 