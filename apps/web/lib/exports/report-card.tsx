import { Document, Page, Text, View, Image, Svg, Polyline, StyleSheet, pdf } from '@react-pdf/renderer';
import { PLAN_TYPE_LABELS, type PlanType } from '@welldesk/shared';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    borderBottom: 1,
    borderColor: '#999999',
    paddingBottom: 8,
  },
  logo: { width: 36, height: 36, objectFit: 'contain' },
  practiceName: { fontSize: 16, fontWeight: 700 },
  tagline: { fontSize: 9, color: '#666666' },
  reportTitle: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  clientMeta: { fontSize: 9, color: '#666666', marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
  statBox: { minWidth: 90 },
  statLabel: { fontSize: 8, color: '#666666' },
  statValue: { fontSize: 12, fontWeight: 700 },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#eeeeee', paddingVertical: 3 },
  headerRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderColor: '#999999',
    paddingVertical: 3,
    fontWeight: 700,
  },
  colSlot: { width: '25%' },
  colFood: { width: '40%' },
  colQty: { width: '20%' },
  colCal: { width: '15%' },
});

type PracticeBranding = {
  name: string;
  tagline: string | null;
  primary_color: string | null;
  logo_url?: string | null;
};

type ReportCardData = {
  client: { full_name: string; gender: string | null };
  enrollment: { plan_type: string; expiry_date: string } | null;
  weightPoints: { date: string; weight: number }[];
  latestMetrics: {
    recorded_at: string;
    weight_kg: number | null;
    bmi: number | null;
    systolic_bp: number | null;
    diastolic_bp: number | null;
    blood_sugar_fasting: number | null;
    waist_cm: number | null;
    body_fat_pct: number | null;
    target_weight_kg: number | null;
  } | null;
  idealWeightKg: number | null;
  currentDietPlan: {
    name: string;
    meals: { slot_name: string; items: { food_item: string; quantity: string | null; calories: number | null }[] }[];
  } | null;
};

function WeightChart({ points, color }: { points: { date: string; weight: number }[]; color: string }) {
  if (points.length < 2) return null;

  const width = 480;
  const height = 110;
  const padding = 16;
  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const coordList = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.weight - minW) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <View>
      <Svg width={width} height={height}>
        <Polyline points={coordList.join(' ')} stroke={color} strokeWidth={2} fill="none" />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 8, color: '#666666' }}>
          {points[0].date} · {points[0].weight}kg
        </Text>
        <Text style={{ fontSize: 8, color: '#666666' }}>
          {points[points.length - 1].date} · {points[points.length - 1].weight}kg
        </Text>
      </View>
    </View>
  );
}

export async function renderReportCardPdf(data: ReportCardData, practice: PracticeBranding): Promise<Blob> {
  const accent = practice.primary_color ?? '#111111';
  const m = data.latestMetrics;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {practice.logo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an <img>
            <Image style={styles.logo} src={practice.logo_url} />
          ) : null}
          <View>
            <Text style={[styles.practiceName, { color: accent }]}>{practice.name}</Text>
            {practice.tagline ? <Text style={styles.tagline}>{practice.tagline}</Text> : null}
          </View>
        </View>

        <Text style={styles.reportTitle}>Progress Report — {data.client.full_name}</Text>
        <Text style={styles.clientMeta}>
          {data.enrollment
            ? `${PLAN_TYPE_LABELS[data.enrollment.plan_type as PlanType] ?? data.enrollment.plan_type} · expires ${data.enrollment.expiry_date}`
            : 'No active plan'}
        </Text>

        <Text style={styles.sectionTitle}>Weight Journey</Text>
        {data.weightPoints.length >= 2 ? (
          <WeightChart points={data.weightPoints} color={accent} />
        ) : (
          <Text style={{ color: '#666666' }}>Not enough entries yet to chart a trend.</Text>
        )}

        <Text style={styles.sectionTitle}>Latest Metrics{m ? ` (${m.recorded_at.slice(0, 10)})` : ''}</Text>
        {m ? (
          <View style={styles.statsRow}>
            {m.weight_kg != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Weight</Text>
                <Text style={styles.statValue}>{m.weight_kg} kg</Text>
              </View>
            )}
            {m.bmi != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>BMI</Text>
                <Text style={styles.statValue}>{m.bmi}</Text>
              </View>
            )}
            {m.systolic_bp != null && m.diastolic_bp != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Blood Pressure</Text>
                <Text style={styles.statValue}>
                  {m.systolic_bp}/{m.diastolic_bp}
                </Text>
              </View>
            )}
            {m.blood_sugar_fasting != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Blood Sugar (Fasting)</Text>
                <Text style={styles.statValue}>{m.blood_sugar_fasting}</Text>
              </View>
            )}
            {m.waist_cm != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Waist</Text>
                <Text style={styles.statValue}>{m.waist_cm} cm</Text>
              </View>
            )}
            {m.body_fat_pct != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Body Fat</Text>
                <Text style={styles.statValue}>{m.body_fat_pct}%</Text>
              </View>
            )}
            {data.idealWeightKg != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Ideal Weight</Text>
                <Text style={styles.statValue}>{data.idealWeightKg} kg</Text>
              </View>
            )}
            {m.target_weight_kg != null && (
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Target Weight</Text>
                <Text style={styles.statValue}>{m.target_weight_kg} kg</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ color: '#666666' }}>No metrics logged yet.</Text>
        )}

        <Text style={styles.sectionTitle}>Current Diet Plan</Text>
        {data.currentDietPlan ? (
          <>
            <Text style={{ marginBottom: 6, fontWeight: 700 }}>{data.currentDietPlan.name}</Text>
            <View style={styles.headerRow}>
              <Text style={styles.colSlot}>Meal</Text>
              <Text style={styles.colFood}>Food</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colCal}>Cal</Text>
            </View>
            {data.currentDietPlan.meals.flatMap((meal) =>
              meal.items.map((item, i) => (
                <View key={`${meal.slot_name}-${i}`} style={styles.row}>
                  <Text style={styles.colSlot}>{i === 0 ? meal.slot_name : ''}</Text>
                  <Text style={styles.colFood}>{item.food_item}</Text>
                  <Text style={styles.colQty}>{item.quantity ?? ''}</Text>
                  <Text style={styles.colCal}>{item.calories ?? ''}</Text>
                </View>
              ))
            )}
          </>
        ) : (
          <Text style={{ color: '#666666' }}>No active diet plan on file.</Text>
        )}
      </Page>
    </Document>
  );

  return pdf(doc).toBlob();
}
