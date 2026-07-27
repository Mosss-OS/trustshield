import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { draftPost } from "@/lib/brand.functions";
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
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/brand")({
  head: () => ({
    meta: [
      { title: "Brand Builder — TrustShield" },
      { name: "description", content: "Draft on-brand posts tuned to your tone and goals." },
    ],
  }),
  component: BrandPage,
});

function BrandPage() {
  const draftFn = useServerFn(draftPost);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("linkedin");
  const [draft, setDraft] = useState("");

  const mut = useMutation({
    mutationFn: (input: any) => draftFn({ data: input }),
    onSuccess: (res: any) => setDraft(res.draft),
    onError: (e: any) => toast.error(e?.message ?? "Draft failed"),
  });

  return (
    <AppShell title="Brand Builder">
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
              mut.mutate({ topic, platform });
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
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Drafting…" : "Draft post"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Draft</span>
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
              Your on-brand post will appear here. Edit freely before posting.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
