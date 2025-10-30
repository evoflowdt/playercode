import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, GripVertical, Clock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PlaylistWithItems, ContentItem, RadioStream } from "@shared/schema";
import { useLanguage } from "@/lib/language-provider";

export default function PlaylistDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  
  // Radio stream states
  const [radioDialogOpen, setRadioDialogOpen] = useState(false);
  const [radioName, setRadioName] = useState("");
  const [radioUrl, setRadioUrl] = useState("");
  const [radioDescription, setRadioDescription] = useState("");
  const [radioActive, setRadioActive] = useState(true);

  const { data: playlist, isLoading } = useQuery<PlaylistWithItems>({
    queryKey: ["/api/playlists", id],
  });

  const { data: allContent = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const { data: radioStreams = [] } = useQuery<RadioStream[]>({
    queryKey: ["/api/radio-streams/playlist", id],
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: { contentId: string; order: number; duration?: number }) => {
      return apiRequest("POST", `/api/playlists/${id}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", id] });
      toast({
        title: t('success'),
        description: t('videoAdded'),
      });
      setAddDialogOpen(false);
      setSelectedContent(null);
      setDuration("");
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedAddVideo'),
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/playlists/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", id] });
      toast({
        title: t('success'),
        description: t('videoRemoved'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedRemoveVideo'),
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      return apiRequest("PATCH", `/api/playlists/${id}/items/reorder`, { itemIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", id] });
      toast({
        title: t('success'),
        description: t('playlistReordered'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedReorderPlaylist'),
        variant: "destructive",
      });
    },
  });

  const createRadioStreamMutation = useMutation({
    mutationFn: async (data: { playlistId: string; name: string; url: string; description?: string; active: boolean }) => {
      return apiRequest("POST", "/api/radio-streams", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radio-streams/playlist", id] });
      toast({
        title: t('success'),
        description: t('radioStreamAdded'),
      });
      setRadioDialogOpen(false);
      setRadioName("");
      setRadioUrl("");
      setRadioDescription("");
      setRadioActive(true);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedAddRadioStream'),
        variant: "destructive",
      });
    },
  });

  const deleteRadioStreamMutation = useMutation({
    mutationFn: async (streamId: string) => {
      return apiRequest("DELETE", `/api/radio-streams/${streamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/radio-streams/playlist", id] });
      toast({
        title: t('success'),
        description: t('radioStreamRemoved'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedRemoveRadioStream'),
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    if (!selectedContent) {
      toast({
        title: t('error'),
        description: t('selectVideo'),
        variant: "destructive",
      });
      return;
    }

    const order = playlist?.items.length || 0;
    const durationValue = duration ? parseInt(duration, 10) : undefined;

    addItemMutation.mutate({
      contentId: selectedContent,
      order,
      duration: durationValue,
    });
  };

  const handleMoveUp = (index: number) => {
    if (!playlist || index === 0) return;
    const newItems = [...playlist.items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    reorderMutation.mutate(newItems.map(item => item.id));
  };

  const handleMoveDown = (index: number) => {
    if (!playlist || index === playlist.items.length - 1) return;
    const newItems = [...playlist.items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    reorderMutation.mutate(newItems.map(item => item.id));
  };

  const handleAddRadioStream = () => {
    if (!radioName.trim()) {
      toast({
        title: t('error'),
        description: t('streamName'),
        variant: "destructive",
      });
      return;
    }
    if (!radioUrl.trim()) {
      toast({
        title: t('error'),
        description: t('streamUrl'),
        variant: "destructive",
      });
      return;
    }

    createRadioStreamMutation.mutate({
      playlistId: id!,
      name: radioName,
      url: radioUrl,
      description: radioDescription,
      active: radioActive,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Playlist not found</div>
      </div>
    );
  }

  // Filter out content already in playlist
  const availableContent = allContent.filter(
    content => !playlist.items.some(item => item.contentId === content.id)
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/playlists")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-muted-foreground text-base">{playlist.description}</p>
          )}
        </div>
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-video">
          <Plus className="h-4 w-4 mr-2" />
          {t('addVideo')}
        </Button>
      </div>

      {playlist.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">{t('noVideosInPlaylist')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('addVideosDesc')}
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addFirstVideo')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {playlist.items
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <Card key={item.id} data-testid={`playlist-item-${item.id}`}>
                <CardHeader className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || reorderMutation.isPending}
                        data-testid={`button-move-up-${item.id}`}
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === playlist.items.length - 1 || reorderMutation.isPending}
                        data-testid={`button-move-down-${item.id}`}
                      >
                        <GripVertical className="h-4 w-4 -rotate-90" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.contentName}</CardTitle>
                      {item.duration && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {item.duration}s
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemMutation.mutate(item.id)}
                      disabled={removeItemMutation.isPending}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </div>
      )}

      {/* Radio Streams Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                {t('radioStreams')}
              </CardTitle>
              <CardDescription className="mt-2">
                {t('radioStreamsDesc')}
              </CardDescription>
            </div>
            <Button onClick={() => setRadioDialogOpen(true)} data-testid="button-add-radio-stream">
              <Plus className="h-4 w-4 mr-2" />
              {t('addStream')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {radioStreams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No radio streams configured for this playlist</p>
              <p className="text-sm mt-2">Add a streaming radio URL to play audio during playlist playback</p>
            </div>
          ) : (
            <div className="space-y-3">
              {radioStreams.map((stream) => (
                <Card key={stream.id} data-testid={`radio-stream-${stream.id}`}>
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Radio className="h-4 w-4 text-primary" />
                          <CardTitle className="text-base">{stream.name}</CardTitle>
                          {!stream.active && (
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono break-all">
                          {stream.url}
                        </p>
                        {stream.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {stream.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRadioStreamMutation.mutate(stream.id)}
                        disabled={deleteRadioStreamMutation.isPending}
                        data-testid={`button-delete-radio-stream-${stream.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addVideo')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">{t('selectVideo')}</Label>
              <select
                id="content"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={selectedContent || ""}
                onChange={(e) => setSelectedContent(e.target.value)}
                data-testid="select-content"
              >
                <option value="">{t('chooseVideo')}</option>
                {availableContent.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.name} ({content.type})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="duration">{t('durationSecondsOptional')}</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={t('leaveEmptyForDefault')}
                data-testid="input-duration"
              />
            </div>
            
            <Button
              onClick={handleAddItem}
              disabled={addItemMutation.isPending || !selectedContent}
              className="w-full"
              data-testid="button-confirm-add"
            >
              {addItemMutation.isPending ? "Adding..." : t('addToPlaylist')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={radioDialogOpen} onOpenChange={setRadioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addRadioStream')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="radio-name">{t('streamName')}</Label>
              <Input
                id="radio-name"
                value={radioName}
                onChange={(e) => setRadioName(e.target.value)}
                placeholder={t('streamNamePlaceholder')}
                data-testid="input-radio-name"
              />
            </div>
            
            <div>
              <Label htmlFor="radio-url">{t('streamUrl')}</Label>
              <Input
                id="radio-url"
                value={radioUrl}
                onChange={(e) => setRadioUrl(e.target.value)}
                placeholder={t('streamUrlPlaceholder')}
                data-testid="input-radio-url"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the direct URL to the audio stream (MP3, AAC, etc.)
              </p>
            </div>
            
            <div>
              <Label htmlFor="radio-description">{t('descriptionOptional')}</Label>
              <Textarea
                id="radio-description"
                value={radioDescription}
                onChange={(e) => setRadioDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                data-testid="input-radio-description"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="radio-active">Active</Label>
              <Switch
                id="radio-active"
                checked={radioActive}
                onCheckedChange={setRadioActive}
                data-testid="switch-radio-active"
              />
            </div>
            
            <Button
              onClick={handleAddRadioStream}
              disabled={createRadioStreamMutation.isPending || !radioName || !radioUrl}
              className="w-full"
              data-testid="button-confirm-add-radio"
            >
              {createRadioStreamMutation.isPending ? "Adding..." : t('addRadioStream')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
