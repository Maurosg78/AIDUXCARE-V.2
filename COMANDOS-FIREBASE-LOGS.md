# Comandos Correctos para Firebase Functions Logs

## Ver Logs de Functions

### Comando Correcto
```bash
# Ver todos los logs de una función
firebase functions:log --only vertexAIProxy

# Ver logs en tiempo real (streaming)
firebase functions:log --only vertexAIProxy --follow

# Ver logs de las últimas N líneas (usando head)
firebase functions:log --only vertexAIProxy | head -20
```

### ❌ Comando Incorrecto
```bash
# NO existe la opción --limit
firebase functions:log --only vertexAIProxy --limit 3  # ❌ Error
```

## Ver Estado de Functions

```bash
# Listar todas las functions
firebase functions:list

# Ver detalles de una función específica
firebase functions:list | grep vertexAIProxy
```

## Verificar Deploy

```bash
# Ver logs recientes después del deploy
firebase functions:log --only vertexAIProxy | head -10

# Buscar mensajes de deploy exitoso
firebase functions:log --only vertexAIProxy | grep -i "deploy\|ready\|success"
```

## Troubleshooting

### Si el deploy falla por función duplicada
```bash
# Eliminar función duplicada en otra región
firebase functions:delete vertexAIProxy --region us-central1 --force

# Luego reintentar deploy
firebase deploy --only functions:vertexAIProxy
```

### Ver logs de errores
```bash
# Filtrar solo errores
firebase functions:log --only vertexAIProxy | grep -i "error\|fail"

# Ver logs con más detalle
firebase functions:log --only vertexAIProxy --level debug
```

---

**Nota:** La opción `--limit` no existe en `firebase functions:log`. Usa `head` o `tail` para limitar la salida.



