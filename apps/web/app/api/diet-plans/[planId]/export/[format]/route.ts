import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { renderPlanPdf } from '@/lib/exports/pdf';
import { renderPlanXlsx } from '@/lib/exports/xlsx';
import { renderPlanDocx } from '@/lib/exports/docx';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string; format: string }> }
) {
  const { planId, format } = await params;

  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = await getPlanWithMeals(supabase, planId);
  if (!plan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const practice = result.profile.practices ?? { name: 'WellDesk', tagline: null, primary_color: null };
  const filename = plan.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'diet-plan';

  if (format === 'pdf') {
    const blob = await renderPlanPdf(plan, practice);
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  if (format === 'xlsx') {
    const buffer = renderPlanXlsx(plan);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  if (format === 'docx') {
    const buffer = await renderPlanDocx(plan, practice);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
      },
    });
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
}
