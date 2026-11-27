"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import type { ApodItem } from "@/lib/apod-types";

/**
 * Pide una foto aleatoria a nuestro Route Handler (/api/apod?count=1)
 * desde el navegador y redirige a su página de detalle.
 */
export default function RandomApodButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Con Cache Components, Next.js no desmonta la página al navegar: la oculta
  // con <Activity> y conserva su estado. Sin esto, al volver a la galería el
  // botón seguiría en "Buscando…". La limpieza corre cuando la página se oculta.
  useLayoutEffect(() => {
    return () => {
      setLoading(false);
      setError(null);
    };
  }, []);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apod?count=1", { cache: "no-store" });
      const data: ApodItem[] | { error: string } = await res.json();
      if (!res.ok || !Array.isArray(data) || !data[0]) {
        throw new Error("error" in data ? data.error : "No se pudo obtener una foto");
      }
      router.push(`/galeria/${data[0].date}`);
      // loading queda en true hasta que la página se oculte (ver useLayoutEffect)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo obtener una foto");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-widest text-slate-400" aria-hidden="true">
        ¿Te sientes con suerte?
      </span>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
        ) : (
          <span aria-hidden="true">🎲</span>
        )}
        {loading ? "Buscando…" : "Foto aleatoria"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
