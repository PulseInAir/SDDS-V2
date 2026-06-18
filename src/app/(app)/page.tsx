import { OperationalDashboard } from "@/components/dashboard/OperationalDashboard";
import { getOperationalDashboardData } from "@/lib/actions/dashboard";

export const metadata = {
  title: "Single Digit Data Solutions Dashboard",
};

export default async function HomePage() {
  const data = await getOperationalDashboardData();

  return <OperationalDashboard data={data} />;
}
