
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (file: File) => Promise<string | null>;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({ value, onChange, disabled = false, className }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !disabled) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await onChange(file);
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0] && !disabled) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        await onChange(file);
      }
    }
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      // Create an empty file to reset the image
      const emptyFile = new File([""], "empty.jpg", { type: "image/jpeg" });
      onChange(emptyFile);
    }
  };

  return (
    <div 
      className={cn(
        "relative border-2 border-dashed rounded-md p-4 transition-colors",
        dragActive ? "border-primary" : "border-muted-foreground/25",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        id="image-upload"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
      />

      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md">
          <img 
            src={value} 
            alt="Uploaded image" 
            className="h-full w-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div 
          className="flex flex-col items-center justify-center py-4 text-center"
          onClick={!disabled ? handleButtonClick : undefined}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-2 text-sm font-medium">
            Drag & drop an image here, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, GIF up to 10MB
          </p>
          <Button 
            type="button" 
            variant="secondary" 
            size="sm" 
            className="mt-4"
            onClick={handleButtonClick}
            disabled={disabled}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
        </div>
      )}
    </div>
  );
}
