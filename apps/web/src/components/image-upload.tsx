'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { uploadsApi } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads an image and reports its public URL. Shows a preview of the current value. */
export function ImageUpload({
  value,
  onChange,
  uploadType,
  aspect = 'aspect-[16/9]',
  label = 'Upload image',
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  uploadType: 'event_banner' | 'event_portrait' | 'organizer_logo' | 'profile_image';
  aspect?: string;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use a JPEG, PNG or WebP image');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Images must be 5 MB or smaller');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadsApi.upload(file, uploadType);
      onChange(uploaded.file_url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-dashed border-line bg-canvas', aspect)}>
      {value ? (
        <>
          <img src={value} alt="" className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-white hover:bg-ink"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="absolute bottom-2 right-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow"
          >
            Replace
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted hover:text-ink"
        >
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          {uploading ? 'Uploading…' : label}
          <span className="text-xs">JPEG, PNG or WebP, up to 5 MB</span>
        </button>
      )}
      {uploading && value && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
