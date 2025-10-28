import {
  LayoutDashboard,
  Monitor,
  FolderOpen,
  Calendar,
  Users,
  Music,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
    titleKey: "analytics" as const,
    url: "/analytics",
    icon: BarChart3,
    testId: "link-analytics",
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold px-4 py-6">
            {t('appName')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItemsConfig.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
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
