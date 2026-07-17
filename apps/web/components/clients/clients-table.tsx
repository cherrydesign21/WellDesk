'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_TYPE_LABELS, getEffectiveClientStatus, type ClientStatus } from '@welldesk/shared';
import { archiveClient, reactivateClient } from '@/app/(dashboard)/clients/actions';
import { EditClientDialog, type EditableClient } from './edit-client-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Enrollment = { plan_type: string; expiry_date: string; status: string; cycle_number: number };
export type ClientRow = EditableClient & {
  status: string;
  created_at: string;
  enrollments: Enrollment[];
};

function latestEnrollment(enrollments: Enrollment[]) {
  return [...(enrollments ?? [])].sort((a, b) => b.cycle_number - a.cycle_number)[0];
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'paused':
      return 'secondary';
    case 'expired':
      return 'destructive';
    default:
      return 'outline';
  }
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function ClientsTable({
  clients,
  initialQuery,
}: {
  clients: ClientRow[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [editing, setEditing] = useState<EditableClient | null>(null);
  const [, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      router.push(`/clients${params.toString() ? `?${params}` : ''}`);
    }, 350);
    return () => clearTimeout(handle);
  }, [query, router]);

  function handleArchive(id: string) {
    startTransition(async () => {
      const result = await archiveClient(id);
      if (result?.error) toast.error(result.error);
      else toast.success('Client archived');
    });
  }

  function handleReactivate(id: string) {
    startTransition(async () => {
      const result = await reactivateClient(id);
      if (result?.error) toast.error(result.error);
      else toast.success('Client reactivated');
    });
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name, phone, or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
            {clients.map((client) => {
              const enrollment = latestEnrollment(client.enrollments);
              const effectiveStatus = getEffectiveClientStatus(client.status as ClientStatus, enrollment);
              const expiringSoon =
                enrollment && effectiveStatus === 'active' && daysUntil(enrollment.expiry_date) <= 7;
              return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.phone}</div>
                    <div className="text-xs text-muted-foreground">{client.email}</div>
                  </TableCell>
                  <TableCell>
                    {enrollment
                      ? PLAN_TYPE_LABELS[enrollment.plan_type as keyof typeof PLAN_TYPE_LABELS]
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {enrollment ? (
                      <span className={expiringSoon ? 'font-medium text-amber-600' : ''}>
                        {enrollment.expiry_date}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(effectiveStatus)} className="capitalize">
                      {effectiveStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(client)}>Edit</DropdownMenuItem>
                        {client.status === 'archived' ? (
                          <DropdownMenuItem onClick={() => handleReactivate(client.id)}>
                            Reactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleArchive(client.id)}>
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <EditClientDialog
        client={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}
