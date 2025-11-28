# ✅ Sistema de Auto-Save Automatizado

Este sistema protege tu trabajo con múltiples capas de guardado automático.

## 🚀 Inicio Rápido

### Opción 1: Usar npm script (Recomendado)
```bash
# Guardar cada 5 minutos (300 segundos)
npm run auto-save:start

# Guardar cada 1 minuto (para desarrollo intensivo)
npm run auto-save:start:fast

# Guardar cada 10 minutos (para trabajo normal)
npm run auto-save:start:slow
```

### Opción 2: Usar script directamente
```bash
# Script Bash (Linux/Mac)
chmod +x scripts/auto-save-workflow.sh
./scripts/auto-save-workflow.sh 300

# Script Node.js (Multiplataforma)
node scripts/auto-save-workflow.js 300
```

## 📋 ¿Qué hace el sistema?

### 1. **Auto-Save en Cursor/VS Code**
- ✅ Guarda automáticamente después de 1 segundo de inactividad
- ✅ Formatea código al guardar
- ✅ Ejecuta ESLint al guardar
- Configurado en `.vscode/settings.json`

### 2. **Commits Automáticos en Git**
- ✅ Crea commits automáticos cada X minutos
- ✅ Mensaje: `💾 Auto-save: [timestamp]`
- ✅ No hace push automático (por seguridad)
- ✅ Puedes hacer push manual cuando quieras

### 3. **Snapshots Locales**
- ✅ Crea copias locales de tus archivos importantes
- ✅ Guarda en `canonical_snapshots/auto/`
- ✅ Mantiene los últimos 20 snapshots
- ✅ Se crean cada 3 ciclos del auto-save

### 4. **Backups Comprimidos**
- ✅ Crea backups en formato `.tar.gz`
- ✅ Guarda en `backups/auto-save/`
- ✅ Mantiene los últimos 10 backups
- ✅ Se crean cada 6 ciclos del auto-save

## 📁 Estructura de Archivos

```
proyecto/
├── backups/
│   └── auto-save/
│       ├── backup_20241125_143022.tar.gz
│       └── backup_20241125_143522.tar.gz
├── canonical_snapshots/
│   └── auto/
│       ├── snapshot_20241125_143022/
│       └── snapshot_20241125_143522/
└── scripts/
    ├── auto-save-workflow.sh
    └── auto-save-workflow.js
```

## 🔧 Configuración

### Intervalos Recomendados

| Escenario | Intervalo | Comando |
|-----------|-----------|---------|
| Desarrollo intensivo | 60s (1 min) | `npm run auto-save:start:fast` |
| Trabajo normal | 300s (5 min) | `npm run auto-save:start` |
| Trabajo tranquilo | 600s (10 min) | `npm run auto-save:start:slow` |

### Personalizar Intervalo

```bash
# Guardar cada 2 minutos (120 segundos)
node scripts/auto-save-workflow.js 120

# Guardar cada 15 minutos (900 segundos)
node scripts/auto-save-workflow.js 900
```

## 🔍 Recuperar Trabajo Perdido

### Opción 1: Desde Git
```bash
# Ver commits de auto-save
git log --grep="Auto-save" --oneline

# Restaurar un commit específico
git checkout <commit-hash>

# Ver cambios en un commit
git show <commit-hash>
```

### Opción 2: Desde Snapshots Locales
```bash
# Listar snapshots disponibles
ls -lt canonical_snapshots/auto/

# Restaurar un snapshot específico
cp -r canonical_snapshots/auto/snapshot_20241125_143022/* .
```

### Opción 3: Desde Backups Comprimidos
```bash
# Listar backups disponibles
ls -lt backups/auto-save/

# Extraer un backup
cd backups/auto-save/
tar -xzf backup_20241125_143022.tar.gz
```

## ⚙️ Configuración Avanzada

### Ejecutar en Background (Linux/Mac)
```bash
# Ejecutar en background
nohup npm run auto-save:start > auto-save.log 2>&1 &

# Ver logs
tail -f auto-save.log

# Detener proceso
pkill -f "auto-save-workflow"
```

### Ejecutar como Servicio (Linux)
```bash
# Crear servicio systemd (opcional)
sudo nano /etc/systemd/system/autosave-workflow.service
```

```ini
[Unit]
Description=Auto-Save Workflow
After=network.target

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/ruta/a/tu/proyecto
ExecStart=/usr/bin/node scripts/auto-save-workflow.js 300
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🛡️ Protecciones Múltiples

Este sistema tiene **4 capas de protección**:

1. **Auto-save del editor** (1 segundo) - Guarda mientras escribes
2. **Commits Git** (cada X minutos) - Historial completo
3. **Snapshots locales** (cada 3 ciclos) - Copias rápidas
4. **Backups comprimidos** (cada 6 ciclos) - Archivos completos

## ⚠️ Notas Importantes

- ✅ Los commits automáticos **NO hacen push** automáticamente
- ✅ Los snapshots y backups se limpian automáticamente (mantiene solo los más recientes)
- ✅ El script se puede detener con `Ctrl+C` en cualquier momento
- ✅ No afecta el rendimiento del editor

## 🐛 Troubleshooting

### El script no crea commits
```bash
# Verificar que estás en un repositorio Git
git status

# Verificar permisos
ls -la .git/
```

### Los snapshots no se crean
```bash
# Verificar permisos de escritura
ls -ld canonical_snapshots/auto/

# Crear directorio manualmente si no existe
mkdir -p canonical_snapshots/auto/
```

### El script se detiene
```bash
# Verificar logs
tail -f auto-save.log

# Reiniciar el script
npm run auto-save:start
```

## 📝 Ejemplo de Uso Diario

```bash
# 1. Iniciar desarrollo
npm run dev

# 2. En otra terminal, iniciar auto-save
npm run auto-save:start

# 3. Trabajar normalmente
# El sistema guardará automáticamente cada 5 minutos

# 4. Al final del día, hacer push manual
git push origin main
```

## 🎯 Mejores Prácticas

1. ✅ **Inicia el auto-save al comenzar a trabajar**
2. ✅ **Haz push manual al final del día**
3. ✅ **Revisa los commits de auto-save periódicamente**
4. ✅ **No confíes solo en auto-save, haz commits importantes manualmente**
5. ✅ **Mantén los backups en un lugar seguro**

---

**¿Problemas?** Abre un issue o contacta al equipo de desarrollo.



