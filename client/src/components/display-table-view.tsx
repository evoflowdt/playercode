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
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, MapPin, Monitor } from "lucide-react";
import { Display } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/language-provider";

interface DisplayTableViewProps {
  displays: Display[];
  selectedDisplayIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onViewDetails?: (display: Display) => void;
  onEdit?: (display: Display) => void;
  onDelete?: (display: Display) => void;
}

export function DisplayTableView({
  displays,
  selectedDisplayIds,
  onToggleSelection,
  onViewDetails,
  onEdit,
  onDelete,
}: DisplayTableViewProps) {
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
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {selectedDisplayIds && onToggleSelection && (
              <TableHead className="w-12">
                <span className="sr-only">Select</span>
              </TableHead>
            )}
            <TableHead className="w-12"></TableHead>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('os')}</TableHead>
            <TableHead>{t('location')}</TableHead>
            <TableHead>{t('resolution')}</TableHead>
            <TableHead>{t('lastSeen')}</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displays.length === 0 ? (
            <TableRow>
              <TableCell colSpan={selectedDisplayIds && onToggleSelection ? 9 : 8} className="text-center py-8 text-muted-foreground">
                {t('noDisplaysFound')}
              </TableCell>
            </TableRow>
          ) : (
            displays.map((display) => (
              <TableRow
                key={display.id}
                className="hover-elevate cursor-pointer"
                onClick={() => onViewDetails?.(display)}
                data-testid={`row-display-${display.id}`}
              >
                {selectedDisplayIds && onToggleSelection && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedDisplayIds.has(display.id)}
                      onCheckedChange={() => onToggleSelection(display.id)}
                      data-testid={`checkbox-display-${display.id}`}
                      aria-label={`Select ${display.name}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  {display.screenshot ? (
                    <img
                      src={display.screenshot}
                      alt={display.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium" data-testid={`text-name-${display.id}`}>
                  {display.name}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusColor(display.status)} text-white border-0`}
                    data-testid={`badge-status-${display.id}`}
                  >
                    {getStatusText(display.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{display.os}</TableCell>
                <TableCell>
                  {display.location ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">{display.location}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {display.resolution || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {display.lastSeen
                    ? formatDistanceToNow(new Date(display.lastSeen), {
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
                        data-testid={`button-menu-${display.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(display);
                        }}
                      >
                        {t('viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(display);
                        }}
                      >
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
