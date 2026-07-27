import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getProfile, completeOnboarding } from "@/lib/profile.functions";
import { listHandles, addHandle, removeHandle } from "@/lib/handles.functions";
import { PLATFORMS } from "@/lib/screening-labels";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TrustShield" },
      { name: "description", content: "Manage your profile, tone, and monitored handles." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const getProfileFn = useServerFn(getProfile);
  const saveFn = useServerFn(completeOnboarding);
  const listHandlesFn = useServerFn(listHandles);
  const addHandleFn = useServerFn(addHandle);
  const removeHandleFn = useServerFn(removeHandle);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: handles = [] } = useQuery({
    queryKey: ["handles"],
    queryFn: () => listHandlesFn(),
  });

  const [newPlatform, setNewPlatform] = useState("x");
  const [newHandle, setNewHandle] = useState("");

  const saveMut = useMutation({
    mutationFn: (input: any) => saveFn({ data: input }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["handles"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const addMut = useMutation({
    mutationFn: (input: any) => addHandleFn({ data: input }),
    onSuccess: () => {
      setNewHandle("");
      qc.invalidateQueries({ queryKey: ["handles"] });
    },
  });

  const removeMut = useMutation({
    mutationFn: (input: any) => removeHandleFn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["handles"] }),
  });

  return (
    <AppShell title="Settings">
      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Profile & voice</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              saveMut.mutate({
                display_name: String(fd.get("display_name") ?? ""),
                industry: String(fd.get("industry") ?? ""),
                goals: String(fd.get("goals") ?? ""),
                tone_voice: String(fd.get("tone_voice") ?? ""),
                handles: handles.map((h: any) => ({ platform: h.platform, handle: h.handle })),
              });
            }}
          >
            <Field label="Display name" name="display_name" defaultValue={profile?.display_name ?? ""} />
            <Field label="Industry" name="industry" defaultValue={profile?.industry ?? ""} />
            <FieldArea label="Goals" name="goals" defaultValue={profile?.goals ?? ""} />
            <FieldArea
              label="Tone & voice"
              name="tone_voice"
              defaultValue={profile?.tone_voice ?? ""}
            />
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Monitored handles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Handles you want TrustShield to reference during screening and drafts.
          </p>
          <div className="mt-4 space-y-2">
            {handles.map((h: any) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <span>
                  <span className="text-muted-foreground">
                    {PLATFORMS.find((p) => p.value === h.platform)?.label ?? h.platform}
                  </span>{" "}
                  · {h.handle}
                </span>
                <button
                  onClick={() => removeMut.mutate({ id: h.id })}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newHandle.trim()) return;
              addMut.mutate({ platform: newPlatform, handle: newHandle });
            }}
          >
            <Select value={newPlatform} onValueChange={setNewPlatform}>
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
              placeholder="@handle or URL"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              maxLength={200}
            />
            <Button type="submit" disabled={addMut.isPending}>
              Add
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required maxLength={100} />
    </div>
  );
}
function FieldArea({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} required rows={3} maxLength={1000} />
    </div>
  );
}
