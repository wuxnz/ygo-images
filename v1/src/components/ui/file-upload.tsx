"use client";

import * as React from "react";
import { Upload, X, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  value?: File | null;
  onClear?: () => void;
}

export function FileUpload({
  onFileSelect,
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  disabled = false,
  value,
  onClear,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    setError(null);

    // Validate file type
    if (accept && !file.name.toLowerCase().endsWith(accept.replace("*", ""))) {
      setError(`File must be of type ${accept}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(
        `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(1)}MB`,
      );
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = () => {
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear?.();
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragOver && !disabled
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-destructive",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {value ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <File className="text-primary h-5 w-5" />
              <div>
                <p className="text-sm font-medium">{value.name}</p>
                <p className="text-muted-foreground text-xs">
                  {(value.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-muted-foreground hover:text-destructive transition-colors"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {accept && `${accept.toUpperCase()} files only`}
                {maxSize && ` • Max ${(maxSize / (1024 * 1024)).toFixed(1)}MB`}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </div>
  );
}
