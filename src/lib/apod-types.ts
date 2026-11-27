/** Un elemento de la Astronomy Picture of the Day (APOD) de la NASA. */
export type ApodItem = {
  date: string; // YYYY-MM-DD
  title: string;
  explanation: string;
  url: string;
  hdurl?: string; // solo en imágenes
  media_type: "image" | "video" | "other";
  thumbnail_url?: string; // solo en videos (requiere thumbs=true)
  copyright?: string; // ausente si la imagen es de dominio público
};

/** Parámetros aceptados por la API APOD. */
export type ApodQuery = {
  date?: string;
  start_date?: string;
  end_date?: string;
  count?: number;
};
