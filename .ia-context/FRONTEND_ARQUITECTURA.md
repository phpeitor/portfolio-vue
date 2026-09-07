# Arquitectura Frontend

Documento de referencia para entender **cómo está construido** el portfolio antes de tocar código. Complementa a:

- [`FRONTEND_STANDARDS.md`](./FRONTEND_STANDARDS.md) — cómo escribir código nuevo (convenciones).
- [`FRONTEND_RULES.md`](./FRONTEND_RULES.md) — reglas de identidad visual y assets WebGL.
- [`AGENTS_ROLES.md`](./AGENTS_ROLES.md) — qué agente/rol toca qué parte del sistema.

## 1. Resumen

SPA de una sola página (sin `vue-router`, sin store centralizado tipo Pinia/Vuex) que combina:

- **Capa UI 2D** en Vue 3 (`<script setup>` + SCSS) para header, secciones, textos, botones.
- **Capa 3D** en three.js "crudo" (sin `@tresjs`/`vue-three`), montada en un único `<canvas>` dentro de `Home.vue`, sincronizada con el scroll.
- **Capa de animación** con GSAP + Lenis que actúa como reloj maestro (`gsap.ticker`) para todo lo que necesita tick por frame (3D, cursor, raycast, scroll).
- Una **"navegación" de proyectos** que en realidad es un overlay (`Project.vue`) sobre el Home, gobernado por un router hecho a mano sobre la History API.

No hay backend propio: todo el contenido (proyectos, textos, i18n) es estático y vive en `src/content/` y `src/i18n/`.

## 2. Capas (vista lógica)

```
┌───────────────────────────────────────────────────────────┐
│ App.vue                                                    │
│  ├─ Header / Cursor (UI global)                            │
│  ├─ Home.vue  (siempre montado)                            │
│  │    ├─ <canvas> → three.init()  (capa WebGL)              │
│  │    └─ secciones Vue (Hero, About, Projects, Contact)    │
│  └─ Project.vue (overlay, visible según projectVisible)    │
├───────────────────────────────────────────────────────────┤
│ Estado global reactivo (singletons por módulo, sin store)  │
│  path · projectId · locale · lenis · preloaderVisible ...  │
├───────────────────────────────────────────────────────────┤
│ animations/ (GSAP ticker)   │ features/sounds/ (Howler)    │
│  scenes.ts · waypoints.ts   │ music · sfx · sprites         │
│  transitions/ · intro.ts    │                               │
├───────────────────────────────────────────────────────────┤
│ three/ (WebGL puro)                                         │
│  core (camera/renderer/scene) · objects/* · utils · shaders │
├───────────────────────────────────────────────────────────┤
│ utils/resources.ts (loader) ← src/sources.ts (registro)     │
└───────────────────────────────────────────────────────────┘
```

## 3. Estructura de carpetas

| Ruta | Contenido | Notas |
| --- | --- | --- |
| `src/main.ts` | Entry point | Registra `ScrollTrigger` y monta `App.vue`. |
| `src/App.vue` | Composición raíz | Activa todos los composables globales (`useTranslations`, `usePreloader`, `useMusic`, `useHowler`, `useScroll`, `useRouteObserver`, `useClickSound`) y decide Home vs Project overlay. |
| `src/sources.ts` | Registro central de assets 3D/texturas | Toda importación de `.glb`/textura pasa por aquí. |
| `src/components/` | UI reutilizable, agnóstica de sección | Botones, header, cursor, iconos, tags. |
| `src/features/home/` | Secciones de la home (Hero, About, Projects, Contact) | Un componente por sección, orquestados desde `Home.vue`. |
| `src/features/projects/` | Página/overlay de detalle de proyecto | Componentes de contenido (`Text`, `Media`, `List`, `ImageText`) tipados vía `ProjectComponent` (discriminated union). |
| `src/features/sounds/` | Todo lo de audio (Howler) | `composables/` (hooks), `core/` (mapeos por escena), `definitions/` (música, sfx, sprites), `utils/sounds.ts` (reproducción). |
| `src/composables/` | Estado y comportamiento transversal | Ver §5, patrón de singleton reactivo. |
| `src/animations/` | Orquestación GSAP | `scenes.ts` (pesos de sección 0–1), `waypoints.ts`/`waypoints-data.ts` (cámara), `transitions/` (about, contact), `intro.ts`. |
| `src/three/` | Motor WebGL | `core/` (cámara, renderer, scene, renderTarget), `objects/` (un módulo por objeto 3D con patrón `init/destroy`), `common/` (colores, geometrías, materiales compartidos), `utils/` (raycast, sizes), `shaders/` (GLSL). |
| `src/i18n/` | Sistema de traducciones propio (no `vue-i18n`) | Ver §11. |
| `src/content/` | Contenido estático tipado (proyectos, social links) | Ver §12. |
| `src/utils/` | Utilidades genéricas | `EventEmitter`, `math`, `observer`, `resources.ts` (loader), `features.ts` (flags), `sizes.ts`. |
| `src/assets/styles/` | SCSS global | Ver §14 y `FRONTEND_STANDARDS.md`. |
| `src/types/` | Ambient types (`.d.ts`) | Imports de `.glb`, tipos de Vue. |

