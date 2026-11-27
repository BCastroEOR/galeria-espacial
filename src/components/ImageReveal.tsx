"use client";

import Image, { type ImageProps } from "next/image";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

/** Avisa al RevealProvider que la imagen ya está lista. */
const RevealContext = createContext<() => void>(() => {});

/** Tiempo máximo de espera: si la imagen tarda más, se muestra el contenido igual. */
const MAX_WAIT_MS = 10_000;

type ProviderProps = {
  children: React.ReactNode;
  /** Lo que se ve mientras la imagen carga. */
  skeleton: React.ReactNode;
  /** false → no hay imagen que esperar (video, iframe…) y se muestra directo. */
  waitForImage: boolean;
};

/**
 * Mantiene el skeleton visible hasta que la imagen principal termina de
 * cargar, y entonces muestra todo el contenido a la vez (texto + imagen),
 * en lugar de mostrar primero el texto y que la imagen lo empuje después.
 *
 * El contenido se renderiza oculto (opacity-0, fuera del flujo) debajo del
 * skeleton para que la imagen empiece a descargarse de inmediato.
 */
export function RevealProvider({ children, skeleton, waitForImage }: ProviderProps) {
  const [ready, setReady] = useState(!waitForImage);
  const markReady = useCallback(() => setReady(true), []);

  // Red de seguridad: nunca dejar el skeleton para siempre
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(markReady, MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, [ready, markReady]);

  return (
    <div className="relative">
      {!ready && skeleton}
      <div
        className={
          ready
            ? "animate-fade-up"
            : "pointer-events-none absolute inset-x-0 top-0 opacity-0"
        }
        // Mientras está oculto, que no se pueda enfocar ni lo lea un lector de pantalla
        inert={!ready}
        aria-hidden={!ready}
      >
        <RevealContext value={markReady}>{children}</RevealContext>
      </div>
    </div>
  );
}

/**
 * next/image que avisa al RevealProvider cuando termina de cargar
 * (o si falla, para no bloquear la página).
 */
export function RevealImage({ alt, ...props }: ImageProps) {
  const markReady = useContext(RevealContext);

  return (
    <Image
      {...props}
      alt={alt}
      onLoad={markReady}
      onError={markReady}
      // Si la imagen ya estaba en caché, puede terminar de cargar antes de que
      // React conecte onLoad: se revisa `complete` al montar el elemento.
      ref={(img) => {
        if (img?.complete && img.naturalWidth > 0) markReady();
      }}
    />
  );
}
