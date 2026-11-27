# 🚀 Proceso de Vibe Coding — Galería del Espacio

Este documento registra cómo se construyó la aplicación usando IA como copiloto de desarrollo.

- **Herramienta(s) de IA:** _(ej. Claude, Cursor, Copilot)_
- **Tiempo total aproximado:** _(ej. 6 horas)_
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · NASA APOD API · Vercel

---

## 1. Concepción del proyecto

**Idea:** Galería web que muestra la *Astronomy Picture of the Day* de la NASA, permite explorar fotos de días anteriores, ver el detalle de cada una y guardar favoritas.

**Por qué este tema:** _(escribe tu motivación en 1–2 líneas)_

**Arquitectura planificada antes de pedirle código a la IA:**

| Ruta | Tipo de componente | Propósito |
|---|---|---|
| `/` | Server Component | Foto del día a pantalla completa |
| `/galeria` | Server + Client (filtro) | Cuadrícula de los últimos días |
| `/galeria/[fecha]` | Server Component | Detalle de una foto |
| `/favoritos` | Client Component | Favoritas guardadas en localStorage |
| `/api/apod` | Route Handler | Proxy hacia la NASA (oculta la API key) |

---

## 2. Prompts principales e iteraciones

### Iteración 0 — Reglas y forma de trabajo con la IA
**Prompt:**
```
Antes de arrancar, definamos una regla, vas a trabajar lo que te pida, me daras espacio para validar los resultados y para que apliquemos cambios si es necesario y cuando te de el OK, haras el commit y me indicaras que te pase el siguiente prompt, en estos commit puedes colocar tu coautoria.

Además, puedes definir una sección adicional con una iteración 0 en la cual hemos definido todas estas reglas y forma de trabajo.
```
**Resultado de la IA:** Se acordó el flujo de trabajo para todo el proyecto:
1. Envío un prompt por fase; la IA lo implementa (revisando antes la documentación de Next.js 16 incluida en `node_modules/next/dist/docs/`, ya que esta versión tiene cambios importantes respecto a versiones anteriores).
2. La IA se detiene y me da espacio para validar el resultado en el navegador/código.
3. Si hace falta, pido ajustes en mensajes de seguimiento hasta quedar conforme.
4. Al dar mi **OK**, la IA hace el commit (con coautoría de Claude) y me pide el siguiente prompt.
5. En cada iteración la IA actualiza este archivo (`VIBE_CODING.md`): en **Resultado de la IA** registra lo que generó, incluidos los ajustes técnicos que ella misma detectó; en **Mi revisión / cambios** registra solo mis observaciones y los cambios que yo le solicite.

**Mi revisión / cambios:** Al revisar la Iteración 1 noté que la IA había escrito en "Mi revisión / cambios" los hallazgos que ella misma encontró. Le aclaré que esa sección es exclusiva para mis observaciones y los cambios que yo le pida. Lo que la IA detecte por su cuenta va en "Resultado de la IA". Se corrigió la Iteración 1 y se actualizó la regla 5.


### Iteración 1 — Estructura base
**Prompt:**
```
Tengo un proyecto Next.js con App Router, TypeScript y Tailwind. Voy a construir "Galería del Espacio" usando la API APOD de la NASA.
Crea el layout raíz con: fondo oscuro tipo espacio (degradado negro/azul profundo con estrellas sutiles en CSS con efecto de paticulas interactivas), una navbar responsive con efecto glassmorphism (links: Inicio, Galería, Favoritos) con menú hamburguesa en móvil, y un footer simple. Usa una fuente elegante de next/font. Aún no consumas la API.
```
**Resultado de la IA:** Antes de escribir código, la IA revisó la documentación de Next.js 16 incluida en el proyecto (`node_modules/next/dist/docs/`) sobre fuentes, `usePathname`, Cache Components y Partial Prefetching (ambos activos en `next.config.ts`). Luego generó:
- `src/app/layout.tsx`: layout raíz en español (`lang="es"`), metadata con plantilla de título (`%s · Galería del Espacio`) y estructura Navbar → `<main>` → Footer.
- Fuentes con `next/font/google`: **Cormorant Garamond** (serif elegante para títulos y marca) + **Inter** (legible para el cuerpo), expuestas como variables CSS y registradas en Tailwind como `font-display` y `font-sans`.
- `src/app/globals.css`: fondo de espacio profundo (degradado negro/azul con "nebulosas" en `radial-gradient`) y una capa `.stars` de estrellas 100% CSS con animación de parpadeo, desactivada si el usuario tiene activado `prefers-reduced-motion`.
- `src/components/StarField.tsx` (Client Component): partículas interactivas en `<canvas>` que flotan, se alejan del cursor y forman "constelaciones" con líneas tenues. Tiene densidad adaptativa según el tamaño de pantalla, soporte para pantallas retina y limpieza de eventos al desmontar.
- `src/components/Navbar.tsx` (Client Component): navbar fija con glassmorphism (`backdrop-blur` + borde y fondo translúcidos). Marca el link activo y tiene menú hamburguesa animado en móvil, con `aria-expanded` y `aria-controls` para accesibilidad.
- `src/components/Footer.tsx` (Server Component): footer simple con crédito a NASA APOD.
- `src/app/page.tsx`: portada provisional (hero con título y botón "Explorar la galería") que reemplaza la plantilla de create-next-app.

