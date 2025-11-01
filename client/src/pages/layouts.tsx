import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-provider";
import { getTranslation } from "@/lib/i18n";
import { Plus, LayoutGrid, Pencil, Trash2, Maximize2, Grip } from "lucide-react";
import type { Layout, LayoutWithDetails, Zone } from "@shared/schema";

export default function Layouts() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = (key: any) => getTranslation(language, key);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<LayoutWithDetails | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    orientation: "horizontal" as "horizontal" | "vertical" | "custom",
    zones: [] as Zone[],
  });

  const { data: layouts = [], isLoading } = useQuery<LayoutWithDetails[]>({
    queryKey: ["/api/layouts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; zones: string }) => {
      return apiRequest("POST", "/api/layouts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: t("layoutCreated") });
    },
    onError: () => {
      toast({ title: t("failedCreateLayout"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Layout> }) => {
      return apiRequest("PUT", `/api/layouts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      setEditDialogOpen(false);
      setSelectedLayout(null);
      toast({ title: t("layoutUpdated") });
    },
    onError: () => {
      toast({ title: t("failedUpdateLayout"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/layouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({ title: t("layoutDeleted") });
    },
    onError: () => {
      toast({ title: t("failedDeleteLayout"), variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      orientation: "horizontal",
      zones: [],
    });
  };

  const generateDefaultZones = (orientation: "horizontal" | "vertical" | "custom"): Zone[] => {
    if (orientation === "horizontal") {
      return [
        { id: "zone-1", x: 0, y: 0, width: 50, height: 100 },
        { id: "zone-2", x: 50, y: 0, width: 50, height: 100 },
      ];
    } else if (orientation === "vertical") {
      return [
        { id: "zone-1", x: 0, y: 0, width: 100, height: 50 },
        { id: "zone-2", x: 0, y: 50, width: 100, height: 50 },
      ];
    } else {
      return [
        { id: "zone-1", x: 0, y: 0, width: 50, height: 50 },
        { id: "zone-2", x: 50, y: 0, width: 50, height: 50 },
        { id: "zone-3", x: 0, y: 50, width: 50, height: 50 },
        { id: "zone-4", x: 50, y: 50, width: 50, height: 50 },
      ];
    }
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({ title: t("layoutName"), description: t("layoutNamePlaceholder"), variant: "destructive" });
      return;
    }

    const zones = formData.zones.length > 0 
      ? formData.zones 
      : generateDefaultZones(formData.orientation);

    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      zones: JSON.stringify(zones),
    });
  };

  const handleEdit = () => {
    if (!selectedLayout) return;

    const zones = formData.zones.length > 0 
      ? formData.zones 
      : generateDefaultZones(formData.orientation);

    updateMutation.mutate({
      id: selectedLayout.id,
      data: {
        name: formData.name,
        description: formData.description || undefined,
        zones: JSON.stringify(zones),
      },
    });
  };

  const openEditDialog = (layout: LayoutWithDetails) => {
    setSelectedLayout(layout);
    setFormData({
      name: layout.name,
      description: layout.description || "",
      orientation: "custom",
      zones: layout.zones || [],
    });
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const renderLayoutPreview = (zones: Zone[]) => {
    return (
      <div className="relative w-full h-40 bg-card border rounded-md overflow-hidden">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="absolute border-2 border-primary/30 bg-primary/5 flex items-center justify-center text-xs font-mono text-muted-foreground"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
            }}
          >
            {zone.id}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">{t("loading")}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title">{t("layoutsTitle")}</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-subtitle">{t("layoutsSubtitle")}</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-create-layout">
              <Plus className="mr-2 h-4 w-4" />
              {t("newLayout")}
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-layout">
            <DialogHeader>
              <DialogTitle>{t("createLayout")}</DialogTitle>
              <DialogDescription>{t("layoutsSubtitle")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("layoutName")}</Label>
                <Input
                  id="name"
                  data-testid="input-layout-name"
                  placeholder={t("layoutNamePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("layoutDescription")}</Label>
                <Textarea
                  id="description"
                  data-testid="input-layout-description"
                  placeholder={t("layoutDescriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("layoutOrientation")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={formData.orientation === "horizontal" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, orientation: "horizontal", zones: [] })}
                    className="flex-col h-auto py-4"
                    data-testid="button-orientation-horizontal"
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-8 h-12 bg-current opacity-30"></div>
                      <div className="w-8 h-12 bg-current opacity-30"></div>
                    </div>
                    <span className="text-xs">{t("orientationHorizontal")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.orientation === "vertical" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, orientation: "vertical", zones: [] })}
                    className="flex-col h-auto py-4"
                    data-testid="button-orientation-vertical"
                  >
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="w-16 h-5 bg-current opacity-30"></div>
                      <div className="w-16 h-5 bg-current opacity-30"></div>
                    </div>
                    <span className="text-xs">{t("orientationVertical")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.orientation === "custom" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, orientation: "custom", zones: [] })}
                    className="flex-col h-auto py-4"
                    data-testid="button-orientation-custom"
                  >
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      <div className="w-7 h-5 bg-current opacity-30"></div>
                      <div className="w-7 h-5 bg-current opacity-30"></div>
                      <div className="w-7 h-5 bg-current opacity-30"></div>
                      <div className="w-7 h-5 bg-current opacity-30"></div>
                    </div>
                    <span className="text-xs">{t("orientationCustom")}</span>
                  </Button>
                </div>
              </div>
              {formData.orientation && (
                <div className="space-y-2">
                  <Label>{t("layoutPreview")}</Label>
                  {renderLayoutPreview(generateDefaultZones(formData.orientation))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
                {t("cancelEdit")}
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-create">
                {createMutation.isPending ? t("creating") : t("createLayout")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {layouts.length === 0 ? (
        <Card data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("noLayoutsYet")}</h3>
            <p className="text-muted-foreground text-center mb-6">{t("createLayoutsDesc")}</p>
            <Button onClick={openCreateDialog} data-testid="button-create-first-layout">
              <Plus className="mr-2 h-4 w-4" />
              {t("createFirstLayout")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {layouts.map((layout) => (
            <Card key={layout.id} data-testid={`card-layout-${layout.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate" data-testid={`text-layout-name-${layout.id}`}>{layout.name}</CardTitle>
                    {layout.description && (
                      <CardDescription className="mt-1" data-testid={`text-layout-description-${layout.id}`}>
                        {layout.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary" data-testid={`badge-zone-count-${layout.id}`}>
                    {t("zoneCount").replace("{count}", String(layout.zones?.length || 0))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {renderLayoutPreview(layout.zones || [])}
                <div className="mt-3 flex items-center text-sm text-muted-foreground">
                  <Maximize2 className="h-3 w-3 mr-1" />
                  <span data-testid={`text-display-count-${layout.id}`}>
                    {t("displaysUsingLayout").replace("{count}", String(layout.displayCount || 0))}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(layout)}
                  data-testid={`button-edit-${layout.id}`}
                >
                  <Pencil className="mr-2 h-3 w-3" />
                  {t("edit")}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid={`button-delete-${layout.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-testid={`dialog-delete-${layout.id}`}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("confirmDeleteLayout")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("layoutDeleteWarning")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid={`button-cancel-delete-${layout.id}`}>
                        {t("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(layout.id)}
                        data-testid={`button-confirm-delete-${layout.id}`}
                      >
                        {t("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-layout">
          <DialogHeader>
            <DialogTitle>{t("editLayout")}</DialogTitle>
            <DialogDescription>{t("layoutsSubtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("layoutName")}</Label>
              <Input
                id="edit-name"
                data-testid="input-edit-layout-name"
                placeholder={t("layoutNamePlaceholder")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("layoutDescription")}</Label>
              <Textarea
                id="edit-description"
                data-testid="input-edit-layout-description"
                placeholder={t("layoutDescriptionPlaceholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            {formData.zones.length > 0 && (
              <div className="space-y-2">
                <Label>{t("layoutPreview")}</Label>
                {renderLayoutPreview(formData.zones)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              {t("cancelEdit")}
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending} data-testid="button-submit-edit">
              {updateMutation.isPending ? t("saving") : t("saveLayout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
