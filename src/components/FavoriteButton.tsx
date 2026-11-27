"use client";

import { useEffect, useState } from "react";
import type { ApodItem } from "@/lib/apod-types";
import { isFavorite, subscribeFavorites, toggleFavorite } from "@/lib/favorites";

type Props = {
  item: ApodItem;
  /** "overlay": botón redondo sobre una imagen · "inline": botón con texto */
  variant?: "overlay" | "inline";
  className?: string;
};

/**
 * Botón de corazón para guardar o quitar una foto de favoritos.
 *
 * Evita errores de hidratación: en el servidor (y en el primer render del
 * cliente) siempre se muestra "no favorito"; el valor real de localStorage
 * se lee en useEffect, que solo corre en el navegador después de hidratar.
 */
export default function FavoriteButton({ item, variant = "overlay", className = "" }: Props) {
  // null = todavía no se leyó localStorage (servidor y primer render del cliente)
  const [stored, setStored] = useState<boolean | null>(null);
  const favorite = stored === true;
  const ready = stored !== null;

  useEffect(() => {
    // Sincroniza con localStorage (sistema externo) y se suscribe a sus cambios,
    // para mantener el corazón al día si se cambia desde otra tarjeta u otra pestaña
    const sync = () => setStored(isFavorite(item.date));
    sync();
    return subscribeFavorites(sync);
  }, [item.date]);

  const label = favorite ? `Quitar "${item.title}" de favoritos` : `Guardar "${item.title}" en favoritos`;

  const handleClick = (e: React.MouseEvent) => {
    // Por si el botón está sobre un enlace: no navegar al hacer clic
    e.preventDefault();
    e.stopPropagation();
    setStored(toggleFavorite(item));
  };

  const heart = (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 transition-transform duration-200 ${favorite ? "scale-110 fill-rose-500 stroke-rose-500" : "fill-transparent stroke-current"}`}
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.6-9.6-9.2C.9 7.9 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6h2c.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.4 4.2 6.8-2.1 4.6-9.6 9.2-9.6 9.2z"
      />
    </svg>
  );

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={favorite}
        aria-label={label}
        disabled={!ready}
        className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:opacity-60 ${className}`}
      >
        {heart}
        {favorite ? "En favoritos" : "Guardar en favoritos"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorite}
      aria-label={label}
      title={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      disabled={!ready}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:scale-105 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:opacity-60 ${className}`}
    >
      {heart}
    </button>
  );
}