Ajustes que la IA hizo por su cuenta al aplicar la documentación de Next.js 16:
- **`usePathname` dentro de `<Suspense>`:** con `cacheComponents` activo, `usePathname` puede suspender en rutas con parámetros dinámicos (como la futura `/galeria/[fecha]`), y sin un `Suspense` el build falla. Por eso los links se renderizan primero sin estado activo (fallback) y luego se resalta el link de la ruta actual.
- **Footer sin `new Date().getFullYear()`:** en Cache Components, llamar `new Date()` en un Server Component durante el prerender es un error de build. Se dejó el footer sin el año dinámico.
- **Partículas solo en el cliente:** `Math.random()` y las animaciones viven dentro de `useEffect` en un Client Component, para evitar errores de hidratación y cumplir las reglas de Cache Components.
- **Combinación de estrellas CSS + canvas:** se combinaron estrellas en CSS (estáticas, sutiles y sin costo de JS) con el canvas interactivo, para cumplir las dos partes del prompt.

Verificado con `npm run lint` y `npm run build` sin errores.

**Mi revisión / cambios:** Revisé el resultado en el navegador y me pareció excelente; no solicité cambios.

### Iteración 2 — Route Handler y consumo de la API
**Prompt:**
```
Crea un Route Handler en app/api/apod/route.ts que consulte https://api.nasa.gov/planetary/apod usando process.env.NASA_API_KEY. Debe aceptar los query params date, start_date, end_date y count, y siempre enviar thumbs=true. Crea también lib/apod.ts con el tipo TypeScript ApodItem (date, title, explanation, url, hdurl, media_type, thumbnail_url, copyright) y funciones para usar desde Server Components con revalidate de 1 hora. Maneja los errores de la API con códigos HTTP correctos. Configura next.config.ts para permitir imágenes de apod.nasa.gov.
```
**Resultado de la IA:** La IA revisó la documentación de Next.js 16 sobre Route Handlers, `use cache`, `cacheLife` e imágenes remotas, y generó:
- `src/lib/apod.ts` (marcado con `server-only` para que nunca llegue al navegador):
  - Tipos `ApodItem` (con `hdurl`, `thumbnail_url` y `copyright` opcionales, y `media_type: "image" | "video" | "other"`), `ApodQuery` y la clase `ApodError`, que lleva el código HTTP a devolver.
  - `parseApodQuery()`: valida los parámetros antes de llamar a la NASA. Revisa el formato `YYYY-MM-DD`, que la fecha no sea anterior a la primera APOD (1995-06-16), que `count` sea un entero entre 1 y 100, que no se combinen `count`, `date` y rango entre sí, que `end_date` venga con `start_date` y que el rango esté en orden.
  - Llamada a la NASA con `api_key` del servidor, `thumbs=true` siempre y un timeout de 10 s.
  - Funciones para Server Components: `getApod(date?)` y `getApodRange(start, end?)` (devuelve lo más reciente primero). Además, `queryApod()`, que usa el Route Handler.
- `src/app/api/apod/route.ts`: `GET` que valida, consulta y responde JSON. Los errores tienen la forma `{ error, status }`.
- `next.config.ts`: `images.remotePatterns` restringido a `apod.nasa.gov/apod/**` (http y https, porque algunas APOD antiguas usan http).

Códigos HTTP: **400** por parámetros inválidos (propios o reportados por la NASA, como una fecha futura), **404** si no hay APOD para esa fecha, **429** si se alcanza el límite de peticiones, **500** si falta `NASA_API_KEY`, **502** si la NASA responde con error 5xx o la key es inválida, y **504** si la NASA no responde a tiempo.

Ajustes que la IA hizo por su cuenta al aplicar la documentación de Next.js 16:
- **`revalidate` → `'use cache'` + `cacheLife('hours')`:** con Cache Components activo, la opción `fetch(..., { next: { revalidate: 3600 } })` se reemplaza por una función con la directiva `'use cache'`. El perfil `hours` equivale a revalidar cada 3600 s.
- **Los errores no se cachean una hora:** la función cacheada devuelve un resultado (`ok`/`error`) en lugar de lanzar una excepción, porque su salida debe ser serializable. Además, usa `cacheLife('seconds')` cuando hay error, para que un fallo temporal de la NASA no quede "congelado" durante una hora.
- **`count` sin caché:** `count` devuelve fotos aleatorias, así que esas consultas siempre van directo a la NASA.
- **Corrección de tipos:** `cacheLife(cond ? 'hours' : 'seconds')` no compilaba por las sobrecargas de TypeScript. Se cambió a un `if/else`.

