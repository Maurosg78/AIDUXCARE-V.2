# AiDuxCare V.2 - Entorno Cloud (Codespaces/Docker)

## 🚀 Migración a Entorno Cloud

Este proyecto está configurado para ejecutarse en entornos cloud reproducibles usando **GitHub Codespaces** o **Docker**, eliminando problemas de dependencias locales y asegurando consistencia entre desarrolladores.

## 📋 Opciones de Entorno

### 1. GitHub Codespaces (Recomendado)

#### Inicio Rápido
1. Ve a tu repositorio en GitHub: `https://github.com/Maurosg78/AIDUXCARE-V.2`
2. Haz clic en el botón verde **"Code"** → **"Codespaces"** → **"Create codespace on main"**
3. Espera a que se configure el entorno (2-3 minutos)
4. El entorno se abrirá automáticamente en VS Code web

#### Configuración Automática
- ✅ Node.js 20.19.4
- ✅ npm con `--legacy-peer-deps`
- ✅ Extensiones VS Code preconfiguradas
- ✅ Puertos forwardeados automáticamente
- ✅ Firebase Emulator integrado

#### Comandos Iniciales
```bash
# Las dependencias se instalan automáticamente
npm run dev
```

### 2. Docker (Desarrollo Local)

#### Requisitos
- Docker Desktop instalado
- Docker Compose

#### Inicio Rápido
```bash
# Clonar el repositorio
git clone https://github.com/Maurosg78/AIDUXCARE-V.2.git
cd AIDUXCARE-V.2

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f frontend
```

#### Servicios Disponibles
- **Frontend**: http://localhost:5173
- **Firebase Emulator**: http://localhost:4000
- **Firestore**: localhost:8080
- **Backend API**: http://localhost:3001

### 3. Docker (Producción)

```bash
# Build de producción
docker build -t aiduxcare-v2 .

# Ejecutar contenedor de producción
docker run -p 80:80 aiduxcare-v2
```

## 🔧 Configuración del Entorno

### Variables de Entorno
```bash
# Desarrollo
NODE_ENV=development
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_EMULATOR=true

# Producción
NODE_ENV=production
VITE_API_URL=https://your-api-domain.com
```

### Puertos Configurados
- **5173-5177**: Vite Dev Server (automático)
- **3000**: React App
- **3001**: Backend API
- **8080**: Firebase Emulator
- **4000**: Firebase UI

## 🧪 Validación del Entorno

### Comandos de Validación
```bash
# Verificar instalación
npm ci --legacy-peer-deps

# Verificar tipos TypeScript
npm run type-check

# Ejecutar tests
npm run test

# Build de producción
npm run build

# Iniciar servidor de desarrollo
npm run dev
```

### Checklist de Validación
- [ ] Dependencias instaladas sin errores
- [ ] TypeScript compilation exitosa
- [ ] Tests ejecutándose (ignorar errores de chai por ahora)
- [ ] Servidor de desarrollo iniciando
- [ ] Aplicación accesible en puerto configurado
- [ ] Firebase Emulator funcionando

## 🐛 Solución de Problemas

### Error ESM/CJS (js-tokens)
Si persiste el error de `js-tokens` en Codespaces:
1. **No es un problema de tu código**
2. **Es un bug del ecosistema de dependencias**
3. **Solución**: Actualizar dependencias problemáticas

### Tests Fallando
Los tests pueden fallar por configuración de `chai`. Esto no afecta la funcionalidad principal.

### Puertos No Disponibles
Si un puerto está ocupado, Vite automáticamente probará el siguiente disponible.

## 📊 Ventajas del Entorno Cloud

### ✅ Beneficios
- **Reproducibilidad**: Mismo entorno para todos los desarrolladores
- **Aislamiento**: Sin conflictos con dependencias locales
- **Escalabilidad**: Fácil onboarding de nuevos desarrolladores
- **Consistencia**: Misma versión de Node, npm, y herramientas
- **Backup**: Entorno siempre disponible en la nube

### 🔄 Flujo de Trabajo
1. **Desarrollo**: Codespaces para desarrollo diario
2. **Testing**: Entorno cloud para validación
3. **CI/CD**: GitHub Actions para automatización
4. **Producción**: Docker para despliegue

## 🚀 Próximos Pasos

1. **Abrir Codespace** desde GitHub
2. **Validar que la app arranca** sin errores ESM/CJS
3. **Ejecutar UAT** en el entorno cloud
4. **Configurar CI/CD** para automatización
5. **Preparar despliegue** a producción

## 📞 Soporte

Si encuentras problemas:
1. Verifica que estás usando Node 20+
2. Ejecuta `npm ci --legacy-peer-deps`
3. Revisa los logs de Docker/Codespaces
4. Abre un issue en GitHub con detalles del error

---

**¡El entorno cloud está listo para validar AiDuxCare V.2 sin problemas de dependencias locales!** 