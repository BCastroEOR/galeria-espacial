# 🌌 Galería del Espacio

Aplicación web que muestra la **Astronomy Picture of the Day (APOD)** de la NASA. Permite ver la foto del día, explorar imágenes anteriores, ver su explicación y guardar favoritas.

🔗 **Demo en producción:** https://space.bcastrolab.org

## ✨ Funcionalidades

- Foto astronómica del día a pantalla completa
- Galería de los últimos días con filtro por fecha
- Página de detalle de cada foto con su explicación
- Favoritos guardados en el navegador
- Soporte para días en que la NASA publica video
- Diseño responsive, estados de carga y manejo de errores

## 🛠️ Tecnologías

- [Next.js 16](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- [Feed oficial de la APOD de la NASA](https://science.nasa.gov/wp-json/wp/v2/apod-basic) (no requiere API key)
- pnpm
- Vercel

## 📁 Rutas

| Ruta | Descripción |
|---|---|
| `/` | Foto del día |
| `/galeria` | Cuadrícula de fotos recientes |
| `/galeria/[fecha]` | Detalle de una foto (formato `YYYY-MM-DD`) |
| `/favoritos` | Fotos guardadas |
| `/api/apod` | Route Handler que consulta el feed de la APOD de la NASA |

## 🚀 Instalación local

Requiere [pnpm](https://pnpm.io/installation).

```bash
git clone https://github.com/BCastroEOR/galeria-espacial.git
cd galeria-espacial
pnpm install
pnpm dev
```

Abre http://localhost:3000

No se necesitan variables de entorno: el feed de la APOD de la NASA no requiere API key.

## 🤖 Proceso de desarrollo con IA

El registro de prompts, iteraciones y decisiones está en [VIBE_CODING.md](./VIBE_CODING.md).

## 👤 Autor

Brandon Castro — Full Stack Junior 36, Kodigo