Verificado con lint, build y pruebas reales del endpoint (`next start` + `curl`): 200 para una fecha, un rango y `count`; 400 en todas las validaciones; 400 de la NASA para una fecha futura. Al pedir la foto de **hoy**, la NASA respondió 500 (comprobado también con su `DEMO_KEY` pública), y el proxy lo devolvió correctamente como **502**.

**Mi revisión / cambios:**
- Observé que en las respuestas **no venía `thumbnail_url`** y que **todos los resultados tenían el mismo título**. La IA lo investigó consultando la API de la NASA directamente: el sitio `apod.nasa.gov` migró a `science.nasa.gov` y la API oficial ahora devuelve, de forma inestable, un contenido genérico (título "NASA Science", explicación genérica y el logo de la NASA como imagen). `thumbnail_url` solo aparece en videos, y el contenido genérico siempre viene como `"image"`.
- Me presentó tres opciones (adaptarnos a la API oficial, usar un mirror no oficial o solo documentarlo) y decidí **seguir con la API oficial y adaptarnos**. Cambios aplicados:
  - `next.config.ts`: se agregó `science.nasa.gov/wp-content/**` a `remotePatterns`, porque ahora las imágenes vienen de ese host.
  - `src/lib/apod-utils.ts`: nueva función `isPlaceholderApod()` para detectar el contenido genérico y mostrar un aviso en la UI (se puede usar en Server y Client Components).
  - `src/lib/apod-types.ts`: los tipos se separaron del archivo `server-only` para poder importarlos desde Client Components (por ejemplo, en Favoritos).
  - Las respuestas genéricas se cachean solo unos minutos (`cacheLife('minutes')`), no una hora, por si la NASA vuelve a devolver el contenido real.
  - Al revisar la respuesta completa apareció un tercer problema: el `copyright` llegaba con caracteres rotos, doblemente mal codificado ("JesÃºs" en lugar de "Jesús"). Se agregó una normalización que repara la codificación y deja solo los campos de `ApodItem`.
  - Durante el build se detectó que el `try/catch` del Route Handler atrapaba una señal interna de Next.js (la interrupción del prerender al leer `searchParams`). Se movió esa lectura fuera del `try`.

### Iteración 3 — Galería y página de detalle
**Prompt:**
```
Crea estas páginas como Server Components:
- app/page.tsx: la foto del día a pantalla completa con título, fecha y un botón "Ver detalle".
- app/galeria/page.tsx: cuadrícula responsive (1/2/3 columnas) de los últimos 24 días, con tarjetas que hacen zoom suave al pasar el mouse.
- app/galeria/[fecha]/page.tsx: detalle con la imagen en HD, título, fecha, copyright y explicación. Recuerda que en Next.js 16 params es una Promesa.
Si media_type es "video", muestra thumbnail_url o un iframe. Crea un componente reutilizable ApodCard.
```
**Resultado de la IA:** La IA revisó la documentación de Next.js 16 sobre rutas dinámicas con Cache Components, valores dependientes del tiempo y `next/image`. Luego generó:
- `src/app/page.tsx`: foto del día a pantalla completa. La imagen queda detrás de la navbar de vidrio, con un degradado para que el texto se lea; incluye título, fecha y botón "Ver detalle".
- `src/app/galeria/page.tsx`: cuadrícula de 1/2/3 columnas (`sm:grid-cols-2 lg:grid-cols-3`) con los últimos 24 días, ordenados del más reciente al más antiguo.
- `src/app/galeria/[fecha]/page.tsx`: detalle con imagen en HD (`hdurl`), título, fecha en español, copyright, explicación y un enlace a la imagen en resolución completa. Los videos se muestran con `<iframe>` (YouTube/Vimeo) o con `<video>` si son archivos directos.
- `src/components/ApodCard.tsx` (reutilizable): tarjeta con zoom suave al pasar el mouse (`group-hover:scale-110`, 700 ms), etiqueta "Video" y enlace al detalle.
- `src/components/ApodPreview.tsx`: muestra la foto, la miniatura del video (`thumbnail_url`) con un ícono de "play", o un fondo de nebulosa cuando no hay imagen. Lo usan la portada, las tarjetas y el detalle.
- `src/components/ApodNotice.tsx`: avisos en estilo glass para errores y contenido no disponible.
- `src/lib/apod.ts`: nuevas funciones `getLatestApod()` y `getRecentApods(24)`. Si la foto de hoy todavía no está publicada, usan la del día anterior; esto resuelve el desafío detectado en la Iteración 2.
- `src/lib/apod-utils.ts`: `formatApodDate()` ("4 de julio de 2024"), `apodSourceUrl()` (enlace a la página original de la APOD) y otras utilidades.
- `next.config.ts`: se permiten las miniaturas de YouTube y Vimeo en `remotePatterns`.

