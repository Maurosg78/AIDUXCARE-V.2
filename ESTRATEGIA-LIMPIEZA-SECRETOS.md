# 🔒 Estrategia para Limpiar Secretos del Historial Git

## 📋 Resumen del Problema

GitHub está bloqueando el push porque detectó una clave API de OpenAI en el commit `9e08e1e7` en el archivo `scripts/setup-codespaces-secrets.sh`.

**Commit problemático:** `9e08e1e7` - "feat(pdf): PDF processing MVP complete - piloto ready"  
**Archivo:** `scripts/setup-codespaces-secrets.sh:63`  
**Secreto detectado:** OpenAI API Key (sk-proj-6aIRf1c...)

---

## 🎯 Estrategias Disponibles

### ✅ Opción 1: git-filter-repo (RECOMENDADA - Moderna)

**Ventajas:**
- ✅ Herramienta moderna recomendada por GitHub
- ✅ Más rápida que `git filter-branch`
- ✅ Ya está instalada en tu sistema (`/opt/homebrew/bin/git-filter-repo`)
- ✅ Reemplaza texto específico en todo el historial

**Pasos:**
```bash
# 1. Crear archivo de reemplazos
cat > /tmp/replace-secrets.txt << 'EOF'
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==>YOUR_OPENAI_API_KEY_HERE
EOF

# 2. Reemplazar en historial
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
git filter-repo --replace-text /tmp/replace-secrets.txt --force

# 3. Limpiar referencias
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push
git push origin feature/pdf-processing-implementation --force
```

---

### ✅ Opción 2: BFG Repo-Cleaner (Alternativa Simple)

**Ventajas:**
- ✅ Más simple de usar
- ✅ Java ya instalado en tu sistema
- ✅ Rápido y eficiente

**Pasos:**
```bash
# 1. Descargar BFG (si no lo tienes)
# brew install bfg  # O descargar desde https://rtyley.github.io/bfg-repo-cleaner/

# 2. Crear archivo con el secreto a reemplazar
echo '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==>YOUR_OPENAI_API_KEY_HERE' > /tmp/secrets.txt

# 3. Clonar repo en modo mirror (si es necesario)
# git clone --mirror git@github.com:Maurosg78/AIDUXCARE-V.2.git repo.git

# 4. Ejecutar BFG (en el repo clonado)
# java -jar bfg.jar --replace-text /tmp/secrets.txt repo.git

# 5. Limpiar y push
# cd repo.git
# git reflog expire --expire=now --all
# git gc --prune=now --aggressive
# git push --force
```

---

### ⚠️ Opción 3: GitHub URL (Temporal - NO Recomendada)

**Desventajas:**
- ❌ No limpia el historial (el secreto sigue ahí)
- ❌ Solo permite el push temporalmente
- ❌ El secreto sigue expuesto en el historial

**URL proporcionada por GitHub:**
```
https://github.com/Maurosg78/AIDUXCARE-V.2/security/secret-scanning/unblock-secret/37nf54WLej0xXNzbAxOZDPUdWCc
```

---

## 🚀 Estrategia Recomendada: git-filter-repo

### ¿Por qué git-filter-repo?

1. ✅ **Ya está instalado** - No necesitas descargar nada
2. ✅ **Moderna** - Recomendada por GitHub (reemplazo de `git filter-branch`)
3. ✅ **Eficiente** - Más rápida que `git filter-branch`
4. ✅ **Segura** - Reescribe el historial de forma segura

### ⚠️ Advertencias Importantes

1. **Historial reescrito:** Esto cambiará todos los commit hashes después del commit modificado
2. **Force push requerido:** Necesitarás `--force` para actualizar el remoto
3. **Coordinación con equipo:** Si otros tienen el branch, necesitarán hacer `git pull --rebase` o reclonar
4. **Backup recomendado:** Hacer backup antes de proceder

---

## 📝 Plan de Ejecución

### Paso 1: Backup (OBLIGATORIO)

```bash
# Crear backup del branch actual
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
git branch backup-before-filter-repo
git push origin backup-before-filter-repo
```

### Paso 2: Crear archivo de reemplazo

```bash
# Crear archivo con el reemplazo
cat > /tmp/replace-openai-key.txt << 'EOF'
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==>YOUR_OPENAI_API_KEY_HERE
EOF
```

### Paso 3: Ejecutar git-filter-repo

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean

# Reemplazar en todo el historial
git filter-repo --replace-text /tmp/replace-openai-key.txt --force

# Limpiar referencias
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Paso 4: Verificar

```bash
# Verificar que el secreto fue reemplazado
git log --all -p | grep -i "sk-proj-6aIRf1c" || echo "✅ Secreto eliminado"

# Verificar el archivo en el commit problemático
git show HEAD~1:scripts/setup-codespaces-secrets.sh | grep "VITE_OPENAI_API_KEY"
```

### Paso 5: Force Push

```bash
git push origin feature/pdf-processing-implementation --force
```

---

## 🔄 Después del Push

### 1. Rotar la Clave API

**IMPORTANTE:** La clave ya está expuesta. Debes:

1. Ir a OpenAI Dashboard: https://platform.openai.com/api-keys
2. Revocar la clave antigua
3. Crear una nueva clave
4. Actualizar secretos en GitHub Codespaces con la nueva clave

### 2. Actualizar el Script

El script `scripts/setup-codespaces-secrets.sh` ya tiene el placeholder correcto, pero asegúrate de que documenta que los usuarios deben proporcionar su propia clave.

---

## 📚 Referencias

- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

## ✅ Checklist Final

- [ ] Backup del branch creado
- [ ] Archivo de reemplazo creado
- [ ] git-filter-repo ejecutado
- [ ] Historial limpiado (reflog + gc)
- [ ] Verificación realizada (secreto no encontrado)
- [ ] Force push completado
- [ ] Clave API rotada en OpenAI
- [ ] Secretos actualizados en GitHub

---

**Última actualización:** 2025-01-02  
**Estado:** Listo para ejecutar

