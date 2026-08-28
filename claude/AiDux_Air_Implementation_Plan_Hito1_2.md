# AiDux Air — Plan de implementación técnica: Hito 1 y 2

*Deriva de `AiDux_Air_PRD_Fase1_Spike.md`. Este archivo es el "cómo"; el PRD es el "qué/por qué" y no se toca acá.*

*Rama de origen confirmada: `stable` (es la que despliega `deploy-pilot.yml` a pilot.aiduxcare.com; `main` está abandonada desde `fd1ba961`). El repo paralelo parte del build de `stable`, no de `main`.*

---

## Hito 1 — Repo paralelo + shell de Capacitor

### Decisión de arquitectura: wrapper delgado, no fork del código fuente

`aidux-air` es un **repo nuevo y separado** que envuelve el **build de producción** (`dist/`) de `aiduxcare-stable`, no una copia del código fuente React/TS. Razones:

- El PRD dice explícitamente "envolver el cliente existente" — el cliente ya existe y se mantiene en `aiduxcare-stable`. Duplicar `src/` en un segundo repo crea dos fuentes de verdad que divergen en cada commit — exactamente el problema `main`/`stable` que ya encontramos y que costó reconstruir esta sesión.
- El backend (whisperProxy, Vertex AI, Firestore) no cambia — el shell nativo solo necesita el bundle JS/CSS compilado apuntando a esos mismos endpoints.
- Es un spike con criterio de salida go/no-go en 2-3 semanas (por el propio PRD) — si falla, se borra un repo delgado, no se revierte un fork completo.

Flujo de build: `aiduxcare-stable` compila (`npm run build` → `dist/`) → `dist/` se copia a `aidux-air/www/` → Capacitor sincroniza `www/` hacia los proyectos nativos (`npx cap sync`). Para este spike el copiado es manual (`scripts/sync-web.sh`); no se automatiza con CI hasta que el spike apruebe.

### Estructura de carpetas

```
aidux-air/                          (repo git nuevo, sibling de aiduxcare-stable)
├── capacitor.config.ts
├── package.json
├── www/                            (destino del dist/ copiado — gitignored, se regenera)
├── scripts/
│   └── sync-web.sh                 (copia dist/ de ../aiduxcare-stable, corre `cap sync`)
├── ios/
│   └── App/
│       ├── App.xcworkspace
│       ├── App/
│       │   ├── Info.plist          (UIBackgroundModes, NSMicrophoneUsageDescription)
│       │   ├── AppDelegate.swift
│       │   └── capacitor.config.json
│       └── Podfile
├── android/                        (Hito 3 — no se toca en Hito 1/2)
├── src/
│   └── plugins/
│       └── background-audio/       (el plugin nativo delgado del Hito 2)
│           ├── package.json        (plugin Capacitor como paquete local, no publicado)
│           ├── src/
│           │   ├── definitions.ts  (interfaz TS del plugin)
│           │   ├── index.ts        (registro `registerPlugin`)
│           │   └── web.ts          (stub web — no-op o fallback a MediaRecorder)
│           └── ios/
│               └── Plugin/
│                   ├── BackgroundAudioPlugin.swift
│                   └── BackgroundAudioPlugin.m   (bridge Objective-C, requerido por Capacitor)
├── .github/workflows/
│   └── ci.yml                      (ver sección "CI: evitar el no-op")
└── .gitignore
```

### Librerías y versiones exactas

| Paquete | Rol |
|---|---|
| `@capacitor/core` | runtime del bridge JS↔nativo |
| `@capacitor/cli` | `cap init`, `cap add`, `cap sync`, `cap open` |
| `@capacitor/ios` | proyecto Xcode template + pods base |
| `@capacitor/android` | se agrega en Hito 3, no en Hito 1/2 |

Fijar versiones exactas (no `^`/`~`) en `package.json` — Capacitor rompe compatibilidad entre majors (6→7) y este spike no debe absorber ese riesgo a mitad de camino. Usar la última versión estable de Capacitor 7.x disponible al momento de instalar (verificar con `npm view @capacitor/core versions --json` antes de fijar, no asumir un número de memoria).

