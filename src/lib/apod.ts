import "server-only";
import { cacheLife } from "next/cache";
import type { ApodItem, ApodQuery } from "./apod-types";

// Los tipos viven en apod-types.ts para poder importarlos también
// desde Client Components (este archivo es solo de servidor).
export type { ApodItem, ApodQuery } from "./apod-types";

/*
 * Fuente de datos: feed oficial de la APOD en science.nasa.gov (WordPress).
 * La API clásica (api.nasa.gov/planetary/apod) se reconectó a este feed tras
 * la migración del sitio APOD y devuelve contenido genérico; su repositorio
 * se archiva el 1 de diciembre de 2026. Este feed no requiere API key.
 *
 *   GET /apod-basic?per_page=N                     → las N más recientes (máx. 25)
 *   GET /apod-basic?date_from=YYMMDD&date_to=YYMMDD → rango (paginado con &page=)
 *   GET /apod-basic/YYMMDD                         → una fecha (404 si no existe)
 */
const APOD_ENDPOINT = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";
const PER_PAGE_MAX = 25; // el feed ignora valores mayores
const FIRST_APOD_DATE = "1995-06-16"; // primera APOD publicada
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_COUNT = 25;
const MAX_RANGE_DAYS = 100;

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
// Fechas
// ---------------------------------------------------------------------------

function isValidDate(value: string) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

/** true si la fecha tiene formato válido y no es anterior a la primera APOD. */
export function isValidApodDate(value: string) {
  return isValidDate(value) && value >= FIRST_APOD_DATE;
}

/** "2024-07-04" → "240704" (formato que usa el feed; 95–99 = años 1990). */
function toFeedDate(date: string) {
  return date.slice(2).replaceAll("-", "");
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  return (Date.parse(end) - Date.parse(start)) / 86_400_000;
}

/** Hoy (YYYY-MM-DD) en la zona horaria de la NASA (hora del Este de EE. UU.). */
function todayInNasaTimezone() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
}

// ---------------------------------------------------------------------------
// Validación de parámetros (misma interfaz que la API clásica)
// ---------------------------------------------------------------------------

/**
 * Valida y normaliza los query params de /api/apod.
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
  if (
    start_date &&
    end_date &&
    daysBetween(start_date, end_date) >= MAX_RANGE_DAYS
  ) {
    throw new ApodError(`El rango no puede superar ${MAX_RANGE_DAYS} días`, 400);
  }

  return { date, start_date, end_date, count };
}

// ---------------------------------------------------------------------------
// Normalización: del formato del feed a ApodItem
// ---------------------------------------------------------------------------

type FeedItem = {
  date: string;
  title: string;
  media_type: string;
  explanation?: string;
  copyright?: string;
  credit?: string;
  url: string; // permalink del artículo, no la imagen
  hdurl?: string; // imagen (o fotograma de portada en videos)
  basic_html?: string;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1].toLowerCase() === "x"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isNaN(n) ? match : String.fromCodePoint(n);
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Convierte el HTML del feed a texto plano conservando los saltos de párrafo. */
function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    // Los enlaces del HTML dejan espacios antes de la puntuación: "M20 ," → "M20,"
    .replace(/ +([.,;:!?)])/g, "$1")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanExplanation(html: string) {
  return htmlToText(html)
    .replace(/^Explanation:\s*/i, "")
    .replace(/\s*Tomorrow's picture:[\s\S]*$/i, "")
    .trim();
}

function cleanCredit(html: string) {
  return htmlToText(html)
    .replace(
      /^(Images?|Videos?|Illustrations?|Animations?)?\s*Credits?\s*(&|and)?\s*(Copyright)?\s*:\s*/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** URL del video dentro de basic_html: <iframe src> (YouTube/Vimeo) o <source src> (mp4). */
function extractVideoUrl(html = "") {
  const match =
    html.match(/<iframe[^>]+src="([^"]+)"/i) ??
    html.match(/<source[^>]+src="([^"]+)"/i) ??
    html.match(/<video[^>]+src="([^"]+)"/i);
  if (!match) return undefined;
  const src = decodeEntities(match[1]);
  return src.startsWith("//") ? `https:${src}` : src;
}

/** Miniatura oficial de YouTube a partir de la URL de embed. */
function youtubeThumbnail(url?: string) {
  const id = url?.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
}

