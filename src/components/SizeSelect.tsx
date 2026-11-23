import { SIZE_LABEL, SIZES } from "@/lib/format";
import { inputCls } from "./ui";

export function SizeSelect({ name = "size", required = true, defaultValue, allowEmpty }: { name?: string; required?: boolean; defaultValue?: string | null; allowEmpty?: boolean }) {
  return (
    <select name={name} required={required} defaultValue={defaultValue ?? ""} className={inputCls}>
      <option value="" disabled={!allowEmpty}>{allowEmpty ? "— None —" : "Select size"}</option>
      {SIZES.map((s) => (
        <option key={s} value={s}>{SIZE_LABEL[s]}</option>
      ))}
    </select>
  );
}
