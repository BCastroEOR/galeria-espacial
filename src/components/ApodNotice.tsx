type Props = {
  title: string;
  children: React.ReactNode;
  tone?: "info" | "error";
};

/** Aviso en estilo glass para errores de la API o contenido no disponible. */
export default function ApodNotice({ title, children, tone = "info" }: Props) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-2xl border p-5 backdrop-blur-md ${
        tone === "error"
          ? "border-rose-400/30 bg-rose-500/10"
          : "border-amber-300/30 bg-amber-400/10"
      }`}
    >
      <p
        className={`font-medium ${tone === "error" ? "text-rose-200" : "text-amber-100"}`}
      >
        {title}
      </p>
      <div className="mt-1 text-sm text-slate-300">{children}</div>
    </div>
  );
}
