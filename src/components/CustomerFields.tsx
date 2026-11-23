import { SizeSelect } from "./SizeSelect";
import { Field, inputCls } from "./ui";

type Values = { name: string; mobile: string | null; address: string | null; defaultSize: string | null; defaultRate: number | null };

export function CustomerFields({ c }: { c?: Values }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Field label="Customer name"><input name="name" required maxLength={100} defaultValue={c?.name} className={inputCls} /></Field>
      </div>
      <Field label="Mobile (optional)">
        <input name="mobile" inputMode="numeric" pattern="\d{10}" maxLength={10} defaultValue={c?.mobile ?? ""} className={inputCls} />
      </Field>
      <Field label="Address (optional)"><input name="address" maxLength={255} defaultValue={c?.address ?? ""} className={inputCls} /></Field>
      <Field label="Default size"><SizeSelect name="defaultSize" required={false} allowEmpty defaultValue={c?.defaultSize} /></Field>
      <Field label="Fixed rate (₹/kg)">
        <input type="number" name="defaultRate" min={0.01} step={0.01} defaultValue={c?.defaultRate ?? ""} className={inputCls} />
      </Field>
    </div>
  );
}