Ajustes que la IA hizo por su cuenta al aplicar la documentación de Next.js 16:
- **`params` como Promesa dentro de `<Suspense>`:** con Cache Components y sin `generateStaticParams`, la fecha solo se conoce en la petición. Por eso el detalle resuelve `params` dentro de un `<Suspense>`, y el resto de la página (botón de volver, estructura) queda prerenderizado (Partial Prerender).
- **Fechas inválidas → 404:** si la fecha tiene un formato incorrecto, es anterior a 1995 o es futura, la página llama a `notFound()`.
- **"Hoy" dentro de `'use cache'`:** Next 16 no permite `new Date()` en Server Components durante el prerender. El cálculo de "hoy" (en la zona horaria de la NASA, hora del Este de EE. UU.) se hace dentro de las funciones cacheadas, como indica la documentación.
- **`priority` → `preload`:** `priority` está deprecado en `next/image` de Next 16. Se usa `preload` en la foto del hero, la del detalle y las primeras 3 tarjetas.
- **Errores sin romper el build:** cada página atrapa los errores de la API y muestra un aviso en lugar de fallar.
- **Mensaje oculto en el hero:** al revisar en el navegador, el mensaje "Imagen no disponible…" del hero quedaba encima del título. Se ocultó en la portada.

Verificado con lint, build y en el navegador: portada, galería con 24 tarjetas, detalle y 404 para fechas inválidas, sin errores en consola. Limitación: la API de la NASA está devolviendo contenido genérico en los 24 días, así que **no se pudo ver en vivo cómo se muestran las fotos reales ni los videos**; esa parte quedó probada solo con lint y build.

**Mi revisión / cambios:**
- Observé que **no se mostraba nada** (todo "Contenido no disponible") y le pedí a la IA consultar la documentación oficial de la NASA. Le indiqué que para la APOD existe la URL `https://science.nasa.gov/wp-json/wp/v2/apod-basic`.
- La IA encontró en el README oficial del repositorio `nasa/apod-api` (actualización del 10 de septiembre de 2026) que el backend de `api.nasa.gov/planetary/apod` se reconectó a ese nuevo endpoint de WordPress y que el repositorio se archivará el **1 de diciembre de 2026**. La guía de usuario enlazada (en Notion) no se pudo leer automáticamente, así que la IA documentó el endpoint probándolo directamente:
  - `?per_page=N` → las N más recientes (máximo 25, valores mayores se ignoran).
  - `?date_from=YYMMDD&date_to=YYMMDD` → rango por fechas en formato **YYMMDD** (por ejemplo, `240701`), con ambos extremos incluidos, del más reciente al más antiguo; se pagina con `&page=` (encabezado `X-WP-TotalPages`).
  - `/apod-basic/YYMMDD` → una fecha concreta (404 si no existe).
  - Campos: `url` es el **artículo**, no la imagen; la imagen está en `hdurl` (CDN `assets.science.nasa.gov`); `explanation` y `copyright` vienen en **HTML**; los videos no traen URL propia, y el video real (`<iframe>` de YouTube o `<source>` mp4) está dentro de `basic_html`. **No requiere API key.**
- Cambios aplicados:
  - `src/lib/apod.ts` reescrito para usar el nuevo feed, **manteniendo la misma interfaz** (`/api/apod` con `date`, `start_date`, `end_date`, `count`, y `getApod`, `getLatestApod`, `getRecentApods`, `getApodRange`). Incluye la normalización al tipo `ApodItem`: HTML → texto plano (quitando "Explanation:" y "Tomorrow's picture"), la imagen desde `hdurl`, la URL del video extraída de `basic_html` y los créditos limpios.
  - `count` (aleatorio) se implementa pidiendo fechas al azar en paralelo, porque el feed no tiene modo aleatorio; el máximo pasó de 100 a 25, como indica la documentación oficial. Se agregó un límite de 100 días por rango.
  - Miniaturas de video: la oficial de YouTube (`img.youtube.com/vi/ID/hqdefault.jpg`); para videos mp4, el fotograma de portada (`hdurl`); se descartan las portadas genéricas de la NASA.
  - Se eliminó la lógica de "contenido genérico" (`isPlaceholderApod`) y la reparación de codificación, que ya no hacen falta, y se actualizaron los `remotePatterns` (`assets.science.nasa.gov` y `img.youtube.com`).
  - Detalles detectados al probar: espacios sobrantes antes de la puntuación ("M20 ,"), el prefijo "Images Credit:" sin eliminar y el símbolo "©" usado para créditos que no son copyright (ahora dice "Crédito:").
  - Verificado en el navegador: portada con la foto real de hoy, galería con imágenes y videos reales, detalle con video de YouTube y mp4, sin errores en consola.
- Al entrar a la galería obtuve el error `Invalid src prop (https://assets.science.nasa.gov/content/dam/.../cq5dam.thumbnail.48.48.png) on next/image, hostname "assets.science.nasa.gov" is not configured`. La IA encontró que algunas entradas (por ejemplo, 3 y 8 de noviembre de 2026) traen en `hdurl` una **miniatura de 48×48 px** del gestor de contenidos (ruta `/content/dam/...`) en lugar de la imagen completa (ruta `/dynamicimage/...`). Corrección:
  - `fixImageUrl()` en `src/lib/apod.ts` convierte esas URLs a la imagen completa del CDN (`.../content/dam/<ruta>.jpg/jcr:content/renditions/...` → `.../dynamicimage/assets/<ruta>.jpg`), que es la misma imagen que aparece en su `basic_html`.
  - Se agregó `/content/dam/**` a `remotePatterns` como respaldo, para que una ruta inesperada del mismo CDN no rompa la página.
  - Verificado: la tarjeta del 8 de noviembre ("Major Fireball Meteor") ya se ve en resolución completa; en una muestra de 100 días, las únicas entradas sin imagen son videos mp4 sin miniatura, que no usan `next/image` y muestran el aviso "Video sin miniatura".
