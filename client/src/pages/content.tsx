import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContentItem } from "@shared/schema";
import { ContentItemCard } from "@/components/content-item-card";
import { EmptyState } from "@/components/empty-state";
import { ContentFormDialog } from "@/components/content-form-dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FolderOpen, Upload, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-provider";
import type { UploadResult } from "@uppy/core";

export default function Content() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
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
        const uploadURL = file.uploadURL as string;
        await uploadMutation.mutateAsync({
          url: uploadURL,
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('contentTitle')}</h1>
          <p className="text-muted-foreground text-base">
            {t('contentSubtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-content"
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
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('quickUpload')}
          </ObjectUploader>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchContent')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-content"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-72 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredContent && filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredContent.map((item) => (
            <ContentItemCard
              key={item.id}
              item={item}
              onDelete={(item) => deleteMutation.mutate(item.id)}
            />
          ))}
        </div>
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
