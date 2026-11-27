"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const FIRST_APOD_DATE = "1995-06-16";

/** Fecha local de hoy en formato YYYY-MM-DD. */
function todayLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isOutOfRange(date: string) {
  return date !== "" && (date < FIRST_APOD_DATE || date > todayLocal());
}

/** Filtro por fecha: elige un día y navega a su detalle en /galeria/[fecha]. */
export default function DateFilter() {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState("");
  const [outOfRange, setOutOfRange] = useState(false);

  // La fecha máxima depende del reloj del navegador. Se aplica directamente al
  // <input> después de hidratar, para que el HTML del servidor y el del cliente coincidan.
  useEffect(() => {
    if (inputRef.current) inputRef.current.max = todayLocal();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setOutOfRange(isOutOfRange(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || outOfRange) return;
    router.push(`/galeria/${date}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs uppercase tracking-widest text-slate-400">
        Buscar por fecha
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="date"
          value={date}
          min={FIRST_APOD_DATE}
          onChange={handleChange}
          aria-invalid={outOfRange}
          aria-describedby={outOfRange ? `${inputId}-error` : undefined}
          className="h-11 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white backdrop-blur-md [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
        />
        <button
          type="submit"
          disabled={!date || outOfRange}
          className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ver
        </button>
      </div>
      {outOfRange && (
        <p id={`${inputId}-error`} className="text-xs text-rose-300">
          Elige una fecha entre el 16/06/1995 y hoy.
        </p>
      )}
    </form>
  );
}
