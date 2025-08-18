#!/usr/bin/env bash
set -euo pipefail

# Script para configurar hooks de Git para AiDuxCare V.2
# Configura pre-commit y pre-push automáticamente

echo "🔧 Configurando hooks de Git para AiDuxCare V.2..."

# Verificar que estamos en un repo Git
if [[ ! -d ".git" ]]; then
    echo "❌ No estás en un repositorio Git"
    exit 1
fi

# Crear directorio de hooks si no existe
mkdir -p .git/hooks

# --- Pre-commit Hook ---
echo "📝 Configurando pre-commit hook..."

cat > .git/hooks/pre-commit << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "🔎 pre-commit: validando calidad y smokes…"

# --- 1) Guardrails rápidos (naming y proyecto)
if git diff --cached -U0 | grep -E 'assistant(Query|DataLookup)Function' -q; then
  echo "❌ No uses sufijos *Function. Usa: assistantQuery / assistantDataLookup."
  exit 1
fi
if git diff --cached -U0 | grep -E 'aiduxcare-stt-2025' -q; then
  echo "❌ Project ID incorrecto en comandos. Usa: aiduxcare-v2-uat-dev."
  exit 1
fi

# --- 2) Lint + Types
if npm run -s lint; then
  echo "✅ Lint OK"
else
  echo "❌ Lint falló"; exit 1
fi

if npx tsc --noEmit; then
  echo "✅ TypeScript OK"
else
  echo "❌ TypeScript falló"; exit 1
fi

# --- 3) Emuladores presentes?
check_port() { nc -z 127.0.0.1 "$1" >/dev/null 2>&1; }
FN=$(check_port 5001 && echo "up" || echo "down")
FS=$(check_port 8080 && echo "up" || echo "down")
AU=$(check_port 9099 && echo "up" || echo "down")

STRICT=${AIDUX_STRICT_SMOKE:-0}
if [[ "$FN" == "up" && "$FS" == "up" && "$AU" == "up" ]]; then
  echo "🟢 Emuladores UP → corriendo smokes…"
  ./tools/smoke-functions.sh
  ./tools/smoke-ai-light.sh
  echo "✅ Smokes OK"
else
  if [[ "$STRICT" == "1" ]]; then
    echo "❌ Emuladores no están corriendo (5001/8080/9099). Inícialos o export AIDUX_STRICT_SMOKE=0 para permitir commit."
    exit 1
  else
    echo "🟡 Emuladores no detectados; omito smokes por velocidad. (export AIDUX_STRICT_SMOKE=1 para exigirlos)"
  fi
fi

echo "✅ pre-commit passed"
EOF

chmod +x .git/hooks/pre-commit
echo "✅ Pre-commit hook configurado"

# --- Pre-push Hook ---
echo "📝 Configurando pre-push hook..."

cat > .git/hooks/pre-push << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "🚀 pre-push: validación obligatoria antes de push…"

# Obtener rama destino
while read local_ref local_sha remote_ref remote_sha; do
    if [[ "$remote_ref" == refs/heads/main ]] || [[ "$remote_ref" == refs/heads/release/* ]]; then
        echo "🔒 Push a rama crítica detectada: $remote_ref"
        echo "Ejecutando validación obligatoria…"
        
        # --- 1) Calidad de código obligatoria
        echo "📋 Verificando calidad de código…"
        if ! npm run -s lint; then
            echo "❌ Lint falló - push bloqueado"
            exit 1
        fi
        
        if ! npx tsc --noEmit; then
            echo "❌ TypeScript falló - push bloqueado"
            exit 1
        fi
        
        # --- 2) Smoke tests obligatorios
        echo "🧪 Ejecutando smoke tests obligatorios…"
        
        # Verificar que los scripts existen
        if [[ ! -f "./tools/smoke-functions.sh" ]] || [[ ! -f "./tools/smoke-ai-light.sh" ]]; then
            echo "❌ Scripts de smoke test no encontrados - push bloqueado"
            exit 1
        fi
        
        # Ejecutar smoke tests
        if ! ./tools/smoke-functions.sh; then
            echo "❌ Smoke test de Functions falló - push bloqueado"
            exit 1
        fi
        
        if ! ./tools/smoke-ai-light.sh; then
            echo "❌ Smoke test de AI Light falló - push bloqueado"
            exit 1
        fi
        
        echo "✅ Validación pre-push completada exitosamente"
        echo "🚀 Push permitido a $remote_ref"
        break
    fi
done

# Si no es rama crítica, permitir push sin validación
echo "🟡 Push a rama no crítica - validación omitida"
echo "✅ Push permitido"
EOF

chmod +x .git/hooks/pre-push
echo "✅ Pre-push hook configurado"

# --- Verificar scripts de smoke test ---
echo "🔍 Verificando scripts de smoke test..."

if [[ ! -f "./tools/smoke-functions.sh" ]]; then
    echo "⚠️  Script smoke-functions.sh no encontrado"
    echo "   Crea el script en tools/smoke-functions.sh"
else
    echo "✅ smoke-functions.sh encontrado"
fi

if [[ ! -f "./tools/smoke-ai-light.sh" ]]; then
    echo "⚠️  Script smoke-ai-light.sh no encontrado"
    echo "   Crea el script en tools/smoke-ai-light.sh"
else
    echo "✅ smoke-ai-light.sh encontrado"
fi

# --- Instrucciones de uso ---
echo ""
echo "🎯 Hooks configurados exitosamente!"
echo ""
echo "📋 Cómo usar:"
echo "   • Cada commit ejecutará automáticamente:"
echo "     - Lint + TypeScript"
echo "     - Smoke tests (si emuladores están corriendo)"
echo "   • Cada push a main/release/* ejecutará:"
echo "     - Validación obligatoria completa"
echo "     - Smoke tests obligatorios"
echo ""
echo "⚙️  Configuración:"
echo "   • Modo rápido (por defecto): omite smokes si emuladores down"
echo "   • Modo estricto: export AIDUX_STRICT_SMOKE=1"
echo ""
echo "🧪 Para probar:"
echo "   1. Arranca emuladores: firebase emulators:start"
echo "   2. Haz un commit: git commit -m 'test'"
echo "   3. Verifica que se ejecuten los hooks"
echo ""
echo "✅ Configuración completada!"
