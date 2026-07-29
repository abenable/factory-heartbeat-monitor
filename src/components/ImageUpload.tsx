import { useRef, useState } from "react";
import { Upload, X, ImageIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ImageAttachment {
  name: string;
  dataUrl: string;
}

interface ImageUploadProps {
  id?: string;
  label?: string;
  description?: string;
  value?: ImageAttachment[];
  onChange: (images: ImageAttachment[]) => void;
  maxCount?: number;
  maxSizeBytes?: number;
}

const DEFAULT_MAX_SIZE = 4 * 1024 * 1024; // 4 MB

export function ImageUpload({
  id,
  label = "Upload image",
  description = "Attach a photo to support your report.",
  value = [],
  onChange,
  maxCount = 4,
  maxSizeBytes = DEFAULT_MAX_SIZE,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);

    if (value.length + files.length > maxCount) {
      setError(`You can attach up to ${maxCount} image${maxCount === 1 ? "" : "s"}.`);
      return;
    }

    const oversized = files.filter((f) => f.size > maxSizeBytes);
    if (oversized.length > 0) {
      const mb = (maxSizeBytes / 1024 / 1024).toFixed(0);
      setError(`Each image must be smaller than ${mb} MB.`);
      return;
    }

    const newImages: ImageAttachment[] = [];
    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        newImages.push({ name: file.name, dataUrl });
      } catch {
        setError(`Could not read ${file.name}.`);
      }
    }

    if (newImages.length > 0) {
      onChange([...value, ...newImages]);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ImageIcon className="size-3" /> {label}
      </label>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((img, idx) => (
            <div
              key={`${img.name}-${idx}`}
              className="relative aspect-square rounded-lg border border-border bg-panel overflow-hidden group"
            >
              <img
                src={img.dataUrl}
                alt={img.name}
                className="size-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(idx)}
                aria-label={`Remove ${img.name}`}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {value.length < maxCount && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-panel p-6 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <Upload className="size-5" />
          <span className="text-sm font-medium">Click to upload an image</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </button>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="size-3" /> {error}
        </p>
      )}

      {value.length > 0 && (
        <p className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
          {value.length} of {maxCount} image{maxCount === 1 ? "" : "s"} attached
        </p>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
