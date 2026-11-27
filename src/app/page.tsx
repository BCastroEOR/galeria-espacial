import Link from "next/link";
import { Suspense } from "react";
import ApodPreview from "@/components/ApodPreview";
import { ApodError, getLatestApod } from "@/lib/apod";
import { formatApodDate } from "@/lib/apod-utils";

// La sección sube 72px (alto de la navbar) para que la foto quede detrás del vidrio.
const heroClass = "relative -mt-[72px] flex h-svh min-h-[560px] w-full overflow-hidden";

export default function Home() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <TodayHero />
    </Suspense>
  );
}

async function TodayHero() {
  let apod;
  try {
    apod = await getLatestApod();
  } catch (err) {
    const message = err instanceof ApodError ? err.message : "Error desconocido";
    return (
      <section className={`${heroClass} items-center justify-center px-6 text-center`}>
        <div className="max-w-lg">
          <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
            No pudimos cargar la foto del día
          </h1>
          <p className="mt-4 text-slate-300">{message}</p>
          <Link
            href="/galeria"
            className="mt-8 inline-block rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
          >
            Ir a la galería
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={heroClass}>
      <ApodPreview item={apod} sizes="100vw" preload showMessage={false} />
      {/* Degradado para que el texto se lea sobre cualquier imagen */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

      <div className="relative mt-auto w-full px-6 pb-16 sm:px-12 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">
            Foto astronómica del día
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight text-white sm:text-6xl">
            {apod.title}
          </h1>
          <time dateTime={apod.date} className="mt-3 block text-slate-300">
            {formatApodDate(apod.date)}
          </time>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/galeria/${apod.date}`}
              aria-label={`Ver detalle de "${apod.title}"`}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              Ver detalle
            </Link>
            <Link
              href="/galeria"
              className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              Ir a la galería
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <section className={`${heroClass} items-end`}>
      <div className="mx-auto w-full max-w-6xl animate-pulse px-6 pb-20 sm:px-12">
        <div className="h-3 w-48 rounded bg-white/15" />
        <div className="mt-4 h-12 w-3/4 max-w-xl rounded bg-white/15" />
        <div className="mt-4 h-4 w-40 rounded bg-white/10" />
        <div className="mt-8 h-11 w-36 rounded-full bg-white/15" />
      </div>
    </section>
  );
}
