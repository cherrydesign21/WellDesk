'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { fetchMyThreadMessages, sendClientMessage } from '@/app/portal/actions';
import type { MessageRow } from '@/lib/messages-store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

const POLL_MS = 6000;

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function PortalMessageThread() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const rows = await fetchMyThreadMessages();
      if (!cancelled) setMessages(rows);
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    startTransition(async () => {
      const result = await sendClientMessage({ body });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      const rows = await fetchMyThreadMessages();
      setMessages(rows);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No messages yet" description="Send a message to reach your dietitian" />
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.sender_type === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-accent-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    m.sender_type === 'client' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  {timeLabel(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          className="max-h-32"
        />
        <Button size="icon" onClick={handleSend} disabled={isPending || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
