"use client";

import { btnSecondary } from "./ui";

/** Opens the browser print dialog. Print styles show only the report table. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={btnSecondary}>
      Print
    </button>
  );
}
