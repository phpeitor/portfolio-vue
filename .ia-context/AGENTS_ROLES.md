# Roles de Agentes IA en este proyecto

Este documento define **qué rol asumir** según el tipo de tarea que se pida en este repo, qué debe leer cada rol antes de tocar código, y cuándo un agente debe frenar y preguntarle a Jose en vez de decidir solo. Está pensado para sesiones de Claude Code (y subagentes que se lancen desde ellas) trabajando en `portfolio-2025-2`.

Documentos de referencia que cada rol usa:

- [`FRONTEND_ARQUITECTURA.md`](./FRONTEND_ARQUITECTURA.md) — cómo está armado el sistema.
- [`FRONTEND_STANDARDS.md`](./FRONTEND_STANDARDS.md) — cómo escribir código nuevo.
- [`FRONTEND_RULES.md`](./FRONTEND_RULES.md) — identidad visual y reglas de assets WebGL.

## 0. Regla base para cualquier rol

1. Antes de escribir código, leer al menos `FRONTEND_ARQUITECTURA.md` (secciones relevantes a la tarea) y `FRONTEND_STANDARDS.md`. No asumir convenciones "genéricas de Vue" — este proyecto tiene patrones propios (sin Pinia, sin vue-router, sin vue-i18n) que rompen expectativas por defecto.
2. Buscar un patrón existente equivalente antes de inventar uno nuevo (otro composable similar, otro componente similar, otro objeto 3D similar).
3. Cerrar la tarea corriendo `npm run typecheck` y `npm run build`. Si el cambio toca UI/layout/3D, describir qué se debería revisar visualmente en `http://localhost:3000` (el agente no siempre tiene navegador disponible; si lo tiene, usarlo).
4. Ningún rol agrega dependencias nuevas al `package.json` sin señalarlo explícitamente al usuario antes de instalar.

## 1. UI Agent (componentes Vue / SCSS)

**Alcance:** `src/components/`, `src/features/*/components/`, estilos scoped, layout responsive.

**Debe leer:** `FRONTEND_STANDARDS.md` §2 (componentes), §5 (SCSS), §6 (data-* de interacción), §7 (i18n).

**No debe hacer sin confirmar:**
- Cambiar tokens globales (`variables.scss`, `colors.scss`) que afectan a todo el sitio.
- Modificar `Header.vue`, `App.vue` o el sistema de overlay de proyecto (`project-wrapper`) sin entender el flujo de `useProjectTransition`/`useRouteObserver` (arquitectura §4, §10) — es fácil romper la transición Home↔Project.

**Checklist de salida:** clases con `&`-nesting, tokens en vez de valores sueltos, breakpoints vía `mixins.mq`, strings vía `t()`, `data-sound`/`data-cursor` en elementos interactivos nuevos.

## 2. WebGL / 3D Agent

**Alcance:** `src/three/`, `src/sources.ts`, assets `.glb`/texturas, shaders GLSL.

**Debe leer:** `FRONTEND_ARQUITECTURA.md` §7–8 (recursos y motor 3D), **todo** `FRONTEND_RULES.md`.

**No debe hacer sin confirmar:**
- Agregar un modelo/textura que no cumpla el estilo cartoon/low-poly (ver `FRONTEND_RULES.md` — principios visuales).
- Cambiar `core/camera.ts`, `core/renderer.ts` o el orden de `objects/index.ts` sin revisar impacto en todos los objetos existentes (todos comparten `renderer.compile()` y el ciclo `init/destroy`).
- Dejar un `Box3` huérfano en `raycast.boxesToCheck` al destruir un objeto (memory/hover leak).

**Checklist de salida:** `MeshoptDecoder` si el GLB usa meshopt, escala/orientación validadas (`Y-up`), captura en `capturas/` para cambios de posición/escala/visibilidad, hitbox removida de `raycast.boxesToCheck` en `destroy()`.

## 3. Motion Agent (GSAP / Lenis / scroll)

**Alcance:** `src/animations/`, `src/composables/useScroll.ts`, `useProjectTransition.ts`, scroll-triggers dentro de componentes de sección.

