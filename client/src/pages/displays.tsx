import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Display } from "@shared/schema";
import { DisplayCard } from "@/components/display-card";
import { DisplayTableView } from "@/components/display-table-view";
import { EmptyState } from "@/components/empty-state";
import { DisplayFormDialog } from "@/components/display-form-dialog";
import { DisplayEditDialog } from "@/components/display-edit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Monitor, Plus, Search, LayoutGrid, List, Trash2, CheckSquare, Square } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-provider";
import { Checkbox } from "@/components/ui/checkbox";

type ViewMode = "grid" | "list";

export default function Displays() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedDisplay, setSelectedDisplay] = useState<Display | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editDisplay, setEditDisplay] = useState<Display | null>(null);
  const [deleteDisplay, setDeleteDisplay] = useState<Display | null>(null);
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [bulkUpdateName, setBulkUpdateName] = useState("");
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<string>("");
  const { toast } = useToast();
  
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

  const { data: displays, isLoading } = useQuery<Display[]>({
    queryKey: ["/api/displays"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/displays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/displays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t('success'),
        description: t('displayDeleted'),
      });
      setDeleteDisplay(null);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedDeleteDisplay'),
        variant: "destructive",
      });
    },
  });

  const filteredDisplays = displays?.filter((display) => {
    const matchesSearch =
      display.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      display.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || display.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('displaysTitle')}</h1>
          <p className="text-muted-foreground text-base">
            {t('displaysSubtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          data-testid="button-add-display"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('addDisplay')}
        </Button>
      </div>

      <Card className="p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchDisplays')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-displays"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
              <SelectValue placeholder={t('filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="online">{t('online')}</SelectItem>
              <SelectItem value="offline">{t('offline')}</SelectItem>
              <SelectItem value="warning">{t('warning')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="h-72 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <Card className="h-96 animate-pulse bg-muted" />
        )
      ) : filteredDisplays && filteredDisplays.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDisplays.map((display) => (
              <DisplayCard
                key={display.id}
                display={display}
                onViewDetails={setSelectedDisplay}
                onEdit={setEditDisplay}
                onDelete={setDeleteDisplay}
              />
            ))}
          </div>
        ) : (
          <DisplayTableView
            displays={filteredDisplays}
            onViewDetails={setSelectedDisplay}
            onEdit={setEditDisplay}
            onDelete={setDeleteDisplay}
          />
        )
      ) : (
        <EmptyState
          icon={Monitor}
          title={t('noDisplaysFound')}
          description={
            searchQuery || statusFilter !== "all"
              ? t('tryAdjustingFilters')
              : t('addFirstDisplay')
          }
          action={
            !searchQuery && statusFilter === "all"
              ? {
                  label: t('addDisplay'),
                  onClick: () => setShowAddDialog(true),
                  testId: "button-add-first-display",
                }
              : undefined
          }
        />
      )}

      <Dialog
        open={!!selectedDisplay}
        onOpenChange={() => setSelectedDisplay(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('displayDetails')}</DialogTitle>
          </DialogHeader>
          {selectedDisplay && (
            <div className="space-y-4">
              {selectedDisplay.screenshot && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedDisplay.screenshot}
                    alt={selectedDisplay.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('name')}</p>
                  <p className="font-medium">{selectedDisplay.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('status')}</p>
                  <p className="font-medium">{getStatusText(selectedDisplay.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('os')}</p>
                  <p className="font-medium">{selectedDisplay.os}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('resolution')}</p>
                  <p className="font-medium">{selectedDisplay.resolution || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">{t('location')}</p>
                  <p className="font-medium">{selectedDisplay.location || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">{t('hashCode')}</p>
                  <p className="font-mono text-sm">{selectedDisplay.hashCode}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DisplayFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      {editDisplay && (
        <DisplayEditDialog
          open={!!editDisplay}
          onOpenChange={(open) => !open && setEditDisplay(null)}
          display={editDisplay}
        />
      )}

      <AlertDialog
        open={!!deleteDisplay}
        onOpenChange={(open) => !open && setDeleteDisplay(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeDisplay')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteMessage').replace('{name}', deleteDisplay?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDisplay && deleteMutation.mutate(deleteDisplay.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
