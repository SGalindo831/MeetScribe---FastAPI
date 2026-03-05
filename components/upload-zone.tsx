"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileAudio, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadAudio } from "@/lib/api";

interface UploadZoneProps {
  onUploadComplete: (taskId: string) => void;
}

const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
  "video/webm",
];

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (ALLOWED_TYPES.includes(file.type) || file.name.match(/\.(mp3|wav|mp4|m4a|webm|ogg)$/i)) {
        setSelectedFile(file);
      } else {
        setError("Unsupported file type. Please use MP3, WAV, MP4, M4A, WebM, or OGG.");
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadAudio(selectedFile);
      if (result.success) {
        onUploadComplete(result.task_id);
        setSelectedFile(null);
      }
    } catch {
      setError("Upload failed. Make sure the backend server is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            !selectedFile && inputRef.current?.click();
          }
        }}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
          isDragging
            ? "border-primary bg-accent"
            : selectedFile
              ? "border-border bg-card"
              : "border-border/60 hover:border-primary/40 hover:bg-accent/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.mp4,.m4a,.webm,.ogg"
          onChange={handleFileSelect}
          className="sr-only"
          aria-label="Choose audio file to upload"
        />

        {selectedFile ? (
          <div className="flex w-full items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent">
              <FileAudio className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Remove selected file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-accent">
              <Upload className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-accent-foreground" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">
              Drop your audio file here
            </p>
            <p className="text-xs text-muted-foreground">
              MP3, WAV, MP4, M4A, WebM, or OGG
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload & Transcribe
            </>
          )}
        </button>
      )}
    </div>
  );
}
