# 🔒 **CHROME - CONFIAR EN CERTIFICADO AUTOFIRMADO**

**Date:** November 2025  
**Status:** ⚠️ **REQUERIDO PARA HTTPS LOCAL**  
**Error:** `NET::ERR_CERT_AUTHORITY_INVALID`

---

## 🚨 **PROBLEMA**

Chrome está bloqueando el acceso a `https://localhost:5174` porque el certificado es autofirmado (self-signed). Esto es normal en desarrollo.

**Error mostrado:**
- `NET::ERR_CERT_AUTHORITY_INVALID`
- "La conexión no es privada"
- "Es posible que un atacante esté intentando robarte la información"

---

## ✅ **SOLUCIÓN: CONFIAR EN EL CERTIFICADO**

### **Opción 1: Avanzado → Continuar (Más Rápido)**

1. En la página de error, haz clic en **"Opciones avanzadas"** (botón gris abajo)
2. Aparecerá un botón **"Continuar a localhost (no seguro)"** o **"Proceed to localhost (unsafe)"**
3. Haz clic en ese botón
4. El sitio se cargará normalmente

**Nota:** Tendrás que hacer esto cada vez que reinicies Chrome o borres el caché.

---

### **Opción 2: Instalar Certificado en macOS (Permanente)**

#### **Paso 1: Exportar Certificado**

```bash
# Desde el directorio del proyecto
openssl x509 -in certs/cert.pem -out certs/cert.crt -outform DER
```

#### **Paso 2: Instalar en macOS**

1. Abre **Keychain Access** (Acceso a Llaveros)
2. Arrastra `certs/cert.crt` a la ventana de Keychain Access
3. Busca el certificado "localhost" en "login" o "System"
4. Haz doble clic en el certificado
5. Expande **"Trust"** (Confianza)
6. Cambia **"When using this certificate"** a **"Always Trust"**
7. Cierra la ventana (te pedirá tu contraseña)
8. Reinicia Chrome

---

### **Opción 3: Chrome Flags (Desarrollo)**

**⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN**

1. Abre Chrome y ve a: `chrome://flags/#allow-insecure-localhost`
2. Habilita **"Allow invalid certificates for resources loaded from localhost"**
3. Reinicia Chrome

---

## 📋 **VERIFICACIÓN**

Después de confiar en el certificado:

1. Accede a: `https://localhost:5174`
2. Deberías ver el 🔒 verde en la barra de direcciones
3. O al menos no debería aparecer el error de privacidad

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Sigue apareciendo el error**

**Solución:**
- Limpia el caché de Chrome: `Cmd+Shift+Delete`
- O usa modo incógnito: `Cmd+Shift+N`
- O usa Safari (generalmente más permisivo con certificados locales)

### **Issue: El certificado expiró**

**Solución:**
```bash
# Regenerar certificado
rm certs/cert.pem certs/key.pem
bash scripts/setup-https-dev.sh
```

### **Issue: Chrome no permite "Continuar"**

**Solución:**
- Usa Safari para desarrollo local
- O instala el certificado en macOS (Opción 2)
- O usa HTTP en localhost (no requiere certificado)

---

## 📝 **NOTAS**

- **Certificados autofirmados** son normales en desarrollo
- **Chrome es más estricto** que Safari con certificados locales
- **Safari** generalmente es más permisivo con `localhost`
- **En producción** Firebase Hosting proporciona certificados válidos automáticamente

---

**Signed:** Implementation Team  
**Date:** November 2025  
**Status:** ✅ **GUÍA COMPLETA - SIGUE OPCIÓN 1 PARA RAPIDEZ**

