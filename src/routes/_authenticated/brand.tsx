import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  draftPost,
  saveBrandContent,
  listBrandContent,
  updateBrandContent,
  deleteBrandContent,
  computeBrandHealthScore,
  getLatestBrandHealthScore,
  getBrandHealthHistory,
} from "@/lib/brand.functions";
import { PLATFORMS } from "@/lib/screening-labels";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Sparkles, Save, Calendar, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/brand")({
  head: () => ({
    meta: [
      { title: "Brand Builder — Pecto" },
      { name: "description", content: "Draft on-brand posts tuned to your tone and goals." },
    ],
  }),
  component: BrandPage,
});

const CONTENT_TYPES = [
  { value: "post", label: "Post" },
  { value: "caption", label: "Caption" },
  { value: "script", label: "Script" },
  { value: "bio", label: "Bio/About" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

function BrandPage() {
  const draftFn = useServerFn(draftPost);
  const saveFn = useServerFn(saveBrandContent);
  const listFn = useServerFn(listBrandContent);
  const updateFn = useServerFn(updateBrandContent);
  const deleteFn = useServerFn(deleteBrandContent);
  const computeHealthFn = useServerFn(computeBrandHealthScore);
  const healthFn = useServerFn(getLatestBrandHealthScore);
  const historyFn = useServerFn(getBrandHealthHistory);
  const qc = useQueryClient();

  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("linkedin");
  const [contentType, setContentType] = useState<"post" | "caption" | "script" | "bio">("post");
  const [draft, setDraft] = useState("");

  const { data: savedContent = [], isLoading: loadingContent } = useQuery({
    queryKey: ["brand-content"],
    queryFn: () => listFn({ data: {} }),
  });

  const { data: latestHealth } = useQuery({
    queryKey: ["brand-health-latest"],
    queryFn: () => healthFn(),
  });

  const { data: healthHistory = [] } = useQuery({
    queryKey: ["brand-health-history"],
    queryFn: () => historyFn(),
  });

  const draftMut = useMutation({
    mutationFn: (input: any) => draftFn({ data: input }),
    onSuccess: (res: any) => setDraft(res.draft),
    onError: (e: any) => toast.error(e?.message ?? "Draft failed"),
  });

  const saveMut = useMutation({
    mutationFn: (input: any) => saveFn({ data: input }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["brand-content"] });
      qc.invalidateQueries({ queryKey: ["brand-health-latest"] });
      qc.invalidateQueries({ queryKey: ["brand-health-history"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const updateMut = useMutation({
    mutationFn: (input: any) => updateFn({ data: input }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["brand-content"] });
      qc.invalidateQueries({ queryKey: ["brand-health-latest"] });
      qc.invalidateQueries({ queryKey: ["brand-health-history"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (input: any) => deleteFn({ data: input }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["brand-content"] });
      qc.invalidateQueries({ queryKey: ["brand-health-latest"] });
      qc.invalidateQueries({ queryKey: ["brand-health-history"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const computeMut = useMutation({
    mutationFn: () => computeHealthFn(),
    onSuccess: () => {
      toast.success("Brand health updated");
      qc.invalidateQueries({ queryKey: ["brand-health-latest"] });
      qc.invalidateQueries({ queryKey: ["brand-health-history"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to compute"),
  });

  const drafts = savedContent.filter((c) => c.status === "draft");
  const scheduled = savedContent.filter((c) => c.status === "scheduled");
  const published = savedContent.filter((c) => c.status === "published");

  return (
    <AppShell title="Brand Builder">
      {/* Brand Health Score Card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Brand Health Score
          </div>
          <Button variant="outline" size="sm" onClick={() => computeMut.mutate()} disabled={computeMut.isPending}>
            {computeMut.isPending ? "Computing…" : "Refresh Score"}
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-5xl tracking-tight text-foreground">{latestHealth?.score ?? "—"}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          {latestHealth && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {latestHealth.score >= 80 ? "Strong" : latestHealth.score >= 60 ? "Good" : "Needs work"}
              </span>
              {latestHealth.breakdown && (
                <>
                  <span className="mx-2">·</span>
                  <span>Published: {latestHealth.breakdown.publishedContent ?? 0}</span>
                  <span className="mx-2">·</span>
                  <span>Active flags: {latestHealth.breakdown.activeScreenings ?? 0}</span>
                </>
              )}
            </div>
          )}
        </div>
        {healthHistory.length > 1 && (
          <div className="mt-6 h-24" style={{ width: "100%" }}>
            <BrandHealthChart history={healthHistory} />
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Draft an on-brand post
          </div>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!topic.trim()) return;
              draftMut.mutate({ topic, platform, content_type: contentType });
            }}
          >
            <div className="space-y-2">
              <Label>What's the post about?</Label>
              <Textarea
                placeholder="e.g. Announcing our seed round, sharing a lesson from last week's launch, congratulating a hire…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                maxLength={500}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={draftMut.isPending}>
              {draftMut.isPending ? "Drafting…" : "Draft post"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Draft</span>
            <div className="flex items-center gap-2">
              {draft && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(draft);
                    toast.success("Copied");
                  }}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              )}
              {draft && (
                <Button variant="outline" size="sm" onClick={() => saveDraft()} disabled={saveMut.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Draft
                </Button>
              )}
            </div>
          </div>
          {draft ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={14}
              className="mt-4 font-sans"
            />
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Your on-brand post will appear here. Edit freely before saving.
            </p>
          )}
        </section>
      </div>

      {/* Saved Content */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Saved Content</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your drafted, scheduled, and published content.
        </p>

        <div className="mt-6 space-y-4">
          {renderContentSection("Drafts", drafts, "draft")}
          {renderContentSection("Scheduled", scheduled, "scheduled")}
          {renderContentSection("Published", published, "published")}
        </div>

        {savedContent.length === 0 && !loadingContent && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No saved content yet.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Generate a draft above and click "Save Draft" to add it here.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );

  function saveDraft() {
    if (!draft.trim()) return;
    saveMut.mutate({
      platform,
      content_type: contentType,
      content_text: draft,
      status: "draft",
    });
    setDraft("");
  }

  function handleStatusChange(id: string, newStatus: "draft" | "scheduled" | "published") {
    updateMut.mutate({ id, updates: { status: newStatus } });
  }

  function handleDelete(id: string) {
    if (confirm("Delete this content?")) {
      deleteMut.mutate({ id });
    }
  }

  function renderContentSection(title: string, items: any[], currentStatus: string) {
    if (items.length === 0) return null;
    return (
      <div key={title} className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title} ({items.length})
        </h3>
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">
                    {PLATFORMS.find((p) => p.value === item.platform)?.label ?? item.platform}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full border border-border">
                    {CONTENT_TYPES.find((t) => t.value === item.content_type)?.label ?? item.content_type}
                  </span>
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm">{item.content_text}</p>
              </div>
              <div className="flex items-center gap-2">
                {item.status === "draft" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(item.id, "scheduled")}
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStatusChange(item.id, "published")}
                    >
                      Publish
                    </Button>
                  </>
                )}
                {item.status === "scheduled" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStatusChange(item.id, "published")}
                  >
                    Publish Now
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

function BrandHealthChart({ history }: { history: any[] }) {
  // Simple chart using SVG (recharts not needed for basic line chart)
  const data = [...history].reverse().slice(-30);
  if (data.length < 2) return null;

  const width = "100%";
  const height = 96;
  const padding = 20;
  const maxScore = 100;
  const minScore = 0;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (100 - 2 * padding);
    const y = padding + (1 - (d.score - minScore) / (maxScore - minScore)) * (height - 2 * padding);
    return `${x}% ${y}%`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 100 ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M${points}`}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5%"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M${points} L${100 - padding}% ${height - padding}% L${padding}% ${height - padding}% Z`}
        fill="url(#gradient)"
      />
      {data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (100 - 2 * padding);
        const y = padding + (1 - (d.score - minScore) / (maxScore - minScore)) * (height - 2 * padding);
        return (
          <circle
            key={d.id}
            cx={`${x}%`}
            cy={`${y}%`}
            r="1.5%"
            fill="hsl(var(--primary))"
            opacity={i === data.length - 1 ? 1 : 0.4}
          />
        );
      })}
    </svg>
  );
}