## 4. Enrutamiento sin `vue-router`

No hay librería de routing. El mecanismo real (`src/composables/useRouteObserver.ts`):

1. `path` es un `ref` global inicializado con `window.location.pathname`.
2. `patchHistory()` envuelve `history.pushState`/`replaceState` una sola vez (`historyPatched` flag) para emitir un evento custom `route-change` después de cada navegación (con `queueMicrotask` para evitar colisiones de reactividad).
3. `useRouteObserver()` escucha `popstate` y `route-change`, y sincroniza `path.value`.
4. `projectId = computed()` matchea `path` contra `/^\/project\/([^/]+)$/`.
5. `projectVisible = computed()` = `projectId !== null && !isTransitioning`.
6. `src/composables/useRouter.ts` expone `push/replace/back` como wrapper fino sobre `window.history` — nada más. No hay tabla de rutas, guards ni lazy-loading de vistas.

`App.vue` no cambia de vista: **siempre** tiene montados `Home.vue` y `Project.vue`; la visibilidad/pointer-events se controla con clases (`project-wrapper-visible`) atadas a `projectVisible`. Esto permite la transición de overlay (`useProjectTransition.ts`) sin desmontar el canvas 3D.

**Regla:** si se necesita una nueva "página", no se agrega al router — se agrega como otro estado derivado de `path`/`projectId`, o se discute con Jose si el patrón ya no escala (ver `AGENTS_ROLES.md`, escalamiento).

## 5. Estado global: singleton reactivo por módulo (no hay Pinia/Vuex)

Convención consistente en todo el proyecto: un composable exporta **refs/computed a nivel de módulo** (fuera de la función `useX()`), y la función `useX()` solo conecta el ciclo de vida (`onMounted`/`onUnmounted`/`watch`). Como los `ref` viven en el módulo, cualquier componente puede importar el estado directamente sin volver a llamar al hook.

Ejemplos reales:

- `useRouteObserver.ts` → exporta `path`, `projectId`, `projectVisible`, `recentProjectId`.
- `useScroll.ts` → exporta `lenis`, `projectLenis`, `velocity`.
- `usePreloader.ts` → exporta `preloaderVisible`.
- `useAgent.ts` → exporta `isTouch`.
- `i18n/store.ts` → exporta `locale`, `translations`.

Patrón para leer: `import { projectId } from "../composables/useRouteObserver"` y usarlo directo en `computed()`/`template`, **sin** volver a invocar `useRouteObserver()` a menos que el componente también necesite inicializar los listeners (normalmente solo `App.vue` lo hace).

Esto reemplaza a Pinia/Vuex en este proyecto. **No introducir una librería de store** sin acordarlo antes — rompería la convención existente en todos los composables.

## 6. Arranque de la app

```
main.ts
  → createApp(App).mount("#app")
App.vue (onMounted implícito por composables)
  → useTranslations() / usePreloader() / useMusic() / useHowler()
  → useScroll() / useRouteObserver() / useClickSound()
Home.vue (onMounted)
  → three.init(canvasRef)              // espera resources "ready"
  → animations.init() (via watchEffect cuando preloader terminó)
```

`three.init()` (`src/three/index.ts`) se queda esperando el evento `ready` de `resources` (§7) antes de inicializar cámara/renderer/objetos — evita crear escena sin assets cargados.

## 7. Carga de recursos

- `src/sources.ts`: array `as const satisfies Source[]` con `{ name, type, path }` para cada modelo/textura. Es el **único** lugar donde se registran assets 3D.
- `src/utils/resources.ts`: clase `Resources extends EventEmitter` que carga todo el array al importarse (`resources.startLoading()` se ejecuta al final del módulo). Emite `progress` (0–1) y `ready` cuando termina. `resources.items[name]` guarda el resultado ya parseado (GLTF/Texture/Group).
- `usePreloader.ts` consume `progress` para animar la barra del preloader (mapeado a 25–100%, dejando 0–25% para el resto del boot) y setea `preloaderVisible = false` al terminar.

