import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-provider";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void | Promise<void>;
  buttonClassName?: string;
  children: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  testId?: string;
}

export function ObjectUploader({
  maxNumberOfFiles = 10,
  maxFileSize = 104857600,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  variant = "default",
  size = "default",
  testId,
}: ObjectUploaderProps) {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  
  // Apply custom styles to Uppy browse button when modal is shown
  useEffect(() => {
    if (showModal) {
      // Wait for Uppy to render
      const timer = setTimeout(() => {
        const browseButton = document.querySelector('.uppy-Dashboard-browse');
        if (browseButton && browseButton instanceof HTMLElement) {
          // Get computed accent color from CSS variables
          const accentColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent').trim();
          const accentFg = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent-foreground').trim();
          
          // Apply styles directly
          browseButton.style.backgroundColor = `hsl(${accentColor})`;
          browseButton.style.color = `hsl(${accentFg})`;
          browseButton.style.borderRadius = '0.5rem';
          browseButton.style.padding = '0.5rem 1.25rem';
          browseButton.style.fontWeight = '700';
          browseButton.style.fontSize = '1rem';
          browseButton.style.border = `2px solid hsl(${accentColor})`;
          browseButton.style.boxShadow = `0 2px 8px hsl(${accentColor} / 0.3)`;
          browseButton.style.display = 'inline-flex';
          browseButton.style.alignItems = 'center';
          browseButton.style.justifyContent = 'center';
          browseButton.style.minHeight = '2.5rem';
          browseButton.style.transition = 'all 0.2s ease';
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showModal]);
  
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*', 'video/*'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", async (result) => {
        if (onComplete && result.successful && result.successful.length > 0) {
          await onComplete(result);
        }
        setTimeout(() => {
          uppy.cancelAll();
          setShowModal(false);
        }, 500);
      })
      .on("upload-error", (file, error) => {
        console.error("Upload error:", file?.name, error);
      })
  );

  return (
    <div>
      <Button
        type="button"
        onClick={() => setShowModal(true)}
        className={buttonClassName}
        variant={variant}
        size={size}
        data-testid={testId}
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note={t('uploadNote')}
        closeModalOnClickOutside
        closeAfterFinish={false}
        locale={{
          strings: {
            browseFiles: t('browseFiles'),
            dropPasteFiles: t('dropPasteFiles'),
            dropPasteFolders: t('dropPasteFiles'),
            dropPasteBoth: t('dropPasteFiles'),
          }
        }}
      />
    </div>
  );
}
