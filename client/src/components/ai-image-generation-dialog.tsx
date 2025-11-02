import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-provider";

interface AIImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIImageGenerationDialog({
  open,
  onOpenChange,
}: AIImageGenerationDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [size, setSize] = useState<"1024x1024" | "512x512" | "256x256">("1024x1024");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/content/generate-image", {
        prompt,
        name: name || "AI Generated Image",
        size,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: t('success'),
        description: t('aiImageGeneratedSuccess'),
      });
      setPrompt("");
      setName("");
      setSize("1024x1024");
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('aiImageGeneratedError'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      generateMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('aiImageGeneration')}
          </DialogTitle>
          <DialogDescription>
            {t('aiImageGenerationNote')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" data-testid="label-ai-prompt">
              {t('aiImagePrompt')}
            </Label>
            <Textarea
              id="prompt"
              placeholder={t('aiImagePromptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-ai-prompt"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" data-testid="label-ai-name">
              {t('aiImageName')}
            </Label>
            <Input
              id="name"
              placeholder={t('aiImageNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-ai-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size" data-testid="label-ai-size">
              {t('aiImageSize')}
            </Label>
            <Select value={size} onValueChange={(v) => setSize(v as typeof size)}>
              <SelectTrigger id="size" data-testid="select-ai-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">1024×1024</SelectItem>
                <SelectItem value="512x512">512×512</SelectItem>
                <SelectItem value="256x256">256×256</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generateMutation.isPending}
              data-testid="button-cancel-ai"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!prompt.trim() || generateMutation.isPending}
              data-testid="button-generate-ai"
            >
              {generateMutation.isPending ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('generateImage')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
