import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DisplayGroup } from "@shared/schema";
import { EmptyState } from "@/components/empty-state";
import { GroupFormDialog } from "@/components/group-form-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Users, Plus, Monitor, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-provider";

export default function Groups() {
  const { t } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteGroup, setDeleteGroup] = useState<DisplayGroup | null>(null);
  const { toast } = useToast();

  const { data: groups, isLoading } = useQuery<DisplayGroup[]>({
    queryKey: ["/api/groups"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: t('success'),
        description: t('groupDeleted'),
      });
      setDeleteGroup(null);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedDeleteGroup'),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{t('groups')}</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('groupsSubtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          data-testid="button-add-group"
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('newGroup')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="p-6 hover-elevate"
              data-testid={`card-group-${group.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteGroup(group);
                    }}
                    data-testid={`button-delete-group-${group.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-4 w-4" />
                <span>{t('displaysCount').replace('{count}', '0')}</span>
              </div>
              {group.createdAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  {t('created')} {format(new Date(group.createdAt), "MMM d, yyyy")}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={t('noGroupsFound')}
          description={t('createGroupsDesc')}
          action={{
            label: t('newGroup'),
            onClick: () => setShowAddDialog(true),
            testId: "button-add-first-group",
          }}
        />
      )}

      <GroupFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <AlertDialog
        open={!!deleteGroup}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')} {t('groups')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteGroup?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGroup && deleteMutation.mutate(deleteGroup.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
