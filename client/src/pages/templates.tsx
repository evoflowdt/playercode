import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, LayoutTemplate, Pencil, Trash2, Play, FileText } from "lucide-react";
import type { ContentTemplate, InsertContentTemplate, TemplateConfig } from "@shared/schema";

const templateTypes = [
  { value: "welcome", label: "Welcome Screen" },
  { value: "menu", label: "Menu Board" },
  { value: "emergency", label: "Emergency Alert" },
  { value: "promo", label: "Promotional" },
  { value: "custom", label: "Custom" },
];

const layoutTypes = [
  { value: "fullscreen", label: "Fullscreen" },
  { value: "split-horizontal", label: "Split Horizontal" },
  { value: "split-vertical", label: "Split Vertical" },
  { value: "grid-2x2", label: "Grid 2x2" },
  { value: "grid-3x3", label: "Grid 3x3" },
];

export default function Templates() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "custom",
    layoutType: "fullscreen",
    playlistId: "",
    contentId: "",
    transitionEffect: "fade",
    defaultDuration: 10,
    backgroundColor: "#000000",
  });

  const templatesUrl = selectedType === "all" 
    ? "/api/templates" 
    : `/api/templates?type=${selectedType}`;

  const { data: templates = [], isLoading } = useQuery<ContentTemplate[]>({
    queryKey: [templatesUrl],
  });

  const { data: displays = [] } = useQuery<any[]>({
    queryKey: ["/api/displays"],
    enabled: applyDialogOpen,
  });

  const { data: playlists = [] } = useQuery<any[]>({
    queryKey: ["/api/playlists"],
    enabled: createDialogOpen || editDialogOpen,
  });

  const { data: contentItems = [] } = useQuery<any[]>({
    queryKey: ["/api/content"],
    enabled: createDialogOpen || editDialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertContentTemplate) => {
      return apiRequest("POST", "/api/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: "Template created", description: "Template has been created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertContentTemplate> }) => {
      return apiRequest("PATCH", `/api/templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditDialogOpen(false);
      setSelectedTemplate(null);
      toast({ title: "Template updated", description: "Template has been updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template deleted", description: "Template has been deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async ({ templateId, displayId }: { templateId: string; displayId: string }) => {
      return apiRequest("POST", `/api/templates/${templateId}/apply`, { displayId });
    },
    onSuccess: () => {
      setApplyDialogOpen(false);
      setSelectedTemplate(null);
      toast({ title: "Template applied", description: "Template has been applied to the display" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to apply template", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "custom",
      layoutType: "fullscreen",
      playlistId: "",
      contentId: "",
      transitionEffect: "fade",
      defaultDuration: 10,
      backgroundColor: "#000000",
    });
  };

  const handleCreate = () => {
    const config: TemplateConfig = {
      layoutType: formData.layoutType as any,
      playlistId: formData.playlistId || undefined,
      contentId: formData.contentId || undefined,
      settings: {
        transitionEffect: formData.transitionEffect as any,
        defaultDuration: formData.defaultDuration,
        backgroundColor: formData.backgroundColor,
      },
    };

    const templateData: any = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      config: JSON.stringify(config),
      isPublic: false,
    };
    
    createMutation.mutate(templateData);
  };

  const handleEdit = () => {
    if (!selectedTemplate) return;

    const config: TemplateConfig = {
      layoutType: formData.layoutType as any,
      playlistId: formData.playlistId || undefined,
      contentId: formData.contentId || undefined,
      settings: {
        transitionEffect: formData.transitionEffect as any,
        defaultDuration: formData.defaultDuration,
        backgroundColor: formData.backgroundColor,
      },
    };

    updateMutation.mutate({
      id: selectedTemplate.id,
      data: {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        config: JSON.stringify(config),
      },
    });
  };

  const openEditDialog = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    const config = JSON.parse(template.config) as TemplateConfig;
    setFormData({
      name: template.name,
      description: template.description || "",
      type: template.type,
      layoutType: config.layoutType,
      playlistId: config.playlistId || "",
      contentId: config.contentId || "",
      transitionEffect: (config.settings?.transitionEffect || "fade") as string,
      defaultDuration: config.settings?.defaultDuration || 10,
      backgroundColor: config.settings?.backgroundColor || "#000000",
    });
    setEditDialogOpen(true);
  };

  const openApplyDialog = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setApplyDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    return templateTypes.find(t => t.value === type)?.label || type;
  };

  const getLayoutLabel = (layoutType: string) => {
    return layoutTypes.find(l => l.value === layoutType)?.label || layoutType;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Content Templates</h1>
          <p className="text-muted-foreground text-sm md:text-base">Create and manage reusable content templates for your displays</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>Create a reusable template for your displays</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Welcome Screen"
                    data-testid="input-template-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Template Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger data-testid="select-template-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this template..."
                  data-testid="input-template-description"
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="layoutType">Layout Type</Label>
                  <Select value={formData.layoutType} onValueChange={(value) => setFormData({ ...formData, layoutType: value })}>
                    <SelectTrigger data-testid="select-layout-type">
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                      {layoutTypes.map((layout) => (
                        <SelectItem key={layout.value} value={layout.value}>
                          {layout.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transitionEffect">Transition Effect</Label>
                  <Select value={formData.transitionEffect} onValueChange={(value) => setFormData({ ...formData, transitionEffect: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select effect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist">Default Playlist (Optional)</Label>
                  <Select value={formData.playlistId || undefined} onValueChange={(value) => setFormData({ ...formData, playlistId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="None - Select playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists.map((playlist: any) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Default Content (Optional)</Label>
                  <Select value={formData.contentId || undefined} onValueChange={(value) => setFormData({ ...formData, contentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="None - Select content" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentItems.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Default Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.defaultDuration}
                    onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 10 })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending} data-testid="button-confirm-create">
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Button
          variant={selectedType === "all" ? "default" : "outline"}
          onClick={() => setSelectedType("all")}
          data-testid="filter-all"
        >
          All Templates
        </Button>
        {templateTypes.map((type) => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? "default" : "outline"}
            onClick={() => setSelectedType(type.value)}
            data-testid={`filter-${type.value}`}
          >
            {type.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">Create your first template to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const config = JSON.parse(template.config) as TemplateConfig;
            return (
              <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{getTypeLabel(template.type)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Layout:</span>
                    <span className="font-medium">{getLayoutLabel(config.layoutType)}</span>
                  </div>
                  {config.playlistId && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Has default playlist</span>
                    </div>
                  )}
                  {config.settings?.defaultDuration && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{config.settings.defaultDuration}s</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openApplyDialog(template)}
                    data-testid={`button-apply-${template.id}`}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this template?")) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                    data-testid={`button-delete-${template.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update template configuration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Template Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Layout Type</Label>
                <Select value={formData.layoutType} onValueChange={(value) => setFormData({ ...formData, layoutType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layoutTypes.map((layout) => (
                      <SelectItem key={layout.value} value={layout.value}>
                        {layout.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transition Effect</Label>
                <Select value={formData.transitionEffect} onValueChange={(value) => setFormData({ ...formData, transitionEffect: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name || updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply to Display Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template to Display</DialogTitle>
            <DialogDescription>
              Select a display to apply the template "{selectedTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Display</Label>
            <Select
              onValueChange={(displayId) => {
                if (selectedTemplate) {
                  applyMutation.mutate({ templateId: selectedTemplate.id, displayId });
                }
              }}
            >
              <SelectTrigger className="mt-2" data-testid="select-display">
                <SelectValue placeholder="Choose a display" />
              </SelectTrigger>
              <SelectContent>
                {displays.map((display: any) => (
                  <SelectItem key={display.id} value={display.id}>
                    {display.name} - {display.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
