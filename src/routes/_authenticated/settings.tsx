import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getProfile, completeOnboarding } from "@/lib/profile.functions";
import { listHandles, addHandle, removeHandle } from "@/lib/handles.functions";
import { getAuditLog, exportUserData, deleteUserAccount, logAuditEvent } from "@/lib/gdpr.functions";
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
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/notification-preferences.functions";
import { Trash2, Download, AlertTriangle, History, Shield, FileText, ExternalLink, Bell } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TrustShield" },
      { name: "description", content: "Manage your profile, tone, monitored handles, and data." },
    ],
  }),
  component: SettingsPage,
});

const ACTION_LABELS: Record<string, string> = {
  screening_created: "Screening created",
  screening_reviewed: "Screening reviewed",
  screening_dismissed: "Screening dismissed",
  remediation_created: "Remediation request created",
  remediation_status_changed: "Remediation status changed",
  brand_content_saved: "Brand content saved",
  brand_content_deleted: "Brand content deleted",
  profile_updated: "Profile updated",
  handle_added: "Handle added",
  handle_removed: "Handle removed",
  account_deleted: "Account deleted",
  data_exported: "Data exported",
};

function SettingsPage() {
  const qc = useQueryClient();
  const getProfileFn = useServerFn(getProfile);
  const saveFn = useServerFn(completeOnboarding);
  const listHandlesFn = useServerFn(listHandles);
  const addHandleFn = useServerFn(addHandle);
  const removeHandleFn = useServerFn(removeHandle);
  const auditLogFn = useServerFn(getAuditLog);
  const exportFn = useServerFn(exportUserData);
  const deleteFn = useServerFn(deleteUserAccount);
  const logEventFn = useServerFn(logAuditEvent);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: handles = [] } = useQuery({
    queryKey: ["handles"],
    queryFn: () => listHandlesFn(),
  });
  const { data: auditLog = [], isLoading: loadingAudit } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => auditLogFn(),
  });

  const [newPlatform, setNewPlatform] = useState("x");
  const [newHandle, setNewHandle] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const saveMut = useMutation({
    mutationFn: (input: any) => saveFn({ data: input }),
    onSuccess: () => {
      toast.success("Saved");
      logEventFn({ data: { action: "profile_updated", entity_type: "profile" } });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["handles"] });
      qc.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const addMut = useMutation({
    mutationFn: (input: any) => addHandleFn({ data: input }),
    onSuccess: () => {
      setNewHandle("");
      logEventFn({ data: { action: "handle_added", entity_type: "monitored_handles" } });
      qc.invalidateQueries({ queryKey: ["handles"] });
      qc.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });

  const removeMut = useMutation({
    mutationFn: (input: any) => removeHandleFn({ data: input }),
    onSuccess: () => {
      logEventFn({ data: { action: "handle_removed", entity_type: "monitored_handles" } });
      qc.invalidateQueries({ queryKey: ["handles"] });
      qc.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });

  const exportMut = useMutation({
    mutationFn: () => exportFn(),
    onSuccess: (data: any) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trustshield-data-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      logEventFn({ data: { action: "data_exported", entity_type: "user" } });
      qc.invalidateQueries({ queryKey: ["audit-log"] });
      toast.success("Data exported successfully");
    },
    onError: (e: any) => toast.error(e?.message ?? "Export failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (input: any) => deleteFn({ data: input }),
    onSuccess: () => {
      toast.success("Account deleted");
      window.location.href = "/auth";
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  return (
    <AppShell title="Settings">
      <div className="space-y-8">
        {/* Profile & Voice */}
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
            <FieldArea label="Tone & voice" name="tone_voice" defaultValue={profile?.tone_voice ?? ""} />
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </section>

        {/* Monitored Handles */}
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

        {/* Notification Preferences */}
        <NotificationPreferencesSection />

        {/* Legal Pages */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Legal</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" /> Terms of Service
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                <Shield className="h-4 w-4 mr-2" /> Privacy Policy
              </a>
            </Button>
          </div>
        </section>

        {/* Data Export */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Export my data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download all your TrustShield data as a JSON file. This includes your profile, screening results,
            brand content, alerts, and audit log.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => exportMut.mutate()}
            disabled={exportMut.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportMut.isPending ? "Exporting…" : "Export data (JSON)"}
          </Button>
        </section>

        {/* Audit Log */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <h2 className="text-base font-semibold">Audit log</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            History of actions taken on your account.
          </p>
          <div className="mt-4 space-y-2">
            {loadingAudit ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              auditLog.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                    <span className="text-xs text-muted-foreground">{entry.entity_type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Delete Account */}
        <section className="rounded-2xl border border-destructive/30 bg-card p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <h2 className="text-base font-semibold">Delete account</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <Button
              variant="destructive"
              className="mt-4"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete my account
            </Button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-destructive font-medium">
                Enter your password to confirm account deletion:
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  variant="destructive"
                  disabled={!deletePassword || deleteMut.isPending}
                  onClick={() => deleteMut.mutate({ password: deletePassword })}
                >
                  {deleteMut.isPending ? "Deleting…" : "Confirm delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function NotificationPreferencesSection() {
  const qc = useQueryClient();
  const getPrefsFn = useServerFn(getNotificationPreferences);
  const updatePrefsFn = useServerFn(updateNotificationPreferences);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => getPrefsFn(),
  });

  const updateMut = useMutation({
    mutationFn: (input: any) => updatePrefsFn({ data: input }),
    onSuccess: () => {
      toast.success("Notification preferences saved");
      qc.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  if (isLoading || !prefs) return null;

  const toggles = [
    { key: "email_high_severity", label: "High severity alerts", desc: "Get notified immediately for high-risk content" },
    { key: "email_medium_severity", label: "Medium severity alerts", desc: "Notifications for medium-risk content" },
    { key: "email_low_severity", label: "Low severity alerts", desc: "Notifications for low-risk content" },
    { key: "email_remediation_updates", label: "Remediation updates", desc: "Status changes on your takedown requests" },
    { key: "email_weekly_summary", label: "Weekly summary", desc: "Digest of your brand monitoring activity" },
    { key: "email_brand_health", label: "Brand health reports", desc: "Periodic brand health score updates" },
  ] as const;

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4" />
        <h2 className="text-base font-semibold">Email notifications</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose which email notifications you'd like to receive
      </p>
      <div className="mt-4 space-y-3">
        {toggles.map(({ key, label, desc }) => (
          <label
            key={key}
            className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <div>
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <input
              type="checkbox"
              checked={(prefs as any)[key]}
              onChange={(e) =>
                updateMut.mutate({ ...(prefs as any), [key]: e.target.checked })
              }
              className="h-4 w-4 rounded border-border"
            />
          </label>
        ))}
      </div>
    </section>
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