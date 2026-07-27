import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Shield, LayoutDashboard, ScanLine, Sparkles, Settings, LogOut, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/screening", label: "Screening", icon: ScanLine },
  { to: "/brand", label: "Brand Builder", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const state = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme } = useTheme();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="flex items-center gap-2 px-5 pt-6 pb-8">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">TrustShield</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = state.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="mx-3 mb-4 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="md:hidden">
              <button
                onClick={signOut}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
