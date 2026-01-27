
### Escenario 6: Cancelación / Interrupción
- [ ] Cancelar grabación a mitad → sistema no queda bloqueado
- [ ] Recargar página post-cancel → estado limpio
- [ ] Cerrar modal durante grabación → estado recuperable
- [ ] Cambiar de pestaña durante grabación → no pierde audio

**Razón:** Las demos suelen fallar por interrupciones humanas, no por lógica clínica.

---

## PROTOCOLO DE PRIORIZACIÓN DE BUGS

### 🔴 BLOQUEANTE (fix inmediato)
- Sistema queda bloqueado sin recuperación
- Error que impide completar flujo completo
- Data loss o corruption

### 🟡 IMPORTANTE (fix si hay tiempo)
- UX confusa pero funcional
- Mensajes poco claros
- Performance lenta pero tolerable

### 🟢 TOLERABLE (post-piloto)
- Edge cases raros
- Mejoras de arquitectura
- Optimizaciones

---

## CRITERIO DE ÉXITO DEL PILOTO

✅ **Mínimo viable:**
- Happy path funciona sin crashes
- Errores dan mensajes claros
- Consentimiento compliant
- SOAP generado es legible

✅ **Deseable:**
- Tiempo total < 2 minutos
- UX pulida
- Loading states informativos

❌ **No crítico para piloto:**
- Context-aware guards
- Episode Plan implementation
- Optimizaciones arquitecturales
