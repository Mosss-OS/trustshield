import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { getProfile } from "@/lib/profile.functions";
import { listScreenings } from "@/lib/content.functions";
import { CATEGORY_LABELS, SEVERITY_CLASS, SEVERITY_LABELS, ACTION_LABELS } from "@/lib/screening-labels";
import { Shield, ScanLine, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — Pecto" },
      { name: "description", content: "Your reputation risk score, recent flags, and brand growth at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const listFn = useServerFn(listScreenings);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: results = [] } = useQuery({ queryKey: ["screenings"], queryFn: () => listFn() });

  useEffect(() => {
    if (profile && !profile.onboarding_complete) navigate({ to: "/onboarding", replace: true });
  }, [profile, navigate]);

  const active = useMemo(() => results.filter((r: any) => !r.dismissed), [results]);
  const score = useMemo(() => computeRiskScore(active), [active]);
  const recent = active.slice(0, 5);

  return (
    <AppShell title="Overview">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <RiskCard score={score} count={active.length} />
        <StatCard
          icon={ScanLine}
          label="Items screened"
          value={String(results.length)}
          hint="all-time"
        />
        <StatCard
          icon={Sparkles}
          label="High-severity flags"
          value={String(active.filter((r: any) => r.severity === "high").length)}
          hint="need review"
        />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent flags</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/screening">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {recent.map((r: any) => (
              <div key={r.id} className="flex flex-col gap-2 p-5 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[r.severity]}`}>
                      {SEVERITY_LABELS[r.severity]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[r.category]} · {ACTION_LABELS[r.suggested_action]}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">
                    {r.content_items?.content ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function computeRiskScore(results: any[]): number {
  if (results.length === 0) return 95;
  const weights: Record<string, number> = { info: 0, low: 4, medium: 12, high: 25 };
  const penalty = results.reduce((s, r) => s + (weights[r.severity] ?? 0), 0);
  return Math.max(5, Math.min(100, 100 - penalty));
}

function RiskCard({ score, count }: { score: number; count: number }) {
  const tone = score >= 80 ? "text-severity-low" : score >= 60 ? "text-severity-medium" : "text-severity-high";
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Some attention" : "Needs review";
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" /> Reputation score
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`font-display text-5xl tracking-tight ${tone}`}>{score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {label} · based on {count} active {count === 1 ? "signal" : "signals"}
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-3 font-display text-5xl tracking-tight">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">No screenings yet.</p>
      <Button asChild className="mt-4">
        <Link to="/screening">Screen your first item</Link>
      </Button>
    </div>
  );
}
