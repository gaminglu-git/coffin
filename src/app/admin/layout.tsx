// Admin-Seiten nicht zur Build-Zeit prerendern (Supabase wird erst zur Laufzeit benötigt)
export const dynamic = "force-dynamic";

import { AdminShellLayout } from "@/components/admin/AdminShellLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShellLayout>{children}</AdminShellLayout>;
}
