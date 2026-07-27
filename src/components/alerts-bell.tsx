import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { listAlerts, unreadCount, markAlertRead, markAllAlertsRead } from "@/lib/alerts.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ALERT_LABELS: Record<string, string> = {
  new_mention: "New Mention",
  severity_change: "Severity Change",
  request_update: "Request Update",
  brand_milestone: "Brand Milestone",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AlertsBell() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAlerts);
  const countFn = useServerFn(unreadCount);
  const markReadFn = useServerFn(markAlertRead);
  const markAllFn = useServerFn(markAllAlertsRead);

  const { data: count = 0 } = useQuery({
    queryKey: ["alerts-unread-count"],
    queryFn: () => countFn(),
    refetchInterval: 30000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => listFn({ data: {} }),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => markReadFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["alerts-unread-count"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => markAllFn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["alerts-unread-count"] });
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {count > 0 && (
            <button
              onClick={() => markAllMut.mutate()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            alerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => {
                  if (!alert.read) markReadMut.mutate(alert.id);
                }}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent/50",
                  !alert.read && "bg-accent/20",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">
                    {ALERT_LABELS[alert.alert_type] ?? alert.alert_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(alert.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{alert.message}</p>
                {!alert.read && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
