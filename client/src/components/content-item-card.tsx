import { useState } from "react";
import { Card } from "@/components/ui/card";
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

interface ContentItemCardProps {
  item: ContentItem;
  isSelected?: boolean;
  onSelect?: (item: ContentItem) => void;
  onEdit?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
}

export function ContentItemCard({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: ContentItemCardProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'it' ? it : enUS;
  const [mediaError, setMediaError] = useState(false);
  
  const getIcon = () => {
    if (item.type.startsWith("image")) return Image;
    if (item.type.startsWith("video")) return Video;
    return FileText;
  };

  const Icon = getIcon();

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return t('unknownSize');
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Convert object storage path to public URL
  const getPublicUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('/objects/')) {
      return url.replace('/objects/', '/public-objects/');
    }
    return url;
  };

  const publicUrl = getPublicUrl(item.url);

  return (
    <Card
      className={`overflow-hidden hover-elevate cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onSelect?.(item)}
      data-testid={`card-content-${item.id}`}
    >
      <div className="aspect-video bg-muted flex items-center justify-center relative">
        {!mediaError && item.type.startsWith("image") ? (
          <img
            src={publicUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setMediaError(true)}
          />
        ) : !mediaError && item.type.startsWith("video") ? (
          <video 
            src={publicUrl} 
            className="w-full h-full object-cover"
            preload="metadata"
            onError={() => setMediaError(true)}
          />
        ) : (
          <Icon className="h-16 w-16 text-muted-foreground" />
        )}
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="backdrop-blur-sm bg-background/80"
                data-testid={`button-menu-${item.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(item)}>
                {t('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(item)}
                className="text-destructive"
              >
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium truncate mb-1" data-testid={`text-name-${item.id}`}>
          {item.name}
        </h3>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {item.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(item.fileSize)}
          </span>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs font-medium text-muted-foreground">ID:</span>
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono" data-testid={`text-id-${item.id}`}>
            {item.id}
          </code>
        </div>
        {item.uploadedAt && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(item.uploadedAt), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </p>
        )}
      </div>
    </Card>
  );
}
