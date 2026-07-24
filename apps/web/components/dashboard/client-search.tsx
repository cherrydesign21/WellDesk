'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { searchClients } from '@/app/(dashboard)/clients/actions';

type Result = { id: string; full_name: string; phone: string | null; email: string | null; photo_url: string | null };

export function ClientSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(() => {
      setIsLoading(true);
      searchClients(query).then((rows) => {
        setResults(rows as Result[]);
        setIsLoading(false);
        setOpen(true);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goTo(id: string) {
    setOpen(false);
    setQuery('');
    router.push(`/clients/${id}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Search clients…"
        className="h-10 w-full rounded-full border border-input bg-card pr-3 pl-9 text-sm outline-none focus:border-ring"
      />
      {isLoading && (
        <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {results.length === 0 && !isLoading && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No clients found</p>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => goTo(r.id)}
              className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {r.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photo_url} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {r.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{r.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.phone ?? r.email ?? ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
