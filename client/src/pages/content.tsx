import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContentItem } from "@shared/schema";
import { ContentItemCard } from "@/components/content-item-card";
import { ContentTableView } from "@/components/content-table-view";
import { EmptyState } from "@/components/empty-state";
import { ContentFormDialog } from "@/components/content-form-dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FolderOpen, Upload, Search, Plus, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-provider";
import type { UploadResult } from "@uppy/core";

type ViewMode = "grid" | "list";

export default function Content() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const { data: contentItems, isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t('success'),
        description: t('contentDeleted'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedDeleteContent'),
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { url: string; name: string; type: string; fileSize: number }) => {
      return apiRequest("POST", "/api/content", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: t('success'),
        description: t('contentUploaded'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedUploadContent'),
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      for (const file of result.successful) {
        // Extract the file path from the upload URL
        // The upload URL is like: https://.../bucket-name/.private/uploads/<uuid>?signature=...
        // We need to convert: /.private/uploads/<uuid> -> /public-objects/uploads/<uuid>
        const uploadURL = (file.response?.uploadURL || file.uploadURL) as string;
        const url = new URL(uploadURL);
        let filePath = url.pathname;
        
        // Convert private path to public path
        // /.private/uploads/<uuid> -> /public-objects/uploads/<uuid>
        if (filePath.includes('/.private/')) {
          filePath = filePath.replace('/.private/', '/public-objects/');
        } else if (filePath.includes('/objects/')) {
          // If it's already /objects/, convert to /public-objects/
          filePath = filePath.replace('/objects/', '/public-objects/');
        }
        
        // Remove bucket name from path if present (e.g., /bucket-name/public-objects/... -> /public-objects/...)
        const pathParts = filePath.split('/').filter(p => p);
        if (pathParts.length > 2 && pathParts[0].startsWith('repl-')) {
          // Remove bucket name (first part)
          filePath = '/' + pathParts.slice(1).join('/');
        }
        
        console.log('[Content] Original URL:', uploadURL);
        console.log('[Content] Processed path:', filePath);
        
        await uploadMutation.mutateAsync({
          url: filePath,
          name: file.name || "Untitled",
          type: file.type || "application/octet-stream",
          fileSize: file.size || 0,
        });
      }
    }
  };

  const filteredContent = contentItems?.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{t('contentTitle')}</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('contentSubtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-content"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addContent')}
          </Button>
          <ObjectUploader
            maxNumberOfFiles={10}
            maxFileSize={104857600}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            variant="outline"
            testId="button-upload-content"
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('quickUpload')}
          </ObjectUploader>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchContent')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-content"
            />
          </div>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label={`${t('contentLibrary')} - Grid view`}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label={`${t('contentLibrary')} - List view`}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="h-72 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <Card className="h-96 animate-pulse bg-muted" />
        )
      ) : filteredContent && filteredContent.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredContent.map((item) => (
              <ContentItemCard
                key={item.id}
                item={item}
                onDelete={(item) => deleteMutation.mutate(item.id)}
              />
            ))}
          </div>
        ) : (
          <ContentTableView
            items={filteredContent}
            onDelete={(item) => deleteMutation.mutate(item.id)}
          />
        )
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={t('noContentFound')}
          description={
            searchQuery
              ? t('tryAdjusting')
              : t('uploadFirstMedia')
          }
        />
      )}

      <ContentFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
