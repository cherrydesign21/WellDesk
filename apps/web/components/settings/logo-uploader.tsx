'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { updateLogoUrl } from '@/app/(dashboard)/settings/branding/actions';
import { Button } from '@/components/ui/button';

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function LogoUploader({ practiceId, initialLogoUrl }: { practiceId: string; initialLogoUrl: string | null }) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Logo must be under 2MB');
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${practiceId}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('logos').getPublicUrl(path);
      const result = await updateLogoUrl(data.publicUrl);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setLogoUrl(data.publicUrl);
      toast.success('Logo updated');
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await updateLogoUrl(null);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setLogoUrl(null);
      toast.success('Logo removed');
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Practice logo" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">No logo</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {logoUrl ? 'Replace logo' : 'Upload logo'}
        </Button>
        {logoUrl && (
          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleRemove}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
