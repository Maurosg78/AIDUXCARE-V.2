# ⚡ Comandos Rápidos - Implementación LLM AiDuxCare

## 🚀 **MAURICIO: EJECUTA ESTOS COMANDOS EN ORDEN**

### **PASO 1: Preparación de Credenciales** 📝

1. **Ir a OpenAI Platform:**
   ```bash
   # Abrir en navegador
   open https://platform.openai.com/api-keys
   ```

2. **Crear archivo .env.local** (en la raíz del proyecto):
   ```bash
   # Crear/editar .env.local
   echo "VITE_OPENAI_API_KEY=sk-TU-API-KEY-AQUI" >> .env.local
   echo "VITE_OPENAI_MODEL=gpt-3.5-turbo" >> .env.local
   echo "VITE_OPENAI_MAX_TOKENS=2000" >> .env.local
   ```

### **PASO 2: Instalación de Dependencies** 📦

```bash
# Instalar OpenAI SDK
npm install openai

# Instalar types adicionales
npm install @types/node --save-dev

# Verificar instalación
npm ls openai
```

### **PASO 3: Crear Estructura de Archivos** 📁

```bash
# Crear directorios necesarios
mkdir -p src/lib
mkdir -p src/services  
mkdir -p src/scripts
mkdir -p src/types

# Verificar estructura
ls -la src/
```

### **PASO 4: Archivos Base** 📄

**Archivo 1: `src/lib/openai.ts`**
```bash
touch src/lib/openai.ts
```

**Archivo 2: `src/services/nlpService.ts`**  
```bash
touch src/services/nlpService.ts
```

**Archivo 3: `src/services/audioProcessingService.ts`**
```bash
touch src/services/audioProcessingService.ts
```

**Archivo 4: `src/scripts/testLLM.ts`**
```bash
touch src/scripts/testLLM.ts
```

### **PASO 5: Verificación Rápida** ✅

```bash
# Verificar que todos los archivos existen
ls -la src/lib/openai.ts
ls -la src/services/nlpService.ts  
ls -la src/services/audioProcessingService.ts
ls -la src/scripts/testLLM.ts
ls -la src/types/nlp.ts

# Verificar .env.local
cat .env.local
```

### **PASO 6: Test de Conexión Básica** 🧪

```bash
# Crear test simple de API
cat > test-openai-connection.js << 'EOF'
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

async function testConnection() {
  try {
    console.log('🧪 Testing OpenAI connection...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "Connection successful!"' }],
      max_tokens: 10
    });
    console.log('✅ Success:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();
EOF

# Ejecutar test
node test-openai-connection.js

# Limpiar archivo de test
rm test-openai-connection.js
```

### **PASO 7: Build y Verificación** 🔧

```bash
# Verificar que el proyecto compila
npm run build

# Si hay errores de TypeScript, verificar tipos
npx tsc --noEmit
```

---

## 🚨 **TROUBLESHOOTING RÁPIDO**

### **Error: API Key no funciona**
```bash
# Verificar que la API key está bien configurada
echo $VITE_OPENAI_API_KEY
# Debería mostrar: sk-...

# Verificar .env.local
cat .env.local | grep OPENAI
```

### **Error: Módulo 'openai' no encontrado**
```bash
# Reinstalar openai
npm uninstall openai
npm install openai

# Verificar node_modules
ls node_modules/ | grep openai
```

### **Error: TypeScript types**
```bash
# Instalar types adicionales
npm install --save-dev @types/node

# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 📋 **CHECKLIST DE VERIFICACIÓN**

Mauricio, marca cada item cuando lo completes:

- [ ] **API Key de OpenAI obtenida**
- [ ] **Archivo .env.local creado** con variables correctas
- [ ] **Dependencies instaladas** (openai, @types/node)
- [ ] **Estructura de directorios** creada (lib, services, scripts, types)
- [ ] **Archivos base** creados y listos para código
- [ ] **Test de conexión** ejecutado exitosamente
- [ ] **Build del proyecto** funciona sin errores

---

## 🎯 **PRÓXIMO PASO**

Una vez que completes este checklist, **reporta al CTO (vía mí, Claude)** con:

1. ✅ **Confirmación** de que todos los pasos se ejecutaron correctamente
2. 📊 **Screenshot** del test de conexión exitoso
3. ❓ **Cualquier error** o problema que hayas encontrado

**Luego procederemos a implementar el código específico en cada archivo.**

---

## 📞 **SI NECESITAS AYUDA**

```bash
# Verificar versiones
node --version    # Debe ser >= 16
npm --version     # Debe ser >= 8

# Status del proyecto
npm run build     # ¿Compila sin errores?
npm test         # ¿Tests pasan?

# Git status
git status       # ¿Archivos tracked correctamente?
```

**¡Mauricio, ejecuta estos comandos y reporta el resultado! 🚀** 