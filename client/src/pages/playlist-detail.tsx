import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, GripVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PlaylistWithItems, ContentItem } from "@shared/schema";

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [duration, setDuration] = useState("");

  const { data: playlist, isLoading } = useQuery<PlaylistWithItems>({
    queryKey: ["/api/playlists", id],
    queryFn: async () => {
      const response = await fetch(`/api/playlists/${id}`);
      if (!response.ok) throw new Error("Failed to fetch playlist");
      return response.json();
    },
  });

  const { data: allContent = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: { contentId: string; order: number; duration?: number }) => {
      return apiRequest("POST", `/api/playlists/${id}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", id] });
      toast({
        title: "Success",
        description: "Video added to playlist",
      });
      setAddDialogOpen(false);
      setSelectedContent(null);
      setDuration("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add video",
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
        title: "Success",
        description: "Video removed from playlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove video",
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
        title: "Success",
        description: "Playlist reordered",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder playlist",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    if (!selectedContent) {
      toast({
        title: "Error",
        description: "Please select a video",
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
          Add Video
        </Button>
      </div>

      {playlist.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No videos in playlist</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add videos to create a sequential playback playlist
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Video
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video to Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Select Video</Label>
              <select
                id="content"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={selectedContent || ""}
                onChange={(e) => setSelectedContent(e.target.value)}
                data-testid="select-content"
              >
                <option value="">Choose a video...</option>
                {availableContent.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.name} ({content.type})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (seconds, optional)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Leave empty for default duration"
                data-testid="input-duration"
              />
            </div>
            
            <Button
              onClick={handleAddItem}
              disabled={addItemMutation.isPending || !selectedContent}
              className="w-full"
              data-testid="button-confirm-add"
            >
              {addItemMutation.isPending ? "Adding..." : "Add to Playlist"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
