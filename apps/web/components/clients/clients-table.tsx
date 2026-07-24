'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, ArrowDownAZ, ArrowUpAZ, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_TYPE_LABELS, PLAN_TYPES, GENDERS, CLIENT_STATUSES } from '@welldesk/shared';
import { archiveClient, reactivateClient, bulkArchiveClients } from '@/app/(dashboard)/clients/actions';
import { EditClientDialog, type EditableClient } from './edit-client-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { ExportMenu } from '@/components/ui/export-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Enrollment = { plan_type: string; expiry_date: string; status: string; cycle_number: number };
export type ClientRow = EditableClient & {
  status: string;
  effective_status: string;
  created_at: string;
  last_visit: string | null;
  enrollments: Enrollment[];
};

export type ClientsFilters = {
  q?: string;
  gender?: string;
  status?: string;
  planType?: string;
  joinMonth?: string;
  expiringWithin?: string;
  sort?: string;
  dir?: string;
};

const SORT_OPTIONS = [
  { value: 'joinDate', label: 'Join Date' },
  { value: 'name', label: 'Name' },
  { value: 'expiryDate', label: 'Expiry Date' },
  { value: 'lastVisit', label: 'Last Visit' },
  { value: 'planType', label: 'Plan Type' },
];

function clearIf(value: string | null, sentinel: string) {
  return value && value !== sentinel ? value : undefined;
}

function latestEnrollment(enrollments: Enrollment[]) {
  return [...(enrollments ?? [])].sort((a, b) => b.cycle_number - a.cycle_number)[0];
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

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const CLIENT_EXPORT_HEADERS = ['Name', 'Phone', 'Email', 'Gender', 'Status', 'Plan', 'Expiry', 'Join Date', 'Last Visit'];

function clientsToRows(clients: ClientRow[]): string[][] {
  return clients.map((c) => {
    const enrollment = latestEnrollment(c.enrollments);
    return [
      c.full_name,
      c.phone ?? '',
      c.email ?? '',
      c.gender ?? '',
      c.effective_status,
      enrollment ? (PLAN_TYPE_LABELS[enrollment.plan_type as keyof typeof PLAN_TYPE_LABELS] ?? '') : '',
      enrollment?.expiry_date ?? '',
      c.created_at.slice(0, 10),
      c.last_visit ? c.last_visit.slice(0, 10) : '',
    ];
  });
}

export function ClientsTable({
  clients,
  filters,
  practiceId,
}: {
  clients: ClientRow[];
  filters: ClientsFilters;
  practiceId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditableClient | null>(null);
  const [isPending, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = setTimeout(() => navigate({ q: query || undefined }), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function navigate(overrides: Partial<ClientsFilters>) {
    const next: ClientsFilters = { ...filters, q: query || undefined, ...overrides };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/clients${params.toString() ? `?${params}` : ''}`);
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(clients.map((c) => c.id)) : new Set());
  }

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

  function handleBulkArchive() {
    if (!window.confirm(`Archive ${selected.size} client(s)?`)) return;
    startTransition(async () => {
      const result = await bulkArchiveClients([...selected]);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${selected.size} client(s) archived`);
      setSelected(new Set());
    });
  }

  const sort = filters.sort ?? 'joinDate';
  const dir = filters.dir === 'asc' ? 'asc' : 'desc';
  const allSelected = clients.length > 0 && selected.size === clients.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search by name, phone, or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64"
        />
        <Select
          value={filters.gender ?? 'all'}
          onValueChange={(v) => navigate({ gender: clearIf(v, 'all') })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genders</SelectItem>
            {GENDERS.map((g) => (
              <SelectItem key={g} value={g} className="capitalize">
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(v) => navigate({ status: clearIf(v, 'all') })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CLIENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.planType ?? 'all'}
          onValueChange={(v) => navigate({ planType: clearIf(v, 'all') })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Plan type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plan types</SelectItem>
            {PLAN_TYPES.map((p) => (
              <SelectItem key={p} value={p}>
                {PLAN_TYPE_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={filters.joinMonth ?? ''}
          onChange={(e) => navigate({ joinMonth: e.target.value || undefined })}
          className="w-40"
        />
        <Select
          value={filters.expiringWithin ?? 'any'}
          onValueChange={(v) => navigate({ expiringWithin: clearIf(v, 'any') })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Expiring" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any expiry</SelectItem>
            <SelectItem value="7">Expiring in 7 days</SelectItem>
            <SelectItem value="14">Expiring in 14 days</SelectItem>
            <SelectItem value="30">Expiring in 30 days</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => v && navigate({ sort: v })}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate({ dir: dir === 'asc' ? 'desc' : 'asc' })}
            title={dir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {dir === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
          </Button>
          <ExportMenu
            filenameBase="clients"
            title="Clients"
            headers={CLIENT_EXPORT_HEADERS}
            rows={clientsToRows(clients)}
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <ExportMenu
            label="Export selected"
            filenameBase="clients-selected"
            title="Clients (selected)"
            headers={CLIENT_EXPORT_HEADERS}
            rows={clientsToRows(clients.filter((c) => selected.has(c.id)))}
          />
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleBulkArchive}>
            Archive selected
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(c) => toggleSelectAll(!!c)} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState icon={Users} title="No clients found" description="Add your first client to get started." compact />
                </TableCell>
              </TableRow>
            )}
            {clients.map((client) => {
              const enrollment = latestEnrollment(client.enrollments);
              const expiringSoon =
                enrollment && client.effective_status === 'active' && daysUntil(enrollment.expiry_date) <= 7;
              return (
                <TableRow key={client.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(client.id)}
                      onCheckedChange={(c) => toggleSelected(client.id, !!c)}
                    />
                  </TableCell>
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
                  <TableCell className="text-sm text-muted-foreground">
                    {client.last_visit ? client.last_visit.slice(0, 10) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(client.effective_status)} className="capitalize">
                      {client.effective_status}
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
        practiceId={practiceId}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}
