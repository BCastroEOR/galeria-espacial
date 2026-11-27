import type { Metadata } from "next";

// La página es un Client Component y no puede exportar `metadata`,
// así que el título de la pestaña se define en este layout (Server Component).
export const metadata: Metadata = {
  title: "Favoritos",
  description: "Tus fotos astronómicas favoritas, guardadas en este navegador.",
};

export default function FavoritosLayout({ children }: LayoutProps<"/favoritos">) {
  return children;
}
