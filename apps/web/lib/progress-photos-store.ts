import type { SupabaseClient } from '@supabase/supabase-js';

export type ProgressPhotoRow = {
  id: string;
  storage_path: string;
  caption: string | null;
  uploaded_by_type: 'profile' | 'client';
  created_at: string;
  signedUrl: string | null;
};

// Bucket is private, so every read goes through a batch of short-lived
// signed URLs — createSignedUrls still enforces the bucket's storage.objects
// RLS for the calling session, same as a direct download would.
export async function getProgressPhotos(supabase: SupabaseClient, clientId: string): Promise<ProgressPhotoRow[]> {
  const { data: rows } = await supabase
    .from('progress_photos')
    .select('id, storage_path, caption, uploaded_by_type, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (!rows || rows.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from('progress-photos')
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      3600
    );

  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({ ...r, signedUrl: urlByPath.get(r.storage_path) ?? null }));
}
