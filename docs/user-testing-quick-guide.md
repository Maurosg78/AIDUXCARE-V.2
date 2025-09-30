# Guía Rápida - User Testing AiDuxCare
## Para Fisioterapeutas Participantes

**¡Bienvenido/a al User Testing de AiDuxCare!** 🎯  
**Tu contribución es fundamental para crear el mejor asistente clínico para fisioterapeutas.**

---

## 🎯 ¿Qué es AiDuxCare?

**AiDuxCare** es un asistente clínico inteligente que utiliza **Inteligencia Artificial 100% local** para:

✅ **Transcribir automáticamente** tus sesiones con pacientes  
✅ **Generar notas SOAP** profesionales y completas  
✅ **Sugerir tratamientos** basados en evidencia clínica  
✅ **Alertar sobre** contraindicaciones y signos de alarma  
✅ **Mantener privacidad total** - Los datos nunca salen de tu dispositivo  

---

## 📋 Qué Necesitas

### Hardware Mínimo
- **Mac**: MacBook Air M1+ (8GB RAM) o iMac
- **PC**: Intel i5+ o AMD Ryzen 5+ con 8GB RAM
- **Espacio**: 10GB libres en disco
- **Micrófono**: Headset o micrófono de calidad
- **Internet**: Solo para instalación inicial

### Tiempo Requerido
- **Instalación**: 30-45 minutos (una sola vez)
- **Testing**: 4 sesiones de 1-2 horas durante 2 semanas
- **Total**: ~8 horas spread over 2 semanas

---

## 🚀 Instalación Super Rápida

### Para Mac (Recomendado)
```bash
# Abre Terminal y ejecuta:
curl -fsSL https://raw.githubusercontent.com/mauriciosobarzo/AIDUXCARE-V.2/main/scripts/install-aiduxcare.sh | bash
```

### Para Windows
```powershell
# Abre PowerShell como Administrador y ejecuta:
iwr -useb https://raw.githubusercontent.com/mauriciosobarzo/AIDUXCARE-V.2/main/scripts/install-aiduxcare.ps1 | iex
```

### ¿Problemas con la Instalación?
📱 **WhatsApp/Telegram**: [NÚMERO_SOPORTE]  
📧 **Email**: mauricio@aiduxcare.com  
🔗 **Video Call**: Programaremos sesión de soporte individual

---

## 📅 Cronograma de Testing

### **Sesión 1**: Onboarding (90 min)
**Objetivo**: Familiarizarte con AiDuxCare
- ✅ Verificar instalación y configuración
- ✅ Demo guiado de todas las funcionalidades
- ✅ Primera prueba con caso clínico simple
- ✅ Resolver dudas técnicas

### **Sesión 2**: Casos Reales (120 min)
**Objetivo**: Testing con tu práctica real
- ✅ Caso ortopédico típico (60 min)
- ✅ Caso con complejidad moderada (60 min)
- ✅ Feedback inmediato después de cada caso

### **Sesión 3**: Testing Avanzado (90 min)
**Objetivo**: Probar límites y casos complejos
- ✅ Caso clínico complejo (45 min)
- ✅ Testing de edge cases (ruido, interrupciones) (30 min)
- ✅ Exploración de features específicos (15 min)

### **Sesión 4**: Feedback Final (60 min)
**Objetivo**: Recoger tu evaluación completa
- ✅ Entrevista estructurada sobre experiencia (45 min)
- ✅ Priorización de mejoras futuras (15 min)

---

## 🎯 Qué Vamos a Evaluar Juntos

### **Usabilidad**
- ¿Es fácil de usar sin formación técnica?
- ¿Se integra bien en tu workflow actual?
- ¿La curva de aprendizaje es razonable?

### **Calidad Clínica**
- ¿Las transcripciones son precisas?
- ¿Las notas SOAP reflejan correctamente las sesiones?
- ¿Las sugerencias de agentes son relevantes y seguras?

### **Propuesta de Valor**
- ¿Realmente ahorra tiempo en documentación?
- ¿Mejora la calidad de tu práctica clínica?
- ¿Es algo que usarías en tu día a día?

### **Privacidad y Confianza**
- ¿Te sientes cómodo/a con el sistema local?
- ¿Confías en que los datos no salen de tu dispositivo?

---

## 💡 Tips para Maximizar el Testing

### **Antes de Cada Sesión**
- 🔧 Asegúrate de que AiDuxCare esté funcionando
- 🎧 Prueba tu micrófono/headset
- 📝 Ten casos clínicos reales o simulados preparados
- ☕ Dedica tiempo sin interrupciones

### **Durante el Testing**
- 🗣️ **Think-aloud**: Verbaliza lo que piensas mientras usas la app
- 🐛 **Reporta errores**: Cualquier bug o comportamiento extraño
- 💭 **Comparte opiniones**: Tanto positivas como negativas
- ❓ **Pregunta**: No hay preguntas tontas

### **Tipos de Casos Ideales para Testing**
- 📋 **Sesión estándar**: Anamnesis + exploración + tratamiento
- 🏃 **Caso deportivo**: Lesión específica + return-to-sport
- 🧠 **Caso neurológico**: Evaluación compleja + ejercicios adaptativos
- ⚠️ **Caso con alertas**: Signos de alarma + derivaciones

