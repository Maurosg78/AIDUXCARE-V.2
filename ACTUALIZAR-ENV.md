# ✅ API KEY VÁLIDA - Actualizar Archivos .env

**Resultado del test:** HTTP 200 ✅  
**API Key:** `YOUR_OPENAI_API_KEY_HERE`

---

## Comandos para Actualizar

### 1. Actualizar .env.local

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean

# Si el archivo existe, actualizar
if grep -q "^VITE_OPENAI_API_KEY=" .env.local 2>/dev/null; then
  sed -i.bak "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE|" .env.local
  rm -f .env.local.bak
  echo "✅ .env.local actualizado"
else
  echo "VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE" >> .env.local
  echo "✅ VITE_OPENAI_API_KEY agregada a .env.local"
fi
```

### 2. Actualizar .env (si existe)

```bash
if [ -f .env ]; then
  if grep -q "^VITE_OPENAI_API_KEY=" .env; then
    sed -i.bak "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE|" .env
    rm -f .env.bak
    echo "✅ .env actualizado"
  else
    echo "VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE" >> .env
    echo "✅ VITE_OPENAI_API_KEY agregada a .env"
  fi
fi
```

---

## Script Todo-en-Uno

Ejecuta este comando completo:

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean && \
API_KEY="YOUR_OPENAI_API_KEY_HERE" && \
if grep -q "^VITE_OPENAI_API_KEY=" .env.local 2>/dev/null; then sed -i.bak "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=$API_KEY|" .env.local && rm -f .env.local.bak && echo "✅ .env.local actualizado"; else echo "VITE_OPENAI_API_KEY=$API_KEY" >> .env.local && echo "✅ VITE_OPENAI_API_KEY agregada a .env.local"; fi && \
if [ -f .env ]; then if grep -q "^VITE_OPENAI_API_KEY=" .env; then sed -i.bak "s|^VITE_OPENAI_API_KEY=.*|VITE_OPENAI_API_KEY=$API_KEY|" .env && rm -f .env.bak && echo "✅ .env actualizado"; else echo "VITE_OPENAI_API_KEY=$API_KEY" >> .env && echo "✅ VITE_OPENAI_API_KEY agregada a .env"; fi; fi
```

---

## Verificación

Después de actualizar, verifica:

```bash
grep VITE_OPENAI_API_KEY .env.local
grep VITE_OPENAI_API_KEY .env 2>/dev/null || echo ".env no existe"
```

