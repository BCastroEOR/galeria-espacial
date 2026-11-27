import type { Metadata } from "next";
import { Suspense } from "react";
import ApodCard from "@/components/ApodCard";
import DateFilter from "@/components/DateFilter";
import RandomApodButton from "@/components/RandomApodButton";
import { GridSkeleton } from "@/components/Skeletons";
import { getRecentApods } from "@/lib/apod";

const DAYS = 24;

export const metadata: Metadata = {
  title: "Galería",
  description: `Las fotos astronómicas de la NASA de los últimos ${DAYS} días.`,
};

export default function GaleriaPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10 flex animate-fade-up flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">
            Últimos {DAYS} días
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">
            Galería
          </h1>
        </div>

        {/* Herramientas de cliente: filtro por fecha y foto aleatoria */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <DateFilter />
          <RandomApodButton />
        </div>
      </header>

      <Suspense fallback={<GridSkeleton count={9} />}>
        <ApodGrid />
      </Suspense>
    </section>
  );
}

/**
 * Si la API falla, el error se propaga hasta galeria/error.tsx, que muestra
 * el botón "Reintentar".
 */
async function ApodGrid() {
  const items = await getRecentApods(DAYS);

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <li
          key={item.date}
          className="h-full animate-fade-up"
          // Entrada escalonada: cada tarjeta aparece un poco después (máx. 0.5 s)
          style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
        >
          <ApodCard item={item} preload={i < 3} />
        </li>
      ))}
    </ul>
  );
}