- Detalle de diseño: cuando un título era largo y ocupaba 2 líneas, esa tarjeta quedaba más alta que las demás y la cuadrícula no se veía uniforme. Pedí que todo se viera uniforme y bien alineado. Cambios en `ApodCard`:
  - El título **siempre reserva 2 líneas** (`min-h-[2lh]` + `line-clamp-2`): si es más corto queda el espacio, y si es más largo se corta con "…". El título completo se ve al pasar el mouse (atributo `title`).
  - La tarjeta ocupa todo el alto de su celda (`flex h-full flex-col`, con el bloque de texto en `flex-1`).
  - El esqueleto de carga también muestra 2 líneas de título, para que no "salte" al cargar.
  - Verificado midiendo en el navegador: las 24 tarjetas miden exactamente lo mismo (371 px).
- Pedí agregar en la portada un botón para ir a la galería, junto a "Ver detalle", para mejorar la accesibilidad. Cambios en `src/app/page.tsx`:
  - Nuevo botón secundario **"Ir a la galería"** (estilo glass, para distinguirlo del botón principal blanco).
  - "Ver detalle" ahora tiene `aria-label` con el título de la foto ("Ver detalle de …"), para que un lector de pantalla anuncie a dónde lleva.
  - Ambos botones tienen un contorno visible al navegar con teclado (`focus-visible`).

### Iteración 4 — Favoritos (useState + useEffect)
**Prompt:**
```
Agrega:
1. Un componente cliente FavoriteButton (corazón) que guarde y quite fotos en localStorage, usando useState y useEffect para evitar errores de hidratación.
2. app/favoritos/page.tsx como Client Component que lea los favoritos con useEffect y los muestre con ApodCard, con un estado vacío bonito si no hay ninguno.
3. En la galería, un filtro cliente con un input de fecha que navegue a /galeria/[fecha].
4. Un botón "Foto aleatoria" que llame a /api/apod?count=1 desde el cliente y redirija al detalle.
```
**Resultado de la IA:**
- `src/lib/favorites.ts`: lectura y escritura de favoritos en `localStorage` (clave `galeria-espacial:favoritos`, se guarda el `ApodItem` completo para poder mostrar la tarjeta sin volver a llamar a la API). Tolera JSON corrupto o almacenamiento bloqueado. Emite un evento propio y escucha el evento `storage`, para que todos los corazones y la página de favoritos se actualicen solos, incluso entre pestañas.
- `src/components/FavoriteButton.tsx` (Client Component): corazón con `useState` + `useEffect`. En el servidor y en el primer render siempre se muestra "no favorito" (deshabilitado), y el valor real se lee de `localStorage` en `useEffect`, después de hidratar, lo que evita errores de hidratación. Tiene dos variantes: un botón redondo sobre las tarjetas y un botón con texto ("Guardar en favoritos" / "En favoritos") en el detalle. Usa `aria-pressed` y un `aria-label` con el título de la foto.
- `ApodCard`: el corazón se agregó como **hermano** del enlace y no dentro de él, porque un `<button>` dentro de un `<a>` es HTML inválido y además haría que el clic abriera el detalle.
- `src/app/favoritos/page.tsx` (Client Component): lee los favoritos en `useEffect` y los muestra con `ApodCard`, con contador de fotos. Mientras no se ha leído `localStorage` muestra un esqueleto, para que alguien con favoritos no vea por un instante el estado vacío. El estado vacío es un planeta con anillo y un corazón, con un mensaje y un botón "Explorar la galería". Si se quita un favorito, desaparece de la lista en el momento.
- `src/app/favoritos/layout.tsx`: define el título de la pestaña ("Favoritos · Galería del Espacio"), porque un Client Component no puede exportar `metadata`.
- `src/components/DateFilter.tsx` (Client Component): `<input type="date">` con mínimo 16/06/1995 y máximo hoy, validación con mensaje accesible (`aria-invalid`, `aria-describedby`) y navegación con `router.push('/galeria/[fecha]')`.
- `src/components/RandomApodButton.tsx` (Client Component): llama a `/api/apod?count=1` con `fetch` desde el navegador, muestra un spinner ("Buscando…") y redirige al detalle; si falla, muestra el error con `role="alert"`.
- La galería muestra el filtro y el botón aleatorio junto al título, y el detalle muestra el botón de favorito junto a "Abrir imagen en resolución completa".

