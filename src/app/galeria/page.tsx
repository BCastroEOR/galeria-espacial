import type { Metadata } from "next";
import { Suspense } from "react";
import ApodCard from "@/components/ApodCard";
import ApodNotice from "@/components/ApodNotice";
import DateFilter from "@/components/DateFilter";
import RandomApodButton from "@/components/RandomApodButton";
import { ApodError, getRecentApods } from "@/lib/apod";

const DAYS = 24;

export const metadata: Metadata = {
  title: "Galería",
  description: `Las fotos astronómicas de la NASA de los últimos ${DAYS} días.`,
};

export default function GaleriaPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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

      <Suspense fallback={<GridSkeleton />}>
        <ApodGrid />
      </Suspense>
    </section>
  );
}

async function ApodGrid() {
  let items;
  try {
    items = await getRecentApods(DAYS);
  } catch (err) {
    return (
      <ApodNotice title="No pudimos cargar la galería" tone="error">
        {err instanceof ApodError ? err.message : "Error desconocido"}
      </ApodNotice>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <li key={item.date} className="h-full">
          <ApodCard item={item} preload={i < 3} />
        </li>
      ))}
    </ul>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid animate-pulse grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
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
