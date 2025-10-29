import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ScheduleWithDetails } from "@shared/schema";
import { EmptyState } from "@/components/empty-state";
import { ScheduleFormDialog } from "@/components/schedule-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Plus, Clock, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Schedules() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleWithDetails | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<ScheduleWithDetails | null>(null);
  const { toast } = useToast();

  const { data: schedules, isLoading } = useQuery<ScheduleWithDetails[]>({
    queryKey: ["/api/schedules"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      setDeleteSchedule(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Scheduling</h1>
          <p className="text-muted-foreground text-base">
            Create and manage content schedules for your displays
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          data-testid="button-add-schedule"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted" />
          ))}
        </div>
      ) : schedules && schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className="p-6 hover-elevate"
              data-testid={`card-schedule-${schedule.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium">{schedule.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={schedule.active ? "default" : "secondary"}>
                    {schedule.active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditSchedule(schedule);
                    }}
                    data-testid={`button-edit-schedule-${schedule.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteSchedule(schedule);
                    }}
                    data-testid={`button-delete-schedule-${schedule.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {schedule.playlistName 
                      ? `Playlist: ${schedule.playlistName}` 
                      : `Content: ${schedule.contentName}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(schedule.startTime), "MMM d, HH:mm")} -{" "}
                    {format(new Date(schedule.endTime), "MMM d, HH:mm")}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Target: {schedule.targetName}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No schedules found"
          description="Create your first schedule to automate content playback on your displays"
          action={{
            label: "Create Schedule",
            onClick: () => setShowAddDialog(true),
            testId: "button-add-first-schedule",
          }}
        />
      )}

      <ScheduleFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
      
      <ScheduleFormDialog
        open={!!editSchedule}
        onOpenChange={(open) => !open && setEditSchedule(null)}
        schedule={editSchedule || undefined}
      />

      <AlertDialog
        open={!!deleteSchedule}
        onOpenChange={(open) => !open && setDeleteSchedule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteSchedule?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSchedule && deleteMutation.mutate(deleteSchedule.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
