# 🏥 Setup de Testing para Fisioterapeutas

## Objetivo

Configurar un entorno de testing accesible y fácil de usar para fisioterapeutas canadienses que prueben AiduxCare.

---

## 🌐 Opción 1: Cloudflare Tunnel (RECOMENDADO)

### Ventajas:
- ✅ **Acceso desde cualquier lugar** (casa, clínica, móvil)
- ✅ **Certificado SSL válido** (sin instalación manual)
- ✅ **URL fácil de recordar:** `https://dev.aiduxcare.com`
- ✅ **Estable y confiable**
- ✅ **Gratis**

### Setup (Una vez):

```bash
# 1. Instalar Cloudflare Tunnel
brew install cloudflared

# 2. Setup inicial
npm run setup:tunnel

# 3. Seguir instrucciones en pantalla
```

### Uso Diario:

```bash
# Iniciar servidor + túnel
npm run dev:tunnel
```

### Para Fisioterapeutas:

1. Abrir Safari en iPhone
2. Ir a: `https://dev.aiduxcare.com`
3. ¡Listo! (sin configuración adicional)

---

## 🔧 Opción 2: mkcert con Dominio Real (Solo Red Local)

### Ventajas:
- ✅ Dominio real (`dev.aiduxcare.com`)
- ✅ Certificado válido (con mkcert)
- ✅ Más rápido (sin túnel)

### Desventajas:
- ❌ Solo funciona en red local
- ❌ Requiere configuración DNS local

### Setup:

```bash
# 1. Instalar mkcert (si no está instalado)
brew install mkcert
mkcert -install

# 2. Generar certificado
mkcert dev.aiduxcare.com "*.dev.aiduxcare.com" localhost 127.0.0.1 ::1

# 3. Mover certificados
mv dev.aiduxcare.com+2.pem certs/cert.pem
mv dev.aiduxcare.com+2-key.pem certs/key.pem

# 4. Configurar DNS local
echo "127.0.0.1  dev.aiduxcare.com" | sudo tee -a /etc/hosts
```

---

## 📱 Configuración en iPhone (Solo Opción 2)

Si usas mkcert, necesitas:

1. **Instalar certificado root en iPhone:**
   - Conectar iPhone a Mac
   - Abrir Keychain Access
   - Exportar certificado root de mkcert
   - Enviar por email a iPhone
   - Instalar en iPhone: Settings → General → Profile
   - Habilitar confianza: Settings → General → About → Certificate Trust

2. **Configurar DNS local** (opcional):
   - Usar app como "DNS Override" o similar
   - O configurar router para redirigir `dev.aiduxcare.com`

---

## 🎯 Recomendación para Testing

### Para Testing Inicial (Red Local):
- Usar **mkcert** con dominio real
- Más rápido de configurar
- Funciona bien si fisioterapeuta está en misma red

### Para Testing Extendido (Múltiples Ubicaciones):
- Usar **Cloudflare Tunnel**
- Acceso desde cualquier lugar
- Más profesional
- Mejor para testing real

---

## 📋 Checklist de Setup

### Setup Inicial:
- [ ] Dominio `aiduxcare.com` configurado en Porkbun
- [ ] Elegir opción (Tunnel o mkcert)
- [ ] Ejecutar scripts de setup
- [ ] Verificar acceso desde iPhone

### Para Cada Sesión de Testing:
- [ ] Iniciar servidor (`npm run dev:tunnel` o `npm run dev:https`)
- [ ] Verificar que `dev.aiduxcare.com` funciona
- [ ] Compartir URL con fisioterapeuta
- [ ] Verificar acceso desde iPhone del fisioterapeuta

---

## 🔍 Troubleshooting

### "dev.aiduxcare.com no carga"
- Verificar que túnel está corriendo (si usas Tunnel)
- Verificar DNS en Porkbun
- Verificar que servidor local está corriendo

### "Certificado no válido"
- Si usas Tunnel: debería funcionar automáticamente
- Si usas mkcert: verificar que certificado root está instalado en iPhone

### "No puedo acceder desde iPhone"
- Verificar que iPhone está en misma red (si usas mkcert)
- Verificar que túnel está activo (si usas Tunnel)
- Verificar firewall en Mac

---

## 📞 Soporte para Fisioterapeutas

**URL de acceso:** `https://dev.aiduxcare.com`

**Instrucciones simples:**
1. Abrir Safari
2. Ir a: `https://dev.aiduxcare.com`
3. Si aparece advertencia de seguridad, contactar soporte técnico

**No requiere:**
- Instalación de apps
- Configuración de certificados (con Tunnel)
- Configuración de DNS (con Tunnel)

---

## 🎯 Próximos Pasos

1. **Elegir opción** (recomendamos Tunnel)
2. **Ejecutar setup** (`npm run setup:tunnel`)
3. **Probar acceso** desde iPhone
4. **Compartir URL** con fisioterapeutas
5. **Iniciar testing**

