import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Monitor, MapPin, Calendar } from "lucide-react";
import { Display } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/language-provider";

interface DisplayCardProps {
  display: Display;
  onViewDetails?: (display: Display) => void;
  onViewScreenshot?: (display: Display) => void;
  onEdit?: (display: Display) => void;
  onDelete?: (display: Display) => void;
}

export function DisplayCard({
  display,
  onViewDetails,
  onViewScreenshot,
  onEdit,
  onDelete,
}: DisplayCardProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'it' ? it : enUS;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success";
      case "offline":
        return "bg-destructive";
      case "warning":
        return "bg-warning";
      default:
        return "bg-muted";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return t('online');
      case "offline":
        return t('offline');
      case "warning":
        return t('warning');
      default:
        return status;
    }
  };

  return (
    <Card
      className="overflow-hidden hover-elevate cursor-pointer"
      onClick={() => onViewDetails?.(display)}
      data-testid={`card-display-${display.id}`}
    >
      <div className="aspect-video bg-muted flex items-center justify-center relative">
        {display.screenshot ? (
          <img
            src={display.screenshot}
            alt={display.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Monitor className="h-16 w-16 text-muted-foreground" />
        )}
        <div className="absolute top-2 right-2">
          <Badge
            className={`${getStatusColor(display.status)} text-white border-0`}
            data-testid={`badge-status-${display.id}`}
          >
            {getStatusText(display.status)}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium truncate"
              data-testid={`text-name-${display.id}`}
            >
              {display.name}
            </h3>
            <p className="text-sm text-muted-foreground">{display.os}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                data-testid={`button-menu-${display.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(display);
              }}>
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onViewScreenshot?.(display);
              }}>
                {t('viewScreenshot')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit?.(display);
              }}>
                {t('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(display);
                }}
                className="text-destructive"
              >
                {t('remove')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {display.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{display.location}</span>
          </div>
        )}
        {display.lastSeen && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(display.lastSeen), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
