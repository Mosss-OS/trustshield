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
import { Shield, Plus, X, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — Pecto" },
      { name: "description", content: "Tell Pecto about you so screening and drafts fit your voice." },
    ],
  }),
  component: OnboardingPage,
});

type Handle = { platform: string; handle: string };

const STEPS = ["Welcome", "About you", "Your voice", "Platforms"];

const INDUSTRY_PRESETS = [
  "Technology / SaaS",
  "Finance / Fintech",
  "Healthcare",
  "E-commerce / Retail",
  "Education",
  "Media / Entertainment",
  "Real Estate",
  "Legal / Consulting",
  "Non-profit",
  "Creator / Influencer",
  "Other",
];

const TONE_PRESETS = [
  "Warm and approachable",
  "Professional and authoritative",
  "Casual and friendly",
  "Technical and precise",
  "Playful with humor",
  "Inspirational and motivating",
  "Direct and straightforward",
];

function OnboardingPage() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const completeFn = useServerFn(completeOnboarding);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [industry, setIndustry] = useState("");
  const [goals, setGoals] = useState("");
  const [tone, setTone] = useState("");
  const [handles, setHandles] = useState<Handle[]>([{ platform: "x", handle: "" }]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setIndustry(profile.industry ?? "");
      setGoals(profile.goals ?? "");
      setTone(profile.tone_voice ?? "");
      if (profile.onboarding_complete) navigate({ to: "/dashboard", replace: true });
    }
  }, [profile, navigate]);

  function validateStep(currentStep: number): boolean {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!displayName.trim()) newErrors.displayName = "Name is required";
      if (!industry.trim()) newErrors.industry = "Industry is required";
    }
    if (currentStep === 2) {
      if (!goals.trim()) newErrors.goals = "Goals are required";
      if (!tone.trim()) newErrors.tone = "Tone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

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

  function skipToEnd() {
    if (!displayName.trim()) setDisplayName("User");
    if (!industry.trim()) setIndustry("General");
    if (!goals.trim()) setGoals("Monitor my brand presence");
    if (!tone.trim()) setTone("Professional");
    setStep(STEPS.length - 1);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">Pecto</span>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                  i < step
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === step
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-8 sm:w-12 transition-colors",
                    i < step ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={cn(i === step && "text-primary font-medium")}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[320px]">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-6">
            <h1 className="font-display text-4xl tracking-tight">Welcome to Pecto</h1>
            <p className="text-muted-foreground text-lg">
              Your AI-powered brand reputation guardian. Let's set you up in just a few steps.
            </p>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold">What you'll get:</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>AI-powered content screening for reputational risks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Brand voice drafts that match your tone and style</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Real-time alerts for mentions across platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Remediation workflows for takedown requests</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button onClick={nextStep} size="lg" className="flex-1">
                Get started <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={skipToEnd} variant="ghost" size="lg">
                Skip setup
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: About you */}
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="font-display text-3xl tracking-tight">About you</h1>
            <p className="text-muted-foreground">
              Help us understand who you are so we can tailor our analysis.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we address you?"
                  maxLength={100}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry or niche</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {INDUSTRY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setIndustry(preset)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        industry === preset
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Input
                  id="industry"
                  placeholder="Or type your industry..."
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  maxLength={100}
                />
                {errors.industry && (
                  <p className="text-sm text-destructive">{errors.industry}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Your voice */}
        {step === 2 && (
          <div className="space-y-6">
            <h1 className="font-display text-3xl tracking-tight">Your voice</h1>
            <p className="text-muted-foreground">
              What are you trying to achieve, and how should your content sound?
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goals">Your goals</Label>
                <Textarea
                  id="goals"
                  placeholder="What are you trying to achieve? (Grow your audience, land clients, protect your public image...)"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  maxLength={1000}
                  rows={3}
                />
                {errors.goals && (
                  <p className="text-sm text-destructive">{errors.goals}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tone & voice</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {TONE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTone(preset)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        tone === preset
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Or describe your tone..."
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
                {errors.tone && (
                  <p className="text-sm text-destructive">{errors.tone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Platforms */}
        {step === 3 && (
          <div className="space-y-6">
            <h1 className="font-display text-3xl tracking-tight">Platforms</h1>
            <p className="text-muted-foreground">
              Add the social media accounts you want to monitor (optional, can add later).
            </p>
            <div className="space-y-3">
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
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {step > 0 && (
        <div className="mt-8 flex gap-3">
          <Button variant="outline" onClick={prevStep} size="lg">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep} size="lg" className="flex-1">
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} size="lg" className="flex-1" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" /> Complete setup
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}