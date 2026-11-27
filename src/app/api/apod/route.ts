import type { NextRequest } from "next/server";
import { ApodError, parseApodQuery, queryApod } from "@/lib/apod";

/**
 * GET /api/apod
 * Proxy hacia la API APOD de la NASA. La API key nunca sale del servidor.
 *
 * Query params: date | start_date [+ end_date] | count  (thumbs=true siempre)
 */
export async function GET(request: NextRequest) {
  // Se lee fuera del try: al acceder a searchParams, Next.js interrumpe el
  // prerender con una señal interna que no debe ser atrapada como error.
  const searchParams = request.nextUrl.searchParams;

  try {
    const query = parseApodQuery(searchParams);
    const data = await queryApod(query);
    return Response.json(data);
  } catch (err) {
    if (err instanceof ApodError) {
      return Response.json(
        { error: err.message, status: err.status },
        { status: err.status },
      );
    }
    console.error("[api/apod] Error inesperado:", err);
    return Response.json(
      { error: "Error interno del servidor", status: 500 },
      { status: 500 },
    );
  }
}
