'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function AvatarUploader({
  practiceId,
  pathPrefix,
  initialUrl,
  onUploaded,
  size = 80,
}: {
  practiceId: string;
  pathPrefix: string;
  initialUrl?: string | null;
  onUploaded: (url: string | null) => void;
  size?: number;
}) {
  const [url, setUrl] = useState(initialUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image must be under 2MB');
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${practiceId}/${pathPrefix}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    setIsUploading(false);

    if (uploadError) {
      toast.error(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setUrl(data.publicUrl);
    onUploaded(data.publicUrl);
  }

  function handleRemove() {
    setUrl(null);
    onUploaded(null);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <div
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border bg-muted"
          style={{ width: size, height: size }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-1/2 w-1/2 text-muted-foreground" />
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-1/3 w-1/3 animate-spin text-white" />
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:opacity-90"
          aria-label={url ? 'Replace photo' : 'Upload photo'}
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {url && (
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" />
          Remove photo
        </button>
      )}
    </div>
  );
}
