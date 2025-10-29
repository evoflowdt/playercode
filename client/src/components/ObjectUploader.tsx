import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

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
  const [showModal, setShowModal] = useState(false);
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
        note="Immagini e video fino a 100MB"
        closeModalOnClickOutside
        closeAfterFinish={false}
        locale={{
          strings: {
            browseFiles: 'Sfoglia file',
            dropPasteFiles: 'Trascina i file qui o %{browseFiles}',
            dropPasteFolders: 'Trascina i file qui o %{browseFolders}',
            dropPasteBoth: 'Trascina i file qui o %{browseFiles}',
          }
        }}
      />
    </div>
  );
}
