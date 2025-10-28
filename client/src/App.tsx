import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { wsClient } from "@/lib/websocket";
import Dashboard from "@/pages/dashboard";
import Displays from "@/pages/displays";
import Content from "@/pages/content";
import Schedules from "@/pages/schedules";
import Groups from "@/pages/groups";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/displays" component={Displays} />
      <Route path="/content" component={Content} />
      <Route path="/schedules" component={Schedules} />
      <Route path="/groups" component={Groups} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
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
      <ThemeProvider defaultTheme="light" storageKey="videomood-theme">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-y-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
