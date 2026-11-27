import type { ApodItem } from "./apod-types";

/**
 * Desde la migración de apod.nasa.gov a science.nasa.gov, la API oficial
 * a veces devuelve un contenido genérico en lugar de la APOD real:
 * título "NASA Science", explicación genérica y el logo de la NASA como imagen.
 * Esta función lo detecta para que la UI muestre un aviso en vez de
 * tarjetas repetidas. Se puede usar en Server y Client Components.
 */
export function isPlaceholderApod(item: Pick<ApodItem, "title" | "url">) {
  return (
    item.title.trim() === "NASA Science" ||
    item.url.includes("/wp-content/themes/")
  );
}