Los 6 skills de `cap-go/capgo-skills` ya instalados en este entorno (`capacitor-best-practices`, `capacitor-plugins`, `debugging-capacitor`, `capacitor-testing`, `capacitor-deep-linking`, `capacitor-security`) cubren buena parte de las decisiones de scaffolding de esta sección — se invocan al momento de escribir el código, no en este documento de planificación.

### Pasos concretos de scaffolding

1. `mkdir aidux-air && cd aidux-air && git init && npm init -y`
2. `npm install @capacitor/core @capacitor/cli`
3. `npx cap init "AiDux Air" "com.aiduxcare.air" --web-dir www`
4. Copiar el build: `cd ../aiduxcare-stable && npm run build && cp -R dist/* ../aidux-air/www/`
5. `npm install @capacitor/ios`
6. `npx cap add ios` — **requiere Xcode completo instalado**, no solo Command Line Tools. Este es el corte real de este entorno (ver reporte de estado).
7. `npx cap sync ios` — instala pods (**requiere CocoaPods**, `sudo gem install cocoapods` o `brew install cocoapods`).
8. `npx cap open ios` — abre Xcode; desde ahí, compilar y correr en simulador o dispositivo real conectado.

### Bundle ID y firma

`com.aiduxcare.air` como bundle ID separado de cualquier bundle ID de producción existente — este es un spike descartable, no debe compartir identidad de app con nada que eventualmente vaya a App Store. Requiere una cuenta de Apple Developer (gratuita alcanza para correr en un dispositivo propio vía Xcode; la cuenta de pago —99 USD/año— solo hace falta para TestFlight, que es la Fase 4 del PRD, no el Hito 1).

---

## Hito 2 — Plugin nativo mínimo de audio en segundo plano (iOS)

### APIs nativas exactas

**1. `Info.plist` — declarar el background mode y el permiso:**

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
<key>NSMicrophoneUsageDescription</key>
<string>AiDux Air necesita el micrófono para transcribir la sesión clínica que iniciás manualmente.</string>
```

`UIBackgroundModes: audio` es la única entitlement que le permite a iOS mantener vivo un proceso en background para audio (grabación o reproducción) — sin esto, iOS suspende la app en segundos al apagar pantalla, sin importar qué haga el código Swift.

**2. `AVAudioSession` — configurar la categoría correcta antes de armar el motor de grabación:**

```swift
import AVFoundation

let session = AVAudioSession.sharedInstance()
try session.setCategory(.playAndRecord,
                         mode: .default,
                         options: [.allowBluetooth, .defaultToSpeaker])
try session.setActive(true)
```

`.playAndRecord` (no `.record` solo) es la categoría que en la práctica sostiene mejor la sesión en background en dispositivos reales — `.record` a secas es más propenso a que el sistema la interrumpa. `.allowBluetooth` importa si el fisio eventualmente usa audífonos; no es crítico para el spike pero cuesta cero incluirlo ahora.

**3. Motor de captura: `AVAudioEngine`, no `AVAudioRecorder`.**

`AVAudioRecorder` es más simple pero da menos control sobre el formato de salida y sobre reaccionar a interrupciones (llamadas entrantes, Siri). `AVAudioEngine` con un `installTap` sobre el `inputNode` permite escribir el buffer a un archivo (`AVAudioFile`) de forma incremental — más robusto para sesiones de horas, y más fácil de trocear en chunks para subir a `whisperProxy` sin esperar a que termine toda la sesión.

```swift
let engine = AVAudioEngine()
let input = engine.inputNode
let format = input.outputFormat(forBus: 0)

input.installTap(onBus: 0, bufferSize: 4096, format: format) { buffer, time in
    // escribir a AVAudioFile en chunks (ver "Persistencia y subida" abajo)
}
try engine.start()
```

**4. Registro como plugin de Capacitor (`CAPPlugin`):**

```swift
import Capacitor

