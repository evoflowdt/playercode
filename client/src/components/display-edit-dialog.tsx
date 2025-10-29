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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
    updateMutation.mutate(data);
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
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 1920x1080"
                      data-testid="input-resolution"
                    />
                  </FormControl>
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
