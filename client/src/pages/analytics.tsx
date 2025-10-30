import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Monitor, Activity, FileText, Wifi, Download, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import type { Display, ContentItem, DisplayGroup, Schedule } from "@shared/schema";
import { useLanguage } from "@/lib/language-provider";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalDisplays: number;
  activeDisplays: number;
  offlineDisplays: number;
  totalContent: number;
}

interface DisplayUptimeMetric {
  displayId: string;
  displayName: string;
  uptimePercentage: number;
  totalOnlineTime: number;
  totalOfflineTime: number;
}

interface ContentPopularityMetric {
  contentId: string;
  contentName: string;
  viewCount: number;
  totalViewTime: number;
}

interface SchedulePerformanceMetric {
  scheduleId: string;
  scheduleName: string;
  successCount: number;
  failedCount: number;
  successRate: number;
}

interface TimeSeriesMetric {
  timestamp: string;
  onlineDisplays: number;
  offlineDisplays: number;
  totalViews: number;
}

interface AdvancedAnalytics {
  displayUptime: DisplayUptimeMetric[];
  contentPopularity: ContentPopularityMetric[];
  schedulePerformance: SchedulePerformanceMetric[];
  timeSeriesMetrics: TimeSeriesMetric[];
}

export default function Analytics() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{ startDate?: string; endDate?: string }>({});

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: displays = [] } = useQuery<Display[]>({
    queryKey: ["/api/displays"],
  });

  const { data: content = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const { data: groups = [] } = useQuery<DisplayGroup[]>({
    queryKey: ["/api/groups"],
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const { data: advancedAnalytics, isLoading: analyticsLoading } = useQuery<AdvancedAnalytics>({
    queryKey: ["/api/analytics/advanced", appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedFilters.startDate) params.append("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.append("endDate", appliedFilters.endDate);
      const response = await fetch(`/api/analytics/advanced?${params}`);
      if (!response.ok) throw new Error("Failed to fetch advanced analytics");
      return response.json();
    },
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (appliedFilters.startDate) params.append("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.append("endDate", appliedFilters.endDate);

      const response = await fetch(`/api/analytics/export?${params}`);
      if (!response.ok) throw new Error("Failed to export analytics");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: t("success"),
        description: t("exportCsv") + " " + t("success"),
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t("error"),
        description: t("error") + ": " + t("exportCsv"),
        variant: "destructive",
      });
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t("loadingAnalytics")}</div>
      </div>
    );
  }

  const displayStatusData = [
    { name: t("online"), value: stats?.activeDisplays || 0, color: "#10b981" },
    { name: t("offline"), value: stats?.offlineDisplays || 0, color: "#ef4444" },
  ];

  const platformData = displays.reduce((acc, display) => {
    const platform = display.os || t("unknown");
    const existing = acc.find((item) => item.name === platform);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: platform, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const contentTypeData = content.reduce((acc, item) => {
    const type =
      item.type === "image"
        ? t("images")
        : item.type === "video"
          ? t("videos")
          : item.type === "html"
            ? t("html")
            : item.type === "webpage"
              ? t("webPages")
              : t("other");
    const existing = acc.find((c) => c.name === type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{t("analyticsTitle")}</h1>
        <p className="text-muted-foreground text-sm md:text-base">{t("analyticsSubtitle")}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            {t("overview")}
          </TabsTrigger>
          <TabsTrigger value="advanced" data-testid="tab-advanced">
            {t("advancedAnalytics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalDisplays")}</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-displays">
                  {stats?.totalDisplays || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t("registeredDevices")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("activeDisplays")}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-active-displays">
                  {stats?.activeDisplays || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t("currentlyOnline")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("offlineDisplays")}</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="stat-offline-displays">
                  {stats?.offlineDisplays || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t("notConnected")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("contentItems")}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-content">
                  {stats?.totalContent || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t("mediaFiles")}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("displayStatusDistribution")}</CardTitle>
                <CardDescription>{t("displayStatusDistributionDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {displayStatusData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={displayStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {displayStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {t("noDisplayDataAvailable")}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("displaysByPlatform")}</CardTitle>
                <CardDescription>{t("displaysByPlatformDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={platformData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {t("noPlatformDataAvailable")}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("contentTypeDistribution")}</CardTitle>
                <CardDescription>{t("contentTypeDistributionDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {contentTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={contentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {contentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {t("noContentDataAvailable")}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("systemOverview")}</CardTitle>
                <CardDescription>{t("systemOverviewDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("groups")}</span>
                    <span className="text-2xl font-bold" data-testid="stat-groups">
                      {groups.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("schedules")}</span>
                    <span className="text-2xl font-bold" data-testid="stat-schedules">
                      {schedules.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("uptimeRate")}</span>
                    <span className="text-2xl font-bold text-green-600">
                      {stats && stats.totalDisplays > 0
                        ? `${Math.round((stats.activeDisplays / stats.totalDisplays) * 100)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("avgContentPerDisplay")}</span>
                    <span className="text-2xl font-bold">
                      {stats && stats.totalDisplays > 0 && content.length > 0
                        ? Math.round(content.length / stats.totalDisplays)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("dateRange")}
              </CardTitle>
              <CardDescription>Filter analytics by date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">{t("from")}</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">{t("to")}</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleApplyFilters}
                    className="flex-1"
                    data-testid="button-apply-filters"
                  >
                    {t("applyFilters")}
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="flex items-center gap-2"
                    data-testid="button-export-csv"
                  >
                    <Download className="h-4 w-4" />
                    {t("exportCsv")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">{t("loadingAnalytics")}</div>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t("displayUptime")}</CardTitle>
                  <CardDescription>Uptime percentage per display</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics?.displayUptime && advancedAnalytics.displayUptime.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={advancedAnalytics.displayUptime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="displayName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="uptimePercentage" fill="#10b981" name={t("uptimePercentage")} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      {t("noData")}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("contentPopularity")}</CardTitle>
                  <CardDescription>Most viewed content items</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics?.contentPopularity &&
                  advancedAnalytics.contentPopularity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={advancedAnalytics.contentPopularity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="contentName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="viewCount" fill="#3b82f6" name={t("viewCount")} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      {t("noData")}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("schedulePerformance")}</CardTitle>
                  <CardDescription>Schedule execution success rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics?.schedulePerformance &&
                  advancedAnalytics.schedulePerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={advancedAnalytics.schedulePerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="scheduleName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="successRate" fill="#10b981" name={t("successRate")} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      {t("noData")}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("timeSeries")}</CardTitle>
                  <CardDescription>Metrics over time (hourly)</CardDescription>
                </CardHeader>
                <CardContent>
                  {advancedAnalytics?.timeSeriesMetrics &&
                  advancedAnalytics.timeSeriesMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={advancedAnalytics.timeSeriesMetrics.slice().reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="onlineDisplays"
                          stroke="#10b981"
                          name={t("onlineDisplays")}
                        />
                        <Line
                          type="monotone"
                          dataKey="offlineDisplays"
                          stroke="#ef4444"
                          name={t("offlineDisplays")}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalViews"
                          stroke="#3b82f6"
                          name={t("totalViews")}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      {t("noData")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
