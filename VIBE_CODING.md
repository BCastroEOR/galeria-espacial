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
```
**Resultado de la IA:**
**Mi revisión / cambios:**

### Iteración 4 — Favoritos (useState + useEffect)
**Prompt:**
```
```
**Resultado de la IA:**
**Mi revisión / cambios:**

### Iteración 5 — Loading, error y responsive
**Prompt:**
```
```
**Resultado de la IA:**
**Mi revisión / cambios:**

_(agrega más iteraciones si las hubo)_

---

## 3. Decisiones técnicas

- **Route Handler como proxy:** la API key de la NASA vive solo en el servidor (`.env.local` / variables de Vercel) y nunca llega al navegador.
- **Server Components para obtener datos:** la portada, la galería y el detalle se renderizan en el servidor → mejor rendimiento y SEO.
- **Client Components solo donde hay interactividad:** filtro de fechas, botón de favorito y página de favoritos.
- **localStorage para favoritos:** no requiere base de datos; se lee en `useEffect` para evitar errores de hidratación.
- **Caché con `revalidate`:** la foto del día cambia una vez al día, así que se cachea para no gastar el límite de peticiones.
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
| `fetch` con `next.revalidate` ya no aplica con Cache Components | Documentación de Next.js 16 | `'use cache'` + `cacheLife('hours')`, y `cacheLife('seconds')` cuando hay error |
| _(tu desafío real)_ | | |

---

## 5. Reflexión final

_(3–5 líneas: qué hizo bien la IA, dónde se equivocó, qué aprendiste sobre dirigirla)_