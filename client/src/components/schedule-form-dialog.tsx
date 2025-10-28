import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { type Display, type DisplayGroup, type ContentItem } from "@shared/schema";
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
  contentId: z.string().min(1, "Content is required"),
  targetType: z.enum(["display", "group"]),
  targetId: z.string().min(1, "Target is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  repeat: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
}: ScheduleFormDialogProps) {
  const { toast } = useToast();

  const { data: displays } = useQuery<Display[]>({
    queryKey: ["/api/displays"],
  });

  const { data: groups } = useQuery<DisplayGroup[]>({
    queryKey: ["/api/groups"],
  });

  const { data: content } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: "",
      contentId: "",
      targetType: "display",
      targetId: "",
      startTime: "",
      endTime: "",
      repeat: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ScheduleFormValues) => {
      const payload: any = {
        name: data.name,
        contentId: data.contentId,
        targetType: data.targetType,
        targetId: data.targetId,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      };
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

  const onSubmit = (data: ScheduleFormValues) => {
    createMutation.mutate(data);
  };

  const targetType = form.watch("targetType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Schedule</DialogTitle>
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
                                {display.name}
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
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-recurrence">
                        <SelectValue placeholder="One-time only" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={createMutation.isPending}
                data-testid="button-submit-schedule"
              >
                {createMutation.isPending ? "Creating..." : "Create Schedule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
