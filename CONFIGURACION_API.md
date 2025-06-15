# 🔧 CONFIGURACIÓN DE API - AIDUXCARE V.2

## 📋 Configuración de la URL del Backend

Para conectar el frontend con tu backend desplegado en Google Cloud Functions, necesitas configurar la URL base de la API.

### 🚀 Paso 1: Obtener URL de la Cloud Function

Después de desplegar el backend con `./deploy-backend.sh`, obtendrás una URL similar a:

```
https://us-central1-[TU-PROJECT-ID].cloudfunctions.net/api
```

### ⚙️ Paso 2: Configurar Variable de Entorno

#### Opción A: Archivo .env (Recomendado)

Crea un archivo `.env` en la raíz del proyecto:

```bash
# .env
VITE_API_BASE_URL=https://us-central1-[TU-PROJECT-ID].cloudfunctions.net/api
```

#### Opción B: Configuración Directa

Edita el archivo `src/core/services/patientService.ts` línea 8:

```typescript
const API_BASE_URL = 'https://us-central1-[TU-PROJECT-ID].cloudfunctions.net/api';
```

### 🔍 Paso 3: Verificar Configuración

1. **Health Check**: Ve a la consola del navegador y busca logs como:
   ```
   🔍 Verificando estado de la API
   ✅ API funcionando correctamente
   ```

2. **Test Manual**: Puedes probar la API directamente:
   ```bash
   curl https://us-central1-[TU-PROJECT-ID].cloudfunctions.net/api/health
   ```

### 🔧 URLs de Ejemplo por Entorno

```bash
# Desarrollo Local (Emuladores)
VITE_API_BASE_URL=http://localhost:5001/[PROJECT-ID]/us-central1/api

# Production (Cloud Functions)
VITE_API_BASE_URL=https://us-central1-[PROJECT-ID].cloudfunctions.net/api

# Staging (si tienes un proyecto separado)
VITE_API_BASE_URL=https://us-central1-[PROJECT-ID]-staging.cloudfunctions.net/api
```

### 🚨 Problemas Comunes

#### Error: CORS
**Síntoma**: Errores de CORS en la consola
**Solución**: Verificar que el backend tenga CORS habilitado (ya está configurado)

#### Error: 404 Not Found
**Síntoma**: La API no responde
**Solución**: Verificar que la URL sea exactamente la proporcionada por Firebase

#### Error: Network Error
**Síntoma**: Error de conexión
**Solución**: Verificar conectividad y que la Cloud Function esté desplegada

### 📝 Ejemplo Completo

```bash
# 1. Crear archivo .env
echo "VITE_API_BASE_URL=https://us-central1-aiduxcare-prod.cloudfunctions.net/api" > .env

# 2. Reiniciar servidor de desarrollo
npm run dev

# 3. Probar creación de paciente
# Ve a http://localhost:3000 y usa el formulario
```

### 🎯 Verificación Final

Una vez configurado correctamente:

1. ✅ El formulario de creación de paciente debe funcionar
2. ✅ Los datos se guardan en Firestore  
3. ✅ La navegación a la ficha clínica muestra datos reales
4. ✅ Los logs de la consola muestran comunicación exitosa con la API

---

**⚠️ Importante**: Recuerda reiniciar el servidor de desarrollo (`npm run dev`) después de cambiar variables de entorno. 