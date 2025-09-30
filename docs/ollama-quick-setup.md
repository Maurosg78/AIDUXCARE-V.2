# ⚡ Setup Ollama SÚPER RÁPIDO - 15 minutos total

## 🎯 **MAURICIO: EJECUTA ESTOS COMANDOS**

### **PASO 1: Instalar Ollama** (2 minutos)

```bash
# macOS/Linux - Una sola línea
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Descargar .exe desde https://ollama.ai/download
```

### **PASO 2: Descargar Modelo** (5 minutos - descarga automática)

```bash
# Modelo compacto pero potente (3.2B parámetros)
ollama pull llama3.2:3b

# Verificar que se instaló
ollama list
```

### **PASO 3: Probar que Funciona** (1 minuto)

```bash
# Terminal 1: Iniciar servidor
ollama serve

# Terminal 2: Test básico
ollama run llama3.2:3b "¿Qué es fisioterapia?"
```

### **PASO 4: Integrar con AiDuxCare** (5 minutos)

```bash
# En el directorio de AiDuxCare
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

# Crear archivos necesarios
mkdir -p src/lib src/services src/scripts
touch src/lib/ollama.ts
touch src/services/nlpServiceOllama.ts  
touch src/scripts/testOllama.ts

# Configurar variables
echo "VITE_LLM_PROVIDER=ollama" >> .env.local
echo "VITE_OLLAMA_URL=http://localhost:11434" >> .env.local
echo "VITE_OLLAMA_MODEL=llama3.2:3b" >> .env.local
```

### **PASO 5: Test Final** (2 minutos)

```bash
# Verificar que Ollama responde
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Genera una nota médica de ejemplo",
  "stream": false
}' | jq '.response'
```

---

## ✅ **CHECKLIST RÁPIDO**

- [ ] Ollama instalado (`ollama --version`)
- [ ] Modelo descargado (`ollama list`)
- [ ] Servidor corriendo (`ollama serve`)
- [ ] Test básico funciona
- [ ] Variables configuradas en `.env.local`
- [ ] Archivos creados en AiDuxCare

---

## 🚨 **SI ALGO FALLA:**

```bash
# Error: comando no encontrado
export PATH=$PATH:/usr/local/bin

# Error: modelo no descarga
ollama pull llama3.2:3b --verbose

# Error: puerto ocupado
lsof -i :11434
pkill ollama
ollama serve
```

---

## 🎉 **¡LISTO!**

Una vez completado, tendrás:
- ✅ LLM local funcionando
- ✅ 100% gratuito
- ✅ Listo para integrar con AiDuxCare

**Tiempo total: ~15 minutos**
**Costo: $0.00** 🆓

**¡Reporta cuando esté completo!** 