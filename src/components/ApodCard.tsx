import Link from "next/link";
import type { ApodItem } from "@/lib/apod-types";
import { formatApodDate } from "@/lib/apod-utils";
import ApodPreview from "./ApodPreview";

type Props = {
  item: ApodItem;
  preload?: boolean;
};

/** Tarjeta reutilizable de una APOD: enlaza a su detalle y hace zoom suave al pasar el mouse. */
export default function ApodCard({ item, preload }: Props) {
  return (
    <Link
      href={`/galeria/${item.date}`}
      title={item.title}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/30 backdrop-blur-sm transition-colors hover:border-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ApodPreview
          item={item}
          preload={preload}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {item.media_type === "video" && (
          <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            Video
          </span>
        )}
      </div>

      {/* Altura uniforme: el título siempre reserva 2 líneas (y corta con "…" si hay más) */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <time dateTime={item.date} className="block text-xs uppercase tracking-widest text-indigo-300">
          {formatApodDate(item.date)}
        </time>
        <h2 className="min-h-[2lh] font-display text-xl font-semibold leading-snug text-white line-clamp-2">
          {item.title}
        </h2>
      </div>
    </Link>
  );
}