Ajustes que la IA hizo por su cuenta:
- **Regla del lint de React `set-state-in-effect`:** la primera versión llamaba a `setState` directamente dentro de `useEffect` y el lint lo marcó como error, porque provoca renders en cascada. Se corrigió **sin desactivar la regla** y manteniendo `useState` + `useEffect`:
  - En `FavoriteButton`, un solo estado `boolean | null` (`null` = aún no leído) en lugar de dos estados; el efecto solo sincroniza con `localStorage` y se suscribe a sus cambios.
  - En `DateFilter`, la fecha máxima (que depende del reloj del navegador) se aplica directamente al `<input>` mediante un `ref` en el efecto, y la validación se hace en el manejador de cambios.
- Al probar la foto aleatoria apareció un crédito con un espacio sobrante después del paréntesis ("( PSU)"); se corrigió en la normalización de textos.

Verificado con lint, build y en el navegador: estado vacío, guardar dos favoritos desde la galería (el clic en el corazón no abre el detalle), verlos en `/favoritos`, quitar uno (desaparece en el momento), filtro por fecha hacia `/galeria/2024-07-04` y foto aleatoria (llevó a `/galeria/2003-07-03`), sin errores de hidratación ni de consola.

**Mi revisión / cambios:**
- Detecté que al dar clic en **"Foto aleatoria"** aparece el loader y me redirige bien, pero **al regresar a la galería el loader se queda visible todo el tiempo**.
- La IA revisó la guía de Next.js 16 *Preserving UI state* y encontró la causa: con Cache Components, Next.js **no desmonta** la página al navegar, sino que la oculta con el componente `<Activity>` de React y conserva su estado (hasta 3 rutas). Por eso, al volver, el botón seguía con `loading = true`.
- Solución, siguiendo la recomendación de la documentación para estados transitorios: un `useLayoutEffect` con función de limpieza en `RandomApodButton`, que reinicia `loading` y `error` cuando la página se oculta.
- Verificado en el navegador: al volver con el botón "Atrás" y con el enlace "Volver a la galería", el botón aparece normal ("Foto aleatoria") y se puede usar de nuevo.

### Iteración 5 — Loading, error y responsive
**Prompt:**
```
Agrega loading.tsx con skeletons animados y error.tsx con un botón de reintentar en app/galeria y en app/galeria/[fecha], más un not-found.tsx con temática espacial. Revisa que todo sea responsive y agrega animaciones de entrada suaves. Revisa también el código completo y dime si hay errores de TypeScript o malas prácticas.
```
**Resultado de la IA:** La IA revisó la documentación de Next.js 16 sobre `loading.js`, `error.js`, `not-found.js` y `generateMetadata`. Luego generó:
- **Skeletons animados** (`src/components/Skeletons.tsx`): componentes compartidos entre los `loading.tsx` y los `<Suspense>` de las páginas, para que los dos estados de carga sean idénticos. Tienen un brillo que recorre cada bloque (clase `.skeleton`).
- **`loading.tsx`** en `app/galeria` (encabezado y 9 tarjetas) y en `app/galeria/[fecha]` (detalle).
- **`error.tsx`** en `app/galeria` y `app/galeria/[fecha]`, con un componente compartido `ErrorState`: ilustración de un cometa, botón **"Reintentar"** (con spinner) y enlace para volver. Muestra el código de error (`digest`) y registra el error en consola.
- **`app/not-found.tsx`**: un "404" donde el 0 es un planeta con anillo, un astronauta flotando, el mensaje "Perdido en el espacio" y botones a Inicio y Galería. Lo usan las rutas inexistentes y las fechas sin foto.
- **Animaciones de entrada** (`globals.css`, como utilidades de Tailwind v4: `animate-fade-up`, `animate-fade-in`, `animate-float`): el texto del hero entra escalonado, la foto aparece con un desvanecido, las tarjetas de la galería y de favoritos entran una tras otra (40 ms entre cada una, máximo 0,5 s) y el detalle y los encabezados se deslizan suavemente. Todas se desactivan con `prefers-reduced-motion`.
- **Título de pestaña por foto:** `generateMetadata` en el detalle ("A Beautiful Trifid · Galería del Espacio"), con descripción e imagen para cuando se comparte el enlace.

Ajustes que la IA hizo por su cuenta:
- **`retry` en lugar de `reset`:** en Next.js 16 `error.tsx` recibe `retry()`, que vuelve a pedir los datos y renderizar (el `reset()` clásico solo limpia el error), y el `error` es de tipo `unknown`.
- **Los errores ahora llegan a `error.tsx`:** antes, la galería y el detalle atrapaban los errores y mostraban un aviso en línea, así que un `error.tsx` nunca se habría activado. Ahora los errores inesperados se propagan; la fecha inválida o sin foto sigue yendo a `notFound()`. Como los errores se cachean solo unos segundos, quedan fuera del prerender y **el build no se rompe aunque la NASA esté caída** (se comprobó). Se eliminó `ApodNotice`, que quedó sin uso.
- **El botón "Reintentar" no se queda pegado:** usa `useTransition`, así que vuelve solo a su estado normal tanto si el reintento funciona como si vuelve a fallar.

