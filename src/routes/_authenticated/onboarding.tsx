import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getProfile, completeOnboarding } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORMS } from "@/lib/screening-labels";
import { Shield, Plus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — TrustShield" },
      { name: "description", content: "Tell TrustShield about you so screening and drafts fit your voice." },
    ],
  }),
  component: OnboardingPage,
});

type Handle = { platform: string; handle: string };

function OnboardingPage() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const completeFn = useServerFn(completeOnboarding);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  const [displayName, setDisplayName] = useState("");
  const [industry, setIndustry] = useState("");
  const [goals, setGoals] = useState("");
  const [tone, setTone] = useState("");
  const [handles, setHandles] = useState<Handle[]>([{ platform: "x", handle: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setIndustry(profile.industry ?? "");
      setGoals(profile.goals ?? "");
      setTone(profile.tone_voice ?? "");
      if (profile.onboarding_complete) navigate({ to: "/dashboard", replace: true });
    }
  }, [profile, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await completeFn({
        data: {
          display_name: displayName,
          industry,
          goals,
          tone_voice: tone,
          handles: handles.filter((h) => h.handle.trim()) as any,
        },
      });
      toast.success("You're all set.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">TrustShield</span>
      </div>
      <h1 className="font-display text-4xl tracking-tight">Let's set you up.</h1>
      <p className="mt-2 text-muted-foreground">
        A few quick details so we can tailor risk analysis and brand drafts to you.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Your name (as it should appear)</Label>
          <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={100} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry or niche</Label>
          <Input
            id="industry"
            placeholder="e.g. Fintech founder, healthcare exec, indie musician"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goals">Your goals</Label>
          <Textarea
            id="goals"
            placeholder="What are you trying to achieve? (Grow your audience, land clients, prepare for a job search, protect your public image…)"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            required
            maxLength={1000}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">Tone & voice</Label>
          <Textarea
            id="tone"
            placeholder="How should posts sound? (e.g. warm and direct, technical, playful with dry humor)"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            required
            maxLength={500}
            rows={2}
          />
        </div>

        <div className="space-y-3">
          <Label>Platforms to monitor</Label>
          {handles.map((h, i) => (
            <div key={i} className="flex gap-2">
              <Select
                value={h.platform}
                onValueChange={(v) => {
                  const copy = [...handles];
                  copy[i] = { ...copy[i], platform: v };
                  setHandles(copy);
                }}
              >
                <SelectTrigger className="w-40">
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
              <Input
                placeholder="@handle or profile URL"
                value={h.handle}
                onChange={(e) => {
                  const copy = [...handles];
                  copy[i] = { ...copy[i], handle: e.target.value };
                  setHandles(copy);
                }}
                maxLength={200}
              />
              {handles.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setHandles(handles.filter((_, j) => j !== i))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHandles([...handles, { platform: "x", handle: "" }])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add another
          </Button>
        </div>

        <Button type="submit" size="lg" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Continue to dashboard"}
        </Button>
      </form>
    </div>
  );
}
