import { Field, inputCls } from "./ui";

type StoreValues = { storeName: string; ownerName: string; mobile: string; address: string | null };

export function StoreFields({ store, isEdit }: { store?: StoreValues; isEdit?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Store / farm name">
        <input name="storeName" required maxLength={100} defaultValue={store?.storeName} className={inputCls} />
      </Field>
      <Field label="Owner name">
        <input name="ownerName" required maxLength={100} defaultValue={store?.ownerName} className={inputCls} />
      </Field>
      <Field label="Mobile number (login ID)">
        <input name="mobile" required inputMode="numeric" pattern="\d{10}" maxLength={10} defaultValue={store?.mobile} className={inputCls} />
      </Field>
      <Field label={isEdit ? "New password" : "Password"} hint={isEdit ? "Leave empty to keep the current password" : "Minimum 6 characters"}>
        <input name="password" type="text" required={!isEdit} minLength={6} className={inputCls} autoComplete="off" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Address (optional)">
          <input name="address" maxLength={255} defaultValue={store?.address ?? ""} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}
