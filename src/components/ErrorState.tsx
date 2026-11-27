"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";

type Props = {
  error: unknown;
  retry: () => void;
  title: string;
  backHref: string;
  backLabel: string;
};

/**
 * Pantalla de error reutilizable para los error.tsx.
 *
 * En producción, Next.js no envía al navegador el mensaje real de los errores
 * del servidor (para no filtrar detalles internos), solo un `digest` que
 * permite encontrar el error en los logs. Por eso se muestra un texto amigable.
 */
export default function ErrorState({ error, retry, title, backHref, backLabel }: Props) {
  // useTransition: "retrying" vuelve solo a false cuando termina el reintento,
  // tanto si funciona como si vuelve a fallar
  const [retrying, startTransition] = useTransition();
  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;

  useEffect(() => {
    // Aquí se conectaría un servicio de monitoreo (Sentry, etc.)
    console.error(error);
  }, [error]);

  const handleRetry = () => {
    // retry() vuelve a pedir los datos y renderizar el segmento
    startTransition(() => retry());
  };

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-xl animate-fade-up flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-6 py-14 text-center backdrop-blur-md"
    >
      {/* Cometa desviado */}
      <div className="relative mb-6 h-20 w-20" aria-hidden="true">
        <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-gradient-to-br from-amber-200 to-rose-400 shadow-[0_0_40px_rgba(251,113,133,0.6)]" />
        <div className="absolute right-8 top-8 h-1.5 w-16 origin-right rotate-[35deg] rounded-full bg-gradient-to-l from-rose-300/80 to-transparent" />
      </div>

      <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
      <p className="mt-3 text-slate-300">
        Hubo una interferencia en la comunicación con la NASA. Puede ser algo
        temporal: intenta de nuevo en unos segundos.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-wait disabled:opacity-70"
        >
          {retrying && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-900" aria-hidden="true" />
          )}
          {retrying ? "Reintentando…" : "Reintentar"}
        </button>
        <Link
          href={backHref}
          className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
        >
          {backLabel}
        </Link>
      </div>

      {digest && <p className="mt-6 text-xs text-slate-500">Código de error: {digest}</p>}
    </div>
  );
}
