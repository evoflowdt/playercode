import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Trash2, Music, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PlaylistWithItems } from "@shared/schema";
import { useLanguage } from "@/lib/language-provider";

export default function PlaylistsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: playlists = [], isLoading } = useQuery<PlaylistWithItems[]>({
    queryKey: ["/api/playlists"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiRequest("POST", "/api/playlists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: t('success'),
        description: t('playlistCreated'),
      });
      setDialogOpen(false);
      setName("");
      setDescription("");
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedCreatePlaylist'),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/playlists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: t('success'),
        description: t('playlistDeleted'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedDeletePlaylist'),
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast({
        title: t('error'),
        description: t('pleaseEnterPlaylistName'),
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({ name, description });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t('loadingPlaylists')}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{t('playlists')}</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('playlistsSubtitle')}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-playlist">
              <Plus className="h-4 w-4 mr-2" />
              {t('newPlaylist')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createPlaylist')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('playlistName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('playlistNamePlaceholder')}
                  data-testid="input-playlist-name"
                />
              </div>
              <div>
                <Label htmlFor="description">{t('descriptionOptional')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('playlistDescPlaceholder')}
                  data-testid="input-playlist-description"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
                data-testid="button-create-playlist"
              >
                {createMutation.isPending ? t('creating') : t('createPlaylist')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noPlaylistsYet')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('createPlaylistsDesc')}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('createPlaylist')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {playlists.map((playlist) => (
            <Card key={playlist.id} data-testid={`card-playlist-${playlist.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      {playlist.name}
                    </CardTitle>
                    {playlist.description && (
                      <CardDescription className="mt-2">
                        {playlist.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(playlist.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-playlist-${playlist.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {playlist.items.length === 0 ? (
                    <p>{t('noVideosInPlaylist')}</p>
                  ) : (
                    <div>
                      <p className="font-medium mb-2">
                        {playlist.items.length} {playlist.items.length !== 1 ? t('items') : t('item')}
                      </p>
                      <ul className="space-y-1">
                        {playlist.items.slice(0, 3).map((item, index) => (
                          <li key={item.id} className="text-xs">
                            {index + 1}. {item.contentName}
                          </li>
                        ))}
                        {playlist.items.length > 3 && (
                          <li className="text-xs italic">
                            +{playlist.items.length - 3} {t('more')}...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {t('created')} {new Date(playlist.createdAt).toLocaleDateString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/playlists/${playlist.id}`)}
                    data-testid={`button-view-playlist-${playlist.id}`}
                  >
                    {t('manage')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
