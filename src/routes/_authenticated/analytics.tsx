import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getAnalyticsSummary } from "@/lib/analytics.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  Shield,
  AlertTriangle,
  FileWarning,
  Download,
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
  info: "#6b7280",
};

const CATEGORY_COLORS: Record<string, string> = {
  harmful_abusive: "#ef4444",
  reputation_risk: "#f59e0b",
  impersonation: "#8b5cf6",
  legitimate_criticism: "#3b82f6",
  positive_on_brand: "#22c55e",
  neutral: "#6b7280",
};

const CATEGORY_LABELS: Record<string, string> = {
  harmful_abusive: "Harmful/Abusive",
  reputation_risk: "Reputation Risk",
  impersonation: "Impersonation",
  legitimate_criticism: "Legitimate Criticism",
  positive_on_brand: "Positive",
  neutral: "Neutral",
};

const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  submitted: "#3b82f6",
  resolved: "#22c55e",
  denied: "#ef4444",
};

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Pecto" },
      { name: "description", content: "View analytics and trends for your brand monitoring." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const summaryFn = useServerFn(getAnalyticsSummary);
  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => summaryFn(),
  });
  const [timeRange, setTimeRange] = useState("6m");

  const handleExportCSV = () => {
    if (!summary) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Screenings", summary.totalResults],
      ["Total Content Items", summary.totalContent],
      ["Remediation Requests", summary.totalRequests],
      ["Unread Alerts", summary.unreadAlerts],
      ["Risk Score", summary.riskScore],
      ["Reviewed Items", summary.reviewedCount],
      ["Dismissed Items", summary.dismissedCount],
      [""],
      ["Category", "Count"],
      ...Object.entries(summary.categoryCounts).map(([k, v]) => [CATEGORY_LABELS[k] ?? k, v]),
      [""],
      ["Severity", "Count"],
      ...Object.entries(summary.severityCounts).map(([k, v]) => [k, v]),
      [""],
      ["Platform", "Count"],
      ...Object.entries(summary.platformCounts).map(([k, v]) => [k, v]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pecto-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  const categoryData = Object.entries(summary.categoryCounts).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] ?? key,
    value,
  }));

  const severityData = Object.entries(summary.severityCounts).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const platformData = Object.entries(summary.platformCounts).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const requestStatusData = Object.entries(summary.requestStatusCounts).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Trends and insights for your brand monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last month</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Risk Score</span>
            </div>
            <div className="text-2xl font-bold">{summary.riskScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Screenings</span>
            </div>
            <div className="text-2xl font-bold">{summary.totalResults}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Unread Alerts</span>
            </div>
            <div className="text-2xl font-bold">{summary.unreadAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileWarning className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Remediation Requests</span>
            </div>
            <div className="text-2xl font-bold">{summary.totalRequests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Screening Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Screening Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={summary.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry) => {
                      const catKey = Object.entries(CATEGORY_LABELS).find(([, v]) => v === entry.name)?.[0] ?? "";
                      return <Cell key={catKey} fill={CATEGORY_COLORS[catKey] ?? "#6b7280"} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name.toLowerCase()] ?? "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remediation Status */}
      {requestStatusData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Remediation Request Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={requestStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {requestStatusData.map((entry) => (
                    <Cell key={entry.name} fill={REQUEST_STATUS_COLORS[entry.name.toLowerCase()] ?? "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}