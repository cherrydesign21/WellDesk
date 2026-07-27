'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TrendPoint = { month: string; amount: number };
type Slice = { name: string; value: number; color: string };

export function DashboardCharts({
  revenueTrend,
  statusBreakdown,
  adherenceBreakdown,
}: {
  revenueTrend: TrendPoint[];
  statusBreakdown: Slice[];
  adherenceBreakdown: Slice[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} />
              <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="amount" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <DonutCard title="Client Status" data={statusBreakdown} />
      <DonutCard title="Adherence" data={adherenceBreakdown} />
    </div>
  );
}

function DonutCard({ title, data }: { title: string; data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-64 items-center gap-2">
        {total === 0 ? (
          <p className="w-full text-center text-sm text-muted-foreground">No data yet</p>
        ) : (
          <>
            <div className="h-full w-1/2 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
                    {data.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 text-sm">
              {data
                .filter((d) => d.value > 0)
                .map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
