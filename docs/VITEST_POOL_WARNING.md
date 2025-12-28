# Vitest Pool Configuration Warning

## ⚠️ IMPORTANT: `--pool=threads` está prohibido

En este proyecto, Vitest con `--pool=threads` se cuelga debido a un deadlock en el pool de threads. **Siempre usar `--pool=forks`** para runs estables.

## Comando recomendado

```bash
pnpm test:lowmem:file <test-file>
```

Ejemplos:

```bash
pnpm test:lowmem:file src/__tests__/smoke.test.ts
pnpm test:lowmem:file src/components/navigation/__tests__/ProtectedRoute.test.tsx
```

O manualmente:

```bash
NODE_OPTIONS='--max-old-space-size=8192' node scripts/vitest-run.cjs run <test-file> --config vitest.lowmem.config.ts --pool=forks --no-file-parallelism --maxWorkers=1
```

## Configuración estable

- Pool: `forks` (nunca `threads`)
- Workers: `1` (con `--no-file-parallelism`)
- Memory: `--max-old-space-size=8192`
- Config: `vitest.lowmem.config.ts`

