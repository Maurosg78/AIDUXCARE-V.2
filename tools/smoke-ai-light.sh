#!/usr/bin/env bash
set -euo pipefail

# Script de Smoke Test para AI Light + Offline Mode + Promote to Pro
# Valida el flujo completo: grabación offline → almacenamiento → promoción → IA Pro

PROJECT_ID="aiduxcare-v2-uat-dev"
BASE_URL="http://127.0.0.1:5001/$PROJECT_ID/europe-west1"
DEMO_URL="http://localhost:3000/ai-light-demo"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para verificar si un servicio está corriendo
check_service() {
    local service_name="$1"
    local port="$2"
    
    if lsof -i :$port >/dev/null 2>&1; then
        log_success "$service_name corriendo en puerto $port"
        return 0
    else
        log_error "$service_name NO está corriendo en puerto $port"
        return 1
    fi
}

# Función para verificar emuladores Firebase
check_emulators() {
    log_info "Verificando emuladores Firebase..."
    
    local all_ok=true
    
    # Verificar Functions
    if check_service "Firebase Functions" "5001"; then
        log_success "Emulador Functions OK"
    else
        all_ok=false
    fi
    
    # Verificar Firestore
    if check_service "Firebase Firestore" "8080"; then
        log_success "Emulador Firestore OK"
    else
        all_ok=false
    fi
    
    # Verificar Auth
    if check_service "Firebase Auth" "9099"; then
        log_success "Emulador Auth OK"
    else
        all_ok=false
    fi
    
    # Verificar UI
    if check_service "Firebase UI" "4001"; then
        log_success "Emulador UI OK"
    else
        all_ok=false
    fi
    
    if [ "$all_ok" = false ]; then
        log_error "Algunos emuladores no están corriendo"
        log_info "Ejecuta: firebase emulators:start --only auth,firestore,functions"
        return 1
    fi
    
    return 0
}

# Función para verificar endpoint de transcripciones locales
test_local_transcription_endpoint() {
    log_info "Probando endpoint de transcripciones locales..."
    
    local test_payload='{
        "id": "smoke-test-123",
        "text": "paciente refiere dolor lumbar de 3 días",
        "confidence": 0.75,
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
        "userId": "smoke-test-user",
        "sessionId": "smoke-test-session",
        "metadata": {
            "duration": 45,
            "sampleRate": 44100,
            "channels": 1
        }
    }'
    
    local response=$(curl -s -w "\nHTTP %{http_code}" -X POST "$BASE_URL/processLocalTranscription" \
        -H "Content-Type: application/json" \
        -d "$test_payload")
    
    local http_code=$(echo "$response" | tail -n1 | awk '{print $2}')
    local response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        log_success "Endpoint processLocalTranscription responde correctamente"
        
        # Verificar que la respuesta contiene los campos esperados
        if echo "$response_body" | grep -q '"proText"' && \
           echo "$response_body" | grep -q '"improvements"' && \
           echo "$response_body" | grep -q '"confidence"'; then
            log_success "Respuesta contiene estructura esperada"
            
            # Mostrar mejoras aplicadas
            local improvements=$(echo "$response_body" | grep -o '"improvements":\[[^]]*\]' | head -1)
            log_info "Mejoras aplicadas: $improvements"
        else
            log_warning "Respuesta no contiene estructura esperada"
        fi
    else
        log_error "Endpoint processLocalTranscription falló con HTTP $http_code"
        log_info "Response: $response_body"
        return 1
    fi
    
    return 0
}

# Función para verificar endpoint de transcripciones Pro
test_pro_transcriptions_endpoint() {
    log_info "Probando endpoint de transcripciones Pro..."
    
    local response=$(curl -s -w "\nHTTP %{http_code}" -X GET \
        "$BASE_URL/getProTranscriptions?userId=smoke-test-user&limit=5")
    
    local http_code=$(echo "$response" | tail -n1 | awk '{print $2}')
    local response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        log_success "Endpoint getProTranscriptions responde correctamente"
        
        # Verificar estructura de respuesta
        if echo "$response_body" | grep -q '"success":true'; then
            log_success "Respuesta indica éxito"
        else
            log_warning "Respuesta no indica éxito"
        fi
    else
        log_error "Endpoint getProTranscriptions falló con HTTP $http_code"
        log_info "Response: $response_body"
        return 1
    fi
    
    return 0
}

# Función para verificar Service Worker
check_service_worker() {
    log_info "Verificando Service Worker..."
    
    if [ -f "public/sw.js" ]; then
        log_success "Service Worker existe en public/sw.js"
        
        # Verificar que el SW tiene las funciones esperadas
        if grep -q "uploadPendingTranscriptions" public/sw.js && \
           grep -q "IndexedDB" public/sw.js && \
           grep -q "background sync" public/sw.js; then
            log_success "Service Worker contiene funcionalidades esperadas"
        else
            log_warning "Service Worker puede estar incompleto"
        fi
    else
        log_error "Service Worker NO existe en public/sw.js"
        return 1
    fi
    
    return 0
}

