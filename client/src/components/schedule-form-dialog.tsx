import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertScheduleSchema, type InsertSchedule, type Display, type DisplayGroup, type ContentItem } from "@shared/schema";
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

  const form = useForm<InsertSchedule>({
    resolver: zodResolver(insertScheduleSchema),
    defaultValues: {
      name: "",
      contentId: "",
      displayId: "",
      groupId: "",
      startTime: "",
      endTime: "",
      recurrence: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSchedule) => {
      const payload: any = { ...data };
      if (!payload.displayId) delete payload.displayId;
      if (!payload.groupId) delete payload.groupId;
      if (!payload.recurrence) delete payload.recurrence;
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

  const onSubmit = (data: InsertSchedule) => {
    createMutation.mutate(data);
  };

  const targetType = form.watch("displayId") ? "display" : form.watch("groupId") ? "group" : "";

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
                      {content?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("groupId", "");
                      }}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-display">
                          <SelectValue placeholder="Select display" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {displays?.map((display) => (
                          <SelectItem key={display.id} value={display.id}>
                            {display.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("displayId", "");
                      }}
                      value={field.value || ""}
                      disabled={!!form.watch("displayId")}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-group">
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups?.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
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
              name="recurrence"
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