**Revisión del código completo:**
- **TypeScript:** `tsc --noEmit` → **0 errores**. **ESLint:** sin errores ni advertencias.
- Malas prácticas encontradas y corregidas:
  1. **Accesibilidad del menú móvil:** cerrado, sus enlaces seguían recibiendo foco con Tab aunque no se veían. Se agregó `inert` cuando está cerrado.
  2. **Código sin uso:** se eliminaron `getApodRange()` y `ApodNotice`, y `FAVORITES_EVENT` y `CardSkeleton` dejaron de exportarse.
  3. **Constante duplicada:** la fecha de la primera APOD estaba repetida en dos archivos; ahora vive en `apod-utils.ts` como `FIRST_APOD_DATE`.
  4. **Número mágico:** el `-mt-[72px]` del hero dependía del alto de la navbar; ahora usa la variable CSS `--nav-height`.
  5. **Skeletons duplicados** en 3 páginas, unificados en `Skeletons.tsx`.
  6. **Videos mp4 sin portada:** ahora usan `poster` con la miniatura, `preload="metadata"` y `aria-label`.
  7. **Detalle sin título propio** en la pestaña: resuelto con `generateMetadata`.
- Observaciones que quedan a mi criterio (no se cambiaron porque son archivos míos o decisiones de alcance):
  - `README.md` y `.env.example` todavía mencionan `NASA_API_KEY`, que ya no se usa con el nuevo feed.
  - En el repo hay **dos lockfiles** (`package-lock.json` y `pnpm-lock.yaml`); conviene dejar solo uno para que Vercel use un único gestor de paquetes.
  - El feed trae un campo `alt` (descripción de la imagen) que no se usa: hoy el `alt` de las imágenes es el título. Usarlo mejoraría la accesibilidad.
  - La portada maneja su error en línea (sin "Reintentar"), porque el prompt pedía `error.tsx` solo en la galería y el detalle.
  - No hay pruebas automatizadas.

**Responsive:** se revisó a 375 px (celular) la portada, la galería, el detalle, favoritos, el 404 y el menú hamburguesa. **No hay desbordamiento horizontal** en ninguna página. Se ajustó el filtro de fecha para que en móvil ocupe todo el ancho, igual que "Foto aleatoria".

Verificado con `tsc`, lint, build y en el navegador: skeletons, 404 espacial (escritorio y móvil), y `error.tsx` de la galería y el detalle forzando una caída temporal de la NASA (el botón "Reintentar" muestra los skeletons y vuelve a la pantalla de error sin quedarse pegado). Luego se restauró el endpoint real y todo volvió a funcionar, sin errores en consola.

**Mi revisión / cambios:**
- Al ver el detalle de una foto noté un efecto raro: primero se mostraba el skeleton (bien), pero luego **aparecía solo el texto y, un segundo después, la imagen, que empujaba todo el texto de forma brusca**.
- La IA empezó a resolverlo reservando el espacio de la imagen, pero **la interrumpí**: mi intención no era reservar el espacio, sino que **el skeleton se mantenga hasta que la imagen aparezca**.
- Solución aplicada (`src/components/ImageReveal.tsx`):
  - `RevealProvider`: mientras la imagen carga, muestra el skeleton del detalle y renderiza el contenido real oculto debajo (`opacity-0`, fuera del flujo, `inert`), para que la imagen empiece a descargarse de inmediato. Cuando la imagen termina, quita el skeleton y muestra **todo junto** (texto + imagen) con la animación de entrada.
  - `RevealImage`: un `next/image` que avisa con `onLoad`. También avisa con `onError`, para que una imagen rota no deje el skeleton para siempre, y revisa `img.complete` al montarse, para el caso de una imagen en caché que termina de cargar antes de que React conecte `onLoad`.
  - Red de seguridad: si la imagen tarda más de 10 s, el contenido se muestra igual.
  - Los videos e iframes no esperan, porque no hay una imagen que cargar.
- Verificado midiendo una línea de tiempo en el navegador al abrir una foto desde la galería: skeleton (0 ms) → llegan los datos y la imagen se descarga oculta, con el skeleton visible (1201 ms) → imagen cargada y skeleton retirado (1561 ms) → texto visible (1592 ms). **El texto nunca aparece antes que la imagen.** Con la imagen en caché (recarga directa) el skeleton tampoco se queda pegado.

_(agrega más iteraciones si las hubo)_

---

## 3. Decisiones técnicas

