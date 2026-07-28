import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listIntegrations,
  upsertIntegration,
  disconnectIntegration,
} from "@/lib/integrations.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type IntegrationProvider = Database["public"]["Enums"]["integration_provider"];
type IntegrationStatus = Database["public"]["Enums"]["integration_status"];

interface IntegrationRow {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  provider_user_id: string | null;
  provider_username: string | null;
  last_synced_at: string | null;
  created_at: string;
}

const PROVIDER_CONFIG: Record<IntegrationProvider, { label: string; description: string; color: string }> = {
  x: { label: "X (Twitter)", description: "Monitor mentions, replies, and brand sentiment on X", color: "#000000" },
  instagram: { label: "Instagram", description: "Track comments, stories, and brand mentions on Instagram", color: "#E4405F" },
  linkedin: { label: "LinkedIn", description: "Monitor professional mentions and brand reputation on LinkedIn", color: "#0A66C2" },
  tiktok: { label: "TikTok", description: "Track video mentions and brand sentiment on TikTok", color: "#000000" },
  facebook: { label: "Facebook", description: "Monitor page mentions and brand discussions on Facebook", color: "#1877F2" },
  youtube: { label: "YouTube", description: "Track video comments and brand mentions on YouTube", color: "#FF0000" },
};

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — TrustShield" },
      { name: "description", content: "Connect your social media accounts for monitoring." },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listIntegrations);
  const upsertFn = useServerFn(upsertIntegration);
  const disconnectFn = useServerFn(disconnectIntegration);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => listFn(),
  });

  const [connectDialog, setConnectDialog] = useState<IntegrationProvider | null>(null);
  const [username, setUsername] = useState("");
  const [connecting, setConnecting] = useState(false);

  const integrationMap: Record<string, IntegrationRow> = {};
  for (const i of integrations as IntegrationRow[]) {
    integrationMap[i.provider] = i;
  }

  const handleConnect = async () => {
    if (!connectDialog) return;
    setConnecting(true);
    try {
      await upsertFn({
        data: {
          provider: connectDialog,
          status: "connected",
          provider_username: username || undefined,
          provider_user_id: `mock-${Date.now()}`,
        },
      });
      toast.success(`Connected to ${PROVIDER_CONFIG[connectDialog].label}`);
      setConnectDialog(null);
      setUsername("");
      qc.invalidateQueries({ queryKey: ["integrations"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    try {
      await disconnectFn({ data: { provider } });
      toast.success(`Disconnected from ${PROVIDER_CONFIG[provider].label}`);
      qc.invalidateQueries({ queryKey: ["integrations"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Disconnect failed");
    }
  };

  const allProviders = Object.keys(PROVIDER_CONFIG) as IntegrationProvider[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect your social media accounts for real-time brand monitoring
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {allProviders.map((provider) => {
            const config = PROVIDER_CONFIG[provider];
            const integration = integrationMap[provider];
            const isConnected = integration?.status === "connected";

            return (
              <Card key={provider}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg border"
                        style={{ borderColor: config.color + "40" }}
                      >
                        <span className="text-lg font-bold" style={{ color: config.color }}>
                          {config.label.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{config.label}</h3>
                          {isConnected ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : integration?.status === "error" ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Not connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                        {isConnected && integration?.provider_username && (
                          <p className="text-xs text-muted-foreground mt-1">
                            @{integration.provider_username}
                            {integration.last_synced_at && (
                              <> · Last synced {new Date(integration.last_synced_at).toLocaleDateString()}</>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(provider)}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setUsername(integrationMap[provider]?.provider_username ?? "");
                            setConnectDialog(provider);
                          }}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!connectDialog} onOpenChange={(open) => !open && setConnectDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Connect {connectDialog ? PROVIDER_CONFIG[connectDialog].label : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username (optional)</Label>
              <Input
                id="username"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your username on this platform for monitoring
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
              <p className="text-muted-foreground">
                In production, this would redirect to {connectDialog ? PROVIDER_CONFIG[connectDialog].label : ""}'s
                OAuth authorization page. For this demo, we'll simulate the connection.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}