# Función para verificar archivos del módulo
check_module_files() {
    log_info "Verificando archivos del módulo AI Light..."
    
    local all_files_exist=true
    
    local required_files=(
        "src/stores/aiModeStore.ts"
        "src/core/sttLocal/index.ts"
        "src/components/PromoteToProButton.tsx"
        "src/pages/AILightDemoPage.tsx"
        "functions/src/localTranscriptionProcessor.ts"
        "src/tests/stores/aiModeStore.spec.ts"
        "src/tests/core/sttLocal/index.spec.ts"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "✓ $file"
        else
            log_error "✗ $file NO existe"
            all_files_exist=false
        fi
    done
    
    if [ "$all_files_exist" = false ]; then
        log_error "Algunos archivos del módulo no existen"
        return 1
    fi
    
    return 0
}

# Función para verificar tests
run_tests() {
    log_info "Ejecutando tests del módulo AI Light..."
    
    # Verificar que vitest está disponible
    if ! command -v npx &> /dev/null; then
        log_error "npx no está disponible"
        return 1
    fi
    
    # Ejecutar tests específicos del módulo
    local test_results=$(npx vitest run src/tests/stores/aiModeStore.spec.ts src/tests/core/sttLocal/index.spec.ts --reporter=verbose 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "Tests del módulo AI Light pasaron exitosamente"
        
        # Extraer cobertura si está disponible
        if echo "$test_results" | grep -q "Coverage:"; then
            local coverage=$(echo "$test_results" | grep "Coverage:" | tail -1)
            log_info "Cobertura: $coverage"
        fi
    else
        log_error "Tests del módulo AI Light fallaron"
        log_info "Output de tests:"
        echo "$test_results"
        return 1
    fi
    
    return 0
}

# Función para verificar linting
check_linting() {
    log_info "Verificando linting del módulo..."
    
    # Verificar que eslint está disponible
    if ! command -v npx &> /dev/null; then
        log_error "npx no está disponible"
        return 1
    fi
    
    # Ejecutar linting en archivos del módulo
    local lint_results=$(npx eslint src/stores/aiModeStore.ts src/core/sttLocal/index.ts src/components/PromoteToProButton.tsx src/pages/AILightDemoPage.tsx --ext .ts,.tsx 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "Linting del módulo AI Light OK"
    else
        log_error "Linting del módulo AI Light falló"
        log_info "Errores de linting:"
        echo "$lint_results"
        return 1
    fi
    
    return 0
}

# Función para verificar tipos TypeScript
check_typescript() {
    log_info "Verificando tipos TypeScript..."
    
    # Verificar que tsc está disponible
    if ! command -v npx &> /dev/null; then
        log_error "npx no está disponible"
        return 1
    fi
    
    # Verificar tipos en archivos del módulo
    local type_check_results=$(npx tsc --noEmit src/stores/aiModeStore.ts src/core/sttLocal/index.ts src/components/PromoteToProButton.tsx src/pages/AILightDemoPage.tsx 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "TypeScript types del módulo AI Light OK"
    else
        log_error "TypeScript types del módulo AI Light fallaron"
        log_info "Errores de tipos:"
        echo "$type_check_results"
        return 1
    fi
    
    return 0
}

# Función para verificar build de Functions
check_functions_build() {
    log_info "Verificando build de Firebase Functions..."
    
    if [ -d "functions/lib" ]; then
        log_success "Functions compiladas en functions/lib/"
        
        # Verificar que las nuevas funciones están exportadas
        if grep -q "processLocalTranscription" functions/lib/index.js && \
           grep -q "getProTranscriptions" functions/lib/index.js; then
            log_success "Nuevas funciones exportadas correctamente"
        else
            log_error "Nuevas funciones NO están exportadas"
            return 1
        fi
    else
        log_error "Functions NO están compiladas"
        log_info "Ejecuta: cd functions && npm run build"
        return 1
    fi
    
    return 0
}

# Función principal de smoke test
main() {
    echo "🚀 AI Light + Offline Mode Smoke Test"
    echo "====================================="
    echo ""
    
    local all_tests_passed=true
    
    # 1. Verificar archivos del módulo
    if ! check_module_files; then
        all_tests_passed=false
    fi
    
    echo ""
    
    # 2. Verificar emuladores Firebase
    if ! check_emulators; then
        all_tests_passed=false
    fi
    
    echo ""
    
    # 3. Verificar build de Functions
    if ! check_functions_build; then
        all_tests_passed=false
    fi
    
    echo ""
    
    # 4. Verificar Service Worker
    if ! check_service_worker; then
        all_tests_passed=false
    fi
    
    echo ""
    
    # 5. Probar endpoints de Functions
    if ! test_local_transcription_endpoint; then
        all_tests_passed=false
    fi
    
    echo ""
    
    if ! test_pro_transcriptions_endpoint; then
        all_tests_passed=false
    fi
    
    echo ""
    
    # 6. Verificar linting
    if ! check_linting; then
        all_tests_passed=false
    fi
    
    echo ""
    
    # 7. Verificar tipos TypeScript
    if ! check_typescript; then
        all_tests_passed=false
    fi
    
    echo ""
    
    # 8. Ejecutar tests
    if ! run_tests; then
        all_tests_passed=false
    fi
    
    echo ""
    echo "====================================="
    
    if [ "$all_tests_passed" = true ]; then
        log_success "🎉 TODOS LOS TESTS DE SMOKE PASARON"
        log_success "El módulo AI Light + Offline Mode está operativo"
        echo ""
        log_info "Próximos pasos:"
        echo "  1. Navegar a $DEMO_URL para probar la demo"
        echo "  2. Activar modo offline y grabar audio"
        echo "  3. Verificar almacenamiento en IndexedDB"
        echo "  4. Probar Promote to Pro automático y manual"
        echo "  5. Confirmar estructura SOAP en transcripciones Pro"
        exit 0
    else
        log_error "💥 ALGUNOS TESTS DE SMOKE FALLARON"
        log_error "El módulo AI Light + Offline Mode NO está operativo"
        echo ""
        log_info "Revisa los errores arriba y corrige los problemas"
        log_info "Luego ejecuta este script nuevamente"
        exit 1
    fi
}

# Ejecutar smoke test
main "$@"
