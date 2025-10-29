import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SyncGroupWithMembers, Display, ContentItem, Playlist } from "@shared/schema";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layers, Plus, Trash2, Users, Play, Pause, Square, Monitor, X } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-provider";

export default function SyncGroups() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState<string | null>(null);
  const [showPlayDialog, setShowPlayDialog] = useState<string | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<SyncGroupWithMembers | null>(null);
  const [deleteMember, setDeleteMember] = useState<{ groupId: string; memberId: string; memberName: string } | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: syncGroups, isLoading } = useQuery<SyncGroupWithMembers[]>({
    queryKey: ["/api/sync-groups"],
  });

  const { data: displays } = useQuery<Display[]>({
    queryKey: ["/api/displays"],
  });

  const { data: content } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sync-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync-groups"] });
      toast({
        title: t("success"),
        description: t("syncGroupDeleted"),
      });
      setDeleteGroup(null);
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedDeleteSyncGroup"),
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      apiRequest("DELETE", `/api/sync-groups/${groupId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync-groups"] });
      toast({
        title: t("success"),
        description: t("memberRemoved"),
      });
      setDeleteMember(null);
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedRemoveMember"),
        variant: "destructive",
      });
    },
  });

  const playMutation = useMutation({
    mutationFn: ({ syncGroupId, contentId, playlistId }: { syncGroupId: string; contentId?: string; playlistId?: string }) =>
      apiRequest("POST", `/api/sync-control/${syncGroupId}/play`, { contentId, playlistId }),
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("playbackStarted"),
      });
      setShowPlayDialog(null);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (syncGroupId: string) => apiRequest("POST", `/api/sync-control/${syncGroupId}/pause`),
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("playbackPaused"),
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (syncGroupId: string) => apiRequest("POST", `/api/sync-control/${syncGroupId}/resume`),
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("playbackResumed"),
      });
    },
  });

  const stopMutation = useMutation({
    mutationFn: (syncGroupId: string) => apiRequest("POST", `/api/sync-control/${syncGroupId}/stop`),
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("playbackStopped"),
      });
    },
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t("syncGroupsTitle")}</h1>
          <p className="text-muted-foreground text-base">
            {t("syncGroupsSubtitle")}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          data-testid="button-create-sync-group"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("createSyncGroup")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted" />
          ))}
        </div>
      ) : syncGroups && syncGroups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {syncGroups.map((group) => (
            <Card
              key={group.id}
              className="p-6 hover-elevate"
              data-testid={`card-sync-group-${group.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <Badge variant={group.active ? "default" : "secondary"}>
                      {group.active ? t("active") : t("inactive")}
                    </Badge>
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteGroup(group);
                    }}
                    data-testid={`button-delete-sync-group-${group.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Monitor className="h-4 w-4" />
                    <span>{group.memberCount} {group.memberCount === 1 ? t("member") : t("members")}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddMemberDialog(group.id)}
                    data-testid={`button-add-member-${group.id}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t("addMembers")}
                  </Button>
                </div>

                {group.members && group.members.length > 0 && (
                  <div className="space-y-1">
                    {group.members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1"
                      >
                        <span className="text-muted-foreground">{member.displayName}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setDeleteMember({
                              groupId: group.id,
                              memberId: member.id,
                              memberName: member.displayName,
                            })
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {group.members.length > 3 && (
                      <p className="text-xs text-muted-foreground px-2">
                        +{group.members.length - 3} {t("more")}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setShowPlayDialog(group.id)}
                    data-testid={`button-play-${group.id}`}
                    className="flex-1"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {t("playContent")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseMutation.mutate(group.id)}
                    data-testid={`button-pause-${group.id}`}
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopMutation.mutate(group.id)}
                    data-testid={`button-stop-${group.id}`}
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>

                {group.createdAt && (
                  <p className="text-xs text-muted-foreground pt-2">
                    {t("created")} {format(new Date(group.createdAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title={t("noSyncGroups")}
          description={t("createFirstSyncGroup")}
          action={{
            label: t("createSyncGroup"),
            onClick: () => setShowCreateDialog(true),
            testId: "button-add-first-sync-group",
          }}
        />
      )}

      <CreateSyncGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <AddMemberDialog
        open={!!showAddMemberDialog}
        onOpenChange={(open) => !open && setShowAddMemberDialog(null)}
        syncGroupId={showAddMemberDialog || ""}
        availableDisplays={displays || []}
        existingMembers={
          syncGroups?.find((g) => g.id === showAddMemberDialog)?.members || []
        }
      />

      <PlayContentDialog
        open={!!showPlayDialog}
        onOpenChange={(open) => !open && setShowPlayDialog(null)}
        syncGroupId={showPlayDialog || ""}
        content={content || []}
        playlists={playlists || []}
        onPlay={(contentId, playlistId) =>
          playMutation.mutate({
            syncGroupId: showPlayDialog!,
            contentId,
            playlistId,
          })
        }
      />

      <AlertDialog
        open={!!deleteGroup}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")} {t("syncGroupsTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteSyncGroup").replace("{name}", deleteGroup?.name || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGroup && deleteMutation.mutate(deleteGroup.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteMember}
        onOpenChange={(open) => !open && setDeleteMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeMember")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmRemoveMember").replace("{name}", deleteMember?.memberName || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteMember &&
                removeMemberMutation.mutate({
                  groupId: deleteMember.groupId,
                  memberId: deleteMember.memberId,
                })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("removeMember")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateSyncGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/sync-groups", {
        name,
        description: description || undefined,
        active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync-groups"] });
      toast({
        title: t("success"),
        description: t("syncGroupCreated"),
      });
      setName("");
      setDescription("");
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedCreateSyncGroup"),
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-sync-group">
        <DialogHeader>
          <DialogTitle>{t("createSyncGroup")}</DialogTitle>
          <DialogDescription>
            {t("createSyncGroupDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t("syncGroupName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("syncGroupNamePlaceholder")}
              data-testid="input-sync-group-name"
            />
          </div>
          <div>
            <Label htmlFor="description">{t("syncGroupDescription")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("syncGroupDescPlaceholder")}
              data-testid="input-sync-group-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || createMutation.isPending}
            data-testid="button-create-sync-group-submit"
          >
            {createMutation.isPending ? t("saving") : t("createSyncGroup")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  syncGroupId,
  availableDisplays,
  existingMembers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncGroupId: string;
  availableDisplays: Display[];
  existingMembers: Array<{ displayId: string }>;
}) {
  const [selectedDisplayId, setSelectedDisplayId] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/sync-groups/${syncGroupId}/members`, {
        displayId: selectedDisplayId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync-groups"] });
      toast({
        title: t("success"),
        description: t("memberAdded"),
      });
      setSelectedDisplayId("");
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedAddMember"),
        variant: "destructive",
      });
    },
  });

  const existingDisplayIds = new Set(existingMembers.map((m) => m.displayId));
  const availableForSelection = availableDisplays.filter(
    (d) => !existingDisplayIds.has(d.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-member">
        <DialogHeader>
          <DialogTitle>{t("addMemberToGroup")}</DialogTitle>
          <DialogDescription>
            {t("selectDisplayDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("selectDisplay")}</Label>
            <Select value={selectedDisplayId} onValueChange={setSelectedDisplayId}>
              <SelectTrigger data-testid="select-display">
                <SelectValue placeholder={t("selectDisplay")} />
              </SelectTrigger>
              <SelectContent>
                {availableForSelection.length > 0 ? (
                  availableForSelection.map((display) => (
                    <SelectItem key={display.id} value={display.id}>
                      {display.name} ({display.os})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-displays" disabled>
                    {t("noAvailableDisplays")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!selectedDisplayId || addMutation.isPending}
            data-testid="button-add-member-submit"
          >
            {addMutation.isPending ? t("saving") : t("addMembers")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlayContentDialog({
  open,
  onOpenChange,
  syncGroupId,
  content,
  playlists,
  onPlay,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncGroupId: string;
  content: ContentItem[];
  playlists: Playlist[];
  onPlay: (contentId?: string, playlistId?: string) => void;
}) {
  const [selectedType, setSelectedType] = useState<"content" | "playlist">("content");
  const [selectedId, setSelectedId] = useState("");
  const { t } = useLanguage();

  const handlePlay = () => {
    if (selectedType === "content") {
      onPlay(selectedId, undefined);
    } else {
      onPlay(undefined, selectedId);
    }
    setSelectedId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-play-content">
        <DialogHeader>
          <DialogTitle>{t("playContent")}</DialogTitle>
          <DialogDescription>
            {t("selectContentPlaylistDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("type")}</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as "content" | "playlist")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content">{t("singleContent")}</SelectItem>
                <SelectItem value="playlist">{t("playlists")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{selectedType === "content" ? t("selectContent") : t("selectPlaylist")}</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger data-testid="select-content">
                <SelectValue placeholder={t("selectContentOrPlaylist")} />
              </SelectTrigger>
              <SelectContent>
                {selectedType === "content" ? (
                  content.length > 0 ? (
                    content.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.type})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-content" disabled>
                      {t("noContentAvailable")}
                    </SelectItem>
                  )
                ) : playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-playlists" disabled>
                    {t("noPlaylistsAvailable")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handlePlay}
            disabled={!selectedId}
            data-testid="button-play-content-submit"
          >
            <Play className="h-4 w-4 mr-2" />
            {t("playContent")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
