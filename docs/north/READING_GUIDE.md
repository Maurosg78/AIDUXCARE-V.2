# Guía de Lectura (Obligatoria)

1) Leer `docs/north/SOURCE_OF_TRUTH.md` (versión vigente).
2) En el PR, incluir: `ACK: SOT v<versión>`.
3) Local:
   - `npm run lint:relaxed`
   - `npm run lint:count`
4) Si se tocan archivos SoT, agregar también `SOT_CHANGE_OK` y bump de versión.
