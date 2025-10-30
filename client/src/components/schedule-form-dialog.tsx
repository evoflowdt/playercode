import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect } from "react";
import { type Display, type DisplayGroup, type ContentItem, type Playlist, type ScheduleWithDetails } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const scheduleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sourceType: z.enum(["content", "playlist"]),
  contentId: z.string().optional(),
  playlistId: z.string().optional(),
  targetType: z.enum(["display", "group"]),
  targetId: z.string().min(1, "Target is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  repeat: z.string().optional(),
  priority: z.number().int().min(0).max(100).default(0),
}).refine(
  (data) => (data.sourceType === "content" && data.contentId) || (data.sourceType === "playlist" && data.playlistId),
  { message: "Either content or playlist must be selected", path: ["contentId"] }
);

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ScheduleWithDetails;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
}: ScheduleFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!schedule;

  const { data: displays } = useQuery<Display[]>({
    queryKey: ["/api/displays"],
  });

  const { data: groups } = useQuery<DisplayGroup[]>({
    queryKey: ["/api/groups"],
  });

  const { data: content } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: schedule ? {
      name: schedule.name,
      sourceType: schedule.playlistId ? "playlist" : "content",
      contentId: schedule.contentId || "",
      playlistId: schedule.playlistId || "",
      targetType: schedule.targetType as "display" | "group",
      targetId: schedule.targetId,
      startTime: new Date(schedule.startTime).toISOString().slice(0, 16),
      endTime: new Date(schedule.endTime).toISOString().slice(0, 16),
      repeat: schedule.repeat || "",
      priority: schedule.priority ?? 0,
    } : {
      name: "",
      sourceType: "content",
      contentId: "",
      playlistId: "",
      targetType: "display",
      targetId: "",
      startTime: "",
      endTime: "",
      repeat: "",
      priority: 0,
    },
  });

  // Reset form when schedule changes or dialog opens/closes
  useEffect(() => {
    if (open && schedule) {
      // Editing mode - populate with schedule data
      form.reset({
        name: schedule.name,
        sourceType: schedule.playlistId ? "playlist" : "content",
        contentId: schedule.contentId || "",
        playlistId: schedule.playlistId || "",
        targetType: schedule.targetType as "display" | "group",
        targetId: schedule.targetId,
        startTime: new Date(schedule.startTime).toISOString().slice(0, 16),
        endTime: new Date(schedule.endTime).toISOString().slice(0, 16),
        repeat: schedule.repeat || "",
        priority: schedule.priority ?? 0,
      });
    } else if (open && !schedule) {
      // Create mode - reset to empty
      form.reset({
        name: "",
        sourceType: "content",
        contentId: "",
        playlistId: "",
        targetType: "display",
        targetId: "",
        startTime: "",
        endTime: "",
        repeat: "",
        priority: 0,
      });
    } else if (!open) {
      // Dialog closed - reset to avoid stale data
      form.reset();
    }
  }, [open, schedule, form]);

  const createMutation = useMutation({
    mutationFn: (data: ScheduleFormValues) => {
      const payload: any = {
        name: data.name,
        targetType: data.targetType,
        targetId: data.targetId,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        priority: data.priority,
      };
      
      // Add either contentId or playlistId based on sourceType
      if (data.sourceType === "content" && data.contentId) {
        payload.contentId = data.contentId;
      } else if (data.sourceType === "playlist" && data.playlistId) {
        payload.playlistId = data.playlistId;
      }
      
      if (data.repeat) {
        payload.repeat = data.repeat;
      }
      return apiRequest("POST", "/api/schedules", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ScheduleFormValues) => {
      const payload: any = {
        name: data.name,
        targetType: data.targetType,
        targetId: data.targetId,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        priority: data.priority,
      };
      
      // Clear both contentId and playlistId first, then set the correct one
      payload.contentId = null;
      payload.playlistId = null;
      
      if (data.sourceType === "content" && data.contentId) {
        payload.contentId = data.contentId;
      } else if (data.sourceType === "playlist" && data.playlistId) {
        payload.playlistId = data.playlistId;
      }
      
      if (data.repeat) {
        payload.repeat = data.repeat;
      }
      
      return apiRequest("PATCH", `/api/schedules/${schedule!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const targetType = form.watch("targetType");
  const sourceType = form.watch("sourceType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Schedule" : "Create Schedule"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Morning Promotional Content"
                      data-testid="input-schedule-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-source-type">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="content">Single Content</SelectItem>
                      <SelectItem value="playlist">Playlist (Multiple Videos)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sourceType === "content" && (
              <FormField
                control={form.control}
                name="contentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-content">
                          <SelectValue placeholder="Select content" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {content && content.length > 0 ? (
                          content.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No content available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {sourceType === "playlist" && (
              <FormField
                control={form.control}
                name="playlistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlist</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-playlist">
                          <SelectValue placeholder="Select playlist" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {playlists && playlists.length > 0 ? (
                          playlists.map((playlist) => (
                            <SelectItem key={playlist.id} value={playlist.id}>
                              {playlist.name}
                              {playlist.description && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  - {playlist.description}
                                </span>
                              )}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No playlists available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-target-type">
                          <SelectValue placeholder="Select target type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="display">Display</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-target">
                          <SelectValue placeholder={`Select ${targetType}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {targetType === "display" && displays ? (
                          displays.length > 0 ? (
                            displays.map((display) => (
                              <SelectItem key={display.id} value={display.id}>
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span>{display.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({display.os})
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      display.status === 'online' 
                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                    }`}>
                                      {display.status}
                                    </span>
                                  </div>
                                  <code className="text-xs text-muted-foreground font-mono">
                                    ID: {display.id}
                                  </code>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No displays available
                            </SelectItem>
                          )
                        ) : targetType === "group" && groups ? (
                          groups.length > 0 ? (
                            groups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No groups available
                            </SelectItem>
                          )
                        ) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        data-testid="input-start-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        data-testid="input-end-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="repeat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-recurrence">
                        <SelectValue placeholder="One-time only" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority (0-100)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      max="100"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-priority"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Higher values take precedence when multiple schedules overlap. Default is 0.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-schedule"
              >
                {isEditing 
                  ? (updateMutation.isPending ? "Updating..." : "Update Schedule")
                  : (createMutation.isPending ? "Creating..." : "Create Schedule")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
