import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Display } from "@shared/schema";
import { DisplayCard } from "@/components/display-card";
import { EmptyState } from "@/components/empty-state";
import { DisplayFormDialog } from "@/components/display-form-dialog";
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
import { Monitor, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Displays() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDisplay, setSelectedDisplay] = useState<Display | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editDisplay, setEditDisplay] = useState<Display | null>(null);
  const [deleteDisplay, setDeleteDisplay] = useState<Display | null>(null);
  const { toast } = useToast();

  const { data: displays, isLoading } = useQuery<Display[]>({
    queryKey: ["/api/displays"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/displays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/displays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Display removed successfully",
      });
      setDeleteDisplay(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove display",
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Displays</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your digital signage displays
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          data-testid="button-add-display"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Display
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search displays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-displays"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-72 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredDisplays && filteredDisplays.length > 0 ? (
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
        <EmptyState
          icon={Monitor}
          title="No displays found"
          description={
            searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first display to get started with digital signage management"
          }
          action={
            !searchQuery && statusFilter === "all"
              ? {
                  label: "Add Display",
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
            <DialogTitle>Display Details</DialogTitle>
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
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedDisplay.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedDisplay.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">OS</p>
                  <p className="font-medium">{selectedDisplay.os}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolution</p>
                  <p className="font-medium">{selectedDisplay.resolution || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedDisplay.location || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Hash Code</p>
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

      <DisplayFormDialog
        open={!!editDisplay}
        onOpenChange={(open) => !open && setEditDisplay(null)}
        display={editDisplay || undefined}
      />

      <AlertDialog
        open={!!deleteDisplay}
        onOpenChange={(open) => !open && setDeleteDisplay(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Display</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteDisplay?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDisplay && deleteMutation.mutate(deleteDisplay.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