/** Algunas entradas traen como portada una imagen genérica de la NASA. */
function isGenericImage(url?: string) {
  return !url || url.includes("/misc/news-thumbnail");
}

/**
 * A veces hdurl apunta a una miniatura de 48×48 del gestor de contenidos:
 *   .../content/dam/<ruta>.jpg/jcr:content/renditions/cq5dam.thumbnail.48.48.png
 * Se convierte a la imagen completa del CDN:
 *   .../dynamicimage/assets/<ruta>.jpg
 */
function fixImageUrl(url?: string) {
  const match = url?.match(
    /^https:\/\/assets\.science\.nasa\.gov\/content\/dam\/(.+?)\/jcr:content\/renditions\//,
  );
  return match
    ? `https://assets.science.nasa.gov/dynamicimage/assets/${match[1]}`
    : url;
}

function normalize(input: FeedItem): ApodItem {
  const raw = { ...input, hdurl: fixImageUrl(input.hdurl) };
  const isVideo = raw.media_type === "video" || raw.media_type === "iframe";
  const videoUrl = isVideo ? extractVideoUrl(raw.basic_html) : undefined;
  const credit = raw.copyright || raw.credit;

  const item: ApodItem = {
    date: raw.date,
    title: decodeEntities(raw.title).trim(),
    explanation: cleanExplanation(raw.explanation ?? ""),
    // Imagen → hdurl. Video → su URL real; si no se encuentra, el artículo.
    url: isVideo ? (videoUrl ?? raw.url) : (raw.hdurl ?? raw.url),
    media_type: isVideo
      ? "video"
      : raw.media_type === "image"
        ? "image"
        : "other",
  };
  if (!isVideo && raw.hdurl) item.hdurl = raw.hdurl;
  if (isVideo) {
    const thumbnail =
      youtubeThumbnail(videoUrl) ??
      (isGenericImage(raw.hdurl) ? undefined : raw.hdurl);
    if (thumbnail) item.thumbnail_url = thumbnail;
  }
  if (credit) item.copyright = cleanCredit(credit);
  return item;
}

// ---------------------------------------------------------------------------
// Llamadas al feed (sin caché)
// ---------------------------------------------------------------------------

function mapUpstreamStatus(status: number): number {
  if (status === 400) return 400; // parámetros inválidos
  if (status === 404) return 404; // no hay APOD para esa fecha
  if (status === 429) return 429; // límite de peticiones alcanzado
  return 502; // la NASA falló → somos un gateway que recibió una mala respuesta
}

const UPSTREAM_MESSAGES: Record<number, string> = {
  400: "Parámetros no válidos para el servicio de la NASA",
  404: "No hay foto astronómica para esa fecha",
  429: "Se alcanzó el límite de peticiones a la NASA; intenta más tarde",
};

type FeedResponse = { body: FeedItem | FeedItem[]; totalPages: number };

async function fetchFeed(path: string): Promise<ApodResult<FeedResponse>> {
  let res: Response;
  try {
    res = await fetch(`${APOD_ENDPOINT}${path}`, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      message: timedOut
        ? "El servicio de la NASA tardó demasiado en responder"
        : "No se pudo conectar con el servicio de la NASA",
    };
  }

  if (!res.ok) {
    const status = mapUpstreamStatus(res.status);
    return {
      ok: false,
      status,
      message:
        UPSTREAM_MESSAGES[status] ??
        `El servicio de la NASA respondió con error (${res.status})`,
    };
  }

  return {
    ok: true,
    data: {
      body: await res.json(),
      totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1),
    },
  };
}

const asList = (body: FeedItem | FeedItem[]) => [body].flat();

async function requestByDate(date: string): Promise<ApodResult<ApodItem>> {
  const r = await fetchFeed(`/${toFeedDate(date)}`);
  if (!r.ok) return r;
  const [raw] = asList(r.data.body);
  if (!raw) return { ok: false, status: 404, message: UPSTREAM_MESSAGES[404] };
  return { ok: true, data: normalize(raw) };
}

