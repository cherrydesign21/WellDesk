import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: 'Helvetica' },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: '#666666', marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderColor: '#333333',
    paddingVertical: 4,
    fontWeight: 700,
  },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#eeeeee', paddingVertical: 4 },
  cell: { paddingRight: 6 },
});

export function GenericTablePdf({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  const colWidth = `${100 / headers.length}%`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Generated {new Date().toLocaleDateString()} · {rows.length} rows</Text>
        <View style={styles.headerRow}>
          {headers.map((h, i) => (
            <Text key={i} style={[styles.cell, { width: colWidth }]}>
              {h}
            </Text>
          ))}
        </View>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row} wrap={false}>
            {row.map((cell, ci) => (
              <Text key={ci} style={[styles.cell, { width: colWidth }]}>
                {cell == null || cell === '' ? '—' : String(cell)}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
