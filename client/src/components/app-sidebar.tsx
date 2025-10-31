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
  Download,
  Package,
  UserCog,
  Shield,
  Building2,
  ScrollText,
  Code,
  LayoutTemplate,
  Smartphone,
  ChevronRight,
  MonitorPlay,
  FileText,
  Clock,
  Laptop,
  Building,
  Wrench,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-provider";

// Struttura menu organizzata per sezioni
const menuGroups = [
  // Dashboard - standalone
  {
    type: "single" as const,
    titleKey: "dashboard" as const,
    url: "/dashboard",
    icon: LayoutDashboard,
    testId: "link-dashboard",
  },
  // Gestione Display
  {
    type: "group" as const,
    titleKey: "displaysMenu" as const,
    icon: MonitorPlay,
    defaultOpen: true,
    items: [
      {
        titleKey: "displays" as const,
        url: "/displays",
        icon: Monitor,
        testId: "link-displays",
      },
      {
        titleKey: "groups" as const,
        url: "/groups",
        icon: Users,
        testId: "link-groups",
      },
      {
        titleKey: "syncGroups" as const,
        url: "/sync-groups",
        icon: Layers,
        testId: "link-sync-groups",
      },
    ],
  },
  // Contenuti
  {
    type: "group" as const,
    titleKey: "contentMenu" as const,
    icon: FileText,
    defaultOpen: true,
    items: [
      {
        titleKey: "contentLibrary" as const,
        url: "/content",
        icon: FolderOpen,
        testId: "link-content",
      },
      {
        titleKey: "templates" as const,
        url: "/templates",
        icon: LayoutTemplate,
        testId: "link-templates",
      },
      {
        titleKey: "playlists" as const,
        url: "/playlists",
        icon: Music,
        testId: "link-playlists",
      },
    ],
  },
  // Programmazione
  {
    type: "group" as const,
    titleKey: "schedulingMenu" as const,
    icon: Clock,
    defaultOpen: false,
    items: [
      {
        titleKey: "schedules" as const,
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
    ],
  },
  // Analytics - standalone
  {
    type: "single" as const,
    titleKey: "analytics" as const,
    url: "/analytics",
    icon: BarChart3,
    testId: "link-analytics",
  },
  // Player & Downloads
  {
    type: "group" as const,
    titleKey: "playerMenu" as const,
    icon: Laptop,
    defaultOpen: false,
    items: [
      {
        titleKey: "playerSetup" as const,
        url: "/settings",
        icon: Settings,
        testId: "link-settings",
      },
      {
        titleKey: "downloads" as const,
        url: "/downloads",
        icon: Download,
        testId: "link-downloads",
      },
      {
        titleKey: "releasesTitle" as const,
        url: "/releases",
        icon: Package,
        testId: "link-releases",
      },
      {
        titleKey: "installApp" as const,
        url: "/install",
        icon: Smartphone,
        testId: "link-install",
      },
    ],
  },
  // Organizzazione
  {
    type: "group" as const,
    titleKey: "organizationMenu" as const,
    icon: Building,
    defaultOpen: false,
    items: [
      {
        titleKey: "team" as const,
        url: "/team",
        icon: UserCog,
        testId: "link-team",
      },
      {
        titleKey: "permissions" as const,
        url: "/permissions",
        icon: Shield,
        testId: "link-permissions",
      },
      {
        titleKey: "organization" as const,
        url: "/organization",
        icon: Building2,
        testId: "link-organization",
      },
      {
        titleKey: "auditLogs" as const,
        url: "/audit-logs",
        icon: ScrollText,
        testId: "link-audit-logs",
      },
    ],
  },
  // Sviluppatori
  {
    type: "group" as const,
    titleKey: "developerMenu" as const,
    icon: Wrench,
    defaultOpen: false,
    items: [
      {
        titleKey: "developer" as const,
        url: "/developer",
        icon: Code,
        testId: "link-developer",
      },
      {
        titleKey: "documentation" as const,
        url: "/documentation",
        icon: BookOpen,
        testId: "link-documentation",
      },
    ],
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
              {menuGroups.map((group, idx) => {
                if (group.type === "single") {
                  // Voce menu singola
                  return (
                    <SidebarMenuItem key={group.titleKey}>
                      <SidebarMenuButton 
                        asChild 
                        data-active={location === group.url}
                        className="py-3"
                      >
                        <Link href={group.url} data-testid={group.testId}>
                          <group.icon className="h-5 w-5" />
                          <span className="font-medium">{t(group.titleKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                } else {
                  // Gruppo collapsibile
                  const isActive = group.items.some(item => location === item.url);
                  
                  return (
                    <Collapsible
                      key={group.titleKey}
                      defaultOpen={group.defaultOpen || isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="py-3" data-testid={`group-${group.titleKey}`}>
                            <group.icon className="h-5 w-5" />
                            <span className="font-medium">{t(group.titleKey)}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {group.items.map((item) => (
                              <SidebarMenuSubItem key={item.titleKey}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location === item.url}
                                >
                                  <Link href={item.url} data-testid={item.testId}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{t(item.titleKey)}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
