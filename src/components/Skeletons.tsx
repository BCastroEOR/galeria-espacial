/*
 * Skeletons compartidos: los usan los loading.tsx (al navegar) y los
 * <Suspense> de las páginas (mientras llegan los datos), para que ambos
 * estados de carga se vean idénticos y no haya "saltos".
 * La clase .skeleton (globals.css) agrega el brillo animado.
 */

function Bone({ className }: { className: string }) {
  return <div className={`skeleton rounded ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-2 p-4">
        <Bone className="h-3 w-32" />
        <Bone className="h-5 w-full" />
        <Bone className="h-5 w-2/3" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul
      role="status"
      aria-label="Cargando fotos"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <CardSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** Encabezado de la galería (título + herramientas) mientras carga la ruta. */
export function GalleryHeaderSkeleton() {
  return (
    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <Bone className="h-3 w-32" />
        <Bone className="h-11 w-48" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Bone className="h-11 w-full rounded-full sm:w-64" />
        <Bone className="h-11 w-full rounded-full sm:w-40" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Cargando foto">
      <Bone className="h-3 w-40" />
      <Bone className="mt-4 h-10 w-3/4 sm:w-2/3" />
      <Bone className="mt-3 h-4 w-1/2" />
      <div className="skeleton mt-6 aspect-video rounded-2xl" />
      <div className="mt-8 space-y-3">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-11/12" />
        <Bone className="h-4 w-2/3" />
      </div>
    </div>
  );
}