**Debe leer:** `FRONTEND_ARQUITECTURA.md` §9–10 (animación y transición de overlay).

**No debe hacer sin confirmar:**
- Crear un `requestAnimationFrame` paralelo al `gsap.ticker` (ver standards §10).
- Cambiar los rangos/pesos de `sceneWeights`/`sceneWeightsInOut` sin verificar qué objetos 3D dependen de ellos (`grep` sobre `sceneWeights` antes de tocarlo).

**Checklist de salida:** todo tick nuevo agregado/removido de `gsap.ticker` en `onMounted`/`onUnmounted`, `ScrollTrigger`/Lenis sincronizados si el cambio afecta scroll.

## 4. Content & i18n Agent

**Alcance:** `src/content/`, `src/i18n/messages/`.

**Debe leer:** `FRONTEND_ARQUITECTURA.md` §11–12, `FRONTEND_STANDARDS.md` §7.

**No debe hacer sin confirmar:**
- Cambiar `projectIds` (afecta el tipo `ProjectId` en todo el sistema de tipos) sin actualizar `previews/{en,de}` y `projects/{en,de}/<slug>.ts` en el mismo cambio.
- Agregar un locale nuevo (implica tocar `LOCALES` en `i18n/constants` y duplicar todos los namespaces).

**Checklist de salida:** slug consistente en `projectIds`, `previews/en.ts`, `previews/de.ts`, `projects/en/<slug>.ts`, `projects/de/<slug>.ts`; keys de `t()` presentes en `en.json` y `de.json`.

## 5. Audio Agent

**Alcance:** `src/features/sounds/`.

**Debe leer:** `FRONTEND_ARQUITECTURA.md` §13, `FRONTEND_STANDARDS.md` §6.

**No debe hacer sin confirmar:** agregar un sonido nuevo que no tenga ya un `data-sound`/`data-hoversound`/`hoverSound` (3D) consumiéndolo — evitar assets de audio huérfanos.

## 6. QA / Release Agent

**Alcance:** verificación transversal antes de cerrar cualquier tarea de los roles anteriores.

**Checklist:**
- `npm run typecheck` y `npm run build` sin errores.
- Revisión visual desktop + mobile si el cambio toca layout, cámara o scroll.
- Sin errores nuevos en consola.
- Modelos GLB cargan y no bloquean el preloader (`usePreloader.ts`).
- Si el cambio es visual/3D, capturas nuevas en `capturas/` con nombre descriptivo.

## Cómo elegir el rol para una tarea

| Pide... | Rol |
| --- | --- |
| "Cambiar el botón/header/sección X" | UI Agent |
| "Agregar/mover un modelo 3D, cambiar material/shader" | WebGL / 3D Agent |
| "El scroll/la cámara/la transición de proyecto se ve rara" | Motion Agent |
| "Agregar un proyecto nuevo / traducir algo" | Content & i18n Agent |
| "Agregar un sonido / música nueva" | Audio Agent |
| "Antes de mergear, revisá que todo esté bien" | QA / Release Agent |

Una tarea puede requerir más de un rol (ej. "nueva sección con objeto 3D animado" = UI + WebGL + Motion). En ese caso, leer los documentos de referencia de cada rol involucrado antes de empezar, no solo el primero.

## Escalamiento a Jose (parar y preguntar)

Frenar y consultar antes de:

- Agregar cualquier dependencia nueva a `package.json`.
- Introducir un patrón que compita con los ya establecidos (store, router, i18n — ver `FRONTEND_STANDARDS.md` §10).
- Tocar `vite.config.ts`, `tsconfig*.json` o el pipeline de build.
- Cualquier cambio que afecte el estilo visual "cartoon/low-poly" de forma perceptible (ver `FRONTEND_RULES.md`).
- Borrar o reemplazar assets 3D existentes (`avatar`, `room`, `lab`, `contact`) en vez de agregar uno nuevo.
- Cambios que crucen de "frontend" a infraestructura (deploy, dominio, VPS) — eso vive fuera de este repo, en el contexto de infraestructura de Jose.
