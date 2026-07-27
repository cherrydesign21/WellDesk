'use client';

import { LENGTH_UNITS, type LengthUnit } from '@welldesk/shared';
import { useLengthUnit } from '@/lib/use-length-unit';

export function LengthUnitToggle({ className }: { className?: string }) {
  const [unit, setUnit] = useLengthUnit();

  return (
    <div className={`flex items-center gap-1 rounded-full border p-0.5 ${className ?? ''}`}>
      {LENGTH_UNITS.map((u: LengthUnit) => (
        <button
          key={u}
          type="button"
          onClick={() => setUnit(u)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            u === unit ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
