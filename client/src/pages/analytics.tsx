import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Activity, FileText, Wifi } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { Display, ContentItem, DisplayGroup, Schedule } from "@shared/schema";
import { useLanguage } from "@/lib/language-provider";

interface DashboardStats {
  totalDisplays: number;
  activeDisplays: number;
  offlineDisplays: number;
  totalContent: number;
}

export default function Analytics() {
  const { t } = useLanguage();
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

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t('loadingAnalytics')}</div>
      </div>
    );
  }

  const displayStatusData = [
    { name: "Online", value: stats?.activeDisplays || 0, color: "#10b981" },
    { name: "Offline", value: stats?.offlineDisplays || 0, color: "#ef4444" },
  ];

  const platformData = displays.reduce((acc, display) => {
    const platform = display.os || "Unknown";
    const existing = acc.find(item => item.name === platform);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: platform, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const contentTypeData = content.reduce((acc, item) => {
    const type = item.type === 'image' ? 'Images' : 
                 item.type === 'video' ? 'Videos' : 
                 item.type === 'html' ? 'HTML' :
                 item.type === 'webpage' ? 'Web Pages' : 'Other';
    const existing = acc.find(c => c.name === type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t('analyticsDashboard')}</h1>
        <p className="text-muted-foreground text-base">
          {t('analyticsDashboardDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalDisplays')}</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-displays">
              {stats?.totalDisplays || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('registeredDevices')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeDisplays')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-active-displays">
              {stats?.activeDisplays || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('currentlyOnline')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('offlineDisplays')}</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-offline-displays">
              {stats?.offlineDisplays || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('notConnected')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('contentItems')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-content">
              {stats?.totalContent || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('mediaFiles')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('displayStatusDistribution')}</CardTitle>
            <CardDescription>{t('displayStatusDistributionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {displayStatusData.some(d => d.value > 0) ? (
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
                {t('noDisplayDataAvailable')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('displaysByPlatform')}</CardTitle>
            <CardDescription>{t('displaysByPlatformDesc')}</CardDescription>
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
                {t('noPlatformDataAvailable')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('contentTypeDistribution')}</CardTitle>
            <CardDescription>{t('contentTypeDistributionDesc')}</CardDescription>
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
                {t('noContentDataAvailable')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('systemOverview')}</CardTitle>
            <CardDescription>{t('systemOverviewDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('groups')}</span>
                <span className="text-2xl font-bold" data-testid="stat-groups">
                  {groups.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('schedules')}</span>
                <span className="text-2xl font-bold" data-testid="stat-schedules">
                  {schedules.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('uptimeRate')}</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats && stats.totalDisplays > 0
                    ? `${Math.round((stats.activeDisplays / stats.totalDisplays) * 100)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('avgContentPerDisplay')}</span>
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
    </div>
  );
}
