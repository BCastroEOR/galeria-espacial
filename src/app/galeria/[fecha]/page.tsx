import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ApodNotice from "@/components/ApodNotice";
import ApodPreview from "@/components/ApodPreview";
import { ApodError, getApod, isValidApodDate, type ApodItem } from "@/lib/apod";
import { formatApodDate, isVideoFile } from "@/lib/apod-utils";

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
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
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
    return (
      <ApodNotice title="No pudimos cargar esta foto" tone="error">
        {err instanceof ApodError ? err.message : "Error desconocido"}
      </ApodNotice>
    );
  }

  return (
    <>
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

        {apod.media_type === "image" && apod.hdurl && (
          <a
            href={apod.hdurl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
          >
            Abrir imagen en resolución completa
          </a>
        )}
      </div>
    </>
  );
}

/** Imagen en HD, o el video (iframe para embeds, <video> para archivos). */
function ApodMediaFull({ apod }: { apod: ApodItem }) {
  if (apod.media_type === "image") {
    return (
      <Image
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
      <video src={apod.url} controls playsInline className="aspect-video w-full" />
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

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-40 rounded bg-white/10" />
      <div className="mt-4 h-10 w-2/3 rounded bg-white/15" />
      <div className="mt-6 aspect-video rounded-2xl bg-white/10" />
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-2/3 rounded bg-white/10" />
      </div>
    </div>
  );
}
