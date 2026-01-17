# 🔍 COMANDO CURL PARA PROBAR API KEY

## Comando Simple:

```bash
curl -H "Authorization: Bearer YOUR_OPENAI_API_KEY_HERE" \
  https://api.openai.com/v1/models
```

## Comando con Status Code:

```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY_HERE" \
  https://api.openai.com/v1/models
```

## Resultado Esperado:

- **HTTP 200**: ✅ Key válida
- **HTTP 401**: ❌ Key inválida o revocada

---

## Script Automático (Recomendado):

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
./scripts/test-and-update-key.sh
```

Este script:
1. Prueba la key con curl
2. Si funciona (HTTP 200), actualiza `.env.local` y `.env`
3. Si no funciona, muestra el error

