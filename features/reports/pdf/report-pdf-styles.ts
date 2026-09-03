import { StyleSheet } from "@react-pdf/renderer";

export const pdfColors = {
  navy: "#0f172a",
  muted: "#64748b",
  border: "#dbe3ef",
  surface: "#f8fafc",
  teal: "#15957f",
  tealSoft: "#dcf7f0",
};

export const reportPdfStyles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 34,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    color: pdfColors.navy,
    backgroundColor: "#ffffff",
    fontSize: 10,
    lineHeight: 1.45,
  },
  header: {
    paddingBottom: 16,
    borderBottom: `1 solid ${pdfColors.border}`,
    marginBottom: 18,
  },
  eyebrow: {
    color: pdfColors.teal,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: pdfColors.navy,
  },
  subtitle: {
    marginTop: 10,
    color: pdfColors.muted,
    fontSize: 10,
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    padding: 10,
    border: `1 solid ${pdfColors.border}`,
    borderRadius: 10,
    backgroundColor: pdfColors.surface,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    color: pdfColors.navy,
  },
  metricLabel: {
    marginTop: 3,
    color: pdfColors.muted,
    fontSize: 8,
    textTransform: "uppercase",
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 7,
  },
  table: {
    border: `1 solid ${pdfColors.border}`,
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    borderBottom: `1 solid ${pdfColors.border}`,
  },
  headerRow: {
    backgroundColor: pdfColors.surface,
  },
  cell: {
    padding: 7,
    fontSize: 9,
  },
  th: {
    color: pdfColors.muted,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  muted: {
    color: pdfColors.muted,
  },
  compactGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  detailCard: {
    padding: 10,
    border: `1 solid ${pdfColors.border}`,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginBottom: 9,
  },
  detailHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  detailTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: 700,
  },
  detailMeta: {
    color: pdfColors.muted,
    fontSize: 8,
  },
  detailText: {
    marginTop: 5,
    fontSize: 9,
    color: pdfColors.navy,
  },
  twoColumn: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  pillRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: pdfColors.tealSoft,
    color: pdfColors.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 8,
  },
  warningPill: {
    backgroundColor: "#fff7ed",
    color: "#9a3412",
  },
  pageSection: {
    marginTop: 18,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 34,
    right: 34,
    textAlign: "center",
    color: pdfColors.muted,
    fontSize: 8,
  },
});
