"use client";

import Link, { useLinkStatus } from "next/link";
import { Spinner } from "./PageLoading";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {links.map((l) => {
        const active = l.href === path || (l.href.split("/").length > 2 && path.startsWith(l.href + "/"));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
              active ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {l.label}
            <PendingDot />
          </Link>
        );
      })}
    </nav>
  );
}

/** Small spinner inside the link that was just clicked, until the new page is ready. */
function PendingDot() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="h-3 w-3" /> : null;
}
