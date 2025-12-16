# Firebase Email: Reply To y Costos

## 📧 Reply To - ¿Puede ser otro email?

**✅ SÍ, absolutamente.** El campo "Reply To" puede ser cualquier email válido, no tiene que ser del dominio de Firebase.

### Configuración:
1. Ve a Firebase Console → Authentication → Templates
2. Edita "Email address verification"
3. En "Reply To", ingresa: `support@aiduxcare.com` (o el email que prefieras)
4. ⚠️ **IMPORTANTE**: Debe ser un email válido (no "noreplay" sin dominio)

---

## 💰 Costos de Emails en Firebase Auth

### ✅ **GRATIS hasta límites muy generosos:**

| Plan | Límite Gratuito | Costo Después |
|------|----------------|---------------|
| **Spark (Gratuito)** | **1,000 emails/día** (30,000/mes) | N/A (no permite más) |
| **Blaze (Pago por uso)** | **100,000 emails/día** (3M/mes) | $0.0555 por cada 1,000 emails adicionales |

### 📊 Ejemplos Reales:

- **100 usuarios nuevos/mes**: 100 emails = **GRATIS** ✅
- **1,000 usuarios nuevos/mes**: 1,000 emails = **GRATIS** ✅
- **10,000 usuarios nuevos/mes**: 10,000 emails = **GRATIS** ✅
- **30,000 usuarios nuevos/mes**: 30,000 emails = **GRATIS** ✅ (plan Spark)
- **100,000 usuarios nuevos/mes**: 100,000 emails = **GRATIS** ✅ (plan Blaze)

### 💡 Para AiDuxCare:

Si tienes **1,000 profesionales registrándose por mes**, estarías enviando **1,000 emails de verificación** = **COMPLETAMENTE GRATIS**.

---

## 🔄 ¿Dónde se Alojan los Emails?

**Firebase Auth maneja los emails directamente** - No necesitas:
- ❌ Cloudflare para emails
- ❌ Servidor propio
- ❌ Configuración adicional

Firebase usa su propia infraestructura de email (Google Cloud).

---

## 📝 Configuración Recomendada

### En Firebase Console:

1. **Reply To**: `support@aiduxcare.com`
2. **Sender Name**: `AiDuxCare Team`
3. **Subject**: `Welcome to AiDuxCare - Verify Your Email 🍁`

**Costo**: **$0/mes** (dentro del límite gratuito)

---

## ✅ Resumen

| Pregunta | Respuesta |
|----------|-----------|
| **¿Reply To puede ser otro email?** | ✅ Sí, cualquier email válido (ej: support@aiduxcare.com) |
| **¿Cada email tiene costo?** | ✅ No, gratis hasta 1,000/día (plan Spark) o 100,000/día (plan Blaze) |
| **¿Necesito pagar Cloudflare?** | ❌ No, Firebase maneja todo |
| **¿Cuándo empiezo a pagar?** | Solo si superas los límites gratuitos (muy difícil de alcanzar) |

---

**Conclusión:** Para tu caso de uso, Firebase Auth es **completamente gratuito** y puedes usar cualquier email para Reply To.


