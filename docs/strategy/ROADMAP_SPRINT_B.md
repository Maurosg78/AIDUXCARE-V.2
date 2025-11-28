# 🧭 ROADMAP TÉCNICO - Sprint B

## **Estado Actual: ✅ BASE SÓLIDA ESTABLECIDA**

La reversión controlada ha establecido una base sólida y confiable para el desarrollo continuo.

---

## **🎯 Objetivos Sprint B**

### **1. Frontend: Ciclo del Assistant Global**
- **Panel persistente** en `LayoutWrapper` con toggle
- **`assistantAdapter`** con routing data/free
- **Integración** con endpoints canónicos establecidos

### **2. Testing: Cobertura Completa**
- **`tests/assistant/assistantDataLookup.emu.spec.ts`** (Emulator)
- **`tests/assistant/routeQuery.spec.ts`** (Router intents)
- **Smoke tests** automatizados en CI/CD

### **3. Auditoría: Métricas Operacionales**
- **Métrica diaria** de invocaciones
- **Latencia media** por función
- **Dashboard** de consultas a `auditLogs`

---

## **🔧 Arquitectura Establecida**

### **Endpoints Canónicos**
```
POST /assistantQuery
POST /assistantDataLookup
```

### **Estructura de Código**
```
functions/
├── src/
│   ├── index.ts          # Exports canónicos
│   ├── assistantQuery.ts # Lógica principal
│   ├── assistantDataLookup.ts # Búsqueda de datos
│   └── auditLogger.ts    # Logging de auditoría
└── lib/                  # Compilado
```

### **Configuración**
- **Region**: `europe-west1`
- **Runtime**: `nodejs20`
- **Source**: `functions/` único

---

## **🧪 Testing Strategy**

### **Local Development**
```bash
# Verificación rápida
./tools/smoke-functions.sh

# Emuladores completos
firebase emulators:start --only auth,firestore,functions
```

### **CI/CD Pipeline**
- **Pre-commit hooks** activos
- **Smoke tests** en cada build
- **Validación** de naming canónico

---

## **📊 Métricas y Monitoreo**

### **KPIs Operacionales**
- **Throughput**: Invocaciones por minuto
- **Latencia**: Tiempo de respuesta promedio
- **Error Rate**: Porcentaje de fallos
- **Availability**: Uptime de las funciones

### **Logs de Auditoría**
- **Acceso a datos** clínicos
- **Consultas del assistant** (con hash de input)
- **Métricas de rendimiento** por función

---

## **🚀 Despliegue y Operaciones**

### **UAT Environment**
```bash
# Despliegue automatizado
./tools/deploy-uat.sh

# Verificación post-deploy
curl -X POST https://europe-west1-aiduxcare-v2-uat-dev.cloudfunctions.net/assistantQuery
```

### **Production Ready**
- **Health checks** implementados
- **Circuit breakers** para dependencias externas
- **Rate limiting** por usuario/IP

---

## **🛡️ Seguridad y Compliance**

### **HIPAA/GDPR**
- **Logs de auditoría** completos
- **Cifrado** de datos sensibles
- **Access control** granular

### **Monitoring**
- **Alertas** automáticas para anomalías
- **Backup** automático de logs
- **Retención** configurada por compliance

---

## **📋 Checklist Sprint B**

### **Frontend Integration**
- [ ] Panel assistant en LayoutWrapper
- [ ] Toggle persistente implementado
- [ ] Routing data/free en assistantAdapter
- [ ] Integración con endpoints canónicos

### **Testing Coverage**
- [ ] Tests de emulator para assistantDataLookup
- [ ] Tests de router para intents
- [ ] Smoke tests en CI/CD pipeline
- [ ] Coverage > 90%

### **Operational Excellence**
- [ ] Métricas de invocaciones diarias
- [ ] Dashboard de latencia media
- [ ] Alertas automáticas configuradas
- [ ] Logs de auditoría operativos

---

## **🎯 Success Criteria**

### **Funcional**
- Assistant global completamente integrado
- Routing de intents funcionando
- Métricas operacionales visibles

### **Técnico**
- Tests cubriendo >90% del código
- Pre-commit hooks bloqueando errores
- Smoke tests pasando en CI/CD

### **Operacional**
- Latencia < 500ms para 95% de requests
- Uptime > 99.9%
- Logs de auditoría 100% completos

---

*Roadmap generado después de la reversión controlada exitosa.*
*Base sólida establecida para desarrollo continuo.*
*Fecha: 15 de Agosto, 2025*
