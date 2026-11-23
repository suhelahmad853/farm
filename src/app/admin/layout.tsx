import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AppShell
      title="Super Admin"
      subtitle={`${admin.name} · ${admin.mobile}`}
      links={[
        { href: "/admin", label: "Stores" },
        { href: "/admin/stores/new", label: "Add Store" },
        { href: "/admin/password", label: "Change Password" },
      ]}
    >
      {children}
    </AppShell>
  );
}
