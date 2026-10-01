import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Home", to: "/" },
  { label: "Methodology", to: "/methodology" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex w-full max-w-[var(--content-max-width)] flex-col gap-4 px-[var(--page-gutter)] py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            aria-label="RoostMap home"
            className="text-xl font-semibold tracking-tight"
            to="/"
          >
            RoostMap
          </Link>

          <nav aria-label="Primary navigation">
            <ul className="flex flex-wrap items-center gap-2">
              {navigationItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        "inline-flex rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent text-accent-foreground",
                      )
                    }
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[var(--content-max-width)] flex-1 px-[var(--page-gutter)] py-[var(--section-space)]">
        {children}
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto w-full max-w-[var(--content-max-width)] px-[var(--page-gutter)] py-6 text-sm text-muted-foreground">
          RoostMap · New Zealand rental-area decision support
        </div>
      </footer>
    </div>
  );
}
