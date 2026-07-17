import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import type { PlanWithMeals } from '@/lib/diet-plans';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
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
  tagline: { fontSize: 10, color: '#666666' },
  planTitle: { fontSize: 14, fontWeight: 700, marginTop: 12 },
  planMeta: { fontSize: 10, color: '#666666', marginBottom: 12 },
  meal: { marginBottom: 12 },
  slotName: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#eeeeee', paddingVertical: 3 },
  headerRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderColor: '#999999',
    paddingVertical: 3,
    fontWeight: 700,
  },
  colFood: { width: '40%' },
  colQty: { width: '20%' },
  colCal: { width: '15%' },
  colNotes: { width: '25%' },
});

type PracticeBranding = {
  name: string;
  tagline: string | null;
  primary_color: string | null;
  logo_url?: string | null;
};

export async function renderPlanPdf(plan: PlanWithMeals, practice: PracticeBranding): Promise<Blob> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {practice.logo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an <img>
            <Image style={styles.logo} src={practice.logo_url} />
          ) : null}
          <View>
            <Text style={[styles.practiceName, { color: practice.primary_color ?? '#111111' }]}>
              {practice.name}
            </Text>
            {practice.tagline ? <Text style={styles.tagline}>{practice.tagline}</Text> : null}
          </View>
        </View>
        <Text style={styles.planTitle}>{plan.name}</Text>
        <Text style={styles.planMeta}>
          {plan.plan_date}
          {!plan.is_template ? ` · v${plan.version}` : ''}
        </Text>
        {plan.diet_plan_meals.map((meal) => (
          <View key={meal.id} style={styles.meal} wrap={false}>
            <Text style={styles.slotName}>{meal.slot_name}</Text>
            <View style={styles.headerRow}>
              <Text style={styles.colFood}>Food</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colCal}>Cal</Text>
              <Text style={styles.colNotes}>Notes</Text>
            </View>
            {meal.diet_plan_meal_items.map((item, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.colFood}>{item.food_item}</Text>
                <Text style={styles.colQty}>{item.quantity ?? ''}</Text>
                <Text style={styles.colCal}>{item.calories ?? ''}</Text>
                <Text style={styles.colNotes}>{item.notes ?? ''}</Text>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );

  return pdf(doc).toBlob();
}
