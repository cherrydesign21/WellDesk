import Link from 'next/link';
import { Mail, Phone, MessageSquare, PhoneCall, FileText, UtensilsCrossed } from 'lucide-react';
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
              className="h-20 w-20 rounded-full object-cover ring-1 ring-foreground/10"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground ring-1 ring-foreground/10">
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
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {client.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {client.phone}
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-x-8 gap-y-1 text-sm sm:flex sm:gap-x-8">
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
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
        <div className="flex items-center gap-2">
          {client.email && (
            <Button variant="outline" size="sm" render={<a href={`mailto:${client.email}`} />}>
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
          )}
          {client.phone && (
            <Button variant="outline" size="sm" render={<a href={`tel:${client.phone}`} />}>
              <PhoneCall className="h-4 w-4" />
              Call
            </Button>
          )}
          <Button variant="outline" size="sm" render={<a href={`/api/clients/${client.id}/report-card`} />}>
            <FileText className="h-4 w-4" />
            Report Card
          </Button>
          <Button variant="outline" size="sm" render={<Link href={`/clients/${client.id}/diet-plans`} />}>
            <UtensilsCrossed className="h-4 w-4" />
            Diet Plans
          </Button>
          <NewAppointmentDialog clientId={client.id} triggerLabel="New Appointment" />
        </div>
        <PortalAccessCard clientId={client.id} hasPortalAccess={!!client.user_id} />
      </div>
    </div>
  );
}
