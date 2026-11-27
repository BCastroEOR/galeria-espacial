import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Solo se permiten imágenes de la APOD de la NASA.
    remotePatterns: [
      // Dominio histórico de la APOD
      { protocol: "https", hostname: "apod.nasa.gov", pathname: "/apod/**" },
      { protocol: "http", hostname: "apod.nasa.gov", pathname: "/apod/**" },
      // Tras la migración a science.nasa.gov, las imágenes (y las portadas de
      // los videos) se sirven desde este CDN, con parámetros ?w=&h=&fit=
      {
        protocol: "https",
        hostname: "assets.science.nasa.gov",
        pathname: "/dynamicimage/**",
      },
      {
        protocol: "https",
        hostname: "assets.science.nasa.gov",
        pathname: "/content/dam/**",
      },
      // Miniaturas de los videos de YouTube
      { protocol: "https", hostname: "img.youtube.com", pathname: "/vi/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
