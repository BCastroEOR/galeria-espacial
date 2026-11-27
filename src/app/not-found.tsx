import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Perdido en el espacio",
};

/**
 * 404 con temática espacial. La usan las rutas que no existen y las llamadas
 * a notFound() (por ejemplo, /galeria/[fecha] con una fecha sin foto).
 */
export default function NotFound() {
  return (
    <section className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      {/* "404" con un planeta haciendo de cero y un astronauta flotando */}
      <div className="relative flex animate-fade-in items-center justify-center gap-2 font-display text-[7rem] font-semibold leading-none text-white/90 sm:gap-4 sm:text-[11rem]">
        <span>4</span>
        <span className="relative inline-block h-[0.8em] w-[0.8em]" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-300 via-violet-500 to-fuchsia-700 shadow-[0_0_80px_rgba(139,92,246,0.5)]" />
          <span className="absolute left-[18%] top-[22%] h-[18%] w-[18%] rounded-full bg-black/20" />
          <span className="absolute bottom-[25%] right-[22%] h-[12%] w-[12%] rounded-full bg-black/20" />
          <span className="absolute left-1/2 top-1/2 h-[28%] w-[150%] -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[50%] border-2 border-indigo-200/60" />
        </span>
        <span>4</span>
        <span className="sr-only">Error 404</span>

        <Astronaut className="absolute -right-6 -top-8 h-16 w-16 animate-float sm:-right-16 sm:h-24 sm:w-24" />
      </div>

      <h1 className="mt-8 animate-fade-up font-display text-4xl font-semibold text-white [animation-delay:150ms] sm:text-5xl">
        Perdido en el espacio
      </h1>
      <p className="mt-4 max-w-md animate-fade-up text-slate-300 [animation-delay:250ms]">
        La página que buscas se alejó más allá del horizonte de eventos, o
        ese día la NASA no publicó ninguna foto.
      </p>

      <div className="mt-10 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:350ms]">
        <Link
          href="/"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
        >
          Volver al inicio
        </Link>
        <Link
          href="/galeria"
          className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
        >
          Explorar la galería
        </Link>
      </div>
    </section>
  );
}

function Astronaut({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Mochila */}
      <rect x="18" y="24" width="28" height="26" rx="6" fill="#94a3b8" />
      {/* Cuerpo */}
      <rect x="21" y="26" width="22" height="24" rx="8" fill="#f1f5f9" />
      {/* Brazos y piernas */}
      <rect x="11" y="30" width="12" height="7" rx="3.5" fill="#e2e8f0" transform="rotate(-25 17 33)" />
      <rect x="41" y="30" width="12" height="7" rx="3.5" fill="#e2e8f0" transform="rotate(25 47 33)" />
      <rect x="23" y="46" width="7" height="12" rx="3.5" fill="#e2e8f0" />
      <rect x="34" y="46" width="7" height="12" rx="3.5" fill="#e2e8f0" />
      {/* Casco y visor */}
      <circle cx="32" cy="18" r="13" fill="#f8fafc" />
      <rect x="23" y="12" width="18" height="12" rx="6" fill="#312e81" />
      <rect x="26" y="14" width="6" height="3" rx="1.5" fill="#a5b4fc" opacity="0.8" />
      {/* Panel del pecho */}
      <rect x="27" y="33" width="10" height="6" rx="2" fill="#c7d2fe" />
      <circle cx="30" cy="36" r="1" fill="#f43f5e" />
    </svg>
  );
}
