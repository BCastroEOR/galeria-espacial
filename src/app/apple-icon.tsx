import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/*
 * Ícono para iOS ("Agregar a pantalla de inicio"). iOS no acepta SVG, así que
 * se genera un PNG de 180×180 a partir del mismo icon.svg: el diseño vive en
 * un solo archivo.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Se lee una sola vez a nivel de módulo (no depende de la petición), así el
// ícono se genera en el build como archivo estático.
const svg = await readFile(join(process.cwd(), "src/app/icon.svg"), "utf8");
const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      // iOS ya redondea las esquinas del ícono; el SVG se dibuja a tamaño completo
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} width={size.width} height={size.height} alt="" />
    ),
    { ...size },
  );
}
