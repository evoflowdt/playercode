import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContentItem } from "@shared/schema";
import { ContentItemCard } from "@/components/content-item-card";
import { ContentTableView } from "@/components/content-table-view";
import { EmptyState } from "@/components/empty-state";
import { ContentFormDialog } from "@/components/content-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FolderOpen, Search, Plus, LayoutGrid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-provider";

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
        <Button
          onClick={() => setShowAddDialog(true)}
          data-testid="button-add-content"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('addContent')}
        </Button>
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
