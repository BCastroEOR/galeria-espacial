import { DetailSkeleton } from "@/components/Skeletons";

/** Se muestra al instante al abrir el detalle de una foto, mientras llega la página. */
export default function DetalleLoading() {
  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="skeleton mb-8 h-4 w-36 rounded" />
      <DetailSkeleton />
    </article>
  );
}
