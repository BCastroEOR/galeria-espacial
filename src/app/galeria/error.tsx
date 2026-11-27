"use client"; // Los error boundaries deben ser Client Components

import ErrorState from "@/components/ErrorState";

// Next.js 16: `error` es `unknown` y `retry()` vuelve a pedir los datos
// (reemplaza el uso habitual de `reset()`, que solo limpia el error).
export default function GaleriaError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <ErrorState
        error={error}
        retry={retry}
        title="No pudimos cargar la galería"
        backHref="/"
        backLabel="Ir al inicio"
      />
    </section>
  );
}
