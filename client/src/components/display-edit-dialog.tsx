import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { type Display } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Standard display resolutions
const STANDARD_RESOLUTIONS = [
  "1920x1080", // Full HD
  "1280x720",  // HD
  "3840x2160", // 4K UHD
  "2560x1440", // QHD
  "1366x768",  // HD Ready
  "1024x768",  // XGA
  "1600x900",  // HD+
  "2048x1152", // QWXGA
  "3440x1440", // UWQHD
  "1080x1920", // Vertical Full HD
  "720x1280",  // Vertical HD
  "2160x3840", // Vertical 4K
] as const;

const displayEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  resolution: z.string().optional(),
});

type DisplayEditValues = z.infer<typeof displayEditSchema>;

interface DisplayEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  display: Display;
}

export function DisplayEditDialog({
  open,
  onOpenChange,
  display,
}: DisplayEditDialogProps) {
  const { toast } = useToast();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const form = useForm<DisplayEditValues>({
    resolver: zodResolver(displayEditSchema),
    defaultValues: {
      name: display.name,
      location: display.location || "",
      latitude: display.latitude || "",
      longitude: display.longitude || "",
      resolution: display.resolution || "",
    },
  });

  // Reset form when display changes or dialog opens/closes
  useEffect(() => {
    if (open && display) {
      form.reset({
        name: display.name,
        location: display.location || "",
        latitude: display.latitude || "",
        longitude: display.longitude || "",
        resolution: display.resolution || "",
      });
    }
  }, [open, display, form]);

  const updateMutation = useMutation({
    mutationFn: (data: DisplayEditValues) => {
      return apiRequest("PATCH", `/api/displays/${display.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/displays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Display updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update display",
        variant: "destructive",
      });
    },
  });

  const geocodeLocation = async (location: string) => {
    if (!location.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate Limit",
            description: "Too many geocoding requests. Please wait a moment and try again.",
            variant: "destructive",
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        form.setValue("latitude", lat);
        form.setValue("longitude", lon);
        toast({
          title: "Success",
          description: "Location coordinates auto-populated",
        });
      } else {
        toast({
          title: "Info",
          description: "Could not find coordinates for this location",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to geocode location",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const onSubmit = (data: DisplayEditValues) => {
    // Normalize empty optional fields to undefined to avoid storing empty strings
    const normalizedData = {
      name: data.name,
      location: data.location?.trim() || undefined,
      latitude: data.latitude?.trim() || undefined,
      longitude: data.longitude?.trim() || undefined,
      resolution: data.resolution?.trim() || undefined,
    };
    updateMutation.mutate(normalizedData);
  };

  const location = form.watch("location");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Display</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Reception Display"
                      data-testid="input-display-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Via Roma 123, Milano"
                        data-testid="input-location"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => geocodeLocation(location || "")}
                      disabled={!location || isGeocoding}
                      data-testid="button-geocode"
                    >
                      {isGeocoding ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Finding...
                        </>
                      ) : (
                        "Auto-fill Coords"
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., 45.4642"
                        data-testid="input-latitude"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., 9.1900"
                        data-testid="input-longitude"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution (Optional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-resolution">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STANDARD_RESOLUTIONS.map((resolution) => (
                        <SelectItem 
                          key={resolution} 
                          value={resolution}
                          data-testid={`option-resolution-${resolution}`}
                        >
                          {resolution}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-submit-display"
              >
                {updateMutation.isPending ? "Updating..." : "Update Display"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
