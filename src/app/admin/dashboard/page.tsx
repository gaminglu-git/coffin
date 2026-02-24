import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getDashboardOverviewData } from "@/app/actions/dashboard";

export default async function AdminDashboardPage() {
  const initialDashboardData = await getDashboardOverviewData();
  return <AdminDashboardClient initialDashboardData={initialDashboardData} />;
}
