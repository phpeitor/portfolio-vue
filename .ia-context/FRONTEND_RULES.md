# Reglas de Identidad Visual y WebGL

Este documento cubre **identidad visual y assets 3D/WebGL** específicamente. Para arquitectura general del frontend ver [`FRONTEND_ARQUITECTURA.md`](./FRONTEND_ARQUITECTURA.md); para convenciones de código Vue/SCSS/TS ver [`FRONTEND_STANDARDS.md`](./FRONTEND_STANDARDS.md); para saber qué rol/agente debe aplicar estas reglas ver [`AGENTS_ROLES.md`](./AGENTS_ROLES.md).

## Principios Visuales

- Mantener el lenguaje visual existente: cartoon, limpio, low-poly, alto contraste y formas legibles.
- No introducir assets realistas si conviven con modelos estilizados como avatar, room o objetos de escritorio.
- En miniatura, la silueta debe entenderse rápido. Si no se reconoce en captura, el asset no sirve aunque sea técnicamente correcto.
- Priorizar consistencia con `room.glb`, `avatar.glb`, `lab.glb` y `contact.glb`.

## Vue, Componentes y SCSS

Convenciones de código (props, naming, nesting SCSS, tokens, breakpoints) están en [`FRONTEND_STANDARDS.md`](./FRONTEND_STANDARDS.md). Lo específico de este documento: el CSS que envuelve al `<canvas>` (`.three-canvas` en `Home.vue`) no debe introducir `overflow`, `transform` o `filter` que rompan el sizing reactivo de `three/utils/sizes.ts` — cualquier cambio de layout alrededor del canvas debe probarse con resize real, no solo con devtools en un tamaño fijo.

## Animaciones

- GSAP controla timelines, scroll triggers y ticker.
- Revisar `src/animations/transitions/` antes de cambiar estados de secciones.
- Los pesos de escenas (0–1 por sección, ej. `hero`, `about-1`, `about-2`) viven en `src/animations/scenes.ts`.
- La posición/foco de cámara (`waypoints.position`, `waypoints.focus`) es un promedio ponderado de los puntos por breakpoint (`src/animations/waypoints-data.ts`, landscape/portrait) usando esos mismos pesos de escena — ver `src/animations/waypoints.ts`.
- Distinto de lo anterior: varios objetos (ej. `avatar`) tienen sus **propias** propiedades `waypointsPosition`/`waypointsRotation`, animadas directamente por timelines en `src/animations/transitions/about.ts` (no por `waypoints.ts`). No confundir "la cámara se mueve" con "este objeto se mueve".
- `aboutProgress` (`src/animations/transitions/about.ts`) es un valor 0–1 leído por varios shaders/uniforms (`lab/shine.ts`, `avatar/hologram.ts`, `grid-floor`, `lab/particles.ts`) para sincronizar efectos visuales con el progreso del scroll de About — si se toca ese timeline, revisar todos esos consumidores antes de cambiar el rango de valores.
- No mover objetos WebGL sin entender de cuál de estos tres mecanismos dependen (`sceneWeights`, `waypoints`/`waypointsPosition`/`waypointsRotation`, o `aboutProgress`).

## Uso de GLB

- Registrar todo GLB en `src/sources.ts`.
- Usar `type: "gltfModel"` para `.glb` y `.gltf`.
- Acceder al modelo con `resources.items["resource-name"]`.
- Clonar modelos antes de agregarlos a escena.
- Para modelos con skeleton, usar `SkeletonUtils.clone`.
- Para modelos estáticos, usar `resource.scene.clone(true)`.
- Normalizar centro/suelo con `Box3` si el asset viene desplazado.
- No asumir orientación: validar si el modelo es `Y-up`, `Z-up` o si tiene rotaciones internas.
- Si el GLB usa `EXT_meshopt_compression`, asegurar `MeshoptDecoder` en `src/utils/resources.ts`.

## Requisitos Para Nuevos Modelos

- Formato preferido: `.glb`.
- Estilo: cartoon, low-poly o compatible con el portfolio.
- Escala: razonable y consistente con avatar/room.
- Origen: centrado en la base del objeto cuando sea posible.
- Orientación: `Y-up`.
- Materiales: embebidos o simples; evitar dependencias externas rotas.
- Nombres de nodos/meshes: descriptivos cuando se necesite manipular partes.

