import Image from "next/image";
import type { ApodItem } from "@/lib/apod-types";
import { apodPreviewImage } from "@/lib/apod-utils";

type Props = {
  item: ApodItem;
  /** Valor de `sizes` para next/image según dónde se use. */
  sizes: string;
  preload?: boolean;
  className?: string;
  /** Mostrar el texto cuando no hay imagen (en el hero se oculta porque el título ya lo indica). */
  showMessage?: boolean;
};

/**
 * Imagen de vista previa que ocupa todo su contenedor (que debe ser `relative`).
 * - Imagen → la foto.
 * - Video → su miniatura (thumbnail_url) con un ícono de "play".
 * - Sin imagen disponible (video sin miniatura o media_type "other")
 *   → un fondo de nebulosa con un mensaje.
 */
export default function ApodPreview({
  item,
  sizes,
  preload,
  className,
  showMessage = true,
}: Props) {
  const src = apodPreviewImage(item);
  const isVideo = item.media_type === "video";

  if (!src) {
    return (
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_30%_20%,rgba(79,70,229,0.35),transparent_60%),radial-gradient(ellipse_at_70%_80%,rgba(147,51,234,0.25),transparent_60%)] p-6 text-center ${className ?? ""}`}
      >
        {isVideo && <PlayIcon />}
        {showMessage && (
          <span className="text-sm text-slate-300">
            {isVideo ? "Video sin miniatura" : "Vista previa no disponible"}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <Image
        src={src}
        alt={item.title}
        fill
        sizes={sizes}
        preload={preload}
        className={`object-cover ${className ?? ""}`}
      />
      {isVideo && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <PlayIcon />
        </div>
      )}
    </>
  );
}

function PlayIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/40 backdrop-blur-sm">
      <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-white" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
      <span className="sr-only">Video</span>
    </span>
  );
}
