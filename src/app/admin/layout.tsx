import { requireRole } from "@/lib/auth";
import { AppNavbar } from "@/components/layout/navbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);
  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar profile={profile} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
