export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-slate-400 sm:flex-row">
        <p>
          <span className="font-display text-base text-slate-200">
            Galería del Espacio
          </span>{" "}
          · Proyecto Bootcamp Kodigo
        </p>
        <p>
          Imágenes cortesía de{" "}
          <a
            href="https://apod.nasa.gov/apod/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 underline-offset-4 hover:underline"
          >
            NASA APOD
          </a>
        </p>
      </div>
    </footer>
  );
}
