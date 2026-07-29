'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { MessageCircle, Send, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchThreadMessages,
  fetchInboxSummaries,
  sendProfileMessage,
} from '@/app/(dashboard)/messages/actions';
import type { MessageRow, InboxThreadSummary } from '@/lib/messages-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

type ClientRow = { id: string; full_name: string; photo_url: string | null };

const POLL_MS = 6000;

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function MessagesInbox({
  clients,
  initialSummaries,
  initialClientId,
}: {
  clients: ClientRow[];
  initialSummaries: InboxThreadSummary[];
  initialClientId?: string;
}) {
  const [summaries, setSummaries] = useState(initialSummaries);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialClientId ?? null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const summaryByClient = useMemo(() => {
    const map = new Map<string, InboxThreadSummary>();
    for (const s of summaries) map.set(s.clientId, s);
    return map;
  }, [summaries]);

  const sortedClients = useMemo(() => {
    const filtered = clients.filter((c) => c.full_name.toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => {
      const sa = summaryByClient.get(a.id);
      const sb = summaryByClient.get(b.id);
      if (sa && sb) return sa.lastCreatedAt < sb.lastCreatedAt ? 1 : -1;
      if (sa) return -1;
      if (sb) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [clients, search, summaryByClient]);

  const selectedClient = clients.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    async function load() {
      const rows = await fetchThreadMessages(selectedId!);
      if (!cancelled) setMessages(rows);
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchInboxSummaries().then(setSummaries);
    }, POLL_MS * 2);
    return () => clearInterval(interval);
  }, []);

  function handleSend() {
    const body = draft.trim();
    if (!body || !selectedId) return;
    setDraft('');
    startTransition(async () => {
      const result = await sendProfileMessage(selectedId, { body });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      const rows = await fetchThreadMessages(selectedId);
      setMessages(rows);
      fetchInboxSummaries().then(setSummaries);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4 rounded-xl border border-border bg-card">
      <div className="flex w-72 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients"
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sortedClients.map((c) => {
            const summary = summaryByClient.get(c.id);
            const isActive = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-center gap-3 border-b border-border/50 px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <Avatar size="sm">
                  <AvatarImage src={c.photo_url ?? undefined} alt="" />
                  <AvatarFallback>{initials(c.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{c.full_name}</p>
                    {summary && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeLabel(summary.lastCreatedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      {summary ? summary.lastBody : 'No messages yet'}
                    </p>
                    {summary && summary.unreadCount > 0 && (
                      <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {summary.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {!selectedClient ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={MessageCircle} title="Select a client" description="Pick a client on the left to start messaging" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <Avatar size="sm">
                <AvatarImage src={selectedClient.photo_url ?? undefined} alt="" />
                <AvatarFallback>{initials(selectedClient.full_name)}</AvatarFallback>
              </Avatar>
              <p className="font-medium">{selectedClient.full_name}</p>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <EmptyState icon={MessageCircle} title="No messages yet" description="Send the first message below" compact />
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_type === 'profile' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                        m.sender_type === 'profile'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          m.sender_type === 'profile' ? 'text-primary-foreground/70' : 'text-muted-foreground'
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
          </>
        )}
      </div>
    </div>
  );
}
