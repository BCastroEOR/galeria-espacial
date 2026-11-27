import { GalleryHeaderSkeleton, GridSkeleton } from "@/components/Skeletons";

/** Se muestra al instante al navegar a /galeria, mientras llega la página. */
export default function GaleriaLoading() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <GalleryHeaderSkeleton />
      <GridSkeleton count={9} />
    </section>
  );
}