/** Rango de fechas, recorriendo todas las páginas del feed. Más reciente primero. */
async function requestRange(
  start: string,
  end: string,
): Promise<ApodResult<ApodItem[]>> {
  const items: ApodItem[] = [];
  for (let page = 1; ; page++) {
    const r = await fetchFeed(
      `?date_from=${toFeedDate(start)}&date_to=${toFeedDate(end)}&per_page=${PER_PAGE_MAX}&page=${page}`,
    );
    if (!r.ok) return r;
    items.push(...asList(r.data.body).map(normalize));
    if (page >= r.data.totalPages) break;
  }
  return { ok: true, data: items };
}

/** Las `n` más recientes (n ≤ 25). */
async function requestLatest(n: number): Promise<ApodResult<ApodItem[]>> {
  const r = await fetchFeed(`?per_page=${Math.min(n, PER_PAGE_MAX)}`);
  if (!r.ok) return r;
  return { ok: true, data: asList(r.data.body).map(normalize) };
}

/** `count` fotos de fechas aleatorias (el feed no tiene un modo aleatorio). */
async function requestRandom(count: number): Promise<ApodResult<ApodItem[]>> {
  const span = daysBetween(FIRST_APOD_DATE, todayInNasaTimezone());
  const dates = new Set<string>();
  while (dates.size < count) {
    dates.add(addDays(FIRST_APOD_DATE, Math.floor(Math.random() * span)));
  }
  const results = await Promise.all([...dates].map(requestByDate));
  const items = results.flatMap((r) => (r.ok ? [r.data] : []));
  if (items.length > 0) return { ok: true, data: items };
  const firstError = results.find((r) => !r.ok);
  return firstError && !firstError.ok
    ? firstError
    : { ok: false, status: 502, message: "No se pudieron obtener fotos" };
}

// ---------------------------------------------------------------------------
// Caché: 1 hora en éxito, unos segundos en error
// ---------------------------------------------------------------------------

/**
 * Los resultados exitosos se guardan 1 hora (perfil 'hours': revalidate = 3600 s).
 * Los errores solo unos segundos, para no "congelar" un fallo temporal.
 * Se devuelve un resultado en lugar de lanzar porque la salida de un
 * 'use cache' debe ser serializable.
 */
function applyCacheLife(result: ApodResult<unknown>) {
  if (result.ok) {
    cacheLife("hours");
  } else {
    cacheLife("seconds");
  }
}

async function byDateCached(date: string) {
  "use cache";
  const result = await requestByDate(date);
  applyCacheLife(result);
  return result;
}

async function rangeCached(start: string, end: string) {
  "use cache";
  const result = await requestRange(start, end);
  applyCacheLife(result);
  return result;
}

async function latestCached(n: number) {
  "use cache";
  const result = await requestLatest(n);
  applyCacheLife(result);
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
 * Consulta genérica usada por el Route Handler (/api/apod).
 * Las consultas con 'count' son aleatorias, así que no se cachean.
 */
export async function queryApod(
  query: ApodQuery,
): Promise<ApodItem | ApodItem[]> {
  if (query.count !== undefined) return unwrap(await requestRandom(query.count));
  if (query.date) return unwrap(await byDateCached(query.date));
  if (query.start_date) {
    // Sin end_date: hasta MAX_RANGE_DAYS días después (el feed corta en hoy)
    const end =
      query.end_date ?? addDays(query.start_date, MAX_RANGE_DAYS - 1);
    // Igual que la API clásica: orden ascendente
    return [...unwrap(await rangeCached(query.start_date, end))].reverse();
  }
  return getLatestApod();
}

/** Foto de una fecha concreta (o la más reciente). Para Server Components. */
export async function getApod(date?: string): Promise<ApodItem> {
  if (!date) return getLatestApod();
  return unwrap(await byDateCached(date));
}

/** La foto del día más reciente publicada. Para Server Components. */
export async function getLatestApod(): Promise<ApodItem> {
  const [latest] = unwrap(await latestCached(1));
  if (!latest) throw new ApodError("No hay fotos disponibles", 502);
  return latest;
}

/** Las fotos de los últimos `days` días publicados (máx. 25), la más reciente primero. */
export async function getRecentApods(days = 24): Promise<ApodItem[]> {
  return unwrap(await latestCached(days));
}

/** Fotos entre dos fechas (ambas incluidas), la más reciente primero. */
export async function getApodRange(
  startDate: string,
  endDate: string,
): Promise<ApodItem[]> {
  return unwrap(await rangeCached(startDate, endDate));
}
