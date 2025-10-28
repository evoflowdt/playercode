import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScheduleWithDetails } from "@shared/schema";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Schedules() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: schedules, isLoading } = useQuery<ScheduleWithDetails[]>({
    queryKey: ["/api/schedules"],
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Scheduling</h1>
          <p className="text-muted-foreground">
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
              className="p-6 hover-elevate cursor-pointer"
              data-testid={`card-schedule-${schedule.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium">{schedule.name}</h3>
                <Badge variant={schedule.active ? "default" : "secondary"}>
                  {schedule.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Content: {schedule.contentName}</span>
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
    </div>
  );
}
