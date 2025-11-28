# 🔧 **COMANDOS DE DEBUGGING PARA VALIDACIÓN CTO**

Comandos útiles para debugging si algo falla durante la validación en iPhone.

---

## **🌐 VERIFICAR CONFIGURACIÓN DE RED**

### **Verificar IP local:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### **Verificar que el servidor está corriendo:**
```bash
lsof -i :5174
```

### **Verificar VITE_DEV_PUBLIC_URL:**
```bash
cat .env | grep VITE_DEV_PUBLIC_URL
```

### **Verificar HTTPS:**
```bash
curl -k https://localhost:5174
```

---

## **📱 VERIFICAR LOGS DEL SERVIDOR**

### **Ver logs en tiempo real:**
```bash
npm run dev 2>&1 | tee validation.log
```

### **Buscar errores específicos:**
```bash
# Errores de Clinical Vault
grep -i "clinical vault\|persistence\|firestore" validation.log

# Errores de consentimiento
grep -i "consent\|sms\|twilio" validation.log

# Errores de MSK tests
grep -i "msk\|test\|region" validation.log
```

---

## **🔍 VERIFICAR EN CONSOLA DEL NAVEGADOR (iPhone)**

### **Abrir Safari Web Inspector:**
1. Conectar iPhone a Mac
2. En iPhone: Settings → Safari → Advanced → Web Inspector (ON)
3. En Mac: Safari → Develop → [Tu iPhone] → [Página abierta]

### **Comandos útiles en Console:**

```javascript
// Verificar que SOAP se guardó
localStorage.getItem('lastSavedSOAP')

// Verificar consent links
window.location.href

// Verificar tests seleccionados
sessionStorage.getItem('selectedTests')

// Verificar región detectada
sessionStorage.getItem('detectedRegion')
```

---

## **📊 VERIFICAR FIRESTORE (Clinical Vault)**

### **Verificar que la nota se guardó:**
```bash
# En consola del navegador (Safari Web Inspector)
# Ejecutar en Console:

// Obtener UID del usuario actual
firebase.auth().currentUser?.uid

// Verificar notas guardadas
firebase.firestore().collection('consultations')
  .where('ownerUid', '==', firebase.auth().currentUser?.uid)
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get()
  .then(snapshot => {
    console.log('Notas encontradas:', snapshot.size);
    snapshot.forEach(doc => {
      console.log('Nota:', doc.id, doc.data());
    });
  });
```

---

## **🧪 VERIFICAR MSK TESTS**

### **En consola del navegador:**
```javascript
// Verificar tests sugeridos
window.__mskTestsSuggested

// Verificar tests seleccionados
window.__mskTestsSelected

// Verificar región detectada
window.__detectedRegion

// Verificar tests filtrados
window.__filteredTests
```

**Nota:** Estos logs deben estar en el código. Si no están, agregar temporalmente para debugging.

---

## **🔗 VERIFICAR LINKS DE CONSENTIMIENTO**

### **Verificar URL generada:**
```bash
# En consola del navegador
console.log('Consent URL:', window.__consentUrl);
```

### **Verificar que abre en iPhone:**
```bash
# Probar link manualmente
curl -k https://TU_IP_LOCAL:5174/consent-verification/TEST_TOKEN
```

---

## **📋 VERIFICAR COPY TO CLIPBOARD**

### **En consola del navegador:**
```javascript
// Verificar permisos de clipboard
navigator.clipboard.readText().then(text => {
  console.log('Clipboard content:', text);
}).catch(err => {
  console.error('Clipboard error:', err);
});
```

---

## **🎨 VERIFICAR OVERLAYS Y COLORES**

### **En consola del navegador:**
```javascript
// Buscar overlays negros
document.querySelectorAll('[class*="bg-black"]').forEach(el => {
  console.log('Black overlay found:', el);
});

// Buscar botones negros
document.querySelectorAll('button[class*="bg-black"], button[class*="text-black"]').forEach(el => {
  console.log('Black button found:', el);
});
```

---

## **🚨 COMANDOS DE EMERGENCIA**

### **Si el servidor no responde:**
```bash
# Matar proceso en puerto 5174
lsof -ti:5174 | xargs kill -9

# Reiniciar servidor
npm run dev
```

### **Si HTTPS falla:**
```bash
# Regenerar certificado
openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"
```

### **Si Firestore no responde:**
```bash
# Verificar conexión a Firebase
curl https://firestore.googleapis.com/v1/projects/TU_PROJECT_ID/databases/(default)/documents
```

---

## **📱 VERIFICAR EN IPHONE DIRECTAMENTE**

### **Safari Web Inspector:**
1. Conectar iPhone a Mac
2. Abrir Safari en Mac
3. Develop → [Tu iPhone] → [Página]
4. Ver Console, Network, Storage tabs

### **Verificar Storage:**
- Application → Local Storage → Ver datos guardados
- Application → Session Storage → Ver datos temporales
- Application → IndexedDB → Ver base de datos local

### **Verificar Network:**
- Network tab → Ver requests a Firestore
- Verificar status codes (200 = OK, 400/500 = Error)
- Verificar headers y payloads

---

## **📝 TEMPLATE DE REPORTE DE ERROR**

Si algo falla, documentar:

```markdown
## Error encontrado:

**Test:** [Nombre del test]
**Dispositivo:** iPhone [Modelo]
**iOS:** [Versión]
**Safari:** [Versión]

**Pasos para reproducir:**
1. ...
2. ...
3. ...

**Comportamiento esperado:**
...

**Comportamiento actual:**
...

**Logs del servidor:**
```
[paste logs aquí]
```

**Logs de la consola:**
```
[paste logs aquí]
```

**Screenshots:**
[adjuntar si es posible]

**Severidad:** ⬜ CRÍTICA / ⬜ ALTA / ⬜ MEDIA / ⬜ BAJA
```

---

**Última actualización:** _______________

