import type { ReactNode } from "react";
import { NavLinks } from "./NavLinks";
import { logoutAction } from "@/app/login/actions";

export function AppShell({
  title,
  subtitle,
  links,
  children,
}: {
  title: string;
  subtitle: string;
  links: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 print:min-h-0 print:bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-slate-900">{title}</div>
              <div className="truncate text-xs text-slate-500">{subtitle}</div>
            </div>
            <form action={logoutAction}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                Logout
              </button>
            </form>
          </div>
          <div className="pb-2">
            <NavLinks links={links} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:p-0">
        {/* Only on paper: who the report belongs to. */}
        <div className="mb-3 hidden border-b border-slate-300 pb-2 print:block">
          <div className="text-lg font-bold">{title}</div>
          <div className="text-xs text-slate-600">
            {subtitle} · Printed {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
