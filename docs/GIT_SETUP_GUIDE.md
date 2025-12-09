# 📋 Guía de Configuración Git - Paso a Paso

**Fecha:** 2025-12-07

---

## 🎯 Situación Actual

El script `recover-git-repo-v2.sh` está ejecutándose y te está preguntando por la URL del repositorio de GitHub.

---

## 🅰️ Opción 1: Dejar que el script configure el remoto (Recomendado)

### Paso 1: Obtener URL del repositorio

1. Ve a tu repositorio en GitHub
2. Haz clic en el botón **"Code"** (verde)
3. Elige el formato que uses:
   - **SSH:** `git@github.com:TU-USUARIO/AIDUXCARE-V.2.git`
   - **HTTPS:** `https://github.com/TU-USUARIO/AIDUXCARE-V.2.git`

### Paso 2: Pegar URL en el script

Cuando el script muestre:
```
Por favor, proporciona la URL del repositorio GitHub (o presiona Enter para omitir):
```

Simplemente **pega la URL** y presiona **Enter**.

### Paso 3: Verificar

Después de que el script termine, verifica:

```bash
cd ~/Dev/AIDUXCARE-V.2
git remote -v
```

Deberías ver:
```
origin  git@github.com:TU-USUARIO/AIDUXCARE-V.2.git (fetch)
origin  git@github.com:TU-USUARIO/AIDUXCARE-V.2.git (push)
```

---

## 🅱️ Opción 2: Configurar manualmente después

### Paso 1: Omitir en el script

Cuando el script pregunte por la URL, simplemente presiona **Enter** sin escribir nada.

### Paso 2: Configurar remoto manualmente

```bash
cd ~/Dev/AIDUXCARE-V.2

# Agregar remoto
git remote add origin <URL_DE_TU_REPO>

# Asegurar branch principal es 'main'
git branch -M main

# Verificar
git remote -v
```

### Paso 3: Primer push

```bash
git push -u origin main
```

---

## 🔍 Verificación Post-Configuración

Después de configurar el remoto (con cualquiera de las opciones), ejecuta:

```bash
cd ~/Dev/AIDUXCARE-V.2
./scripts/verify-git-setup.sh
```

Este script verificará:
- ✅ Remoto configurado correctamente
- ✅ Branch correcto (main)
- ✅ .gitignore completo
- ✅ No hay archivos sensibles en staging
- ✅ Commits listos para push
- ✅ Sin líneas raras en git status

---

## 🚨 Si ves líneas raras en git status

Si después de la verificación ves líneas como:
```
?? --filter=bindings.members:serviceAccount:*
?? --flatten=bindings[].members
```

Esto puede indicar problemas con el repositorio. En ese caso:

1. Ejecuta el script de verificación completo
2. Revisa el output
3. Si hay problemas, podemos crear un mini-WO para limpiar esos restos

---

## ✅ Checklist Final

- [ ] Remoto configurado (`git remote -v` muestra origin)
- [ ] Branch es `main` (o `master` si prefieres)
- [ ] Commits hechos correctamente (`git log --oneline`)
- [ ] No hay archivos sensibles en staging
- [ ] Verificación completa sin errores

---

**Última actualización:** 2025-12-07

