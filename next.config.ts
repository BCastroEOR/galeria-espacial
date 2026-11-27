import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Solo se permiten imágenes de la APOD de la NASA (http y https).
    // science.nasa.gov: la APOD migró ahí y la API ya devuelve URLs de ese host.
    remotePatterns: [
      { protocol: "https", hostname: "apod.nasa.gov", pathname: "/apod/**" },
      { protocol: "http", hostname: "apod.nasa.gov", pathname: "/apod/**" },
      {
        protocol: "https",
        hostname: "science.nasa.gov",
        pathname: "/wp-content/**",
      },
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
