"use client"; // Los error boundaries deben ser Client Components

import ErrorState from "@/components/ErrorState";

export default function DetalleError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <ErrorState
        error={error}
        retry={retry}
        title="No pudimos cargar esta foto"
        backHref="/galeria"
        backLabel="Volver a la galería"
      />
    </section>
  );
}
