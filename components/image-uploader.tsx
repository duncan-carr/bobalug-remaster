"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  ImagePlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

interface UploadedImage {
  storageId: Id<"_storage">;
  url: string | null;
  fileName: string;
  status: "uploading" | "success" | "error";
  progress?: number;
  error?: string;
}

interface ImageUploaderProps {
  images: Id<"_storage">[];
  onImagesChange: (images: Id<"_storage">[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  className,
}: ImageUploaderProps) {
  const [uploadingImages, setUploadingImages] = useState<Map<string, UploadedImage>>(new Map());
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFileMetadata = useMutation(api.files.saveFileMetadata);
  const deleteFile = useMutation(api.files.deleteFile);

  // Fetch URLs for existing images
  const fetchImageUrl = useCallback(async (storageId: Id<"_storage">) => {
    if (imageUrls.has(storageId)) return;
    
    try {
      // We'll use the storage URL directly from Convex
      const response = await fetch(`/api/storage/${storageId}`);
      if (response.ok) {
        const data = await response.json();
        setImageUrls(prev => new Map(prev).set(storageId, data.url));
      }
    } catch {
      // Fallback - the URL might be fetched differently
    }
  }, [imageUrls]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Allowed: JPEG, PNG, GIF, WebP";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 10MB (file is ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<Id<"_storage"> | null> => {
    const tempId = `temp-${Date.now()}-${file.name}`;
    
    // Validate file
    const error = validateFile(file);
    if (error) {
      setUploadingImages(prev => {
        const newMap = new Map(prev);
        newMap.set(tempId, {
          storageId: "" as Id<"_storage">,
          url: URL.createObjectURL(file),
          fileName: file.name,
          status: "error",
          error,
        });
        return newMap;
      });
      // Remove error after 3 seconds
      setTimeout(() => {
        setUploadingImages(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
      }, 3000);
      return null;
    }

    // Add to uploading state
    setUploadingImages(prev => {
      const newMap = new Map(prev);
      newMap.set(tempId, {
        storageId: "" as Id<"_storage">,
        url: URL.createObjectURL(file),
        fileName: file.name,
        status: "uploading",
        progress: 0,
      });
      return newMap;
    });

    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadingImages(prev => {
              const newMap = new Map(prev);
              const current = newMap.get(tempId);
              if (current) {
                newMap.set(tempId, { ...current, progress });
              }
              return newMap;
            });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.storageId);
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("POST", uploadUrl);
        xhr.send(file);
      });

      const storageId = await uploadPromise as Id<"_storage">;

      // Save metadata and get URL
      const result = await saveFileMetadata({
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      // Update state with success
      setUploadingImages(prev => {
        const newMap = new Map(prev);
        newMap.set(tempId, {
          storageId,
          url: result.url,
          fileName: file.name,
          status: "success",
          progress: 100,
        });
        return newMap;
      });

      // Store the URL
      if (result.url) {
        setImageUrls(prev => new Map(prev).set(storageId, result.url!));
      }

      // Remove from uploading state after animation
      setTimeout(() => {
        setUploadingImages(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
      }, 500);

      return storageId;
    } catch (err) {
      console.error("Upload error:", err);
      setUploadingImages(prev => {
        const newMap = new Map(prev);
        newMap.set(tempId, {
          storageId: "" as Id<"_storage">,
          url: URL.createObjectURL(file),
          fileName: file.name,
          status: "error",
          error: "Failed to upload. Please try again.",
        });
        return newMap;
      });

      // Remove error after 3 seconds
      setTimeout(() => {
        setUploadingImages(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
      }, 3000);

      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (remainingSlots <= 0) {
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    const results = await Promise.all(filesToUpload.map(uploadFile));
    const successfulUploads = results.filter((id): id is Id<"_storage"> => id !== null);
    
    if (successfulUploads.length > 0) {
      onImagesChange([...images, ...successfulUploads]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [images.length, maxImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveImage = async (storageId: Id<"_storage">) => {
    try {
      await deleteFile({ storageId });
      onImagesChange(images.filter(id => id !== storageId));
      setImageUrls(prev => {
        const newMap = new Map(prev);
        newMap.delete(storageId);
        return newMap;
      });
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const canAddMore = images.length + uploadingImages.size < maxImages;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => canAddMore && fileInputRef.current?.click()}
        className={cn(
          "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          !canAddMore && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={!canAddMore}
        />
        
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            {isDragging ? (
              <Upload className="h-7 w-7 text-primary" />
            ) : (
              <ImagePlus className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <p className="font-medium">
              {isDragging ? "Drop images here" : "Drag & drop images"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse • Max 10MB per file
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {images.length}/{maxImages} images • JPEG, PNG, GIF, WebP
          </p>
        </div>
      </div>

      {/* Image Previews */}
      {(images.length > 0 || uploadingImages.size > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {/* Existing images */}
          {images.map((storageId) => (
            <ImagePreview
              key={storageId}
              storageId={storageId}
              onRemove={() => handleRemoveImage(storageId)}
            />
          ))}
          
          {/* Uploading images */}
          {Array.from(uploadingImages.entries()).map(([tempId, image]) => (
            <div
              key={tempId}
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              {image.url && (
                <img
                  src={image.url}
                  alt={image.fileName}
                  className={cn(
                    "h-full w-full object-cover transition-opacity",
                    image.status === "uploading" && "opacity-50"
                  )}
                />
              )}
              
              {/* Upload overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                {image.status === "uploading" && (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <span className="mt-2 text-sm font-medium text-white">
                      {image.progress}%
                    </span>
                  </>
                )}
                
                {image.status === "success" && (
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                )}
                
                {image.status === "error" && (
                  <div className="flex flex-col items-center gap-1 px-2 text-center">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                    <span className="text-xs text-white">{image.error}</span>
                  </div>
                )}
              </div>
              
              {/* Progress bar */}
              {image.status === "uploading" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${image.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Separate component for image preview to handle URL fetching
function ImagePreview({
  storageId,
  onRemove,
}: {
  storageId: Id<"_storage">;
  onRemove: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Construct the Convex site URL from the cloud URL
  // NEXT_PUBLIC_CONVEX_URL is like "https://xxx.convex.cloud"
  // We need "https://xxx.convex.site"
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
  const convexSiteUrl = convexUrl.replace(".cloud", ".site");
  const url = `${convexSiteUrl}/getImage?storageId=${storageId}`;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
      {convexSiteUrl ? (
        <img
          src={url}
          alt="MOC preview"
          className={cn(
            "h-full w-full object-cover transition-all",
            isLoading && "animate-pulse"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      
      {/* Remove button */}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

