import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Every color in this document is grayscale on purpose — this is a
// black-ink-on-white-paper report, not a screen UI.
const BLACK = "#000000";
const LINE = "#000000";
const HEAD_BG = "#ececec";
const ALT_BG = "#f8f8f8";
const ABNORMAL_BG = "#e6e6e6"; // used for the matched-tier row inside RefTierBoxPDF

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: BLACK, padding: 28, paddingBottom: 92 },

  // Letterhead
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: `2 solid ${LINE}`,
    paddingBottom: 10,
    marginBottom: 10,
  },
  labName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BLACK, textTransform: "uppercase", letterSpacing: 0.6 },
  labTagline: { fontSize: 8, color: BLACK, marginTop: 3, fontFamily: "Helvetica-Oblique" },
  labAddr: { fontSize: 7.5, color: BLACK, marginTop: 4 },
  headerRight: { alignItems: "flex-end" },
  headerLine: { fontSize: 7.5, color: BLACK, marginBottom: 2 },

  // Title bar
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1 solid ${LINE}`,
    paddingBottom: 6,
    marginBottom: 10,
  },
  titleText: { fontSize: 12.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.6 },
  invoiceText: { fontSize: 8, fontFamily: "Courier" },

  // Patient info — a real bordered table, not colored cards
  patientTable: { border: `1 solid ${LINE}`, marginBottom: 10 },
  patientRow: { flexDirection: "row" },
  patientCell: { flex: 1, borderRight: `1 solid ${LINE}`, borderBottom: `1 solid ${LINE}`, padding: "5 8" },
  patientCellLast: { flex: 1, borderBottom: `1 solid ${LINE}`, padding: "5 8" },
  cellLabel: {
    fontSize: 6.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  cellValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: BLACK },
  referredRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: "5 8" },

  // Section — bordered box, header band in neutral gray, full grid table inside
  sectionWrap: { border: `1 solid ${LINE}`, marginBottom: 10 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: HEAD_BG,
    borderBottom: `1 solid ${LINE}`,
    padding: "6 8",
  },
  sectionBadge: {
    width: 16,
    height: 16,
    border: `1 solid ${LINE}`,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeTxt: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: BLACK },
  sectionName: {
    flex: 1,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: BLACK,
  },

  tableHead: { flexDirection: "row", backgroundColor: HEAD_BG, borderBottom: `1 solid ${LINE}` },
  th: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    padding: "5 8",
    borderRight: `1 solid ${LINE}`,
    color: BLACK,
  },
  thLast: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    padding: "5 8",
    color: BLACK,
  },
  tableRow: { flexDirection: "row", borderBottom: `1 solid ${LINE}` },
  tableRowAlt: { backgroundColor: ALT_BG },
  td: { fontSize: 9, padding: "5 8", borderRight: `1 solid ${LINE}`, color: BLACK },
  tdLast: { fontSize: 9, padding: "5 8", color: BLACK },
  tdBold: { fontFamily: "Helvetica-Bold" },
  tdMuted: { fontSize: 8, color: BLACK },

  statusBox: {
    borderWidth: 1,
    borderColor: BLACK,
    borderStyle: "solid",
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
  },
  statusTxt: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.3, color: BLACK },
  statusDash: { fontSize: 8, color: BLACK },

  refNote: { fontSize: 7.5, fontFamily: "Helvetica-Oblique", color: BLACK },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "12 28", borderTop: `1 solid ${LINE}` },
  sigRow: { flexDirection: "row", marginBottom: 10 },
  sigBox: { flex: 1 },
  sigLine: { borderBottom: `1 dashed ${LINE}`, height: 26, marginBottom: 4 },
  sigLabel: { fontSize: 7, color: BLACK },
  footerNote: { fontSize: 7, color: BLACK, textAlign: "center", marginTop: 6 },
});

// Status is purely the tag typed on the matched tier — nothing to
// interpret, no fallback numeric comparison, no keyword guessing.
function getStatus(field) {
  return field?.referenceTag || null;
}
function isResultField(field) {
  if (!field || typeof field !== "object") return false;
  return Boolean(field.referenceRange) || Boolean(field.referenceTag) || Boolean(field.unit);
}
function hasEvaluableStatus(field) {
  return Boolean(field?.referenceTag);
}

function getSectionEntries(sectionData) {
  return Object.entries(sectionData).filter(([key]) => key !== "__showTitle");
}

// field.referenceTiers is an array of GROUPS — [{ group, rows }] — where
// `group` is null for a "simple" (ungrouped) standard range, or a label
// like "Male" / "Female" / "18y – 60y" for gender/age scoped ranges. This
// flattens that structure into a simple ordered list of header/row lines,
// mirroring the same helper used by the web/print renderer so all three
// surfaces produce an identical layout from the same data.
function flattenTierGroups(groups) {
  const lines = [];
  groups.forEach((g) => {
    if (g.group) lines.push({ type: "header", label: g.group });
    g.rows.forEach((r) => lines.push({ type: "row", ...r }));
  });
  return lines;
}

// Status rendered as a bordered box with bold uppercase text — no color,
// just whatever label was typed on the matched tier. Mirrors a stamped
// "result flag" box on a printed report.
function StatusBoxPDF({ label }) {
  if (!label) return <Text style={s.statusDash}>—</Text>;
  return (
    <View style={s.statusBox}>
      <Text style={s.statusTxt}>{label.toUpperCase()}</Text>
    </View>
  );
}

// A Key-Value Pair reference — stacked rows with a border-top divider
// between them, no outer box of its own. The parent cell hands this
// component the full cell area with zero padding (see call sites below),
// so each row's own padding + border-top stretches edge-to-edge across
// the cell — real boxed rows (Male/Female/Children stacked in one cell),
// not a thin centered line floating inside leftover cell padding.
function RefKeyValueBoxPDF({ pairs }) {
  return (
    <View style={{ width: "100%" }}>
      {pairs.map((p, i) => (
        <View
          key={i}
          style={{
            borderTop: i > 0 ? `1 solid ${LINE}` : undefined,
            paddingVertical: 4,
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: BLACK, textAlign: "center" }}>
            {p.key} : {p.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// A number field's full reference table. Every group defined on the
// field's standard range is rendered (e.g. both Male and Female blocks,
// or every age bracket) — not just the one that applies to this patient —
// with a header band per group and a two-column label|range layout per
// tier row, matching the lab's printed format (see Format.jpg). The row
// the patient's actual value landed in (within their own group only) gets
// ABNORMAL_BG's neutral gray fill, bold text, and a plain tick mark to the
// right of the tier name (not on the range side) — grayscale only,
// matching this report's black-ink-on-white-paper theme — so it's
// unambiguous which reference band this patient falls under, with every
// other tier/group still shown for clinical context.
function RefTierBoxPDF({ groups }) {
  const lines = flattenTierGroups(groups);
  return (
    <View style={{ width: "100%" }}>
      {lines.map((line, i) =>
        line.type === "header" ? (
          <View
            key={i}
            style={{
              borderTop: i > 0 ? `1 solid ${LINE}` : undefined,
              backgroundColor: HEAD_BG,
              paddingVertical: 2,
              paddingHorizontal: 6,
            }}
          >
            <Text
              style={{
                fontSize: 6.5,
                fontFamily: "Helvetica-Bold",
                color: BLACK,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {line.label}
            </Text>
          </View>
        ) : (
          <View
            key={i}
            style={{
              borderTop: i > 0 ? `1 solid ${LINE}` : undefined,
              backgroundColor: line.matched ? ABNORMAL_BG : undefined,
              flexDirection: "row",
            }}
          >
            <View
              style={{
                width: "50%",
                borderRight: `1 solid ${LINE}`,
                paddingVertical: 3,
                paddingHorizontal: 6,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 7, fontFamily: line.matched ? "Helvetica-Bold" : "Helvetica", color: BLACK }}>
                {line.label}
              </Text>
              {line.matched && <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: BLACK }}>✓</Text>}
            </View>
            <View
              style={{
                width: "50%",
                paddingVertical: 3,
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ fontSize: 7, fontFamily: line.matched ? "Helvetica-Bold" : "Helvetica", color: BLACK }}>
                {line.range}
              </Text>
            </View>
          </View>
        ),
      )}
    </View>
  );
}

function PDFSection({ sectionName, sectionData, index, showHeader }) {
  const entries = getSectionEntries(sectionData);
  const resultEntries = entries.filter(([, v]) => isResultField(v));
  const plainEntries = entries.filter(([, v]) => !isResultField(v));
  const hasUnits = resultEntries.some(([, v]) => Boolean(v.unit));
  const hasStatus = resultEntries.some(([, v]) => hasEvaluableStatus(v));

  const W = hasUnits
    ? hasStatus
      ? { param: "30%", result: "14%", unit: "12%", ref: "24%", status: "20%" }
      : { param: "34%", result: "18%", unit: "14%", ref: "34%" }
    : hasStatus
      ? { param: "34%", result: "18%", ref: "28%", status: "20%" }
      : { param: "38%", result: "22%", ref: "40%" };

  return (
    <View style={s.sectionWrap} wrap={false}>
      {showHeader && (
        <View style={s.sectionHead}>
          <View style={s.sectionBadge}>
            <Text style={s.sectionBadgeTxt}>{String.fromCharCode(65 + index)}</Text>
          </View>
          <Text style={s.sectionName}>{sectionName}</Text>
        </View>
      )}

      {resultEntries.length > 0 && (
        <View>
          <View style={s.tableHead}>
            <Text style={[s.th, { width: W.param }]}>Parameter</Text>
            <Text style={[s.th, { width: W.result }]}>Result</Text>
            {hasUnits && <Text style={[s.th, { width: W.unit }]}>Unit</Text>}
            <Text style={[hasStatus ? s.th : s.thLast, { width: W.ref }]}>Reference Range</Text>
            {hasStatus && <Text style={[s.thLast, { width: W.status }]}>Status</Text>}
          </View>
          {resultEntries.map(([name, field], i) => {
            const value = String(field.value ?? "");
            const unit = field.unit || "";
            // referenceTiers (when present) is the richer, dynamically
            // generated view of the same match — a full list of groups
            // (each with its own tier rows, one flagged as this patient's
            // match) — so it supersedes referenceRange/referenceValue and
            // is checked first. Older reports saved before this field
            // existed simply fall through to the single-range/KV-pair
            // format below. referenceRange holds the matched tier's own
            // bounds (e.g. "70–100", "> 10"); referenceTag holds its
            // label — shown separately in Ref. Range vs Status.
            // A result field can also carry a Key-Value Pair reference
            // (referenceValue as an array, e.g. Male/Female/Children) in
            // place of a single range — checked as a fallback so this
            // renders the boxed rows instead of dropping the reference.
            const tierGroups =
              Array.isArray(field.referenceTiers) && field.referenceTiers.length ? field.referenceTiers : null;
            const ref = tierGroups ? null : field.referenceRange || field.referenceValue || "";
            const refIsKV = !tierGroups && Array.isArray(ref);
            const status = getStatus(field);
            return (
              <View key={name} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]} wrap={false}>
                <Text style={[s.td, { width: W.param }]}>{name}</Text>
                <Text style={[s.td, s.tdBold, { width: W.result }]}>{value || "—"}</Text>
                {hasUnits && <Text style={[s.td, s.tdMuted, { width: W.unit }]}>{unit || "—"}</Text>}
                {tierGroups ? (
                  <View style={[hasStatus ? s.td : s.tdLast, { width: W.ref, padding: 0 }]}>
                    <RefTierBoxPDF groups={tierGroups} />
                  </View>
                ) : refIsKV ? (
                  <View style={[hasStatus ? s.td : s.tdLast, { width: W.ref, padding: 0 }]}>
                    <RefKeyValueBoxPDF pairs={ref} />
                  </View>
                ) : (
                  <Text style={[hasStatus ? s.td : s.tdLast, s.tdMuted, { width: W.ref }]}>{ref || "—"}</Text>
                )}
                {hasStatus && (
                  <View style={[s.tdLast, { width: W.status }]}>
                    <StatusBoxPDF label={status} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {plainEntries.length > 0 && (
        <View style={resultEntries.length > 0 ? { borderTop: `1 solid ${LINE}` } : undefined}>
          {plainEntries.map(([name, field], i) => {
            const val = Array.isArray(field.value) ? field.value.join(", ") : String(field.value ?? "—");
            const isKV = Array.isArray(field.referenceValue);
            return (
              <View key={name} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]} wrap={false}>
                <Text style={[s.td, { width: "32%" }]}>{name}</Text>
                {isKV ? (
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    <Text style={[s.tdBold, { fontSize: 9, color: BLACK, padding: "5 8" }]}>{val || "—"}</Text>
                    <View style={{ flex: 1 }}>
                      <RefKeyValueBoxPDF pairs={field.referenceValue} />
                    </View>
                  </View>
                ) : (
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", padding: "5 8", gap: 6 }}>
                    <Text style={[s.tdBold, { fontSize: 9, color: BLACK }]}>{val || "—"}</Text>
                    {field.referenceValue ? <Text style={s.refNote}>(Ref: {field.referenceValue})</Text> : null}
                  </View>
                )}
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
        <View style={s.letterhead}>
          <View>
            <Text style={s.labName}>{labInfo.name}</Text>
            <Text style={s.labTagline}>{labInfo.tagline}</Text>
            <Text style={s.labAddr}>{labInfo.address}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerLine}>Tel: {labInfo.phone}</Text>
            <Text style={s.headerLine}>{labInfo.email}</Text>
            <Text style={s.headerLine}>Reg. No: {labInfo.regNo}</Text>
          </View>
        </View>

        <View style={s.titleBar}>
          <Text style={s.titleText}>{reportName}</Text>
          {shortId ? <Text style={s.invoiceText}>Invoice No: {shortId}</Text> : null}
        </View>

        <View style={s.patientTable}>
          <View style={s.patientRow}>
            {mainFields.map(({ label, value }, i) => (
              <View key={label} style={i === mainFields.length - 1 ? s.patientCellLast : s.patientCell}>
                <Text style={s.cellLabel}>{label}</Text>
                <Text style={s.cellValue}>{value || "—"}</Text>
              </View>
            ))}
          </View>
          <View style={s.referredRow}>
            <Text style={[s.cellLabel, { marginBottom: 0 }]}>Referred By</Text>
            <Text style={[s.cellValue, { fontSize: 9 }]}>{patient.referredBy || "—"}</Text>
          </View>
        </View>

        {sections.map(([sectionName, sectionData], i) => (
          <PDFSection
            key={sectionName}
            sectionName={sectionName}
            sectionData={sectionData}
            index={i}
            showHeader={sectionData.__showTitle !== false}
          />
        ))}

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
