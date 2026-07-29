'use client';

import { useRef, useState, useTransition } from 'react';
import { Camera, ImageOff, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { fetchMyProgressPhotos, addMyProgressPhoto, deleteMyProgressPhoto } from '@/app/portal/actions';
import type { ProgressPhotoRow } from '@/lib/progress-photos-store';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

const MAX_SIZE_BYTES = 8 * 1024 * 1024;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PortalProgressPhotos({
  clientId,
  practiceId,
  initialPhotos,
}: {
  clientId: string;
  practiceId: string;
  initialPhotos: ProgressPhotoRow[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image must be under 8MB');
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${practiceId}/${clientId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('progress-photos').upload(path, file, {
      contentType: file.type,
    });

    if (uploadError) {
      setIsUploading(false);
      toast.error(uploadError.message);
      return;
    }

    const result = await addMyProgressPhoto(path);
    setIsUploading(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    const updated = await fetchMyProgressPhotos();
    setPhotos(updated);
    toast.success('Photo added');
  }

  function handleDelete(photo: ProgressPhotoRow) {
    if (!window.confirm('Delete this photo?')) return;
    startTransition(async () => {
      const result = await deleteMyProgressPhoto(photo.id, photo.storage_path);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{photos.length} photo{photos.length === 1 ? '' : 's'}</p>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {isUploading ? 'Uploading…' : 'Add Photo'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {photos.length === 0 ? (
        <EmptyState icon={ImageOff} title="No photos yet" description="Track your progress by adding photos over time" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              {photo.signedUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.signedUrl}
                  alt=""
                  className="h-full w-full cursor-pointer object-cover"
                  onClick={() => window.open(photo.signedUrl!, '_blank')}
                />
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1">
                <span className="text-[11px] text-white">{formatDate(photo.created_at)}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(photo)}
                  className="text-white/80 hover:text-white"
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
