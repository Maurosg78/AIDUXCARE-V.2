# Prácticas de Shell para el Equipo

## Regla Principal: No mezclar comentarios en la misma línea

**Siempre escribir comandos así:**

```bash
cd ~/Dev/AIDUXCARE-V.2

# Comentario en línea aparte
git status

# Otro comentario
git pull origin piloto-ca-dec2025
```

**Nunca copiar/pegar cosas tipo:**

```bash
pnpm dev    # esto a veces trae caracteres raros
cd ~/Dev    # comentario aquí puede causar errores
```

## Por qué

Cuando copias/pegas comandos con comentarios en la misma línea, pueden introducirse caracteres invisibles o problemas de encoding que causan errores como:

- `pwd: too many arguments`
- `cd: no such file or directory` (cuando el path es correcto)
- Errores de parsing inesperados

## Formato correcto en WOs

En cualquier WO con comandos, seguir esta regla:

1. **Comandos sin comentarios al final de la línea**
2. **Comentarios en línea aparte con `#`**

### Ejemplo correcto:

```bash
cd ~/Dev/AIDUXCARE-V.2

# Verificar rama actual
git branch --show-current

# Hacer pull de cambios
git pull origin piloto-ca-dec2025
```

### Ejemplo incorrecto:

```bash
cd ~/Dev/AIDUXCARE-V.2  # ir al repo
git branch --show-current  # ver rama
git pull origin piloto-ca-dec2025  # actualizar
```

## Ante duda

Si no estás seguro, pegar primero el comando solo y luego el comentario en la siguiente línea.

## Aplicación

- ✅ Todos los WOs nuevos deben seguir este formato
- ✅ Scripts de shell deben tener comentarios en líneas separadas
- ✅ Documentación técnica debe usar este formato

Esto evita errores tontos que queman tiempo y paciencia del equipo.