@objc(BackgroundAudioPlugin)
public class BackgroundAudioPlugin: CAPPlugin {
    @objc func startRecording(_ call: CAPPluginCall) {
        // configurar sesión + engine, iniciar tap
        call.resolve()
    }

    @objc func stopRecording(_ call: CAPPluginCall) {
        // detener tap, cerrar archivo, devolver ruta o subir directamente
        call.resolve(["filePath": path])
    }
}
```

Con su bridge Objective-C obligatorio (`BackgroundAudioPlugin.m`):

```objc
#import <Capacitor/Capacitor.h>
CAP_PLUGIN(BackgroundAudioPlugin, "BackgroundAudio",
    CAP_PLUGIN_METHOD(startRecording, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopRecording, CAPPluginReturnPromise);
)
```

**5. Interfaz TS del lado JS (`definitions.ts`):**

```typescript
export interface BackgroundAudioPlugin {
  startRecording(): Promise<void>;
  stopRecording(): Promise<{ filePath: string }>;
}
```

Esta interfaz es deliberadamente mínima — dos métodos, sin opciones — porque el PRD es explícito en que el spike no incluye inicio/fin automático ni ninguna lógica de las 3 capas de identificación; solo probar que la grabación sobrevive.

### Persistencia y subida — reutilizando lo que ya existe

El PRD dice "subir el blob al mismo `whisperProxy` ya existente". Esto es directamente reutilizable sin cambios de backend:

- El archivo `.m4a`/`.caf` que arma `AVAudioEngine` se puede convertir a los formatos que ya acepta `FirebaseWhisperService.transcribe()` (revisar `mimeType` esperado por `whisperProxy` — hoy acepta `audio/webm` desde el flujo web; confirmar en el propio Cloud Function si acepta `audio/x-m4a` o si hace falta transcodificar antes de subir).
- El resto del contrato (`base64Audio`, `idToken` de Firebase Auth, endpoint HTTP) no cambia — el plugin nativo solo necesita producir el blob; la llamada HTTP la sigue haciendo la capa JS existente (`FirebaseWhisperService`), corriendo dentro del WebView de Capacitor exactamente igual que corre hoy en el navegador.
- Para sesiones de 6-8 horas, subir al final es frágil (un solo fallo de red pierde todo). El plugin debe trocear el archivo en segmentos (p. ej. cada 5-10 min) y subirlos incrementalmente — mismo patrón de "chunking" que ya usa `useTranscript.ts` en la versión web, adaptado al contexto nativo.

### Qué NO se resuelve en el Hito 2

- Ninguna lógica de reconexión ante pérdida de red prolongada (el bolsillo puede pasar por zonas sin señal).
- Ninguna gestión de batería más allá de lo que Apple exige declarar — no hay UI de aviso de batería baja en este spike.
- Nada de Android — eso es el Hito 3, explícitamente fuera del alcance de esta sesión de trabajo.

---

## CI del repo paralelo: evitar el no-op que ya encontramos en `aiduxcare-stable`

`ci.yml` en el repo original tiene un job cuyo `if:` compara el output de un step (siempre string) contra un booleano literal — la condición nunca se cumple, y el job pasa en verde sin ejecutar lint/typecheck/build/test. Antes de confiar en cualquier CI nuevo acá, se verifica con una prueba real, no se asume:

1. Escribir `ci.yml` mínimo para `aidux-air` (typecheck del TS del plugin + lint, sin pasos condicionales `if:` sobre outputs de steps — la causa raíz del bug original).
2. Hacer un commit que **rompe deliberadamente** el build (p. ej. un error de sintaxis TS en `definitions.ts`), pushear, confirmar que el check da **rojo**.
3. Revertir el commit roto, confirmar que el check da **verde**.
4. Solo después de ver ambos estados reales, confiar en que el check protege algo — no antes.

Este ítem se ejecuta como parte del Hito 1 (antes de escribir el plugin nativo real), según lo pedido explícitamente.
