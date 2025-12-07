# Canonical Baselines – AIDUXCARE V2

Este documento define los puntos de referencia "canónicos" del sistema.
Si algo se corrompe o hay dudas, estos tags son las fotos de referencia.

## Lista de baselines

| Tag                         | Rama base             | Fecha       | Descripción                                        |
|-----------------------------|-----------------------|------------|----------------------------------------------------|
| canon-pilot-ca-dec2025-v1   | piloto-ca-dec2025     | 2025-12-07 | Primera baseline canónica del piloto CA-DEC2025. Incluye pipeline de PDFs (imaging) funcionando y documentación de readiness. |

## Uso

- Para inspeccionar el estado exacto de una baseline:

  ```bash
  git checkout canon-pilot-ca-dec2025-v1
  ```

* Para volver al trabajo normal del piloto:

  ```bash
  git checkout piloto-ca-dec2025
  ```

Este documento se actualizará solo cuando se cree una nueva baseline importante.