**Regla:** todo modelo/textura nuevo se agrega en `sources.ts`; nunca se hace `fetch`/`import` directo de un asset 3D desde un objeto de escena.

## 8. Capa WebGL (`src/three/`)

- `core/`: `camera.ts`, `renderer.ts`, `scene.ts`, `renderTarget.ts` — cada uno expone `{ init, destroy }` (y a veces más, ej. `renderer.setIsActive()`, `renderer.compile()`).
- `objects/`: un módulo por objeto de escena (`avatar/`, `room/`, `lab/`, `contact/`, `grid-floor/`, `dark-plane/`, `digital-numbers/`). Todos siguen el mismo contrato:
  ```ts
  const init = () => { /* crea geometría/mesh, añade a scene */ };
  const destroy = () => { /* dispose, remove de scene, remove de raycast.boxesToCheck */ };
  export const nombre = { init, destroy };
  ```
  `objects/index.ts` orquesta el orden de `init()`/`destroy()` de todos ellos y llama a `renderer.compile()` al final.
- `utils/raycast.ts`: raycasting manual contra `Box3` (no contra meshes) para hover/click en objetos 3D. `boxesToCheck` es un array mutable compartido; cada objeto interactivo agrega/quita su `ClickableBox3` (con `onClick`/`hoverSound` opcionales) al entrar/salir de escena.
- `utils/sizes.ts`: tamaño del canvas/viewport reactivo a resize.
- `common/`: colores, geometrías y materiales **compartidos** entre objetos (para no duplicar `MeshStandardMaterial` idénticos).
- `shaders/`: GLSL importado vía `vite-plugin-glsl` (`.glsl`/`.vert`/`.frag`).
- `types.ts`: `ClickableBox3 = Box3 & { onClick?; hoverSound?; }`.

## 9. Animación (`src/animations/`)

`animations/index.ts` es el orquestador: `init()`/`destroy()` con guard `isInitialized` para evitar doble-init.

- **`scenes.ts`**: `sceneWeights` (0–1 por sección: `hero`, `about`, `about-1`, `about-2`, `projects`, `contact`) recalculado cada frame desde `sceneWeightsInOut` (valores `in`/`out` que actualiza el scroll-trigger de cada sección). Cualquier objeto 3D que deba aparecer/desaparecer con el scroll lee estos pesos.
- **`waypoints.ts` + `waypoints-data.ts`**: posiciones/rotaciones de cámara por breakpoint (landscape/portrait), interpoladas según progreso de scroll.
- **`transitions/about.ts`, `transitions/contact.ts`**: timelines GSAP específicos de esas secciones (probablemente los que actualizan `sceneWeightsInOut`).
- **`intro.ts`**: animación de entrada (`intro.play()`), disparada una vez en `animations.init()`.
- **Reloj central**: `gsap.ticker` es el único `requestAnimationFrame` de la app. `useScroll.ts` alimenta Lenis dentro de ese mismo ticker (`instance.raf(time * 1000)`), y sincroniza `ScrollTrigger.update()` en cada scroll de Lenis. El cursor (`Cursor.vue`) y el raycast (`raycast.ts`) también se enganchan a `gsap.ticker.add()`. **No crear un segundo `requestAnimationFrame` propio** — todo tick nuevo debe sumarse a `gsap.ticker`.

## 10. Transición Home ↔ Project (overlay)

- `useProjectTransition.ts` expone `isTransitioning` (module singleton) usado para bloquear scroll (`lenis.stop()`), pausar interacción (`pointer-events`) y animar el overlay.
- `App.vue` monta `ProjectBackground` + `.project-wrapper` con clases `project-wrapper-visible`/`project-wrapper-transitioning` atadas a `projectVisible`/`isTransitioning`.
- `Home.vue` reacciona a `projectVisible` para: aplicar animación de escala (`home-wrapper-out/in`), y desactivar el render 3D cuando el overlay está abierto (`renderer.setIsActive(!projectVisible)`), ahorrando GPU mientras se ve un proyecto.

## 11. i18n (`src/i18n/`) — sistema propio, no `vue-i18n`

