import type { ApodItem } from "./apod-types";

/*
 * Favoritos guardados en localStorage. Solo debe usarse en el navegador
 * (dentro de useEffect o de manejadores de eventos), nunca durante el render,
 * porque en el servidor no existe localStorage y provocaría errores de hidratación.
 */

const STORAGE_KEY = "galeria-espacial:favoritos";
/** Evento para avisar a otros componentes de la misma pestaña que cambió la lista. */
export const FAVORITES_EVENT = "favoritos:cambio";

export function readFavorites(): ApodItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ApodItem[]) : [];
  } catch {
    // JSON corrupto o localStorage bloqueado (modo privado estricto)
    return [];
  }
}

function writeFavorites(items: ApodItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Cuota llena o almacenamiento bloqueado: no hay mucho más que hacer
  }
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function isFavorite(date: string) {
  return readFavorites().some((f) => f.date === date);
}

/** Agrega o quita la foto. Devuelve true si quedó como favorita. */
export function toggleFavorite(item: ApodItem): boolean {
  const current = readFavorites();
  const exists = current.some((f) => f.date === item.date);
  writeFavorites(
    exists
      ? current.filter((f) => f.date !== item.date)
      : // Más reciente agregada primero
        [item, ...current],
  );
  return !exists;
}

/**
 * Suscribe una función a los cambios de favoritos: los de esta pestaña
 * (evento propio) y los de otras pestañas (evento "storage").
 * Devuelve la función para cancelar la suscripción.
 */
export function subscribeFavorites(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener(FAVORITES_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(FAVORITES_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
