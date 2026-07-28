import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAnalyticsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [resultsRes, contentRes, requestsRes, alertsRes] = await Promise.all([
      context.supabase
        .from("screening_results")
        .select("id, category, severity, dismissed, reviewed, created_at")
        .eq("user_id", context.userId),
      context.supabase
        .from("content_items")
        .select("id, platform, created_at")
        .eq("user_id", context.userId),
      context.supabase
        .from("remediation_requests")
        .select("id, request_type, status, created_at")
        .eq("user_id", context.userId),
      context.supabase
        .from("alerts")
        .select("id, alert_type, read, created_at")
        .eq("user_id", context.userId),
    ]);

    const results = resultsRes.data ?? [];
    const content = contentRes.data ?? [];
    const requests = requestsRes.data ?? [];
    const alerts = alertsRes.data ?? [];

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    for (const r of results) {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    }

    // Severity breakdown
    const severityCounts: Record<string, number> = {};
    for (const r of results) {
      severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1;
    }

    // Platform breakdown
    const platformCounts: Record<string, number> = {};
    for (const c of content) {
      platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
    }

    // Monthly screening trend (last 6 months)
    const now = new Date();
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const count = results.filter((r) => {
        const rd = new Date(r.created_at);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      }).length;
      monthlyTrend.push({ month: monthStr, count });
    }

    // Remediation status breakdown
    const requestStatusCounts: Record<string, number> = {};
    for (const req of requests) {
      requestStatusCounts[req.status] = (requestStatusCounts[req.status] || 0) + 1;
    }

    // Alert stats
    const unreadAlerts = alerts.filter((a) => !a.read).length;

    // Risk score (simple formula: weighted categories)
    const highCount = severityCounts["high"] ?? 0;
    const mediumCount = severityCounts["medium"] ?? 0;
    const lowCount = severityCounts["low"] ?? 0;
    const infoCount = severityCounts["info"] ?? 0;
    const totalResults = results.length || 1;
    const riskScore = Math.round(
      ((highCount * 4 + mediumCount * 2 + lowCount * 1 + infoCount * 0.5) / (totalResults * 4)) * 100,
    );

    return {
      totalResults: results.length,
      totalContent: content.length,
      totalRequests: requests.length,
      unreadAlerts,
      riskScore: Math.min(riskScore, 100),
      categoryCounts,
      severityCounts,
      platformCounts,
      monthlyTrend,
      requestStatusCounts,
      reviewedCount: results.filter((r) => r.reviewed).length,
      dismissedCount: results.filter((r) => r.dismissed).length,
    };
  });