- `store.ts`: `locale` y `translations` como refs a nivel de módulo (mismo patrón del §5).
- `useTranslations()` (composable en `i18n/composables/`): al montar, lee `localStorage["portfolio-locale"]` o el idioma del navegador (fallback `en`); persiste cambios de `locale` en `localStorage`; carga el namespace `common` con `loadTranslations()` cada vez que cambia `locale`.
- `utils/load.ts`: carga dinámica de JSON por namespace/locale.
- `utils/translate.ts`: función `t(key)` usada directo en componentes (`t("get-in-touch")`), lee de `translations.value`.
- `utils/template.ts`: interpolación de variables en strings traducidos.
- `messages/namespaces/<namespace>/<locale>.json`: los textos en sí. Idiomas soportados: `en`, `de` (ver `constants/index.ts` → `LOCALES`).

**Regla:** todo string visible en UI pasa por `t()`; no hay strings de UI hardcodeados en componentes (excepto contenido de proyectos, que vive en `content/` por idioma — ver §12).

## 12. Contenido (`src/content/`)

- `content/projects/index.ts`: define `projectIds` (tupla) → `ProjectId` es `(typeof projectIds)[number]`. Este tipo gobierna qué slugs son válidos en todo el sistema de tipos.
- `content/projects/{en,de}/<slug>.ts`: contenido completo de cada proyecto (`ProjectContent`: título, tema, tags, componentes de la página de detalle).
- `content/projects/previews/{en,de}.ts`: datos resumidos para las cards de listado (`ProjectPreview`).
- `content/types.ts`: `ProjectContent`, `SkillContent`, `ProjectPreview`.
- `content/social.ts`: links sociales usados por `Header`/`Footer`/`Social.vue`.
- `features/projects/types.ts`: `ProjectComponent` es una discriminated union generada a partir de `ProjectComponents` (mapea `type` → `props` de cada componente de contenido: `imageText`, `text`, `list`, `media`). Al agregar un nuevo tipo de bloque de contenido, se registra aquí y en `ProjectComponents`.

**Regla:** slugs deben mantenerse consistentes entre `projectIds`, `previews/*` y `projects/{en,de}/*` — si falta uno, TypeScript strict debería marcarlo, pero conviene revisar ambos idiomas al agregar/quitar un proyecto.

## 13. Audio (`src/features/sounds/`)

- `definitions/music.ts`, `definitions/sounds.ts`, `definitions/sprites.ts`: mapeo declarativo de qué suena y con qué sprite/volumen.
- `composables/useHowler.ts`: inicializa Howler globalmente.
- `composables/useMusic.ts`: música de fondo por escena/estado.
- `composables/useClickSounds.ts` / `useHoverSounds.ts`: **no** atan el sonido por componente. Escuchan `click`/hover a nivel de `document.body` con delegación (`el.closest("[data-sound]")`) y reproducen `el.dataset.sound`. Esto es el mismo patrón que el cursor (§ siguiente) y que `raycast.ts` (objetos 3D con `hoverSound` en su `ClickableBox3`).
- `utils/sounds.ts`: `playSound(key: SoundKey)`.

**Regla:** para que un elemento suene al click/hover, se le agrega `data-sound="..."`/`data-hoversound="..."` — no se llama a `playSound()` manualmente desde el handler del componente salvo un caso muy específico no cubierto por delegación.

## 14. Cursor custom y raycast — mismo patrón declarativo

`Cursor.vue` no sabe qué componente está bajo el mouse: en cada `mousemove` busca el ancestro más cercano con `data-cursor` (`circle-black`, `circle-white`, `arrow`, `arrow-external`) vía `closest`/recursión sobre `parentElement`. Si el raycast 3D (`raycast.getHoveringBox()`) detecta un objeto interactivo, este tiene prioridad y fuerza `circle-black`.

**Regla:** cualquier elemento clickeable (2D o 3D) debe declarar su feedback visual con `data-cursor` en vez de estilos `cursor: pointer` sueltos, para mantener el cursor custom coherente.

## 15. Feature flags

`src/utils/features.ts` — objeto plano `features` + `isFeatureEnabled(key)`. Se usa para apagar/prender funcionalidad opcional (ej. `SoundsToggle` con `v-if="isFeatureEnabled('sounds')"`). No hay sistema de remote-config: son flags de build.

## 16. Build y configuración

- `vite.config.ts`: puerto fijo `3000` (`strictPort: true`), plugin `vue()` + `vite-plugin-glsl`, `assetsInclude` para `.glb/.gltf/.png/.jpg/.ktx2/.obj/.mtl`, mixins SCSS globales inyectados (`additionalData`), output con `assets/[hash].[ext]` y chunks bajo `chunks/`.
- `tsconfig.app.json`: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports` — sin margen para código muerto o `switch` sin `break`.
- `package.json`: `npm run build` corre `vue-tsc -b` **antes** del build de Vite — un error de tipos rompe el build.
