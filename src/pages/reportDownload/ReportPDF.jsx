// ReportPDF.jsx — UNCHANGED.
// @react-pdf/renderer does not render to the DOM/CSSOM at all — it lays out
// a PDF document tree directly, and StyleSheet.create() is its own styling
// API (a small CSS-like subset, but not real CSS and not something a browser
// stylesheet or Tailwind's build pipeline can touch). There is no Tailwind
// equivalent for a PDF document, so this file keeps its existing styling
// exactly as-is.
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const C = {
  dark: "#1e293b",
  mid: "#334155",
  light: "#f1f5f9",
  border: "#e2e8f0",
  muted: "#94a3b8",
  body: "#374151",
  normal: "#059669",
  low: "#d97706",
  high: "#dc2626",
  tag: "#7c3aed",
  lowBg: "#fffbeb",
  highBg: "#fff1f2",
  normBg: "#f0fdf4",
  tagBg: "#f5f3ff",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: C.dark, paddingBottom: 80 },
  header: { backgroundColor: C.dark, padding: "12 16", flexDirection: "row", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", gap: 10 },
  labName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "white" },
  labSub: { fontSize: 8, color: C.muted, marginTop: 2 },
  labAddr: { fontSize: 7, color: "#64748b", marginTop: 3 },
  headerRight: { alignItems: "flex-end" },
  headerSmall: { fontSize: 7, color: C.muted, marginBottom: 2 },
  titleBar: {
    backgroundColor: C.light,
    padding: "7 16",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1 solid ${C.border}`,
  },
  titleText: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  invoiceText: { fontSize: 7, color: C.muted, fontFamily: "Courier" },
  patientRow: { flexDirection: "row", borderBottom: `1 solid ${C.border}` },
  patientCell: { flex: 1, padding: "5 10", backgroundColor: "white", borderRight: `1 solid ${C.border}` },
  cellLabel: { fontSize: 6.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  cellValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark },
  referredRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: "4 10",
    backgroundColor: "white",
    borderBottom: `1 solid ${C.border}`,
    gap: 8,
  },
  summaryBar: {
    backgroundColor: "#f8fafc",
    padding: "5 16",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    borderBottom: `1 solid ${C.border}`,
  },
  sectionWrap: { marginBottom: 8, border: `1 solid ${C.border}`, borderRadius: 4 },
  sectionHead: { backgroundColor: C.mid, padding: "6 10", flexDirection: "row", alignItems: "center", gap: 6 },
  sectionBadge: {
    width: 16,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeTxt: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "white" },
  sectionName: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: "white" },
  sectionCount: { fontSize: 7, color: C.muted },
  tableHead: { flexDirection: "row", backgroundColor: "#f8fafc", borderBottom: `1 solid ${C.border}`, padding: "3 0" },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280", textTransform: "uppercase", paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", borderBottom: `1 solid #f1f5f9`, paddingVertical: 5 },
  td: { fontSize: 9, paddingHorizontal: 8, color: C.body },
  tdBold: { fontSize: 9, paddingHorizontal: 8, fontFamily: "Helvetica-Bold" },
  tdUnit: { fontSize: 7.5, paddingHorizontal: 8, color: "#64748b", textTransform: "uppercase" },
  tdMuted: { fontSize: 8, paddingHorizontal: 8, color: "#6b7280" },
  pill: { borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "10 16", borderTop: `1 solid ${C.border}` },
  sigRow: { flexDirection: "row", marginBottom: 10 },
  sigBox: { flex: 1 },
  sigLine: { borderBottom: "1 dashed #cbd5e1", height: 24, marginBottom: 3 },
  sigLabel: { fontSize: 7, color: C.muted },
  footerNote: { fontSize: 7, color: C.muted, textAlign: "center", marginTop: 4 },
});

