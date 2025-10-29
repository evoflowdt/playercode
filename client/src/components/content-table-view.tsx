import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Image, Video, FileText } from "lucide-react";
import { ContentItem } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/language-provider";

interface ContentTableViewProps {
  items: ContentItem[];
  onEdit?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
}

export function ContentTableView({
  items,
  onEdit,
  onDelete,
}: ContentTableViewProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'it' ? it : enUS;
  const [mediaErrors, setMediaErrors] = useState<Set<string>>(new Set());

  const getIcon = (type: string) => {
    if (type.startsWith("image")) return Image;
    if (type.startsWith("video")) return Video;
    return FileText;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getPublicUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('/objects/')) {
      return url.replace('/objects/', '/public-objects/');
    }
    return url;
  };

  const handleMediaError = (itemId: string) => {
    setMediaErrors(prev => new Set(prev).add(itemId));
  };

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{t('type')}</TableHead>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('id')}</TableHead>
            <TableHead className="w-32">{t('fileSize')}</TableHead>
            <TableHead className="w-40">{t('uploaded')}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {t('noContentFound')}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const Icon = getIcon(item.type);
              const publicUrl = getPublicUrl(item.url);
              const hasMediaError = mediaErrors.has(item.id);

              return (
                <TableRow
                  key={item.id}
                  className="hover-elevate"
                  data-testid={`row-content-${item.id}`}
                >
                  <TableCell>
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                      {!hasMediaError && item.type.startsWith("image") ? (
                        <img
                          src={publicUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={() => handleMediaError(item.id)}
                        />
                      ) : !hasMediaError && item.type.startsWith("video") ? (
                        <video
                          src={publicUrl}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          onError={() => handleMediaError(item.id)}
                        />
                      ) : (
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-name-${item.id}`}>
                    <div className="max-w-xs truncate">{item.name}</div>
                  </TableCell>
                  <TableCell>
                    <code 
                      className="text-xs bg-muted px-2 py-1 rounded font-mono"
                      data-testid={`text-id-${item.id}`}
                    >
                      {item.id}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatFileSize(item.fileSize)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.uploadedAt
                      ? formatDistanceToNow(new Date(item.uploadedAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-menu-${item.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(item);
                          }}
                        >
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(item);
                          }}
                          className="text-destructive"
                        >
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
