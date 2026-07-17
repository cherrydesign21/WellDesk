import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteTemplateButton } from '@/components/diet-plans/delete-template-button';

export default async function DietPlanTemplatesPage() {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const { data: templates } = await supabase
    .from('diet_plans')
    .select('id, name, created_at')
    .eq('is_template', true)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Diet Plan Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable plans you can start any client&apos;s plan from.</p>
        </div>
        <Button render={<Link href="/diet-plans/templates/new" />}>New Template</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!templates || templates.length === 0) && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No templates yet.
                </TableCell>
              </TableRow>
            )}
            {templates?.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  <Link href={`/diet-plans/templates/${template.id}`} className="hover:underline">
                    {template.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <DeleteTemplateButton templateId={template.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
