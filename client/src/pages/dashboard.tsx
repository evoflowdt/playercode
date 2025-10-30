import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { DisplayCard } from "@/components/display-card";
import { Monitor, Activity, AlertCircle, FolderOpen } from "lucide-react";
import { DashboardStats, Display } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/language-provider";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function Dashboard() {
  const { t } = useLanguage();
  
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: displays, isLoading: displaysLoading } = useQuery<Display[]>({
    queryKey: ["/api/displays"],
  });

  const recentDisplays = displays?.slice(0, 8) || [];
  const displaysWithLocation = displays?.filter(d => d.latitude && d.longitude) || [];
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return t('online');
      case "offline":
        return t('offline');
      case "warning":
        return t('warning');
      default:
        return status;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{t('dashboardTitle')}</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {t('dashboardSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 h-32 animate-pulse bg-muted" />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title={t('totalDisplays')}
              value={stats?.totalDisplays || 0}
              icon={Monitor}
              variant="default"
              testId="stat-total-displays"
            />
            <StatsCard
              title={t('activeNow')}
              value={stats?.activeDisplays || 0}
              icon={Activity}
              variant="success"
              trend={{
                value: `+12% ${t('fromLastWeek')}`,
                isPositive: true,
              }}
              testId="stat-active-displays"
            />
            <StatsCard
              title={t('offlineDisplays')}
              value={stats?.offlineDisplays || 0}
              icon={AlertCircle}
              variant="destructive"
              testId="stat-offline-displays"
            />
            <StatsCard
              title={t('contentItems')}
              value={stats?.totalContent || 0}
              icon={FolderOpen}
              variant="default"
              testId="stat-total-content"
            />
          </>
        )}
      </div>

      <Card className="p-4 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold tracking-tight mb-4">{t('displayLocations')}</h2>
        <div className="h-64 md:h-96 rounded-lg overflow-hidden border">
          {displaysWithLocation.length > 0 ? (
            <MapContainer
              center={[
                parseFloat(displaysWithLocation[0].latitude!),
                parseFloat(displaysWithLocation[0].longitude!),
              ]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {displaysWithLocation.map((display) => (
                <Marker
                  key={display.id}
                  position={[
                    parseFloat(display.latitude!),
                    parseFloat(display.longitude!),
                  ]}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-medium">{display.name}</p>
                      <Badge
                        className={`mt-1 ${
                          display.status === "online"
                            ? "bg-success"
                            : "bg-destructive"
                        } text-white border-0`}
                      >
                        {getStatusText(display.status)}
                      </Badge>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted">
              <p className="text-muted-foreground">
                {t('noDisplaysWithLocation')}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold tracking-tight">{t('recentDisplays')}</h2>
        </div>
        {displaysLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : recentDisplays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {recentDisplays.map((display) => (
              <DisplayCard key={display.id} display={display} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center shadow-sm">
            <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('noDisplaysRegistered')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
