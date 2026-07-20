import { Target } from 'lucide-react';
import { calculateIdealWeightKg, type Gender } from '@welldesk/shared';
import { Card, CardContent } from '@/components/ui/card';

export function IdealWeightCard({
  heightCm,
  gender,
  currentWeightKg,
}: {
  heightCm: number | null;
  gender: Gender | null;
  currentWeightKg: number | null;
}) {
  const ideal = heightCm ? calculateIdealWeightKg(heightCm, gender) : null;
  if (!ideal) return null;

  const diff = currentWeightKg ? Math.round((currentWeightKg - ideal) * 10) / 10 : null;

  return (
    <Card className="border-l-4 border-l-info">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/15 text-(--info-700)">
            <Target className="h-5 w-5" />
          </div>
          <p className="text-xs text-muted-foreground">Ideal weight (Devine formula)</p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Ideal</p>
            <p className="text-lg font-semibold">{ideal} kg</p>
          </div>
          {diff !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Current vs. ideal</p>
              <p className="text-lg font-semibold">
                {diff > 0 ? `+${diff}` : diff} kg
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Based on latest recorded height{gender ? '' : ' — set gender on this client for a more precise estimate'}.
        </p>
      </CardContent>
    </Card>
  );
}
