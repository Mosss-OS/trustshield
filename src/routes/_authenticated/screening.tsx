import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { analyzeContent } from "@/lib/screening.functions";
import { listScreenings, updateResult } from "@/lib/content.functions";
import {
  CATEGORY_LABELS,
  SEVERITY_CLASS,
  SEVERITY_LABELS,
  ACTION_LABELS,
  PLATFORMS,
} from "@/lib/screening-labels";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Copy, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/screening")({
  head: () => ({
    meta: [
      { title: "Screening — TrustShield" },
      { name: "description", content: "Analyze content for reputational risk with explainable AI." },
    ],
  }),
  component: ScreeningPage,
});

function ScreeningPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listScreenings);
  const analyzeFn = useServerFn(analyzeContent);
  const updateFn = useServerFn(updateResult);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["screenings"],
    queryFn: () => listFn(),
  });

  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<string>("x");
  const [sourceUrl, setSourceUrl] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const analyzeMut = useMutation({
    mutationFn: (input: any) => analyzeFn({ data: input }),
    onSuccess: () => {
      toast.success("Analysis complete");
      setContent("");
      setSourceUrl("");
      qc.invalidateQueries({ queryKey: ["screenings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Analysis failed"),
  });

  const updateMut = useMutation({
    mutationFn: (input: any) => updateFn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["screenings"] }),
  });

  const active = results.filter((r: any) => !r.dismissed);
  const openItem = results.find((r: any) => r.id === openId);

  return (
    <AppShell title="Screening">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Screen a piece of content</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste text you posted, a comment about you, or an article excerpt.
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim()) return;
            analyzeMut.mutate({ content, platform, source_url: sourceUrl });
          }}
        >
          <Textarea
            placeholder="Paste the content to analyze…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={8000}
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
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
              <Label>Source URL (optional)</Label>
              <Input
                type="url"
                placeholder="https://…"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={analyzeMut.isPending}>
            {analyzeMut.isPending ? "Analyzing…" : "Analyze"}
          </Button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Screened items</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing screened yet.
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((r: any) => (
              <button
                key={r.id}
                onClick={() => setOpenId(r.id)}
                className="block w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-accent/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[r.severity]}`}
                  >
                    {SEVERITY_LABELS[r.severity]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[r.category]} · {ACTION_LABELS[r.suggested_action]}
                  </span>
                  {r.reviewed && (
                    <span className="ml-auto text-xs text-muted-foreground">Reviewed</span>
                  )}
                </div>
                <p className="mt-3 line-clamp-2 text-sm">{r.content_items?.content}</p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{r.rationale}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <Sheet open={!!openItem} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {openItem && (
            <>
              <SheetHeader>
                <SheetTitle>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[openItem.severity]}`}
                  >
                    {SEVERITY_LABELS[openItem.severity]}
                  </span>{" "}
                  {CATEGORY_LABELS[openItem.category]}
                </SheetTitle>
                <SheetDescription>{ACTION_LABELS[openItem.suggested_action]}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 px-4">
                <section>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Content
                  </div>
                  <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm">
                    {openItem.content_items?.content}
                  </p>
                  {openItem.content_items?.source_url && (
                    <a
                      href={openItem.content_items.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-muted-foreground underline underline-offset-4"
                    >
                      Source
                    </a>
                  )}
                </section>

                <section>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Why this flag
                  </div>
                  <p className="text-sm">{openItem.rationale}</p>
                </section>

                {openItem.suggested_response && (
                  <section>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Suggested response
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(openItem.suggested_response);
                          toast.success("Copied");
                        }}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm">
                      {openItem.suggested_response}
                    </p>
                  </section>
                )}

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateMut.mutate({ id: openItem.id, reviewed: !openItem.reviewed })
                    }
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {openItem.reviewed ? "Mark unreviewed" : "Mark reviewed"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateMut.mutate({ id: openItem.id, dismissed: true });
                      setOpenId(null);
                    }}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
