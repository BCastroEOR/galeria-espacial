import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ApodPreview from "@/components/ApodPreview";
import FavoriteButton from "@/components/FavoriteButton";
import { RevealImage, RevealProvider } from "@/components/ImageReveal";
import { DetailSkeleton } from "@/components/Skeletons";
import { ApodError, getApod, isValidApodDate, type ApodItem } from "@/lib/apod";
import { formatApodDate, isVideoFile } from "@/lib/apod-utils";

/**
 * Título y descripción de la pestaña (y de la vista previa al compartir) con
 * los datos de la foto. Como la página ya se resuelve en la petición (params
 * dentro de Suspense), la metadata se transmite junto con el contenido.
 */
export async function generateMetadata({
  params,
}: PageProps<"/galeria/[fecha]">): Promise<Metadata> {
  const { fecha } = await params;
  if (!isValidApodDate(fecha)) return { title: "Foto no encontrada" };
  try {
    const apod = await getApod(fecha);
    const image = apod.media_type === "image" ? apod.url : apod.thumbnail_url;
    return {
      title: apod.title,
      description: apod.explanation.slice(0, 160),
      openGraph: image ? { images: [image] } : undefined,
    };
  } catch {
    // El error real lo maneja la página (not-found.tsx o error.tsx)
    return { title: formatApodDate(fecha) };
  }
}

/**
 * En Next.js 16 `params` es una Promesa. Con Cache Components y sin
 * generateStaticParams, la fecha solo se conoce en la petición, así que
 * se resuelve dentro de un <Suspense> para que el resto de la página
 * (el shell estático) se pueda prerenderizar.
 */
export default function DetallePage({ params }: PageProps<"/galeria/[fecha]">) {
  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/galeria"
        className="mb-8 inline-flex items-center gap-2 rounded text-sm text-slate-300 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300"
      >
        <span aria-hidden="true">←</span> Volver a la galería
      </Link>

      <Suspense fallback={<DetailSkeleton />}>
        {params.then(({ fecha }) => (
          <ApodDetail fecha={fecha} />
        ))}
      </Suspense>
    </article>
  );
}

/**
 * Fecha inválida o sin foto → not-found.tsx (404 espacial).
 * Cualquier otro error se propaga a galeria/[fecha]/error.tsx ("Reintentar").
 */
async function ApodDetail({ fecha }: { fecha: string }) {
  if (!isValidApodDate(fecha)) notFound();

  let apod: ApodItem;
  try {
    apod = await getApod(fecha);
  } catch (err) {
    // 404: no hay APOD ese día · 400: fecha fuera de rango (p. ej. futura)
    if (err instanceof ApodError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }

  // Si es una imagen, el skeleton sigue visible hasta que termine de cargar y
  // luego aparece todo junto (así el texto no "salta" cuando llega la imagen)
  return (
    <RevealProvider skeleton={<DetailSkeleton />} waitForImage={apod.media_type === "image"}>
      <header className="mb-6">
        <time dateTime={apod.date} className="text-xs uppercase tracking-[0.3em] text-indigo-300">
          {formatApodDate(apod.date)}
        </time>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
          {apod.title}
        </h1>
        {apod.copyright && (
          <p className="mt-2 text-sm text-slate-400">Crédito: {apod.copyright}</p>
        )}
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl shadow-black/50">
        <ApodMediaFull apod={apod} />
      </div>

      <div className="mt-8 space-y-6">
        <p className="whitespace-pre-line text-lg leading-relaxed text-slate-200">
          {apod.explanation}
        </p>

        <div className="flex flex-wrap gap-3">
          <FavoriteButton item={apod} variant="inline" />
          {apod.media_type === "image" && apod.hdurl && (
            <a
              href={apod.hdurl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              Abrir imagen en resolución completa
            </a>
          )}
        </div>
      </div>
    </RevealProvider>
  );
}

/** Imagen en HD, o el video (iframe para embeds, <video> para archivos). */
function ApodMediaFull({ apod }: { apod: ApodItem }) {
  if (apod.media_type === "image") {
    return (
      <RevealImage
        src={apod.hdurl ?? apod.url}
        alt={apod.title}
        width={1600}
        height={1200}
        sizes="(min-width: 1024px) 1024px, 100vw"
        preload
        className="mx-auto h-auto max-h-[80vh] w-auto object-contain"
      />
    );
  }

  if (apod.media_type === "video") {
    return isVideoFile(apod.url) ? (
      <video
        src={apod.url}
        poster={apod.thumbnail_url}
        controls
        playsInline
        preload="metadata"
        aria-label={apod.title}
        className="aspect-video w-full"
      />
    ) : (
      <iframe
        src={apod.url}
        title={apod.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full"
      />
    );
  }

  // media_type "other": vista previa con mensaje
  return (
    <div className="relative aspect-video">
      <ApodPreview item={apod} sizes="(min-width: 1024px) 1024px, 100vw" />
    </div>
  );
}
