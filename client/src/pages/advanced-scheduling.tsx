import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, Clock, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { 
  SchedulingRule, 
  ContentPriority, 
  Transition,
  Schedule 
} from "@shared/schema";

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const ruleFormSchema = z.object({
  scheduleId: z.string().min(1, "Schedule is required"),
  ruleType: z.enum(["day_of_week", "time_range", "date_range"]),
  ruleConfig: z.string().min(1, "Configuration is required"),
  priority: z.coerce.number().min(0).max(100),
});

const priorityFormSchema = z.object({
  contentId: z.string().min(1, "Content is required"),
  priority: z.coerce.number().min(0).max(100),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

const transitionFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  transitionType: z.enum(["fade", "slide", "zoom"]),
  duration: z.coerce.number().min(100).max(5000),
  config: z.string().optional(),
});

export default function AdvancedScheduling() {
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const { toast } = useToast();

  // Fetch data
  const { data: rules } = useQuery<SchedulingRule[]>({
    queryKey: ["/api/scheduling/rules"],
  });

  const { data: priorities } = useQuery<ContentPriority[]>({
    queryKey: ["/api/content/priorities"],
  });

  const { data: transitions } = useQuery<Transition[]>({
    queryKey: ["/api/transitions"],
  });

  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  // Forms
  const ruleForm = useForm<z.infer<typeof ruleFormSchema>>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      priority: 50,
      ruleType: "day_of_week",
      ruleConfig: "",
      scheduleId: "",
    },
  });

  const priorityForm = useForm<z.infer<typeof priorityFormSchema>>({
    resolver: zodResolver(priorityFormSchema),
    defaultValues: {
      priority: 50,
      contentId: "",
    },
  });

  const transitionForm = useForm<z.infer<typeof transitionFormSchema>>({
    resolver: zodResolver(transitionFormSchema),
    defaultValues: {
      name: "",
      transitionType: "fade",
      duration: 1000,
      config: "{}",
    },
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: (data: z.infer<typeof ruleFormSchema>) =>
      apiRequest("POST", "/api/scheduling/rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduling/rules"] });
      toast({ title: "Success", description: "Rule created successfully" });
      setShowRuleDialog(false);
      ruleForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create rule", variant: "destructive" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/scheduling/rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduling/rules"] });
      toast({ title: "Success", description: "Rule deleted successfully" });
    },
  });

  const createPriorityMutation = useMutation({
    mutationFn: (data: z.infer<typeof priorityFormSchema>) =>
      apiRequest("POST", "/api/content/priorities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/priorities"] });
      toast({ title: "Success", description: "Priority created successfully" });
      setShowPriorityDialog(false);
      priorityForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create priority", variant: "destructive" });
    },
  });

  const deletePriorityMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/content/priorities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/priorities"] });
      toast({ title: "Success", description: "Priority deleted successfully" });
    },
  });

  const createTransitionMutation = useMutation({
    mutationFn: (data: z.infer<typeof transitionFormSchema>) =>
      apiRequest("POST", "/api/transitions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transitions"] });
      toast({ title: "Success", description: "Transition created successfully" });
      setShowTransitionDialog(false);
      transitionForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create transition", variant: "destructive" });
    },
  });

  const deleteTransitionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/transitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transitions"] });
      toast({ title: "Success", description: "Transition deleted successfully" });
    },
  });

  const handleRuleSubmit = (values: z.infer<typeof ruleFormSchema>) => {
    try {
      // Parse JSON config and send as object
      const parsedConfig = JSON.parse(values.ruleConfig);
      createRuleMutation.mutate({
        ...values,
        ruleConfig: parsedConfig,
      });
    } catch (error) {
      toast({
        title: "Invalid Configuration",
        description: "Rule configuration must be valid JSON",
        variant: "destructive",
      });
    }
  };

  const handlePrioritySubmit = (values: z.infer<typeof priorityFormSchema>) => {
    createPriorityMutation.mutate(values);
  };

  const handleTransitionSubmit = (values: z.infer<typeof transitionFormSchema>) => {
    // Parse JSON config if provided
    let submitData = { ...values };
    if (values.config && values.config.trim()) {
      try {
        submitData.config = JSON.parse(values.config);
      } catch (error) {
        toast({
          title: "Invalid Configuration",
          description: "Transition configuration must be valid JSON",
          variant: "destructive",
        });
        return;
      }
    }
    createTransitionMutation.mutate(submitData);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Advanced Scheduling</h1>
        <p className="text-muted-foreground text-base">
          Configure conditional rules, priorities, and transitions for smart content scheduling
        </p>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules" data-testid="tab-rules">Scheduling Rules</TabsTrigger>
          <TabsTrigger value="priorities" data-testid="tab-priorities">Content Priorities</TabsTrigger>
          <TabsTrigger value="transitions" data-testid="tab-transitions">Transitions</TabsTrigger>
          <TabsTrigger value="conflicts" data-testid="tab-conflicts">Conflict Detection</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Create conditional rules to control when schedules are active
            </p>
            <Button onClick={() => setShowRuleDialog(true)} data-testid="button-add-rule">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules?.map((rule) => (
              <Card key={rule.id} className="p-6 hover-elevate" data-testid={`card-rule-${rule.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      {rule.ruleType.replace("_", " ")}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Schedule ID: {rule.scheduleId.slice(0, 8)}...
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                    data-testid={`button-delete-rule-${rule.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge variant="secondary">{rule.priority}</Badge>
                  </div>
                  <div className="text-muted-foreground text-xs break-all">
                    Config: {rule.ruleConfig}
                  </div>
                </div>
              </Card>
            ))}
            {(!rules || rules.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No scheduling rules yet. Create one to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="priorities" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Set priority levels for content items
            </p>
            <Button onClick={() => setShowPriorityDialog(true)} data-testid="button-add-priority">
              <Plus className="h-4 w-4 mr-2" />
              Add Priority
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorities?.map((priority) => (
              <Card key={priority.id} className="p-6 hover-elevate" data-testid={`card-priority-${priority.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Content: {priority.contentId.slice(0, 8)}...</p>
                    <Badge variant="default">{priority.priority}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePriorityMutation.mutate(priority.id)}
                    data-testid={`button-delete-priority-${priority.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {(priority.validFrom || priority.validUntil) && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {priority.validFrom && (
                      <div>From: {new Date(priority.validFrom).toLocaleDateString()}</div>
                    )}
                    {priority.validUntil && (
                      <div>To: {new Date(priority.validUntil).toLocaleDateString()}</div>
                    )}
                  </div>
                )}
              </Card>
            ))}
            {(!priorities || priorities.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No content priorities set. Create one to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transitions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Define transition effects between content items
            </p>
            <Button onClick={() => setShowTransitionDialog(true)} data-testid="button-add-transition">
              <Plus className="h-4 w-4 mr-2" />
              Add Transition
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transitions?.map((transition) => (
              <Card key={transition.id} className="p-6 hover-elevate" data-testid={`card-transition-${transition.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">{transition.name}</h3>
                    <Badge variant="outline">{transition.transitionType}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTransitionMutation.mutate(transition.id)}
                    data-testid={`button-delete-transition-${transition.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Duration: {transition.duration}ms
                </div>
              </Card>
            ))}
            {(!transitions || transitions.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No transitions configured. Create one to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Detect and resolve scheduling conflicts
            </p>
            <Button onClick={() => setShowConflictDialog(true)} data-testid="button-detect-conflicts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Check Conflicts
            </Button>
          </div>

          <Card className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a display or group to check for scheduling conflicts</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Preview content timeline for displays and groups
            </p>
            <Button onClick={() => setShowTimelineDialog(true)} data-testid="button-preview-timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Generate Preview
            </Button>
          </div>

          <Card className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Generate a timeline preview to visualize content scheduling</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent data-testid="dialog-add-rule">
          <DialogHeader>
            <DialogTitle>Create Scheduling Rule</DialogTitle>
            <DialogDescription>
              Add a conditional rule to control schedule activation
            </DialogDescription>
          </DialogHeader>
          <Form {...ruleForm}>
            <form onSubmit={ruleForm.handleSubmit(handleRuleSubmit)} className="space-y-4">
              <FormField
                control={ruleForm.control}
                name="scheduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-schedule">
                          <SelectValue placeholder="Select a schedule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schedules?.map((schedule) => (
                          <SelectItem key={schedule.id} value={schedule.id}>
                            {schedule.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ruleForm.control}
                name="ruleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-rule-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="day_of_week">Day of Week</SelectItem>
                        <SelectItem value="time_range">Time Range</SelectItem>
                        <SelectItem value="date_range">Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ruleForm.control}
                name="ruleConfig"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder='{"days": ["monday", "friday"]} or {"start": "09:00", "end": "17:00"}'
                        data-testid="input-rule-config"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ruleForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-rule-priority"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createRuleMutation.isPending}
                  data-testid="button-submit-rule"
                >
                  Create Rule
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Priority Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent data-testid="dialog-add-priority">
          <DialogHeader>
            <DialogTitle>Set Content Priority</DialogTitle>
            <DialogDescription>
              Assign priority level to content for scheduling resolution
            </DialogDescription>
          </DialogHeader>
          <Form {...priorityForm}>
            <form onSubmit={priorityForm.handleSubmit(handlePrioritySubmit)} className="space-y-4">
              <FormField
                control={priorityForm.control}
                name="contentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter content ID" data-testid="input-content-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={priorityForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-priority"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createPriorityMutation.isPending}
                  data-testid="button-submit-priority"
                >
                  Create Priority
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Transition Dialog */}
      <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <DialogContent data-testid="dialog-add-transition">
          <DialogHeader>
            <DialogTitle>Create Transition</DialogTitle>
            <DialogDescription>
              Define a transition effect for content changes
            </DialogDescription>
          </DialogHeader>
          <Form {...transitionForm}>
            <form onSubmit={transitionForm.handleSubmit(handleTransitionSubmit)} className="space-y-4">
              <FormField
                control={transitionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Smooth Fade" data-testid="input-transition-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transitionForm.control}
                name="transitionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-transition-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transitionForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (ms)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-transition-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createTransitionMutation.isPending}
                  data-testid="button-submit-transition"
                >
                  Create Transition
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
