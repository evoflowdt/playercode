import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/lib/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ExternalLink, Calendar, Package, Upload } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface PlayerRelease {
  id: string;
  version: string;
  platform: string;
  releaseDate: string;
  changelog: string | null;
  githubReleaseUrl: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number | null;
  isPrerelease: boolean;
  isLatest: boolean;
}

export default function Releases() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    version: '',
    platform: 'windows',
    changelog: '',
    isPrerelease: false,
    isLatest: true,
    file: null as File | null,
  });

  const { data: releases = [], isLoading } = useQuery<PlayerRelease[]>({
    queryKey: ['/api/player/releases'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadData) => {
      if (!data.file) throw new Error('No file selected');
      
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('version', data.version);
      formData.append('platform', data.platform);
      formData.append('changelog', data.changelog);
      formData.append('isPrerelease', String(data.isPrerelease));
      formData.append('isLatest', String(data.isLatest));

      const response = await fetch('/api/player/releases/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player/releases'] });
      setIsUploadOpen(false);
      setUploadData({
        version: '',
        platform: 'windows',
        changelog: '',
        isPrerelease: false,
        isLatest: true,
        file: null,
      });
      toast({
        title: "Release uploaded successfully",
        description: "The release has been published to GitHub and is now available for download.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('releasesTitle')}</h1>
          <p className="text-muted-foreground">{t('releasesSubtitle')}</p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const platformReleases = {
    windows: releases.filter(r => r.platform === 'windows'),
    macos: releases.filter(r => r.platform === 'macos'),
    linux: releases.filter(r => r.platform === 'linux'),
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const renderPlatformReleases = (platform: string, platformReleases: PlayerRelease[]) => {
    const latestRelease = platformReleases.find(r => r.isLatest);
    const otherReleases = platformReleases.filter(r => !r.isLatest);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Package className="h-6 w-6" />
          {t(platform as any)}
        </h2>

        {latestRelease && (
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {latestRelease.version}
                    <Badge variant="default">{t('latestVersion')}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(latestRelease.releaseDate), 'PPP')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="default"
                    data-testid={`button-download-${latestRelease.id}`}
                  >
                    <a href={latestRelease.downloadUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      {t('downloadRelease')}
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    data-testid={`button-github-${latestRelease.id}`}
                  >
                    <a href={latestRelease.githubReleaseUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('viewOnGitHub')}
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{t('releaseFileName')}:</span>
                  <span>{latestRelease.fileName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{t('releaseFileSize')}:</span>
                  <span>{formatFileSize(latestRelease.fileSize)}</span>
                </div>
                {latestRelease.changelog && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">{t('releaseNotes')}</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                        {latestRelease.changelog}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {otherReleases.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">Previous Versions</h3>
            {otherReleases.map(release => (
              <Card key={release.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{release.version}</CardTitle>
                      {release.isPrerelease && (
                        <Badge variant="secondary">{t('prerelease')}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        data-testid={`button-download-${release.id}`}
                      >
                        <a href={release.downloadUrl} download>
                          <Download className="h-3 w-3 mr-1" />
                          {t('downloadRelease')}
                        </a>
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(release.releaseDate), 'PPP')}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {platformReleases.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t('noReleasesYet')}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-releases-title">{t('releasesTitle')}</h1>
          <p className="text-muted-foreground">{t('releasesSubtitle')}</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-release">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Release
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Player Release</DialogTitle>
              <DialogDescription>
                Upload a compiled installer to GitHub Releases. Make sure you've built the player first.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  placeholder="1.0.0"
                  value={uploadData.version}
                  onChange={(e) => setUploadData({ ...uploadData, version: e.target.value })}
                  data-testid="input-version"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={uploadData.platform}
                  onValueChange={(value) => setUploadData({ ...uploadData, platform: value })}
                >
                  <SelectTrigger data-testid="select-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="macos">macOS</SelectItem>
                    <SelectItem value="linux">Linux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="file">Installer File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".exe,.dmg,.AppImage,.deb"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                  data-testid="input-file"
                />
                <p className="text-sm text-muted-foreground">
                  {uploadData.platform === 'windows' && 'Upload .exe installer'}
                  {uploadData.platform === 'macos' && 'Upload .dmg disk image'}
                  {uploadData.platform === 'linux' && 'Upload .AppImage or .deb file'}
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="changelog">Changelog</Label>
                <Textarea
                  id="changelog"
                  placeholder="Release notes and changes..."
                  value={uploadData.changelog}
                  onChange={(e) => setUploadData({ ...uploadData, changelog: e.target.value })}
                  rows={4}
                  data-testid="textarea-changelog"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLatest"
                  checked={uploadData.isLatest}
                  onCheckedChange={(checked) => setUploadData({ ...uploadData, isLatest: checked as boolean })}
                  data-testid="checkbox-latest"
                />
                <Label htmlFor="isLatest">Mark as latest version</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrerelease"
                  checked={uploadData.isPrerelease}
                  onCheckedChange={(checked) => setUploadData({ ...uploadData, isPrerelease: checked as boolean })}
                  data-testid="checkbox-prerelease"
                />
                <Label htmlFor="isPrerelease">Pre-release / Beta version</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
              <Button
                onClick={() => uploadMutation.mutate(uploadData)}
                disabled={!uploadData.version || !uploadData.file || uploadMutation.isPending}
                data-testid="button-submit-upload"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Release'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-12">
        {renderPlatformReleases('windows', platformReleases.windows)}
        {renderPlatformReleases('macos', platformReleases.macos)}
        {renderPlatformReleases('linux', platformReleases.linux)}
      </div>
    </div>
  );
}
