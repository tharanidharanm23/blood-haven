import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-4">
          ● Signal Lost
        </div>
        <h1 className="text-7xl font-bold text-foreground font-mono">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Coordinates not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you requested is not in the network grid.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-primary px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold text-primary-foreground hover:bg-foreground transition-colors"
          >
            Return to Base
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Donor Land — Saving Lives, One Drop at a Time" },
      {
        name: "description",
        content:
          "Donor Land is a Tamil Nadu blood bank management system: 38-district inventory, smart donor matching, and emergency dispatch — all in one HUD.",
      },
      { property: "og:title", content: "Donor Land — Tamil Nadu Blood Bank Mission Control" },
      {
        property: "og:description",
        content: "Real-time Tamil Nadu blood inventory, smart matching, emergency dispatch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(l){if(l.search[1]===\"/\"){var decoded=l.search.slice(1).split(\"&\").map(function(s){return s.replace(/~and~/g,\"&\");}).join(\"?\");window.history.replaceState(null,null,l.pathname.slice(0,-1)+decoded+l.hash);}})(window.location);",
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  );
}
