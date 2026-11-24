/** Shown instantly while a page's data loads (used by loading.tsx). */
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function PageLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading">
      <div className="mb-5 flex items-center gap-3 text-emerald-700">
        <Spinner className="h-6 w-6" />
        <span className="text-sm font-medium">Loading…</span>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-200/70" />)}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 h-4 w-40 rounded bg-slate-200" />
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="mb-3 h-8 rounded bg-slate-100" />)}
        </div>
      </div>
    </div>
  );
}
