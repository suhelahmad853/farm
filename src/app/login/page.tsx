import { ActionForm } from "@/components/ActionForm";
import { Field, inputCls } from "@/components/ui";
import { loginAction } from "./actions";

export const metadata = { title: "Login · Poultry Farm Manager" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-2xl">🐔</div>
          <h1 className="text-2xl font-bold text-slate-900">Poultry Farm Manager</h1>
          <p className="mt-1 text-sm text-slate-500">Login with your mobile number</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {reason === "inactive" && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your store is deactivated. Please contact the admin.
            </p>
          )}
          <ActionForm action={loginAction} submitLabel="Login" resetOnSuccess={false}>
            <Field label="Mobile number">
              <input name="mobile" inputMode="numeric" pattern="\d{10}" maxLength={10} required className={inputCls} autoComplete="username" placeholder="10-digit mobile number" />
            </Field>
            <Field label="Password">
              <input name="password" type="password" required className={inputCls} autoComplete="current-password" />
            </Field>
          </ActionForm>
        </div>
      </div>
    </main>
  );
}
