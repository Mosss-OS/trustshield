import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  listRemediationRequests,
  updateRequestStatus,
} from "@/lib/remediation.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  FileText,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RemediationRow = {
  id: string;
  scan_result_id: string;
  request_type: Database["public"]["Enums"]["request_type"];
  status: Database["public"]["Enums"]["request_status"];
  request_body: string;
  submitted_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

const REQUEST_TYPES: Record<Database["public"]["Enums"]["request_type"], string> = {
  dmca: "DMCA Takedown",
  defamation: "Defamation Notice",
  gdpr: "GDPR Deletion",
  platform_report: "Platform Report",
};

const STATUS_CONFIG: Record<Database["public"]["Enums"]["request_status"], { icon: typeof Clock; variant: string; label: string }> = {
  pending: { icon: Clock, variant: "outline", label: "Pending" },
  submitted: { icon: Send, variant: "secondary", label: "Submitted" },
  resolved: { icon: CheckCircle2, variant: "default", label: "Resolved" },
  denied: { icon: XCircle, variant: "destructive", label: "Denied" },
};

const NEXT_STATUS: Record<Database["public"]["Enums"]["request_status"], Database["public"]["Enums"]["request_status"] | null> = {
  pending: "submitted",
  submitted: "resolved",
  resolved: null,
  denied: null,
};

export const Route = createFileRoute("/_authenticated/remediation")({
  component: RemediationPage,
});

function RemediationPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RemediationRow[]>([]);
  const [detailItem, setDetailItem] = useState<RemediationRow | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await listRemediationRequests();
      setRequests(data as RemediationRow[]);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadRequests();
  });

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  const handleUpdateStatus = async (id: string, newStatus: Database["public"]["Enums"]["request_status"]) => {
    try {
      setUpdating(true);
      await updateRequestStatus({ data: { id, status: newStatus } });
      await loadRequests();
      setDetailItem(null);
    } catch (e: any) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Remediation Requests</h1>
          <p className="text-muted-foreground mt-1">
            Track your takedown requests and dispute workflows
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredRequests.length} request{filteredRequests.length !== 1 && "s"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No remediation requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use the "Request Removal" button on a screening result to create one
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const statusConf = STATUS_CONFIG[req.status];
            const StatusIcon = statusConf.icon;
            return (
              <Card
                key={req.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setDetailItem(req)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {REQUEST_TYPES[req.request_type]}
                        </Badge>
                        <Badge variant={statusConf.variant as any} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConf.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {req.request_body.slice(0, 150)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {detailItem ? REQUEST_TYPES[detailItem.request_type] : ""}
            </DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_CONFIG[detailItem.status].variant as any}>
                  {STATUS_CONFIG[detailItem.status].label}
                </Badge>
                {detailItem.submitted_at && (
                  <span className="text-xs text-muted-foreground">
                    Submitted {new Date(detailItem.submitted_at).toLocaleDateString()}
                  </span>
                )}
                {detailItem.resolved_at && (
                  <span className="text-xs text-muted-foreground">
                    Resolved {new Date(detailItem.resolved_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Generated Notice</label>
                <div className="mt-1 p-4 rounded-lg border bg-muted/50 text-sm whitespace-pre-wrap">
                  {detailItem.request_body}
                </div>
              </div>
              <DialogFooter>
                {detailItem.status === "pending" && (
                  <Button
                    onClick={() => handleUpdateStatus(detailItem.id, "submitted")}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Mark as Submitted
                  </Button>
                )}
                {detailItem.status === "submitted" && (
                  <Button
                    onClick={() => handleUpdateStatus(detailItem.id, "resolved")}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Mark as Resolved
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailItem(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}