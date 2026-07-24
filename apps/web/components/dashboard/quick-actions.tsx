import Link from 'next/link';
import { UserPlus, UtensilsCrossed, CalendarPlus, MessageCircle, type LucideIcon } from 'lucide-react';
import { NewClientDialog } from '@/components/clients/new-client-dialog';
import { NewAppointmentDialog } from '@/components/appointments/new-appointment-dialog';

const CARD_CLASS =
  'flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground';

function QuickActionContent({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </>
  );
}

export function QuickActionsRow({
  practiceId,
  clients,
}: {
  practiceId: string;
  clients: { id: string; full_name: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <NewClientDialog
        practiceId={practiceId}
        trigger={<button type="button" className={CARD_CLASS} />}
        triggerLabel={<QuickActionContent icon={UserPlus} label="Add New Client" />}
      />
      <Link href="/diet-plans/templates/new" className={CARD_CLASS}>
        <QuickActionContent icon={UtensilsCrossed} label="Create Diet Plan" />
      </Link>
      <NewAppointmentDialog
        clients={clients}
        trigger={<button type="button" className={CARD_CLASS} />}
        triggerLabel={<QuickActionContent icon={CalendarPlus} label="Schedule Appointment" />}
      />
      <Link href="/clients" className={CARD_CLASS}>
        <QuickActionContent icon={MessageCircle} label="Message Client" />
      </Link>
    </div>
  );
}
