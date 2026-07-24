'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, Trash2, Users } from 'lucide-react';
import { deleteClientAdmin } from '@/app/admin/clients/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export type AdminClientRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  dob: string | null;
  status: string;
  joinedAt: string;
  practiceId: string;
  practiceName: string;
  dietitianName: string;
};

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function statusVariant(status: string): 'success' | 'warning' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'expired':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function AdminClientsTable({ rows }: { rows: AdminClientRow[] }) {
  const [selected, setSelected] = useState<AdminClientRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(row: AdminClientRow) {
    if (
      !window.confirm(`Permanently delete ${row.fullName}? This removes their plans, payments, and history. This cannot be undone.`)
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteClientAdmin(row.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Client deleted');
      setSelected(null);
    });
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Dietitian</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState icon={Users} title="No clients yet" compact />
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelected(row)}>
                <TableCell className="font-medium">{row.fullName}</TableCell>
                <TableCell>
                  <div className="text-sm">{row.phone ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{row.email ?? '—'}</div>
                </TableCell>
                <TableCell className="capitalize">{row.gender ?? '—'}</TableCell>
                <TableCell>{calculateAge(row.dob) ?? '—'}</TableCell>
                <TableCell>{row.dietitianName}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)} className="capitalize">
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {row.joinedAt.slice(0, 10)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSelected(row)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={isPending} onClick={() => handleDelete(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.fullName}</SheetTitle>
                <SheetDescription>{selected.practiceName}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selected.email ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selected.phone ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{selected.gender ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-medium">{calculateAge(selected.dob) ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dietitian</p>
                    <p className="font-medium">{selected.dietitianName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={statusVariant(selected.status)} className="mt-0.5 capitalize">
                      {selected.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="font-medium">{selected.joinedAt.slice(0, 10)}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link href={`/admin/practices/${selected.practiceId}/clients/${selected.id}`} target="_blank" />}
                >
                  View full profile &amp; history
                </Button>

                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isPending}
                  onClick={() => handleDelete(selected)}
                >
                  Delete client
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