function parseRange(ref) {
  if (!ref) return null;
  const m = ref.match(/^([\d.]+)\s*[–\-]\s*([\d.]+)$/);
  if (!m) return null;
  return { min: parseFloat(m[1]), max: parseFloat(m[2]) };
}
function statusFromTag(tag) {
  const label = (tag || "").toLowerCase();
  if (/low/.test(label)) return "low";
  if (/high/.test(label)) return "high";
  if (/normal|unremarkable|negative/.test(label)) return "normal";
  return "tag";
}
function getStatus(field) {
  if (!field) return null;
  if (field.referenceTag) return statusFromTag(field.referenceTag);
  const n = parseFloat(field.value);
  if (isNaN(n) || !field.referenceRange) return null;
  const r = parseRange(field.referenceRange);
  if (!r) return null;
  if (n < r.min) return "low";
  if (n > r.max) return "high";
  return "normal";
}
function isResultField(field) {
  if (!field || typeof field !== "object") return false;
  return Boolean(field.referenceRange) || Boolean(field.referenceTag) || Boolean(field.unit);
}

function getSectionEntries(sectionData) {
  return Object.entries(sectionData).filter(([key]) => key !== "__showTitle");
}

function Pill({ status, label }) {
  if (!status) return null;
  const cfg = {
    normal: { label: "Normal", bg: C.normBg, color: C.normal },
    low: { label: "Low", bg: C.lowBg, color: C.low },
    high: { label: "High", bg: C.highBg, color: C.high },
    tag: { label: label || "—", bg: C.tagBg, color: C.tag },
  }[status];
  if (!cfg) return null;
  return (
    <View style={[s.pill, { backgroundColor: cfg.bg }]}>
      <Text style={{ color: cfg.color, fontSize: 7, fontFamily: "Helvetica-Bold" }}>{cfg.label}</Text>
    </View>
  );
}

