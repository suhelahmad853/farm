"use client";

import { useEffect, useRef, useState } from "react";
import { inr, round2 } from "@/lib/format";

/** Shows weight × rate live by listening to the parent form's inputs. */
export function TotalPreview({ a = "weightKg", b = "ratePerKg", label = "Total amount" }: { a?: string; b?: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const value = (name: string) => Number((form.elements.namedItem(name) as HTMLInputElement | null)?.value) || 0;
    const calc = () => setTotal(round2(value(a) * value(b)));
    const onReset = () => setTimeout(calc);
    form.addEventListener("input", calc);
    form.addEventListener("change", calc);
    form.addEventListener("reset", onReset);
    calc();
    return () => {
      form.removeEventListener("input", calc);
      form.removeEventListener("change", calc);
      form.removeEventListener("reset", onReset);
    };
  }, [a, b]);

  return (
    <div ref={ref} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-600">{label}: </span>
      <span className="font-bold tabular-nums text-slate-900">{inr(total)}</span>
    </div>
  );
}
