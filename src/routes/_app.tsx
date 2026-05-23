// Pathless layout route — wraps dashboard pages with the shell (sidebar + header).
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { getShellData } from "@/lib/server/api";

export const Route = createFileRoute("/_app")({
  loader: () => getShellData(),
  component: AppLayout,
});

function AppLayout() {
  const { notifications } = Route.useLoaderData();
  return <DashboardShell notifications={notifications} />;
}
