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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
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
            {display.status}
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
                className="h-8 w-8"
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
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onViewScreenshot?.(display);
              }}>
                View Screenshot
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit?.(display);
              }}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(display);
                }}
                className="text-destructive"
              >
                Remove
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
              })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
