# 🏗️ Estructura del Proyecto AIDUXCARE-V.2

## 📁 Organización Profesional

```
AIDUXCARE-V.2/
├── 📂 src/                          # Código fuente principal
│   ├── components/                  # Componentes React
│   ├── core/                       # Lógica de negocio
│   ├── services/                   # Servicios externos
│   ├── pages/                      # Páginas de la aplicación
│   └── ...
├── 📂 config/                       # ⭐ Configuraciones
│   ├── jest.config.cjs             # Configuración Jest
│   ├── jest.setup.cjs              # Setup Jest
│   └── vitest.config.ts            # Configuración Vitest
├── 📂 database/                     # ⭐ Base de Datos
│   ├── supabase.schema.sql         # Schema SQL
│   ├── RLS_POLICIES.md             # Políticas RLS
│   └── SUPABASE_SETUP.md           # Setup Supabase
├── 📂 deployment/                   # ⭐ Despliegue
│   ├── .vercel/                    # Configuración Vercel
│   ├── .vercelignore              # Archivos a ignorar
│   ├── .npmrc                     # Configuración NPM
│   └── .node-version              # Versión Node.js
├── 📂 maintenance/                  # ⭐ Mantenimiento
│   ├── a11y_fixes.patch           # Parches accesibilidad
│   ├── set-github-secrets.sh      # Secrets GitHub
│   ├── diagnose-warnings.sh       # Diagnóstico
│   └── fix-audit-logger.sh        # Fix auditoría
├── 📂 docs/                        # ⭐ Documentación
│   ├── FASES_DEL_PROYECTO.md       # Fases del proyecto
│   ├── PLAN_ESTABILIZACION_MVP.md  # Plan MVP
│   ├── v2.9-status-report.md       # Status report
│   ├── CONTRIBUTING.md             # Guía contribución
│   ├── CHANGELOG.md                # Changelog
│   ├── MCP-EVAL-README.md          # Evaluaciones MCP
│   └── todo-mauricio-user-testing.md # User testing
├── 📂 scripts/                     # Scripts utilitarios
├── 📂 __tests__/                   # Tests principales
├── 📂 __mocks__/                   # Mocks para testing
├── 📂 public/                      # Assets públicos
├── 📂 forms/                       # Formularios
├── 📂 logs/                        # Logs del sistema
├── 📂 .github/                     # Configuración GitHub
├── 📄 package.json                 # Configuración NPM
├── 📄 tsconfig.json               # Configuración TypeScript
├── 📄 tailwind.config.ts          # Configuración Tailwind
├── 📄 vite.config.ts              # Configuración Vite
├── 📄 .eslintrc.js/.json          # Configuración ESLint
└── 📄 README.md                   # Documentación principal
```

## 🎯 Beneficios de la Nueva Estructura

### ✅ **Profesionalismo**
- Archivos agrupados por funcionalidad
- Estructura clara y mantenible
- Fácil navegación para desarrolladores

### ✅ **Mantenibilidad**
- Configuraciones centralizadas en `config/`
- Documentación organizada en `docs/`
- Scripts de mantenimiento en `maintenance/`

### ✅ **Escalabilidad**
- Fácil añadir nuevas configuraciones
- Documentación centralizada
- Deploy y database separados

### ✅ **Colaboración**
- Estructura intuitiva para el equipo
- Documentación accesible
- Separación clara de responsabilidades

## 🔧 Scripts Actualizados

Los siguientes scripts han sido actualizados para usar las nuevas rutas:

```json
{
  "test": "vitest --config config/vitest.config.ts",
  "test:jest": "jest --config config/jest.config.cjs",
  "test:coverage": "vitest run --config config/vitest.config.ts --coverage",
  "test:eval": "vitest run --config config/vitest.config.ts __tests__/evals/..."
}
```

## 📝 Notas Importantes

- **Funcionalidad Intacta**: Todas las funcionalidades siguen operativas
- **Build Exitoso**: Verificado con `npm run build`
- **Enrutamiento Preservado**: No se afectaron rutas críticas
- **Configuraciones Actualizadas**: Referencias actualizadas en package.json

---

*Estructura reorganizada el ${new Date().toLocaleDateString('es-ES')} para mejorar la profesionalidad del proyecto AIDUXCARE-V.2* 