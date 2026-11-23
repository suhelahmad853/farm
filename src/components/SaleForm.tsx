"use client";

import { useEffect, useRef, useState } from "react";
import type { FormState } from "@/lib/types";
import { MODE_LABEL, PAYMENT_MODES, round2, SIZE_LABEL, SIZES, type SizeKey } from "@/lib/format";
import { ActionForm } from "./ActionForm";
import { CustomerPicker } from "./CustomerPicker";
import { TotalPreview } from "./TotalPreview";
import { Field, inputCls } from "./ui";

type CustomerOption = { id: number; name: string; mobile: string | null; defaultSize: SizeKey | null; defaultRate: number | null; pending: number };

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  customers: CustomerOption[];
  stock: { size: SizeKey; pieces: number }[];
  today: string;
};

export function SaleForm({ action, customers, stock, today }: Props) {
  return (
    <ActionForm action={action} submitLabel="Save sale">
      <SaleFields customers={customers} stock={stock} today={today} />
    </ActionForm>
  );
}

function SaleFields({ customers, stock, today }: Omit<Props, "action">) {
  const ref = useRef<HTMLDivElement>(null);
  const [customerId, setCustomerId] = useState("");
  const selected = customers.find((c) => String(c.id) === customerId);

  const form = () => ref.current?.closest("form");
  const setField = (name: string, value: string) => {
    const el = form()?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
    if (el) el.value = value;
  };

  useEffect(() => {
    const f = form();
    if (!f) return;
    const onReset = () => setCustomerId("");
    f.addEventListener("reset", onReset);
    return () => f.removeEventListener("reset", onReset);
  }, []);

  function onCustomerChange(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => String(x.id) === id);
    if (c?.defaultSize) setField("size", c.defaultSize);
    if (c?.defaultRate) setField("ratePerKg", String(c.defaultRate));
    form()?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function fillFullPaid() {
    const f = form();
    if (!f) return;
    const v = (n: string) => Number((f.elements.namedItem(n) as HTMLInputElement).value) || 0;
    setField("paidAmount", String(round2(v("weightKg") * v("ratePerKg"))));
  }

  return (
    <div ref={ref} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" name="date" required defaultValue={today} className={inputCls} /></Field>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Customer</span>
        <CustomerPicker customers={customers} selectedId={customerId} onSelect={onCustomerChange} />
      </div>

      {!selected && (
        <Field label="Walk-in customer name (optional)">
          <input name="customerName" maxLength={100} placeholder="Walk-in customer" className={inputCls} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Size">
          <select name="size" required defaultValue="" className={inputCls}>
            <option value="" disabled>Select size</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {SIZE_LABEL[s]} ({stock.find((x) => x.size === s)?.pieces ?? 0} pcs)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pieces"><input type="number" name="pieces" min={1} step={1} required className={inputCls} /></Field>
        <Field label="Weight (kg)"><input type="number" name="weightKg" min={0.001} step={0.001} required className={inputCls} /></Field>
        <Field label="Rate (₹ per kg)"><input type="number" name="ratePerKg" min={0.01} step={0.01} required className={inputCls} /></Field>
      </div>

      <TotalPreview />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Paid now (₹)">
          <input type="number" name="paidAmount" min={0} step={0.01} required className={inputCls} />
        </Field>
        <Field label="Payment mode">
          <select name="paymentMode" required defaultValue="CASH" className={inputCls}>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
          </select>
        </Field>
      </div>
      <button type="button" onClick={fillFullPaid} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
        Mark as fully paid
      </button>
      {!selected && <p className="text-xs text-slate-500">Walk-in sales must be fully paid. Select a saved customer to keep a pending amount.</p>}

      <Field label="Note (optional)"><input name="note" maxLength={255} className={inputCls} /></Field>
    </div>
  );
}
