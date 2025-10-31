import { Switch, Route, Redirect } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageProvider } from "@/lib/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { wsClient } from "@/lib/websocket";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Displays from "@/pages/displays";
import Content from "@/pages/content";
import Templates from "@/pages/templates";
import Schedules from "@/pages/schedules";
import AdvancedScheduling from "@/pages/advanced-scheduling";
import Groups from "@/pages/groups";
import Playlists from "@/pages/playlists";
import PlaylistDetail from "@/pages/playlist-detail";
import SyncGroups from "@/pages/sync-groups";
import Analytics from "@/pages/analytics";
import Documentation from "@/pages/documentation";
import Downloads from "@/pages/downloads";
import Releases from "@/pages/releases";
import Settings from "@/pages/settings";
import Team from "@/pages/team";
import Permissions from "@/pages/permissions";
import Organization from "@/pages/organization";
import AuditLogs from "@/pages/audit-logs";
import Developer from "@/pages/developer";
import AcceptInvitation from "@/pages/accept-invitation";
import Install from "@/pages/install";
import Player from "@/pages/player";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" data-testid="button-user-menu">
          <User className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{userName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} data-testid="button-logout">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function ProtectedRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/displays" component={() => <ProtectedRoute component={Displays} />} />
      <Route path="/content" component={() => <ProtectedRoute component={Content} />} />
      <Route path="/templates" component={() => <ProtectedRoute component={Templates} />} />
      <Route path="/schedules" component={() => <ProtectedRoute component={Schedules} />} />
      <Route path="/advanced-scheduling" component={() => <ProtectedRoute component={AdvancedScheduling} />} />
      <Route path="/groups" component={() => <ProtectedRoute component={Groups} />} />
      <Route path="/playlists" component={() => <ProtectedRoute component={Playlists} />} />
      <Route path="/playlists/:id" component={() => <ProtectedRoute component={PlaylistDetail} />} />
      <Route path="/sync-groups" component={() => <ProtectedRoute component={SyncGroups} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/documentation" component={() => <ProtectedRoute component={Documentation} />} />
      <Route path="/downloads" component={() => <ProtectedRoute component={Downloads} />} />
      <Route path="/releases" component={() => <ProtectedRoute component={Releases} />} />
      <Route path="/install" component={() => <ProtectedRoute component={Install} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/team" component={() => <ProtectedRoute component={Team} />} />
      <Route path="/permissions" component={() => <ProtectedRoute component={Permissions} />} />
      <Route path="/organization" component={() => <ProtectedRoute component={Organization} />} />
      <Route path="/audit-logs" component={() => <ProtectedRoute component={AuditLogs} />} />
      <Route path="/developer" component={() => <ProtectedRoute component={Developer} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  useEffect(() => {
    wsClient.connect();

    wsClient.on("display_added", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/displays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    });

    wsClient.on("display_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/displays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    });

    wsClient.on("display_deleted", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/displays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    });

    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="evoflow-theme">
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              {/* Routes without sidebar: Landing, Player, Login, Register, Accept Invitation */}
              <Switch>
                <Route path="/" component={Landing} />
                <Route path="/player" component={Player} />
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/accept-invitation/:token" component={AcceptInvitation} />
                <Route>
                  <SidebarProvider style={style as React.CSSProperties}>
                    <div className="flex h-screen w-full">
                      <AppSidebar />
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <header className="flex items-center justify-between p-3 md:p-4 border-b bg-background">
                          <SidebarTrigger data-testid="button-sidebar-toggle" />
                          <div className="flex items-center gap-1 md:gap-2">
                            <UserMenu />
                            <NotificationBell />
                            <LanguageToggle />
                            <ThemeToggle />
                          </div>
                        </header>
                        <main className="flex-1 overflow-y-auto">
                          <ProtectedRouter />
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                </Route>
              </Switch>
              <PWAInstallPrompt />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