function PDFSection({ sectionName, sectionData, index, showHeader }) {
  const entries = getSectionEntries(sectionData);
  const resultEntries = entries.filter(([, v]) => isResultField(v));
  const plainEntries = entries.filter(([, v]) => !isResultField(v));
  const hasUnits = resultEntries.some(([, v]) => Boolean(v.unit));

  const W = hasUnits
    ? { param: "34%", result: "14%", unit: "12%", ref: "22%", status: "18%" }
    : { param: "36%", result: "18%", ref: "28%", status: "18%" };

  return (
    <View style={s.sectionWrap}>
      {showHeader && (
        <View style={s.sectionHead}>
          <View style={s.sectionBadge}>
            <Text style={s.sectionBadgeTxt}>{String.fromCharCode(65 + index)}</Text>
          </View>
          <Text style={s.sectionName}>{sectionName}</Text>
          <Text style={s.sectionCount}>
            {entries.length} parameter{entries.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {resultEntries.length > 0 && (
        <View>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: W.param }]}>Parameter</Text>
            <Text style={[s.th, { width: W.result }]}>Result</Text>
            {hasUnits && <Text style={[s.th, { width: W.unit }]}>Unit</Text>}
            <Text style={[s.th, { width: W.ref }]}>Ref. Range</Text>
            <Text style={[s.th, { width: W.status }]}>Status</Text>
          </View>
          {resultEntries.map(([name, field]) => {
            const value = String(field.value ?? "");
            const unit = field.unit || "";
            const ref = field.referenceRange || field.referenceTag || "";
            const status = getStatus(field);
            const isAb = status === "low" || status === "high";
            return (
              <View key={name} style={[s.tableRow, { backgroundColor: isAb ? C.highBg : "white" }]}>
                <Text style={[s.td, { width: W.param }]}>{name}</Text>
                <Text style={[s.tdBold, { width: W.result, color: isAb ? C.high : C.dark }]}>{value}</Text>
                {hasUnits && <Text style={[s.tdUnit, { width: W.unit }]}>{unit || "—"}</Text>}
                <Text style={[s.tdMuted, { width: W.ref }]}>{ref || "—"}</Text>
                <View style={{ width: W.status, justifyContent: "center" }}>
                  <Pill status={status} label={field.referenceTag} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {plainEntries.length > 0 && (
        <View style={{ borderTop: resultEntries.length > 0 ? `1 solid ${C.border}` : undefined }}>
          {plainEntries.map(([name, field]) => {
            const val = Array.isArray(field.value) ? field.value.join(", ") : String(field.value ?? "—");
            return (
              <View key={name} style={[s.tableRow, { backgroundColor: "white" }]}>
                <Text style={[s.tdMuted, { width: "38%" }]}>{name}</Text>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 6 }}>
                  <Text style={[s.tdBold, { paddingHorizontal: 0 }]}>{val || "—"}</Text>
                  {field.referenceValue ? (
                    <Text style={{ fontSize: 7.5, color: C.tag }}>(Ref: {field.referenceValue})</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function ReportPDFDocument({ report, reportName, shortId, patient, labInfo }) {
  const sections = Object.entries(report).filter(
    ([key, val]) =>
      key !== "_id" && key !== "name" && val !== null && typeof val === "object" && !Array.isArray(val) && !val.$oid,
  );

  let normal = 0,
    low = 0,
    high = 0;
  sections.forEach(([, sec]) => {
    getSectionEntries(sec).forEach(([, field]) => {
      if (!isResultField(field)) return;
      const st = getStatus(field);
      if (st === "normal") normal++;
      else if (st === "low") low++;
      else if (st === "high") high++;
    });
  });
  const total = normal + low + high;

  const mainFields = [
    { label: "Patient Name", value: patient.name },
    { label: "Age / Gender", value: [patient.age, patient.gender].filter(Boolean).join(" · ") },
    { label: "Contact", value: patient.contact },
    { label: "Sample Date", value: patient.sampleDate },
    { label: "Report Date", value: patient.reportDate },
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View>
              <Text style={s.labName}>{labInfo.name}</Text>
              <Text style={s.labSub}>{labInfo.tagline}</Text>
              <Text style={s.labAddr}>{labInfo.address}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerSmall}>{labInfo.phone}</Text>
            <Text style={s.headerSmall}>{labInfo.email}</Text>
            <Text style={s.headerSmall}>Reg: {labInfo.regNo}</Text>
          </View>
        </View>

        <View style={s.titleBar}>
          <Text style={s.titleText}>{reportName}</Text>
          {shortId ? <Text style={s.invoiceText}>Invoice No: {shortId}</Text> : null}
        </View>

        <View style={s.patientRow}>
          {mainFields.map(({ label, value }) => (
            <View key={label} style={s.patientCell}>
              <Text style={s.cellLabel}>{label}</Text>
              <Text style={s.cellValue}>{value || "—"}</Text>
            </View>
          ))}
        </View>
        <View style={s.referredRow}>
          <Text style={[s.cellLabel, { marginBottom: 0 }]}>Referred By</Text>
          <Text style={[s.cellValue, { fontSize: 9 }]}>{patient.referredBy || "—"}</Text>
        </View>

        {total > 0 && (
          <View style={s.summaryBar}>
            <Text style={{ fontSize: 8, color: "#64748b" }}>{total} parameters:</Text>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.normal }}>{normal} Normal</Text>
            {low > 0 && <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.low }}>{low} Low</Text>}
            {high > 0 && <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.high }}>{high} High</Text>}
          </View>
        )}

        <View style={{ padding: "10 14" }}>
          {sections.map(([sectionName, sectionData], i) => (
            <PDFSection
              key={sectionName}
              sectionName={sectionName}
              sectionData={sectionData}
              index={i}
              showHeader={sectionData.__showTitle !== false}
            />
          ))}
        </View>

        <View style={s.footer} fixed>
          <View style={s.sigRow}>
            <View style={[s.sigBox, { marginRight: 40 }]}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Pathologist Signature &amp; Seal</Text>
            </View>
            <View style={[s.sigBox, { marginLeft: 40 }]}>
              <View style={s.sigLine} />
              <Text style={[s.sigLabel, { textAlign: "right" }]}>Authorized Signatory</Text>
            </View>
          </View>
          <Text style={s.footerNote}>
            For qualified medical professionals only. Interpret results in full clinical context. · {labInfo.name} ·{" "}
            {labInfo.phone}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
