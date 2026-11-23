import { AppShell } from "@/components/AppShell";
import { requireVendor } from "@/lib/session";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const store = await requireVendor();
  return (
    <AppShell
      title={store.storeName}
      subtitle={`${store.ownerName} · ${store.mobile}`}
      links={[
        { href: "/vendor", label: "Dashboard" },
        { href: "/vendor/purchases", label: "Purchase" },
        { href: "/vendor/expenses", label: "Expense" },
        { href: "/vendor/sales", label: "Sell" },
        { href: "/vendor/customers", label: "Customers" },
        { href: "/vendor/password", label: "Password" },
      ]}
    >
      {children}
    </AppShell>
  );
}
