"use client";

import { useActionState, useEffect, useRef, startTransition, type ReactNode } from "react";
import type { FormState } from "@/lib/types";
import { btnPrimary } from "./ui";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  submitLabel: string;
  resetOnSuccess?: boolean;
  className?: string;
};

/** Form wired to a server action; shows error/success and keeps inputs on error. */
export function ActionForm({ action, children, submitLabel, resetOnSuccess = true, className = "space-y-4" }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {children}
      {state.error && <p data-msg="error" role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p data-msg="success" role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
      <button type="submit" className={`${btnPrimary} w-full sm:w-auto`} disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
