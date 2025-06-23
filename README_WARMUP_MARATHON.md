# �� MARATÓN DE CALENTAMIENTO - ESTRATEGIA PARA DESBLOQUEAR VERTEX AI

## 📋 Descripción

Este script automatiza la ejecución continua del test de calentamiento para generar actividad masiva en las APIs de Google Cloud y potencialmente desbloquear el acceso a Vertex AI.

## 🎯 Objetivo

Generar un historial de uso significativo y legítimo en el proyecto `aiduxcare-mvp-prod` durante 24-48 horas para que los sistemas automáticos de Google Cloud levanten las restricciones de acceso a Vertex AI.

## 📁 Archivos

- `run_warmup_marathon.sh` - Script principal de automatización
- `scripts/test-warmup-activity.cjs` - Script de prueba que se ejecuta
- `warmup_marathon_log.txt` - Archivo de log generado automáticamente

## 🚀 Instrucciones de Uso

### 1. Verificar Prerrequisitos

Asegúrate de estar en el directorio raíz del proyecto:
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
```

### 2. Dar Permisos de Ejecución

```bash
chmod +x run_warmup_marathon.sh
```

### 3. Ejecutar el Maratón

```bash
./run_warmup_marathon.sh
```

### 4. Detener el Proceso

Para detener el maratón de forma segura, presiona:
```
Ctrl + C
```

## ⚙️ Configuración

El script está configurado con los siguientes parámetros:

- **Intervalo entre ejecuciones:** 10 minutos
- **Timeout por ejecución:** 5 minutos
- **Archivo de log:** `warmup_marathon_log.txt`
- **Script de prueba:** `scripts/test-warmup-activity.cjs`

## 📊 Monitoreo

### En Tiempo Real
El script muestra en la consola:
- ✅ Estado de cada iteración
- 📊 Estadísticas actuales (total, éxitos, fallos)
- ⏰ Tiempo hasta la próxima ejecución
- 🔥 Confirmación de actividad de calentamiento

### Log Detallado
Todas las ejecuciones se registran en `warmup_marathon_log.txt` con:
- Timestamp de cada iteración
- Salida completa del script de prueba
- Separadores visuales para fácil lectura

## 🎯 Criterios de Éxito

Una iteración se considera **exitosa** cuando:
- El script de prueba se ejecuta sin errores
- La respuesta contiene `warmupStatus: COMPLETED`
- No hay timeouts (máximo 5 minutos por ejecución)

## 📈 Estadísticas

Al detener el script (Ctrl+C), se muestra un resumen final con:
- ⏱️ Tiempo total de ejecución
- 📋 Total de ejecuciones realizadas
- ✅ Número de ejecuciones exitosas
- ❌ Número de ejecuciones fallidas
- 📈 Tasa de éxito porcentual

## 🔧 Solución de Problemas

### Error: "No se encontró el script de prueba"
- Verifica que estés en el directorio raíz del proyecto
- Confirma que existe `scripts/test-warmup-activity.cjs`

### Error: "Node.js no está instalado"
- Instala Node.js desde https://nodejs.org/
- Verifica que esté en el PATH del sistema

### Timeouts frecuentes
- El script tiene un timeout de 5 minutos por ejecución
- Si ocurren timeouts frecuentes, revisa la conectividad de red
- Verifica que la función de Firebase esté funcionando correctamente

## 🎯 Plan de Acción Recomendado

1. **Ejecutar durante la noche:** Inicia el maratón antes de dormir
2. **Monitorear logs:** Revisa `warmup_marathon_log.txt` periódicamente
3. **Verificar actividad:** Confirma que aparezcan logs de "🔥 INICIANDO ACTIVIDAD DE CALENTAMIENTO OBLIGATORIA"
4. **Probar Vertex AI:** Después de 24-48 horas, ejecuta el test de Vertex AI

## 📝 Notas Importantes

- El script es **seguro** y no modifica archivos del proyecto
- La actividad generada es **legítima** y de bajo costo
- El proceso se puede **detener en cualquier momento** con Ctrl+C
- Los logs se **acumulan** en el archivo, no se sobrescriben

## 🎉 Resultado Esperado

Después de 24-48 horas de actividad continua, el objetivo es que:
1. Google Cloud reconozca el proyecto como activo
2. Se levanten las restricciones automáticas
3. Vertex AI esté disponible para el proyecto `aiduxcare-mvp-prod`

---

**¡Listo para ejecutar el maratón de calentamiento! 🔥**
