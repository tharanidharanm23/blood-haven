import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminDashboardPage = lazy(() => import("@/pages/admin-dashboard"));

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Mission Control — Donor Land" },
      { name: "description", content: "Real-time overview of donors, requests, and inventory." },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <Suspense
      fallback={
        <div className="hud-panel p-8 text-center text-muted-foreground font-mono text-sm">
          Loading mission control...
        </div>
      }
    >
      <AdminDashboardPage />
    </Suspense>
  );
}
