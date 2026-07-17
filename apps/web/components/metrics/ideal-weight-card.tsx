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
    <Card>
      <CardContent className="flex flex-wrap items-center gap-6 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Ideal weight (Devine formula)</p>
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
        <p className="ml-auto max-w-xs text-xs text-muted-foreground">
          Based on latest recorded height{gender ? '' : ' — set gender on this client for a more precise estimate'}.
        </p>
      </CardContent>
    </Card>
  );
}
