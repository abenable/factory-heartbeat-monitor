import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
}

export function textToSignatureDataUrl(text: string): string {
  if (!text.trim()) return "";
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "italic 36px 'Brush Script MT', 'Georgia', cursive";
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "middle";

  const measured = ctx.measureText(text);
  const x = Math.max(16, (canvas.width - measured.width) / 2);
  const y = canvas.height / 2;
  ctx.fillText(text, x, y);

  return canvas.toDataURL("image/png");
}

export function SignaturePad({
  value,
  onChange,
  label = "Signature",
  placeholder = "Sign here",
  disabled = false,
  height = 120,
  className = "",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const drawingRef = useRef(false);

  // Draw any existing signature when the component mounts or value changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHasDrawn(true);
    };
    img.src = value;
  }, [value]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    drawingRef.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    const point = getPoint(e);
    ctx.moveTo(point.x, point.y);
    setHasDrawn(true);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const point = getPoint(e);
    ctx.lineTo(point.x, point.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.stroke();
  };

  const end = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    e?.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </span>
        {!disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasDrawn}>
            Clear
          </Button>
        )}
      </div>
      <div
        className={`relative rounded-md border border-border bg-white ${disabled ? "opacity-70 cursor-not-allowed" : "cursor-crosshair"}`}
        style={{ height }}
      >
        {!hasDrawn && !value && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/60">
            {placeholder}
          </span>
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={height * 2}
          className="h-full w-full touch-none rounded-md"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
          aria-label={label}
        />
      </div>
      <p className="text-xs text-muted-foreground">Draw your signature above using a mouse or touch/stylus.</p>
    </div>
  );
}