---

## 🎁 Beneficios de Participar

### **Acceso Anticipado**
- ✅ **6 meses gratis** de AiDuxCare post-lanzamiento
- ✅ **Influencia directa** en el roadmap de desarrollo
- ✅ **Early adopter status** con features exclusivos

### **Compensación**
- 💰 **50-100€** por participación completa
- 🎓 **Certificado** de colaboración en innovación clínica
- 🤝 **Networking** con otros fisioterapeutas innovadores

### **Impacto Profesional**
- 🔬 **Contribuir** al futuro de la fisioterapia digital
- 📚 **Aprender** sobre IA aplicada a salud
- 🏆 **Ser pionero** en adopción de tecnología clínica

---

## 🔧 Comandos Básicos

### **Iniciar AiDuxCare**
```bash
cd ~/AiDuxCare
./start-aiduxcare.sh
```

### **Acceder a la Aplicación**
Abre tu navegador en: **http://localhost:5173**

### **Parar AiDuxCare**
```bash
cd ~/AiDuxCare
./stop-aiduxcare.sh
```

### **Verificar que Todo Funciona**
```bash
cd ~/AiDuxCare
npm run test:ollama
```

---

## 🆘 Soporte Inmediato

### **Canal Principal: WhatsApp/Telegram**
- 📱 **Respuesta**: < 2 horas durante horario laboral
- 🔧 **Tipo**: Troubleshooting técnico, dudas de uso
- 🎯 **Disponibilidad**: Lunes a Viernes 9:00-18:00

### **Video Calls de Soporte**
- 📹 **Plataforma**: Zoom/Google Meet
- ⏰ **Duración**: 15-30 minutos
- 🎯 **Para**: Issues complejos que requieren screen sharing

### **Email para No Urgentes**
- 📧 **mauricio@aiduxcare.com**
- ⏰ **Respuesta**: < 24 horas
- 📋 **Tipo**: Feedback detallado, sugerencias, documentación

---

## 📊 Formularios de Feedback

### **Post-Sesión (Rápido - 5 min)**
Después de cada caso clínico completarás un formulario corto sobre:
- Precisión de transcripción (1-10)
- Calidad de nota SOAP (1-10)
- Relevancia de sugerencias (1-10)
- Experiencia general (1-10)

### **Entrevista Final (Detallada - 45 min)**
En la Sesión 4 tendremos una conversación estructurada sobre:
- Propuesta de valor percibida
- Integración en workflow
- Calidad clínica
- Modelo de negocio
- Comparación con competencia

---

## 🎯 Casos de Uso Específicos para Testing

### **Caso Tipo 1: Dolor Lumbar Crónico**
```
Paciente: 45 años, oficinista
Duración: 45-60 minutos
Incluye: Anamnesis + exploración + ejercicios + educación
Testing: Transcripción completa → SOAP → sugerencias
```

### **Caso Tipo 2: Lesión Deportiva**
```
Paciente: 28 años, futbolista amateur
Duración: 60 minutos  
Incluye: Evaluación funcional + ejercicios específicos + RTP
Testing: Entidades complejas + terminología específica
```

### **Caso Tipo 3: Rehabilitación Neurológica**
```
Paciente: 65 años, post-ACV
Duración: 75 minutos
Incluye: Evaluación neuro + ejercicios adaptativos + familia
Testing: Contexto clínico complejo + múltiples intervenciones
```

---

## ❓ FAQ Rápido

### **¿Es seguro para mis datos?**
✅ **100% Local**: Todo se procesa en tu dispositivo  
✅ **Zero Cloud**: Los datos nunca salen de tu Mac/PC  
✅ **GDPR Compliant**: Cumplimiento total de privacidad  

### **¿Qué pasa si tengo problemas técnicos?**
🛠️ **Soporte 24/7**: WhatsApp/Telegram disponible  
🔄 **Backup plan**: Instancia centralizada como fallback  
📞 **Video support**: Screen sharing para debugging  

### **¿Afecta al rendimiento de mi ordenador?**
⚡ **Optimizado**: Diseñado para M1 Macs (ideal)  
💾 **Ligero**: ~3GB de RAM cuando está activo  
🔋 **Eficiente**: No afecta otros programas  

### **¿Puedo usar datos de pacientes reales?**
✅ **Sí, con consentimiento**: Privacidad garantizada  
✅ **Casos simulados**: También válidos para testing  
✅ **Anonimización**: Recomendado usar nombres ficticios  

---

## 🚀 ¡Empezamos Cuando Quieras!

**¿Listo/a para ser pionero/a en la próxima generación de asistentes clínicos?**

1. **Ejecuta** el script de instalación
2. **Contacta** via WhatsApp cuando esté listo
3. **Programa** tu primera sesión de onboarding
4. **¡Empieza** a hacer historia en fisioterapia digital!

---

**🎯 Tu feedback directo determinará el futuro de AiDuxCare y la digitización de la fisioterapia.** 

**¡Gracias por ser parte de esta revolución clínica!** 🙌 