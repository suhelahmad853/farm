"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { inr } from "@/lib/format";
import { inputCls } from "./ui";

export type PickerCustomer = { id: number; name: string; mobile: string | null; pending: number };

type Props = {
  customers: PickerCustomer[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/** Search customers by name or mobile and pick one. Empty selection = walk-in. */
export function CustomerPicker({ customers, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = customers.find((c) => String(c.id) === selectedId);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? customers.filter((c) => c.name.toLowerCase().includes(q) || (c.mobile ?? "").includes(q))
      : customers;
    return list.slice(0, 50);
  }, [customers, query]);

  function choose(id: string) {
    onSelect(id);
    setQuery("");
    setOpen(false);
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-2">
        <input type="hidden" name="customerId" value={selected.id} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{selected.name}</div>
          <div className="truncate text-xs text-slate-600">
            {selected.mobile ?? "No mobile"} · Pending {inr(selected.pending)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            choose("");
            setTimeout(() => inputRef.current?.focus());
          }}
          className="shrink-0 text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input type="hidden" name="customerId" value="" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="customer-picker-list"
        aria-label="Search customer"
        autoComplete="off"
        value={query}
        placeholder={customers.length ? "Search by name or mobile…" : "No saved customers yet"}
        className={inputCls}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            // Don't submit the sale form while picking a customer.
            e.preventDefault();
            if (open && matches[active]) choose(String(matches[active].id));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul
          id="customer-picker-list"
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          // Keep focus in the input so the click registers before blur closes the list.
          onMouseDown={(e) => e.preventDefault()}
        >
          {matches.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(String(c.id))}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${i === active ? "bg-emerald-50" : ""}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-900">{c.name}</span>
                <span className="block text-xs text-slate-500">{c.mobile ?? "No mobile"}</span>
              </span>
              {c.pending > 0 && <span className="shrink-0 text-xs font-medium text-amber-700">{inr(c.pending)} due</span>}
            </li>
          ))}
          {matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">
              {query ? `No customer matches “${query}”.` : "No saved customers yet."}
            </li>
          )}
          <li className="border-t border-slate-100 px-3 py-2">
            <Link href="/vendor/customers" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
              + Add new customer
            </Link>
          </li>
        </ul>
      )}
      <p className="mt-1 text-xs text-slate-500">Leave empty for a walk-in sale.</p>
    </div>
  );
}
