import type { ApodItem } from "./apod-types";

/** Fecha de la primera APOD publicada. */
export const FIRST_APOD_DATE = "1995-06-16";

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2024-07-04" → "4 de julio de 2024" */
export function formatApodDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

/** Imagen a mostrar como miniatura: la foto, o la miniatura si es un video. */
export function apodPreviewImage(item: ApodItem): string | undefined {
  if (item.media_type === "image") return item.url;
  return item.thumbnail_url;
}

/** true si la URL del video es un archivo directo (se usa <video>) y no un embed (<iframe>). */
export function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}
