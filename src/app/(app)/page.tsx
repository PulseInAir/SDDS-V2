import { OperationalDashboard } from "@/components/dashboard/OperationalDashboard";
import { getOperationalDashboardData } from "@/lib/actions/dashboard";

export const metadata = {
  title: "Operational Cockpit - Single Digit Data Solutions",
};

export default async function HomePage() {
  const data = await getOperationalDashboardData();

  return <OperationalDashboard data={data} />;
}
