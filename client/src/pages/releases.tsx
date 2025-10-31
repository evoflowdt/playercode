import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Calendar, Package } from "lucide-react";
import { format } from "date-fns";

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

  const { data: releases = [], isLoading } = useQuery<PlayerRelease[]>({
    queryKey: ['/api/player/releases'],
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-releases-title">{t('releasesTitle')}</h1>
        <p className="text-muted-foreground">{t('releasesSubtitle')}</p>
      </div>

      <div className="space-y-12">
        {renderPlatformReleases('windows', platformReleases.windows)}
        {renderPlatformReleases('macos', platformReleases.macos)}
        {renderPlatformReleases('linux', platformReleases.linux)}
      </div>
    </div>
  );
}
