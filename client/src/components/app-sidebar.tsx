import {
  LayoutDashboard,
  Monitor,
  FolderOpen,
  Calendar,
  CalendarClock,
  Users,
  Music,
  Layers,
  BarChart3,
  Settings,
  Activity,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-provider";

const menuItemsConfig = [
  {
    titleKey: "dashboard" as const,
    url: "/",
    icon: LayoutDashboard,
    testId: "link-dashboard",
  },
  {
    titleKey: "displays" as const,
    url: "/displays",
    icon: Monitor,
    testId: "link-displays",
  },
  {
    titleKey: "contentLibrary" as const,
    url: "/content",
    icon: FolderOpen,
    testId: "link-content",
  },
  {
    titleKey: "scheduling" as const,
    url: "/schedules",
    icon: Calendar,
    testId: "link-schedules",
  },
  {
    titleKey: "advancedScheduling" as const,
    url: "/advanced-scheduling",
    icon: CalendarClock,
    testId: "link-advanced-scheduling",
  },
  {
    titleKey: "groups" as const,
    url: "/groups",
    icon: Users,
    testId: "link-groups",
  },
  {
    titleKey: "playlists" as const,
    url: "/playlists",
    icon: Music,
    testId: "link-playlists",
  },
  {
    titleKey: "syncGroups" as const,
    url: "/sync-groups",
    icon: Layers,
    testId: "link-sync-groups",
  },
  {
    titleKey: "analytics" as const,
    url: "/analytics",
    icon: BarChart3,
    testId: "link-analytics",
  },
  {
    titleKey: "documentation" as const,
    url: "/documentation",
    icon: BookOpen,
    testId: "link-documentation",
  },
  {
    titleKey: "settings" as const,
    url: "/settings",
    icon: Settings,
    testId: "link-settings",
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Activity className="h-6 w-6 text-accent-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-sidebar-foreground">
              {t('appName')}
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              Digital Signage
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItemsConfig.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton 
                    asChild 
                    data-active={location === item.url}
                    className="py-3"
                  >
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
