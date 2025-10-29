import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertDisplaySchema, type InsertDisplay, type Display } from "@shared/schema";
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
import { MapPin, Loader2 } from "lucide-react";

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

interface DisplayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  display?: Display;
}

export function DisplayFormDialog({
  open,
  onOpenChange,
  display,
}: DisplayFormDialogProps) {
  const { toast } = useToast();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const form = useForm<InsertDisplay>({
    resolver: zodResolver(insertDisplaySchema),
    defaultValues: display || {
      name: "",
      hashCode: "",
      os: "",
      location: "",
      latitude: "",
      longitude: "",
      resolution: "",
    },
  });

  // Reset form when display changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset(display || {
        name: "",
        hashCode: "",
        os: "",
        location: "",
        latitude: "",
        longitude: "",
        resolution: "",
      });
    }
  }, [display, open, form]);

  const getCoordinates = async () => {
    const location = form.getValues("location");
    if (!location || !location.trim()) {
      toast({
        title: "Error",
        description: "Please enter a location first",
        variant: "destructive",
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
      );

      if (!response.ok) {
        throw new Error(`Geocoding service error: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        form.setValue("latitude", lat);
        form.setValue("longitude", lon);
        toast({
          title: "Success",
          description: "Coordinates retrieved successfully",
        });
      } else {
        toast({
          title: "Location not found",
          description: "Could not find coordinates for this location. Try being more specific.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to retrieve coordinates",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: InsertDisplay) => apiRequest("POST", "/api/displays", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/displays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Display registered successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register display",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Display>) => 
      apiRequest("PATCH", `/api/displays/${display?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/displays"] });
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

  const onSubmit = (data: InsertDisplay) => {
    if (display) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {display ? "Edit Display" : "Register New Display"}
          </DialogTitle>
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
                      placeholder="Store Entrance Display"
                      data-testid="input-display-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hashCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hash Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ABC123456"
                      className="font-mono"
                      data-testid="input-hash-code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="os"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operating System</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Samsung Tizen, LG webOS, Android..."
                      data-testid="input-os"
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
                  <FormLabel>Location</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Milan, Italy"
                        data-testid="input-location"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={getCoordinates}
                      disabled={isGeocoding}
                      title="Get coordinates from location"
                      data-testid="button-get-coordinates"
                    >
                      {isGeocoding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution</FormLabel>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="40.7128"
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
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="-74.0060"
                        data-testid="input-longitude"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-display"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : display
                  ? "Update"
                  : "Register"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
