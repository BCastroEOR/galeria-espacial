"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ApodCard from "@/components/ApodCard";
import type { ApodItem } from "@/lib/apod-types";
import { readFavorites, subscribeFavorites } from "@/lib/favorites";

/**
 * Favoritos guardados en el navegador (localStorage).
 *
 * Es un Client Component: los favoritos se leen en useEffect, que solo corre
 * en el navegador después de hidratar. Mientras tanto (y en el HTML que genera
 * el servidor) se muestra un esqueleto, así no aparece por un instante el
 * estado vacío a alguien que sí tiene favoritos.
 */
export default function FavoritosPage() {
  // null = todavía no se leyó localStorage
  const [favorites, setFavorites] = useState<ApodItem[] | null>(null);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    sync();
    // Si se quita un favorito (aquí u otra pestaña), la lista se actualiza sola
    return subscribeFavorites(sync);
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">
          Guardadas en este navegador
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">
          Favoritos
        </h1>
        {favorites && favorites.length > 0 && (
          <p className="mt-2 text-slate-400">
            {favorites.length} {favorites.length === 1 ? "foto guardada" : "fotos guardadas"}
          </p>
        )}
      </header>

      {favorites === null ? (
        <GridSkeleton />
      ) : favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((item) => (
            <li key={item.date} className="h-full">
              <ApodCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 px-6 py-20 text-center backdrop-blur-md">
      {/* Planeta con anillo y un corazón como "luna" */}
      <div className="relative mb-8 h-32 w-32" aria-hidden="true">
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-600 shadow-[0_0_60px_rgba(139,92,246,0.45)]" />
        <div className="absolute left-1/2 top-1/2 h-8 w-40 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[50%] border-2 border-indigo-200/60" />
        <svg viewBox="0 0 24 24" className="absolute -right-2 top-0 h-8 w-8 animate-pulse fill-rose-400">
          <path d="M12 20.5s-7.5-4.6-9.6-9.2C.9 7.9 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6h2c.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.4 4.2 6.8-2.1 4.6-9.6 9.2-9.6 9.2z" />
        </svg>
      </div>
      <h2 className="font-display text-3xl font-semibold text-white">
        Tu universo de favoritos está vacío
      </h2>
      <p className="mt-3 max-w-md text-slate-300">
        Toca el corazón en cualquier foto de la galería para guardarla aquí.
        Tus favoritos se quedan en este navegador.
      </p>
      <Link
        href="/galeria"
        className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
      >
        Explorar la galería
      </Link>
    </div>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid animate-pulse grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando favoritos">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="aspect-[4/3] bg-white/10" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-32 rounded bg-white/10" />
            <div className="h-5 w-full rounded bg-white/15" />
            <div className="h-5 w-2/3 rounded bg-white/15" />
          </div>
        </li>
      ))}
    </ul>
  );
}
