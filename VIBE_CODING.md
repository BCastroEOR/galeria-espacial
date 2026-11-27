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
```
**Resultado de la IA:**
**Mi revisión / cambios:**

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
| _(tu desafío real)_ | | |

---

## 5. Reflexión final

_(3–5 líneas: qué hizo bien la IA, dónde se equivocó, qué aprendiste sobre dirigirla)_