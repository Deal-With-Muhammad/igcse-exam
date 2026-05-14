import { requireSignedIn } from "@/lib/auth";
import { AppNavbar } from "@/components/layout/navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireSignedIn();
  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar profile={profile} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