## Texturas y Materiales

- Mantener texturas en `src/assets/textures/` si son compartidas.
- Usar `LinearSRGBColorSpace`/`SRGBColorSpace` siguiendo el patrón existente.
- Para matcaps del avatar, revisar `src/three/objects/avatar/index.ts`.
- Para room, revisar `src/three/common/materials.ts` y `room.webp`.
- No reutilizar el atlas del room en modelos externos si genera artefactos visuales.

## Shaders

- Shaders GLSL viven en `src/three/shaders/`.
- Vite compila GLSL mediante `vite-plugin-glsl`.
- Mantener uniformes simples y explícitos.
- Si un shader afecta transparencia o depth, revisar `depthWrite`, `depthTest`, `renderOrder` y `transparent`.

## Interactividad WebGL

- Hitboxes clickables son `ClickableBox3` (`Box3` extendido con `onClick?` y `hoverSound?`, definido en `src/three/types.ts`), agregadas a `raycast.boxesToCheck` (`src/three/utils/raycast.ts`).
- El raycast es contra `Box3`, no contra la geometría real del mesh — si el modelo tiene forma irregular, la hitbox sigue siendo una caja; ajustar tamaño/posición de la caja a mano si el click debe sentirse preciso.
- `raycast.getHoveringBox()` es la única fuente de verdad de "qué objeto 3D está bajo el cursor". La consumen tanto `Cursor.vue` (fuerza cursor `circle-black` cuando hay hover 3D, con prioridad sobre `data-cursor` del DOM) como `Home.vue` (cambia `document.documentElement.style.cursor` a `pointer` en touch/no-touch) y el propio `raycast.ts` (dispara `hoverSound` al detectar cambio de hover).
- Al agregar un objeto interactivo: crear su `ClickableBox3`, setear `onClick`/`hoverSound` si aplica, y hacer `raycast.boxesToCheck.push(box)` en `init()`. **Al destruir**, remover esa misma caja de `raycast.boxesToCheck` (`splice`/filter) — no limpiar esto deja hitboxes fantasma que siguen respondiendo a click/hover con el objeto ya fuera de escena.
- El raycast completo (`performRaycast`) corre en `gsap.ticker` solo si el dispositivo no es touch (`isTouchDevice` detectado una vez al cargar el módulo) — en touch, el hover continuo no tiene sentido; no forzar su ejecución.
- Mantener `tick()` barato; evitar crear geometrías/materiales/vectores pesados cada frame si no es necesario.
- Reutilizar `Vector3`, `Box3`, `Euler` y objetos temporales cuando se actualicen en ticker (patrón usado en `raycast.ts`: `pointer`, `ndcPointer`, `ray`, `target` son instancias únicas reutilizadas, no recreadas por frame).

## Capturas y Revisión Visual

- Usar `capturas/` para comparar iteraciones visuales.
- Para cambios de posición, escala, orientación o visibilidad de GLB, validar con capturas antes de cerrar.
- Nombrar capturas de prueba de forma descriptiva, por ejemplo `php-logo-chest-final.png`.

## Checklist Antes de Entregar

- Ejecutar `npm run typecheck`.
- Ejecutar `npm run build`.
- Revisar visualmente desktop.
- Revisar visualmente mobile si el cambio toca layout o cámara.
- Confirmar que no aparecen errores en consola.
- Confirmar que modelos GLB cargan correctamente y no bloquean el preloader.

## Errores Comunes

- GLB comprimido sin decoder: configurar `MeshoptDecoder` en el `GLTFLoader`.
- Modelo acostado: revisar eje vertical (`Y-up` vs `Z-up`).
- Modelo invisible: revisar escala, centro, `frustumCulled`, `depthTest`, `renderOrder` y materiales transparentes.
- Logo o mesh desplazado: revisar si la geometría interna está lejos del origen y centrar con `Box3`.
- Asset no coincide con el proyecto: buscar un GLB cartoon/low-poly antes de intentar recrearlo con primitivas.
