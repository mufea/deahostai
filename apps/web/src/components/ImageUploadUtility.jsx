import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';
import { useTranslation } from 'react-i18next';

export default function ImageUploadUtility({ 
  onImageSelected, 
  onError, 
  maxSizeMB = 10,
  minDim = 256,
  maxDim = 4096,
  className
}) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const validateAndProcessFile = useCallback((file) => {
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      onError(t('video.errors.invalid_format') || 'Invalid format. Use JPG, PNG, WebP, or GIF.');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      onError(t('video.errors.too_large') || `File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    
    // Validate Dimensions
    const img = new Image();
    img.onload = () => {
      if (img.width < minDim || img.height < minDim || img.width > maxDim || img.height > maxDim) {
        onError(t('video.errors.invalid_dimensions') || `Image dimensions must be between ${minDim}x${minDim} and ${maxDim}x${maxDim}.`);
        URL.revokeObjectURL(objectUrl);
        return;
      }
      
      setPreviewUrl(objectUrl);
      setFileInfo({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        dimensions: `${img.width}x${img.height}`
      });
      onImageSelected(file, objectUrl);
    };
    img.onerror = () => {
      onError('Failed to read image data.');
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }, [maxSizeMB, minDim, maxDim, onError, onImageSelected, t, allowedTypes]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const clearImage = (e) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileInfo(null);
    onImageSelected(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50",
            "bg-muted/30"
          )}
        >
          <div className="p-4 bg-background rounded-full shadow-sm mb-4">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">{t('video.upload_image') || 'Upload Image'}</p>
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            Drag & drop or click to browse. Supports JPG, PNG, WebP, GIF (Max {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border bg-muted/30 group">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full object-cover max-h-[300px]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="mr-2">
              Replace
            </Button>
            <Button variant="destructive" size="icon" onClick={clearImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2 text-white/90">
              <ImageIcon className="h-4 w-4" />
              <span className="text-xs truncate font-medium">{fileInfo?.name}</span>
              <span className="text-xs text-white/70 ml-auto">{fileInfo?.dimensions} • {fileInfo?.size}</span>
            </div>
          </div>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept={allowedTypes.join(',')} 
        className="hidden" 
      />
    </div>
  );
}