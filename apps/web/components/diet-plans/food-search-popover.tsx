'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { FoodSearchResult } from '@/app/api/food-search/route';

export function FoodSearchPopover({ onSelect }: { onSelect: (result: FoodSearchResult) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setError(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Search failed');
          setResults([]);
        } else {
          setResults(data.results ?? []);
        }
      } catch {
        setError('Search failed');
      } finally {
        setIsLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(result: FoodSearchResult) {
    onSelect(result);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="ghost" size="icon" title="Search USDA food database" />}
      >
        <Search className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <Input
          autoFocus
          placeholder="Search foods (e.g. chicken breast)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {error && <p className="px-1 py-2 text-xs text-destructive">{error}</p>}
          {!isLoading && !error && query.trim() && results.length === 0 && (
            <p className="px-1 py-2 text-xs text-muted-foreground">No matches found</p>
          )}
          {results.map((r) => (
            <button
              key={r.fdcId}
              type="button"
              onClick={() => handleSelect(r)}
              className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-accent"
            >
              <span className="text-sm font-medium">{r.description}</span>
              <span className="text-xs text-muted-foreground">
                {r.calories != null ? `${r.calories} kcal` : '—'} per 100g
                {r.proteinG != null && ` · P ${r.proteinG}g`}
                {r.fatG != null && ` · F ${r.fatG}g`}
                {r.carbsG != null && ` · C ${r.carbsG}g`}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
