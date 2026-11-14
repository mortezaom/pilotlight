/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: drag and drop zone */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: drag and drop zone */

import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";

const MAX_SIZE_MB = 0.5;
const MAX_LOGO_PX = 200;

/** Downscales raster logos to fit MAX_LOGO_PX (Workers have no canvas, so this runs in the browser) */
export async function resizeLogo(file: File): Promise<File> {
  if (file.type === "image/svg+xml") {
    return file;
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_LOGO_PX / Math.max(bitmap.width, bitmap.height)
  );
  const canvas = new OffscreenCanvas(
    Math.round(bitmap.width * scale),
    Math.round(bitmap.height * scale)
  );
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new File([blob], "logo.png", { type: "image/png" });
}

export default function BrandingFileUpload({
  currentImage,
  onChange,
}: {
  currentImage: string | null;
  onChange: (file: File | "removed") => void;
}) {
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/svg+xml,image/png,image/jpeg,image/gif,image/webp",
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    onFilesAdded: (added) => {
      const file = added[0]?.file;
      if (file instanceof File) {
        onChange(file);
      }
    },
  });

  const [current, setCurrent] = useState(currentImage);
  const preview = files[0]?.preview || current;

  const handleRemove = () => {
    if (files[0]) {
      removeFile(files[0].id);
    }
    setCurrent(null);
    onChange("removed");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div
          className="border-input has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 relative flex h-36 flex-col items-center justify-center overflow-hidden rounded-md border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
          data-dragging={isDragging || undefined}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            {...getInputProps()}
            aria-label="Upload image file"
            className="sr-only"
          />
          {preview ? (
            <div className="absolute inset-0 flex h-full items-center justify-center p-4">
              {/** biome-ignore lint/correctness/useImageSize: Not-Needed */}
              <img
                alt="Logo preview"
                className="mx-auto max-h-full rounded object-contain"
                src={preview}
              />
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center px-4 py-3 text-center">
              <div
                aria-hidden="true"
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
              >
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-3.5 text-sm font-medium">Logo</p>
              <p className="text-muted-foreground flex flex-col items-center gap-1 text-xs">
                <span>SVG, PNG, JPG, GIF or WebP (max. {MAX_SIZE_MB}MB)</span>
                <b>
                  Preferred size: {MAX_LOGO_PX}x{MAX_LOGO_PX}px
                </b>
              </p>
              <Button
                className="text-primary mt-4"
                onClick={openFileDialog}
                type="button"
                variant="ghost"
              >
                <UploadIcon
                  aria-hidden="true"
                  className="-ms-1 size-4 opacity-60"
                />
                Select image
              </Button>
            </div>
          )}
        </div>

        {preview && (
          <div className="absolute top-4 right-4">
            <button
              aria-label="Remove image"
              className="focus-visible:border-ring focus-visible:ring-ring/50 bg-background/80 text-foreground hover:bg-background z-50 flex size-8 cursor-pointer items-center justify-center rounded-full border transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
              onClick={handleRemove}
              type="button"
            >
              <XIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}
