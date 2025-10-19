#!/usr/bin/env bash
set -euo pipefail
LEGACY_BRANCH="origin/develop"
OUT="reports/design_inventory"
mkdir -p "$OUT"

echo "🔍 Analizando rama: $LEGACY_BRANCH"
echo "📁 Salida: $OUT"

# 1) Rutas/páginas clave
echo "📄 Buscando archivos de UI clave..."
git ls-tree -r --name-only "$LEGACY_BRANCH" | grep -E "(welcome|Welcome|login|Login|register|Register|wizard|Wizard|onboarding|Onboarding)" | sort > "$OUT/files.raw.txt"

git ls-tree -r --name-only "$LEGACY_BRANCH" | grep -E "(welcome|Welcome)" | sort > "$OUT/files.welcome.txt"
git ls-tree -r --name-only "$LEGACY_BRANCH" | grep -E "(register|Register|wizard|Wizard|onboarding|Onboarding)" | sort > "$OUT/files.register.txt"
git ls-tree -r --name-only "$LEGACY_BRANCH" | grep -E "(Step|Stepper|step|stepper)" | sort > "$OUT/files.wizard.txt"
git ls-tree -r --name-only "$LEGACY_BRANCH" | grep -E "(Command|Dashboard|command|dashboard)" | sort > "$OUT/files.pipeline.txt"

# 2) Tailwind y tokens
echo "🎨 Analizando configuración de Tailwind..."
for f in tailwind.config.{js,cjs,ts,mjs}; do
  if git ls-tree -r --name-only "$LEGACY_BRANCH" | grep -q "$f"; then
    echo "📁 Encontrado: $f"
    git show "$LEGACY_BRANCH:$f" > "$OUT/tailwind.config.temp" 2>/dev/null || true
    if [ -f "$OUT/tailwind.config.temp" ]; then
      node -e '
        try {
          const fs = require("fs");
          const content = fs.readFileSync("'$OUT'/tailwind.config.temp", "utf8");
          const config = eval("(" + content.replace(/export default/, "module.exports =") + ")");
          console.log(JSON.stringify(config.theme?.extend || {}, null, 2));
        } catch (e) {
          console.log("{}");
        }
      ' > "$OUT/tokens.tailwind.json" 2>/dev/null || echo "{}" > "$OUT/tokens.tailwind.json"
      rm -f "$OUT/tailwind.config.temp"
    fi
  fi
done

# 3) Variables CSS y fuentes
echo "🎭 Buscando variables CSS y fuentes..."
git grep -n --include="*.css" --include="*.scss" --include="*.tsx" --include="*.ts" \
  -E "(var\(--|font-family|@font-face|@import.*fonts|googleapis.*fonts)" "$LEGACY_BRANCH" 2>/dev/null | sort > "$OUT/tokens.cssvars_fonts.txt" || echo "No se encontraron variables CSS" > "$OUT/tokens.cssvars_fonts.txt"

# 4) Componentes y layouts
echo "🧩 Buscando componentes y layouts..."
git grep -n --include="*.tsx" -E "(Logo|AppShell|Layout|Background|Orb|Gradient|Glass|Stepper|FormProvider|useForm)" "$LEGACY_BRANCH" 2>/dev/null | sort > "$OUT/components.txt" || echo "No se encontraron componentes" > "$OUT/components.txt"

# 5) Rutas
echo "🛣️ Buscando definición de rutas..."
git grep -n --include="*.tsx" -E "(createBrowserRouter|Routes|Route|path:)" "$LEGACY_BRANCH" 2>/dev/null | sort > "$OUT/routes.txt" || echo "No se encontraron rutas" > "$OUT/routes.txt"

# 6) any-check
echo "⚠️ Verificando uso de 'any'..."
git grep -n --include="*.ts" --include="*.tsx" -E ":\s*any\b|as\s+any\b" "$LEGACY_BRANCH" 2>/dev/null | sort > "$OUT/any_usages.txt" || echo "No se encontraron usos de 'any'" > "$OUT/any_usages.txt"

# 7) Archivos específicos de UI
echo "📋 Analizando archivos específicos..."
echo "=== WELCOME PAGE ===" > "$OUT/files.welcome.txt"
git show "$LEGACY_BRANCH:src/pages/WelcomePage.tsx" 2>/dev/null | head -50 >> "$OUT/files.welcome.txt" || echo "No se pudo leer WelcomePage.tsx" >> "$OUT/files.welcome.txt"

echo "=== ONBOARDING PAGE ===" > "$OUT/files.onboarding.txt"
git show "$LEGACY_BRANCH:src/pages/OnboardingPage.tsx" 2>/dev/null | head -50 >> "$OUT/files.onboarding.txt" || echo "No se pudo leer OnboardingPage.tsx" >> "$OUT/files.onboarding.txt"

echo "=== PROFESSIONAL ONBOARDING ===" >> "$OUT/files.onboarding.txt"
git show "$LEGACY_BRANCH:src/pages/ProfessionalOnboardingPage.tsx" 2>/dev/null | head -50 >> "$OUT/files.onboarding.txt" || echo "No se pudo leer ProfessionalOnboardingPage.tsx" >> "$OUT/files.onboarding.txt"

# 8) Estructura de directorios
echo "📂 Estructura de directorios..." > "$OUT/directory_structure.txt"
git ls-tree -r --name-only "$LEGACY_BRANCH" | grep -E "^src/(features|shared|components|pages)" | sort >> "$OUT/directory_structure.txt"

echo "✅ Inventario generado en $OUT"
echo "📊 Archivos encontrados:"
wc -l "$OUT"/*.txt 2>/dev/null || true
