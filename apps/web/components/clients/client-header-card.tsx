import Link from 'next/link';
import { MessageSquare, PhoneCall, FileText, UtensilsCrossed, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewAppointmentDialog } from '@/components/appointments/new-appointment-dialog';
import { PortalAccessCard } from '@/components/clients/portal-access-card';

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function ToolbarDivider() {
  return <div className="h-5 w-px shrink-0 bg-border" />;
}

export function ClientHeaderCard({
  client,
  effectiveStatus,
  statusVariant,
  memberSince,
}: {
  client: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    gender: string | null;
    dob: string | null;
    photo_url: string | null;
    diet_type: string | null;
    user_id: string | null;
  };
  effectiveStatus: string;
  statusVariant: 'success' | 'warning' | 'destructive' | 'outline';
  memberSince: string;
}) {
  const initial = client.full_name.trim().charAt(0).toUpperCase() || '?';
  const age = calculateAge(client.dob);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          {client.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={client.photo_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-1 ring-foreground/10"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground ring-1 ring-foreground/10">
              {initial}
            </div>
          )}
          {effectiveStatus === 'active' && (
            <span className="absolute right-1 bottom-1 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-card" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{client.full_name}</h1>
            <Badge variant={statusVariant} className="capitalize">
              {effectiveStatus}
            </Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:flex sm:flex-wrap sm:gap-x-8">
            {age !== null && (
              <div>
                <p className="text-xs text-muted-foreground">Age</p>
                <p className="font-medium">{age} Years</p>
              </div>
            )}
            {client.gender && (
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{client.gender}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="font-medium">{memberSince}</p>
            </div>
            {client.diet_type && (
              <div>
                <p className="text-xs text-muted-foreground">Diet type</p>
                <p className="font-medium">{client.diet_type}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="flex h-11 items-center gap-1 rounded-[10px] border bg-muted/40 p-[5px]">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Message"
            render={<Link href={`/messages?clientId=${client.id}`} />}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="sr-only">Message</span>
          </Button>
          {client.phone && (
            <Button variant="ghost" size="icon-sm" title="Call" render={<a href={`tel:${client.phone}`} />}>
              <PhoneCall className="h-4 w-4" />
              <span className="sr-only">Call</span>
            </Button>
          )}
          <ToolbarDivider />
          <Button variant="ghost" size="sm" render={<a href={`/api/clients/${client.id}/report-card`} />}>
            <FileText className="h-4 w-4" />
            Report Card
          </Button>
          <Button variant="ghost" size="sm" render={<Link href={`/clients/${client.id}/diet-plans`} />}>
            <UtensilsCrossed className="h-4 w-4" />
            Diet Plans
          </Button>
          <ToolbarDivider />
          <NewAppointmentDialog
            clientId={client.id}
            trigger={<Button size="sm" />}
            triggerLabel={
              <>
                <Plus className="h-3.5 w-3.5" />
                New Appointment
              </>
            }
          />
        </div>
        <PortalAccessCard clientId={client.id} hasPortalAccess={!!client.user_id} />
      </div>
    </div>
  );
}
