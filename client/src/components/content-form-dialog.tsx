import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { FileVideo, FileImage, Globe, Database } from "lucide-react";

const contentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["image", "video", "webpage", "html", "datafeed"]),
  url: z.string().optional(),
  htmlContent: z.string().optional(),
  dataFeedUrl: z.string().url().optional().or(z.literal("")),
  dataFeedConfig: z.string().optional(),
  duration: z.number().optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

interface ContentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentFormDialog({
  open,
  onOpenChange,
}: ContentFormDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("media");

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      name: "",
      type: "image",
      url: "",
      htmlContent: "",
      dataFeedUrl: "",
      dataFeedConfig: "",
      duration: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ContentFormValues) => {
      const payload: any = {
        name: data.name,
        type: data.type,
      };
      
      if (data.url) payload.url = data.url;
      if (data.htmlContent) payload.htmlContent = data.htmlContent;
      if (data.dataFeedUrl) payload.dataFeedUrl = data.dataFeedUrl;
      if (data.dataFeedConfig) payload.dataFeedConfig = data.dataFeedConfig;
      if (data.duration) payload.duration = data.duration;
      
      return apiRequest("POST", "/api/content", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Content created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create content",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContentFormValues) => {
    // Note: We allow creating content without URL - the uploader should have populated it
    // If URL is missing, the player will show an error message to the user
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="media" className="gap-2">
              <FileImage className="h-4 w-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="webpage" className="gap-2">
              <Globe className="h-4 w-4" />
              Webpage
            </TabsTrigger>
            <TabsTrigger value="html" className="gap-2">
              <FileVideo className="h-4 w-4" />
              HTML
            </TabsTrigger>
            <TabsTrigger value="datafeed" className="gap-2">
              <Database className="h-4 w-4" />
              Data Feed
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="My Content"
                        data-testid="input-content-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TabsContent value="media" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-media-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://example.com/image.jpg or use uploader below"
                          data-testid="input-media-url"
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty and use the uploader below to upload files from your computer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border rounded-lg p-4 bg-muted/20">
                  <ObjectUploader
                    onGetUploadParameters={async () => {
                      const token = localStorage.getItem('auth_token');
                      const headers: Record<string, string> = {};
                      if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                      }
                      
                      const response = await fetch("/api/objects/upload", {
                        method: "POST",
                        headers,
                        credentials: "include",
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to get upload URL: ${response.statusText}`);
                      }
                      
                      const data = await response.json();
                      return {
                        method: "PUT" as const,
                        url: data.uploadURL,
                      };
                    }}
                    onComplete={(result) => {
                      if (result.successful && result.successful.length > 0) {
                        const file = result.successful[0];
                        
                        console.log("[ContentForm] Upload complete:", file);
                        console.log("[ContentForm] file.response:", file.response);
                        console.log("[ContentForm] file.uploadURL:", file.uploadURL);
                        
                        // Extract the object path from the upload URL
                        // Try both file.response.uploadURL and file.uploadURL
                        const uploadURL = (file.response?.uploadURL || file.uploadURL) as string;
                        
                        if (uploadURL) {
                          try {
                            const uploadUrl = new URL(uploadURL);
                            console.log("[ContentForm] Upload URL parsed:", uploadUrl.pathname);
                            
                            // pathname format: /<bucket-name>/objects/uploads/<uuid>
                            // We need to extract everything after the bucket name (which is /objects/uploads/<uuid>)
                            const pathname = uploadUrl.pathname;
                            const pathParts = pathname.split('/').filter(p => p);
                            
                            console.log("[ContentForm] Path parts:", pathParts);
                            
                            if (pathParts.length >= 2) {
                              // Remove bucket name (first part), keep the rest
                              // pathParts[0] = bucket-name
                              // pathParts[1..n] = objects/uploads/<uuid>
                              const objectPath = pathParts.slice(1).join('/');
                              // objectPath is already "objects/uploads/<uuid>", just add leading slash
                              const url = `/${objectPath}`;
                              
                              console.log("[ContentForm] Setting URL to:", url);
                              form.setValue("url", url);
                              
                              if (!form.getValues("name")) {
                                form.setValue("name", file.name || "Uploaded file");
                              }
                              
                              toast({
                                title: "File uploaded successfully",
                                description: `${file.name} - URL populated automatically`,
                              });
                            } else {
                              throw new Error("Invalid upload URL format");
                            }
                          } catch (error) {
                            console.error("[ContentForm] Failed to parse upload URL:", error);
                            toast({
                              title: "Warning",
                              description: "File uploaded but URL parsing failed. Please enter URL manually.",
                              variant: "destructive",
                            });
                          }
                        } else {
                          console.error("[ContentForm] No uploadURL found in:", file);
                          toast({
                            title: "Error",
                            description: "Upload completed but URL not found. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    maxNumberOfFiles={1}
                    variant="outline"
                  >
                    Upload File
                  </ObjectUploader>
                </div>

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="30"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormDescription>
                        How long to display this content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="webpage" className="space-y-4 mt-0">
                <Input type="hidden" {...form.register("type")} value="webpage" />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webpage URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.com"
                          data-testid="input-webpage-url"
                        />
                      </FormControl>
                      <FormDescription>
                        URL of the webpage to display in an iframe
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="60"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-webpage-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="html" className="space-y-4 mt-0">
                <Input type="hidden" {...form.register("type")} value="html" />
                <FormField
                  control={form.control}
                  name="htmlContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HTML Content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="<div>Your HTML content here...</div>"
                          rows={10}
                          className="font-mono text-sm"
                          data-testid="input-html-content"
                        />
                      </FormControl>
                      <FormDescription>
                        Custom HTML/CSS/JavaScript to display
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="30"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-html-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="datafeed" className="space-y-4 mt-0">
                <Input type="hidden" {...form.register("type")} value="datafeed" />
                <FormField
                  control={form.control}
                  name="dataFeedUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Feed URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://api.example.com/data"
                          data-testid="input-datafeed-url"
                        />
                      </FormControl>
                      <FormDescription>
                        API endpoint that returns data (JSON, RSS, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataFeedConfig"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='{"refreshInterval": 60, "template": "..."}'
                          rows={6}
                          className="font-mono text-sm"
                          data-testid="input-datafeed-config"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional JSON configuration for the data feed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="60"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-datafeed-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

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
                  disabled={createMutation.isPending}
                  data-testid="button-submit-content"
                >
                  {createMutation.isPending ? "Creating..." : "Add Content"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
