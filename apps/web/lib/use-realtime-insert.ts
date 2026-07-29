'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// Subscribes to Supabase Realtime INSERT events on `table`, filtered by
// `filter` (e.g. "recipient_profile_id=eq.<uuid>"). RLS still gates what
// actually arrives over the socket — the filter just cuts subscription
// noise. Only re-subscribes when table/filter change, not on every render.
export function useRealtimeInsert(table: string, filter: string, onInsert: () => void) {
  const onInsertRef = useRef(onInsert);
  useEffect(() => {
    onInsertRef.current = onInsert;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`${table}:${filter}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, () => onInsertRef.current())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