- **Route Handler como proxy:** la API key de la NASA vive solo en el servidor (`.env.local` / variables de Vercel) y nunca llega al navegador.
- **Server Components para obtener datos:** la portada, la galería y el detalle se renderizan en el servidor → mejor rendimiento y SEO.
- **Client Components solo donde hay interactividad:** filtro de fechas, botón de favorito y página de favoritos.
- **localStorage para favoritos:** no requiere base de datos; se lee en `useEffect` para evitar errores de hidratación.
- **Caché con `revalidate`:** la foto del día cambia una vez al día, así que se cachea para no gastar el límite de peticiones.
- **Feed oficial de science.nasa.gov en lugar de api.nasa.gov:** tras la migración de la APOD, el feed de WordPress es la fuente con datos reales y no requiere API key. El Route Handler se mantiene como capa propia: valida, normaliza el formato a `ApodItem`, cachea y conserva la interfaz de la API clásica.
- **Estado conservado entre navegaciones (`<Activity>`):** con Cache Components, Next.js oculta las páginas en lugar de desmontarlas. Los estados de vista útiles (por ejemplo, la fecha escrita en el filtro) se conservan, y los transitorios (loaders, errores) se reinician al ocultar la página.
- _(agrega las tuyas)_

---

## 4. Desafíos y cómo se resolvieron con apoyo de IA

| Desafío | Cómo lo detecté | Solución |
|---|---|---|
| Algunos días la APOD es un **video**, no una imagen | La tarjeta salía rota / vacía | Revisar `media_type` y mostrar miniatura (`thumbs=true`) o un `<iframe>` |
| `next/image` rechazaba imágenes externas | Error en consola sobre host no configurado | Agregar `apod.nasa.gov` en `images.remotePatterns` de `next.config.ts` |
| Error de hidratación al leer localStorage | Warning en consola | Mover la lectura a `useEffect` |
| `params` es una Promesa en Next.js 15+ | La IA generó código con `params.fecha` directo | Usar `const { fecha } = await params` |
| `usePathname` en la navbar puede romper el build con Cache Components | Lectura de la documentación de Next.js 16 antes de codificar | Aislar la lectura de la ruta en un componente envuelto en `<Suspense>` con fallback sin estado activo |
| `new Date()` en Server Components falla en el prerender | Documentación de Cache Components | Footer sin año dinámico; lo no determinista (`Math.random`) va solo en Client Components |
| La API de la NASA devuelve 500 al pedir la foto de "hoy" cuando aún no está publicada | Prueba real del endpoint con `curl` (también falla con `DEMO_KEY`) | El proxy responde 502 (error del servicio externo, no nuestro); la portada deberá usar la foto del día anterior como respaldo |
| La API oficial devuelve contenido genérico ("NASA Science") y sin `thumbnail_url` por la migración de APOD a science.nasa.gov | Observé que todos los títulos eran iguales; la IA lo confirmó consultando la NASA directamente | Detectarlo con `isPlaceholderApod()`, cachearlo poco tiempo, permitir imágenes de `science.nasa.gov` y mostrar un aviso en la UI |
| Textos con caracteres rotos ("JesÃºs") | Revisión del JSON completo | Reparar la codificación (Latin-1 → UTF-8, hasta 3 pasadas) al normalizar la respuesta |
| La API clásica devuelve contenido genérico; el nuevo feed oficial no está documentado públicamente (la guía de Notion requiere JavaScript) | La app no mostraba nada; revisión del README de `nasa/apod-api` | Documentar el feed `science.nasa.gov/wp-json/wp/v2/apod-basic` probándolo directamente (fechas en formato YYMMDD, máximo 25 por página, HTML en los textos, video dentro de `basic_html`) y adaptar `lib/apod.ts` manteniendo la interfaz |
| Al volver a la galería, el botón "Foto aleatoria" seguía mostrando el loader | Lo detecté probando la navegación de ida y vuelta | Next.js 16 conserva las páginas ocultas con `<Activity>`; los estados transitorios se reinician en la limpieza de un `useLayoutEffect` |
| Los `error.tsx` nunca se activaban porque las páginas atrapaban los errores | Revisión del flujo de errores al implementar la Iteración 5 | Propagar los errores inesperados (los 404 siguen en `notFound()`); el cacheo corto de errores evita que rompan el build |
| En Next.js 16 `error.tsx` recibe `retry` (no solo `reset`) y `error: unknown` | Documentación de `error.js` | Usar `retry()` dentro de `useTransition` para que el botón no se quede en "Reintentando…" |
| El lint de React marcó `setState` dentro de `useEffect` (`react-hooks/set-state-in-effect`) | `npm run lint` | Un solo estado `boolean \| null` sincronizado con `localStorage` por suscripción, y un `ref` para aplicar al `<input>` la fecha máxima dependiente del reloj |
| Un botón de favorito dentro de una tarjeta que es enlace | Revisión del HTML: un `<button>` dentro de un `<a>` es inválido | Poner el corazón como hermano del enlace, superpuesto con `absolute` |
| `priority` de `next/image` deprecado en Next.js 16 | Documentación de `next/image` | Usar `preload` |
| `fetch` con `next.revalidate` ya no aplica con Cache Components | Documentación de Next.js 16 | `'use cache'` + `cacheLife('hours')`, y `cacheLife('seconds')` cuando hay error |
| _(tu desafío real)_ | | |

---

## 5. Reflexión final

_(3–5 líneas: qué hizo bien la IA, dónde se equivocó, qué aprendiste sobre dirigirla)_