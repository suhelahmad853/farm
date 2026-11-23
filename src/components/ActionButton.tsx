"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/types";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  label: string;
  confirmText?: string;
  variant?: "danger" | "default";
};

/** Small button that runs a server action (delete, toggle…) with optional confirm. */
export function ActionButton({ action, label, confirmText, variant = "danger" }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const cls =
    variant === "danger"
      ? "text-red-600 hover:text-red-800"
      : "text-emerald-700 hover:text-emerald-900";
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmText && !confirm(confirmText)) e.preventDefault();
      }}
      className="inline"
    >
      <button type="submit" disabled={pending} className={`text-sm font-medium ${cls} disabled:opacity-50`}>
        {pending ? "…" : label}
      </button>
      {state.error && <span className="ml-2 block max-w-56 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
