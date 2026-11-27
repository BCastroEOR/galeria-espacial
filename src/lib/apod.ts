import "server-only";
import { cacheLife } from "next/cache";

import type { ApodItem, ApodQuery } from "./apod-types";

// Los tipos viven en apod-types.ts para poder importarlos también
// desde Client Components (este archivo es solo de servidor).
export type { ApodItem, ApodQuery } from "./apod-types";
export { isPlaceholderApod } from "./apod-utils";
import { isPlaceholderApod } from "./apod-utils";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Error con el código HTTP que debe devolverse al cliente. */
export class ApodError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApodError";
  }
}

type ApodResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

// ---------------------------------------------------------------------------
// Validación de parámetros
// ---------------------------------------------------------------------------

const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";
const FIRST_APOD_DATE = "1995-06-16"; // primera APOD publicada
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_COUNT = 100;

function isValidDate(value: string) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

/**
 * Valida y normaliza los query params antes de llamar a la NASA.
 * Lanza ApodError(400) si la combinación no es válida.
 */
export function parseApodQuery(params: URLSearchParams): ApodQuery {
  const date = params.get("date") ?? undefined;
  const start_date = params.get("start_date") ?? undefined;
  const end_date = params.get("end_date") ?? undefined;
  const countRaw = params.get("count") ?? undefined;

  for (const [name, value] of Object.entries({ date, start_date, end_date })) {
    if (value === undefined) continue;
    if (!isValidDate(value)) {
      throw new ApodError(`'${name}' debe tener el formato YYYY-MM-DD`, 400);
    }
    if (value < FIRST_APOD_DATE) {
      throw new ApodError(
        `'${name}' no puede ser anterior a ${FIRST_APOD_DATE}`,
        400,
      );
    }
  }

  let count: number | undefined;
  if (countRaw !== undefined) {
    count = Number(countRaw);
    if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
      throw new ApodError(
        `'count' debe ser un entero entre 1 y ${MAX_COUNT}`,
        400,
      );
    }
  }

  if (count !== undefined && (date || start_date || end_date)) {
    throw new ApodError(
      "'count' no se puede combinar con 'date', 'start_date' ni 'end_date'",
      400,
    );
  }
  if (date && (start_date || end_date)) {
    throw new ApodError(
      "'date' no se puede combinar con 'start_date' ni 'end_date'",
      400,
    );
  }
  if (end_date && !start_date) {
    throw new ApodError("'end_date' requiere 'start_date'", 400);
  }
  if (start_date && end_date && start_date > end_date) {
    throw new ApodError("'start_date' debe ser anterior a 'end_date'", 400);
  }

  return { date, start_date, end_date, count };
}

// ---------------------------------------------------------------------------
// Llamada a la NASA (sin caché)
// ---------------------------------------------------------------------------

/** Traduce el código de la NASA al código que debe ver nuestro cliente. */
function mapUpstreamStatus(status: number): number {
  if (status === 400) return 400; // parámetros inválidos (p. ej. fecha futura)
  if (status === 404) return 404; // no hay APOD para esa fecha
  if (status === 429) return 429; // límite de peticiones alcanzado
  // 401/403 = API key inválida → problema de configuración del servidor
  // 5xx = la NASA falló → somos un gateway que recibió una mala respuesta
  return 502;
}

async function requestApod(
  query: ApodQuery,
): Promise<ApodResult<ApodItem | ApodItem[]>> {
  const apiKey = process.env.NASA_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      message: "Falta configurar NASA_API_KEY en el servidor",
    };
  }

  const url = new URL(APOD_ENDPOINT);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("thumbs", "true");
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      message: timedOut
        ? "La API de la NASA tardó demasiado en responder"
        : "No se pudo conectar con la API de la NASA",
    };
  }

  if (!res.ok) {
    // La NASA responde { code, msg } o { error: { message } } según el caso
    const body = await res.json().catch(() => null);
    const upstreamMsg: string | undefined = body?.msg ?? body?.error?.message;
    const status = mapUpstreamStatus(res.status);
    return {
      ok: false,
      status,
      message:
        status === 502
          ? `La API de la NASA respondió con error (${res.status})`
          : (upstreamMsg ?? `Error de la API de la NASA (${res.status})`),
    };
  }

  const raw: RawApod | RawApod[] = await res.json();
  return {
    ok: true,
    data: Array.isArray(raw) ? raw.map(normalizeApod) : normalizeApod(raw),
  };
}

// ---------------------------------------------------------------------------
// Normalización de la respuesta
// ---------------------------------------------------------------------------

type RawApod = ApodItem & Record<string, unknown>;

/**
 * Corrige texto UTF-8 que la API entrega mal decodificado como Latin-1
 * (p. ej. "JesÃºs" → "Jesús"). A veces viene codificado dos veces, así que
 * se repite hasta 3 veces. Si el texto no tiene ese problema, no se toca.
 */
function fixMojibake(text: string): string {
  let current = text;
  for (let i = 0; i < 3 && /[ÃÂ]/.test(current); i++) {
    const repaired = Buffer.from(current, "latin1").toString("utf8");
    if (repaired.includes("�") || repaired === current) break;
    current = repaired;
  }
  return current;
}

/** Deja solo los campos de ApodItem, con el texto limpio. */
function normalizeApod(raw: RawApod): ApodItem {
  const item: ApodItem = {
    date: raw.date,
    title: fixMojibake(raw.title).trim(),
    explanation: fixMojibake(raw.explanation).trim(),
    url: raw.url,
    media_type: raw.media_type,
  };
  if (raw.hdurl) item.hdurl = raw.hdurl;
  if (raw.thumbnail_url) item.thumbnail_url = raw.thumbnail_url;
  if (raw.copyright) item.copyright = fixMojibake(raw.copyright).trim();
  return item;
}

/**
 * Versión cacheada: los resultados exitosos se guardan 1 hora
 * (perfil 'hours': revalidate = 3600 s). Los errores se cachean solo
 * unos segundos para no "congelar" un fallo temporal durante una hora.
 * Devuelve un resultado en lugar de lanzar, porque la salida de un
 * 'use cache' debe ser serializable.
 */
async function requestApodCached(query: ApodQuery) {
  "use cache";
  const result = await requestApod(query);
  if (!result.ok) {
    cacheLife("seconds");
  } else if ([result.data].flat().some(isPlaceholderApod)) {
    // Contenido genérico de la NASA: reintentar pronto por si ya hay datos reales
    cacheLife("minutes");
  } else {
    cacheLife("hours");
  }
  return result;
}

function unwrap<T>(result: ApodResult<T>): T {
  if (!result.ok) throw new ApodError(result.message, result.status);
  return result.data;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Consulta genérica usada por el Route Handler.
 * Las consultas con 'count' devuelven fotos aleatorias, así que no se cachean.
 */
export async function queryApod(query: ApodQuery) {
  const result =
    query.count !== undefined
      ? await requestApod(query)
      : await requestApodCached(query);
  return unwrap(result);
}

/** Foto del día (o de una fecha concreta). Para Server Components. */
export async function getApod(date?: string): Promise<ApodItem> {
  return unwrap(await requestApodCached({ date })) as ApodItem;
}

/** Fotos entre dos fechas (ambas incluidas). Para Server Components. */
export async function getApodRange(
  startDate: string,
  endDate?: string,
): Promise<ApodItem[]> {
  const data = unwrap(
    await requestApodCached({ start_date: startDate, end_date: endDate }),
  ) as ApodItem[];
  // La NASA devuelve orden ascendente; mostramos primero lo más reciente
  return [...data].reverse();
}
