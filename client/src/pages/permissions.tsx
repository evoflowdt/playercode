import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Trash2, Plus } from "lucide-react";
import type { ResourcePermission, TeamMember } from "@shared/schema";
import { useLanguage } from "@/lib/language-provider";

const RESOURCE_TYPES = ['display', 'content_item', 'playlist', 'schedule', 'display_group'];
const ACTIONS = ['view', 'edit', 'delete', 'manage'];

export default function PermissionsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<ResourcePermission | null>(null);
  
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [filterResourceType, setFilterResourceType] = useState<string>("all");
  
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedResourceType, setSelectedResourceType] = useState<string>("");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  // Fetch team members for user selection
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  // Fetch all resources based on selected type
  const { data: resources = [] } = useQuery<any[]>({
    queryKey: [`/api/${selectedResourceType === 'content_item' ? 'content' : selectedResourceType === 'display_group' ? 'groups' : selectedResourceType}s`],
    enabled: !!selectedResourceType,
  });

  // Fetch permissions with filters
  const queryParams = new URLSearchParams();
  if (filterUserId && filterUserId !== 'all') queryParams.append('userId', filterUserId);
  if (filterResourceType && filterResourceType !== 'all') queryParams.append('resourceType', filterResourceType);
  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/permissions?${queryString}` : '/api/permissions';
  
  const { data: permissions = [], isLoading } = useQuery<ResourcePermission[]>({
    queryKey: [apiUrl],
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/permissions", {
        userId: selectedUserId,
        resourceType: selectedResourceType,
        resourceId: selectedResourceId,
        actions: selectedActions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      setAddDialogOpen(false);
      resetForm();
      toast({
        title: t("permissionCreated"),
        description: t("permissionCreated"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedCreatePermission"),
        variant: "destructive",
      });
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      setDeleteDialogOpen(false);
      setPermissionToDelete(null);
      toast({
        title: t("permissionDeleted"),
        description: t("permissionDeleted"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedDeletePermission"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedUserId("");
    setSelectedResourceType("");
    setSelectedResourceId("");
    setSelectedActions([]);
  };

  const handleAddPermission = () => {
    if (!selectedUserId || !selectedResourceType || !selectedResourceId || selectedActions.length === 0) {
      toast({
        title: t("error"),
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }
    createPermissionMutation.mutate();
  };

  const handleDeletePermission = (permission: ResourcePermission) => {
    setPermissionToDelete(permission);
    setDeleteDialogOpen(true);
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const getUserName = (userId: string) => {
    const member = teamMembers.find(m => m.userId === userId);
    return member ? `${member.userFirstName} ${member.userLastName}` : userId;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("permissionsTitle")}</h1>
          <p className="text-muted-foreground">{t("permissionsSubtitle")}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-permission">
          <Plus className="h-4 w-4 mr-2" />
          {t("addPermission")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("permissionsTitle")}</CardTitle>
          <CardDescription>
            {permissions.length} {t("permissionsActions").toLowerCase()}
          </CardDescription>
          <div className="flex gap-4 mt-4">
            <Select value={filterUserId} onValueChange={setFilterUserId}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-user">
                <SelectValue placeholder={t("filterByUser")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allUsers")}</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.userFirstName} {member.userLastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterResourceType} onValueChange={setFilterResourceType}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-resource-type">
                <SelectValue placeholder={t("filterByResourceType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allResourceTypes")}</SelectItem>
                {RESOURCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">{t("loading")}</div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-permissions">
              {t("noPermissionsFound")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead>{t("resourceType")}</TableHead>
                  <TableHead>{t("resourceId")}</TableHead>
                  <TableHead>{t("permissionsActions")}</TableHead>
                  <TableHead>{t("createdBy")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id} data-testid={`row-permission-${permission.id}`}>
                    <TableCell className="font-medium" data-testid={`text-user-${permission.id}`}>
                      {getUserName(permission.userId)}
                    </TableCell>
                    <TableCell data-testid={`text-resource-type-${permission.id}`}>
                      {permission.resourceType.replace('_', ' ')}
                    </TableCell>
                    <TableCell data-testid={`text-resource-id-${permission.id}`}>
                      {permission.resourceId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {permission.actions.map((action) => (
                          <Badge key={action} variant="secondary">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getUserName(permission.createdBy)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePermission(permission)}
                        disabled={deletePermissionMutation.isPending}
                        data-testid={`button-delete-${permission.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Permission Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent data-testid="dialog-add-permission">
          <DialogHeader>
            <DialogTitle>{t("addPermission")}</DialogTitle>
            <DialogDescription>
              {t("permissionsSubtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">{t("selectUser")}</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user" data-testid="select-user">
                  <SelectValue placeholder={t("userPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.userFirstName} {member.userLastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resourceType">{t("selectResourceType")}</Label>
              <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                <SelectTrigger id="resourceType" data-testid="select-resource-type">
                  <SelectValue placeholder={t("resourceTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resourceId">{t("selectResource")}</Label>
              <Select value={selectedResourceId} onValueChange={setSelectedResourceId} disabled={!selectedResourceType}>
                <SelectTrigger id="resourceId" data-testid="select-resource">
                  <SelectValue placeholder={t("resourcePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((resource: any) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name || resource.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("permissionsActions")}</Label>
              <div className="flex flex-col gap-2">
                {ACTIONS.map((action) => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={action}
                      checked={selectedActions.includes(action)}
                      onCheckedChange={() => toggleAction(action)}
                      data-testid={`checkbox-${action}`}
                    />
                    <label htmlFor={action} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {action}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAddDialogOpen(false); resetForm(); }}
              data-testid="button-cancel-add"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleAddPermission}
              disabled={createPermissionMutation.isPending}
              data-testid="button-save-permission"
            >
              {createPermissionMutation.isPending ? t("saving") : t("addPermission")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permission Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-permission">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeletePermission")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("thisActionCannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => permissionToDelete && deletePermissionMutation.mutate(permissionToDelete.id)}
              disabled={deletePermissionMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
