import Link from "next/link";

// Portada provisional: en la Iteración 2 se reemplazará por la foto del día (APOD).
export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mb-4 text-xs uppercase tracking-[0.35em] text-indigo-300">
        Astronomy Picture of the Day
      </p>
      <h1 className="font-display text-5xl font-semibold leading-tight text-white sm:text-7xl">
        Galería del Espacio
      </h1>
      <p className="mt-6 max-w-xl text-lg text-slate-300">
        Cada día, una nueva ventana al universo. Explora las imágenes
        astronómicas de la NASA y guarda tus favoritas.
      </p>
      <Link
        href="/galeria"
        className="mt-10 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
      >
        Explorar la galería
      </Link>
    </section>
  );
}
