import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const s = await getSession();
  redirect(s?.role === "ADMIN" ? "/admin" : s?.role === "VENDOR" ? "/vendor" : "/login");
}
