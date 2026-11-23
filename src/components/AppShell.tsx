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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
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
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
