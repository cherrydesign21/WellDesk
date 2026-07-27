'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { assignTemplateToClients } from '@/app/(dashboard)/diet-plans/templates/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function AssignTemplateDialog({
  templateId,
  clients,
  trigger,
  triggerContent,
}: {
  templateId: string;
  clients: { id: string; full_name: string }[];
  trigger?: React.ReactElement;
  triggerContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => clients.filter((c) => c.full_name.toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0) return;
    const count = selected.size;
    startTransition(async () => {
      const result = await assignTemplateToClients(templateId, [...selected]);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Assigned to ${count} client${count === 1 ? '' : 's'}`);
      setOpen(false);
      setSelected(new Set());
      setSearch('');
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelected(new Set());
          setSearch('');
        }
      }}
    >
      <DialogTrigger render={trigger ?? <Button variant="outline" />}>
        {trigger ? (
          triggerContent
        ) : (
          <>
            <Users className="h-4 w-4" />
            Assign to Clients
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign template to clients</DialogTitle>
          <DialogDescription>
            Select one or more clients to create a new diet plan from this template for each of them.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <Input placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="max-h-80 space-y-0.5 overflow-y-auto rounded-md border p-1">
            {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">No clients found.</p>}
            {filtered.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md p-2 text-sm hover:bg-muted"
              >
                <Checkbox checked={selected.has(c.id)} onCheckedChange={(checked) => toggle(c.id, !!checked)} />
                {c.full_name}
              </label>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending || selected.size === 0}>
            {isPending
              ? 'Assigning…'
              : selected.size > 0
                ? `Assign to ${selected.size} client${selected.size === 1 ? '' : 's'}`
                : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
