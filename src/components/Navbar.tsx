"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/galeria", label: "Galería" },
  { href: "/favoritos", label: "Favoritos" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

type LinkListProps = {
  pathname: string | null;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

function LinkList({ pathname, variant, onNavigate }: LinkListProps) {
  return (
    <>
      {links.map(({ href, label }) => {
        const active = isActive(pathname, href);
        const base =
          variant === "desktop"
            ? "rounded-full px-4 py-1.5 text-sm transition-colors"
            : "block rounded-lg px-4 py-3 text-base transition-colors";
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`${base} ${
              active
                ? "bg-white/15 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}

/** Lee la ruta actual; aislado en Suspense porque usePathname puede suspender con Cache Components. */
function ActiveLinkList(props: Omit<LinkListProps, "pathname">) {
  const pathname = usePathname();
  return <LinkList pathname={pathname} {...props} />;
}

function NavLinks(props: Omit<LinkListProps, "pathname">) {
  return (
    <Suspense fallback={<LinkList pathname={null} {...props} />}>
      <ActiveLinkList {...props} />
    </Suspense>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/30 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="font-display text-2xl font-semibold tracking-wide text-white"
          >
            Galería <span className="text-indigo-300">del Espacio</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <NavLinks variant="desktop" />
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 hover:bg-white/10 md:hidden"
          >
            <span
              className={`absolute h-0.5 w-6 rounded bg-current transition-transform duration-300 ${
                open ? "rotate-45" : "-translate-y-2"
              }`}
            />
            <span
              className={`absolute h-0.5 w-6 rounded bg-current transition-opacity duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute h-0.5 w-6 rounded bg-current transition-transform duration-300 ${
                open ? "-rotate-45" : "translate-y-2"
              }`}
            />
          </button>
        </div>

        <div
          id="mobile-menu"
          // Cerrado, el menú solo se colapsa visualmente: `inert` evita que sus
          // enlaces reciban foco con Tab o los anuncie un lector de pantalla
          inert={!open}
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 md:hidden ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0">
            <div className="space-y-1 border-t border-white/10 px-3 py-3">
              <NavLinks variant="mobile" onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
