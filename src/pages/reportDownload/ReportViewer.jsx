import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  FlaskConical,
  MapPin,
  Mail,
  Phone,
  User,
  Calendar,
  Stethoscope,
  Hash,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  Share2,
  Printer,
  Download,
  ChevronDown,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Tag,
} from "lucide-react";
import { ReportPDFDocument } from "./ReportPDF";

const LAB_INFO = {
  name: "MediScan Diagnostics",
  tagline: "Precision Medicine · Trusted Results",
  address: "House 12, Road 5, Dhanmondi, Dhaka-1205, Bangladesh",
  email: "reports@mediscan.com.bd",
  phone: "+880 1711-000000",
  regNo: "DGDA/LAB/2024/0042",
};

// Empty patient fallback — all fields blank, nothing hardcoded
const EMPTY_PATIENT = {
  name: "",
  age: "",
  gender: "",
  contact: "",
  referredBy: "",
  sampleDate: "",
  reportDate: "",
};

// ── Keys inside report that are metadata, not sections ────────────────────────
const REPORT_META_KEYS = new Set(["_id", "name", "reportDate", "sampleCollectionDate"]);

// ── Status resolution ──────────────────────────────────────────────────────
// Number fields carry ONE of two reference sources, set by SchemaRenderer's
// buildPayload() depending on the field's standardRange.mode:
//   - "range"  mode -> entry.referenceRange = "min–max" (numeric)
//   - "tagged" mode -> entry.referenceTag   = tier label (e.g. "Low", "Turbid")
// Both must be checked — a tagged field has no referenceRange at all.
function parseRange(ref) {
  if (!ref) return null;
  const m = ref.match(/^([\d.]+)\s*[–\-]\s*([\d.]+)$/);
  if (!m) return null;
  return { min: parseFloat(m[1]), max: parseFloat(m[2]) };
}

// Tagged tiers store a free-text label instead of a numeric range. Map the
// common ones onto the same low/high/normal vocabulary the range mode uses;
// anything else (custom tier names) falls back to a neutral "tag" status.
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

// A field "has status" only when it's a number field with a numeric range or
// a tagged tier — that's the only case with a low/normal/high verdict to
// show. Every other field type (text, textarea, select, radio, checkbox)
// still gets its own Parameter | Result | Ref row — it just has no status.
function hasEvaluableStatus(field) {
  return Boolean(field?.referenceRange) || Boolean(field?.referenceTag);
}

function getSectionEntries(sectionData) {
  return Object.entries(sectionData).filter(([key]) => key !== "__showTitle");
}

// Every field in a section — number, text, textarea, select, radio, checkbox
// — renders through this so Parameter, Result, Unit, Ref and Status always
// line up in the same five columns, whether or not a given field actually
// has a unit, a range, or a status to show.
function getRefDisplay(field) {
  return field.referenceRange || field.referenceTag || field.referenceValue || "";
}

function formatValue(field) {
  return Array.isArray(field.value) ? field.value.join(", ") : String(field.value ?? "");
}

function StatusPill({ status, label }) {
  if (!status) return <span className="text-xs text-slate-300">—</span>;
  const cfg = {
    normal: { label: "Normal", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    low: { label: "Low", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: TrendingDown },
    high: { label: "High", cls: "bg-red-50 text-red-700 border-red-200", Icon: TrendingUp },
    tag: { label: label || "—", cls: "bg-violet-50 text-violet-700 border-violet-200", Icon: Tag },
  }[status];
  if (!cfg) return <span className="text-xs text-slate-300">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.cls}`}>
      <cfg.Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

// A single row for one field, of any type — number, text, textarea, select,
// radio, or checkbox. Always renders Parameter | Result | (Unit) | Ref |
// Status in that order; Status is blank for fields with no evaluable range.
function ParamRow({ name, field, hasUnits }) {
  const value = formatValue(field);
  const unit = field.unit || "";
  const ref = getRefDisplay(field);
  const status = hasEvaluableStatus(field) ? getStatus(field) : null;
  const isAb = status === "low" || status === "high";
  return (
    <tr className={isAb ? "bg-red-50/50" : "odd:bg-white even:bg-slate-50/30"}>
      <td className="pl-4 pr-3 py-2.5 text-sm text-slate-700 border-b border-slate-100">{name}</td>
      <td
        className={`px-3 py-2.5 text-sm font-bold tabular-nums border-b border-slate-100 ${isAb ? "text-red-700" : "text-slate-900"}`}
      >
        {value || <span className="text-slate-300 font-normal">—</span>}
      </td>
      {hasUnits && (
        <td className="px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-100">
          {unit || <span className="text-slate-300">—</span>}
        </td>
      )}
      <td className="px-3 py-2.5 text-xs text-slate-500 border-b border-slate-100 tabular-nums">
        {ref || <span className="text-slate-300">—</span>}
      </td>
      <td className="px-3 pr-4 py-2.5 border-b border-slate-100">
        <StatusPill status={status} label={field.referenceTag} />
      </td>
    </tr>
  );
}

function Section({ sectionName, sectionData, index, showHeader }) {
  const [collapsed, setCollapsed] = useState(false);
  const entries = getSectionEntries(sectionData);
  const hasUnits = entries.some(([, v]) => Boolean(v.unit));

  const tableBody = (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="pl-4 pr-3 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[34%]">
            Parameter
          </th>
          <th className="px-3 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[16%]">
            Result
          </th>
          {hasUnits && (
            <th className="px-3 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[12%]">
              Unit
            </th>
          )}
          <th className="px-3 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[24%]">
            Ref. Range
          </th>
          <th className="px-3 pr-4 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[18%]">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([n, f]) => (
          <ParamRow key={n} name={n} field={f} hasUnits={hasUnits} />
        ))}
      </tbody>
    </table>
  );

  if (!showHeader) return <div className="rounded-lg overflow-hidden border border-slate-200 mb-2.5">{tableBody}</div>;

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 mb-2.5">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 transition-colors text-left"
      >
        <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {String.fromCharCode(65 + index)}
        </span>
        <span className="flex-1 text-sm font-semibold text-white">{sectionName}</span>
        <span className="text-[10px] text-slate-400">
          {entries.length} parameter{entries.length !== 1 ? "s" : ""}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0 ${collapsed ? "" : "rotate-180"}`}
        />
      </button>
      {!collapsed && <div>{tableBody}</div>}
    </div>
  );
}

function SummaryStrip({ sections }) {
  let normal = 0,
    low = 0,
    high = 0;
  sections.forEach(([, sec]) => {
    getSectionEntries(sec).forEach(([, field]) => {
      if (!hasEvaluableStatus(field)) return;
      const s = getStatus(field);
      if (s === "normal") normal++;
      else if (s === "low") low++;
      else if (s === "high") high++;
    });
  });
  const total = normal + low + high;
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-1 text-xs">
      <ClipboardList className="w-3 h-3 text-slate-400 mr-1 flex-shrink-0" />
      <span className="text-slate-500 font-medium">{total} parameters:</span>
      <span className="font-bold text-emerald-600 ml-1">{normal} Normal</span>
      {low > 0 && (
        <>
          <span className="text-slate-300 mx-0.5">·</span>
          <span className="font-bold text-amber-600">{low} Low</span>
        </>
      )}
      {high > 0 && (
        <>
          <span className="text-slate-300 mx-0.5">·</span>
          <span className="font-bold text-red-600">{high} High</span>
        </>
      )}
    </div>
  );
}

function PatientGrid({ patient }) {
  const mainFields = [
    { label: "Patient Name", value: patient.name, Icon: User },
    { label: "Age / Gender", value: [patient.age, patient.gender].filter(Boolean).join(" · "), Icon: Hash },
    { label: "Contact", value: patient.contact, Icon: Phone },
    { label: "Sample Date", value: patient.sampleDate, Icon: Calendar },
    { label: "Report Date", value: patient.reportDate, Icon: Calendar },
  ];
  const Cell = ({ label, value, Icon }) => (
    <div className="bg-white px-3 py-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-xs font-semibold text-slate-800 truncate">{value || "—"}</p>
    </div>
  );
  return (
    <div className="border-b border-slate-200">
      <div className="grid grid-cols-5 gap-px bg-slate-200 border-b border-slate-200">
        {mainFields.map((f) => (
          <Cell key={f.label} {...f} />
        ))}
      </div>
      <div className="bg-white px-3 py-1.5 flex items-center gap-3">
        <Stethoscope className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Referred By</span>
        <span className="text-xs font-semibold text-slate-800">{patient.referredBy || "—"}</span>
      </div>
    </div>
  );
}

// ── Print HTML builder ────────────────────────────────────────────────────────
function buildPrintHTML({ reportName, shortId, patient, labInfo, sections, printType }) {
  const isPad = printType === "PAD";

  const statusLabel = (st, field) =>
    st === "tag" ? field?.referenceTag || "—" : { normal: "Normal", low: "↓ Low", high: "↑ High" }[st] || "—";
  const statusColor = (st) => ({ normal: "#059669", low: "#d97706", high: "#dc2626", tag: "#7c3aed" })[st] || "#94a3b8";
  const statusBg = (st) => ({ normal: "#f0fdf4", low: "#fffbeb", high: "#fef2f2", tag: "#f5f3ff" })[st] || "white";

  const renderSection = (sectionName, sectionData, index) => {
    const showHeader = sectionData.__showTitle !== false;
    const entries = getSectionEntries(sectionData);
    const hasUnits = entries.some(([, v]) => Boolean(v.unit));
    const unitHeader = hasUnits
      ? `<th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:12%;">Unit</th>`
      : "";
    const rows = entries
      .map(([name, field]) => {
        const value = formatValue(field);
        const unit = field.unit || "";
        const ref = getRefDisplay(field);
        const status = hasEvaluableStatus(field) ? getStatus(field) : null;
        const isAb = status === "low" || status === "high";
        return `<tr style="background:${isAb ? "#fff1f2" : "white"};">
        <td style="padding:7px 12px;font-size:12px;color:#374151;border-bottom:1px solid #f1f5f9;">${name}</td>
        <td style="padding:7px 12px;font-size:12px;font-weight:700;color:${isAb ? "#b91c1c" : "#111827"};border-bottom:1px solid #f1f5f9;">${value || "—"}</td>
        ${hasUnits ? `<td style="padding:7px 12px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">${unit || "—"}</td>` : ""}
        <td style="padding:7px 12px;font-size:11px;color:#6b7280;border-bottom:1px solid #f1f5f9;">${ref || "—"}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;">${status ? `<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:99px;border:1px solid;background:${statusBg(status)};color:${statusColor(status)};border-color:${statusColor(status)}40;">${statusLabel(status, field)}</span>` : `<span style="font-size:11px;color:#cbd5e1;">—</span>`}</td>
      </tr>`;
      })
      .join("");
    const headerHTML = showHeader
      ? `<div style="background:#334155;padding:8px 14px;display:flex;align-items:center;gap:8px;"><span style="width:20px;height:20px;background:rgba(255,255,255,0.15);border-radius:4px;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:700;">${String.fromCharCode(65 + index)}</span><span style="color:white;font-size:12px;font-weight:600;flex:1;">${sectionName}</span><span style="color:#94a3b8;font-size:9px;">${entries.length} parameter${entries.length !== 1 ? "s" : ""}</span></div>`
      : "";
    return `<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:10px;">${headerHTML}<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;"><th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:34%;">Parameter</th><th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:16%;">Result</th>${unitHeader}<th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:24%;">Ref. Range</th><th style="padding:5px 12px;text-align:left;font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;width:18%;">Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };

  const mainFields = [
    { label: "Patient Name", value: patient.name },
    { label: "Age / Gender", value: [patient.age, patient.gender].filter(Boolean).join(" · ") },
    { label: "Contact", value: patient.contact },
    { label: "Sample Date", value: patient.sampleDate },
    { label: "Report Date", value: patient.reportDate },
  ];
  const mainCells = mainFields
    .map(
      ({ label, value }) =>
        `<td style="padding:6px 12px;background:white;vertical-align:top;border-right:1px solid #e2e8f0;width:20%;"><div style="font-size:8px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;">${label}</div><div style="font-size:11px;font-weight:600;color:#1e293b;margin-top:2px;">${value || "—"}</div></td>`,
    )
    .join("");

  let normal = 0,
    low = 0,
    high = 0;
  sections.forEach(([, sec]) => {
    getSectionEntries(sec).forEach(([, field]) => {
      if (!hasEvaluableStatus(field)) return;
      const s = getStatus(field);
      if (s === "normal") normal++;
      else if (s === "low") low++;
      else if (s === "high") high++;
    });
  });
  const total = normal + low + high;

  const topBlock = isPad
    ? `<div style="height:1.5in;background:white;"></div>`
    : `<div style="background:#1e293b;padding:16px 20px;display:flex;align-items:flex-start;justify-content:space-between;border-radius:10px 10px 0 0;"><div><div style="font-size:15px;font-weight:700;color:white;">${labInfo.name}</div><div style="font-size:10px;color:#94a3b8;margin-top:3px;">${labInfo.tagline}</div><div style="font-size:9px;color:#64748b;margin-top:4px;">📍 ${labInfo.address}</div></div><div style="text-align:right;"><div style="font-size:9px;color:#94a3b8;">📞 ${labInfo.phone}</div><div style="font-size:9px;color:#94a3b8;margin-top:2px;">✉ ${labInfo.email}</div><div style="font-size:9px;color:#64748b;margin-top:4px;font-family:monospace;">Reg: ${labInfo.regNo}</div></div></div>`;

  const footerBlock = isPad
    ? ""
    : `<div class="footer-fixed"><table style="width:100%;max-width:680px;margin:0 auto 8px;"><tr><td style="width:45%;padding-right:20px;"><div style="height:30px;border-bottom:1px dashed #cbd5e1;"></div><div style="font-size:9px;color:#94a3b8;margin-top:3px;">Pathologist Signature &amp; Seal</div></td><td style="width:10%;"></td><td style="width:45%;padding-left:20px;"><div style="height:30px;border-bottom:1px dashed #cbd5e1;"></div><div style="font-size:9px;color:#94a3b8;margin-top:3px;text-align:right;">Authorized Signatory</div></td></tr></table><div style="font-size:9px;color:#94a3b8;text-align:center;max-width:680px;margin:0 auto;">For qualified medical professionals only. Interpret results in full clinical context. · ${labInfo.name} · ${labInfo.phone}</div></div>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${reportName}</title><style>* { box-sizing:border-box;margin:0;padding:0 } body { font-family:'Segoe UI',Arial,sans-serif;background:white;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact } @page { size:A4;margin:14mm } @media print { .footer-fixed { position:fixed;bottom:0;left:0;right:0;padding:10px 20px;background:white;border-top:1px solid #f1f5f9; } }</style></head><body><div style="max-width:680px;margin:0 auto;padding-bottom:${isPad ? "20px" : "90px"};">${topBlock}<div style="background:#f1f5f9;padding:8px 20px;display:flex;align-items:center;justify-content:space-between;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;"><div style="font-size:14px;font-weight:700;color:#0f172a;">${reportName}</div>${shortId ? `<div style="font-size:9px;color:#94a3b8;font-family:monospace;">Invoice No: ${shortId}</div>` : ""}</div><table style="width:100%;border-collapse:collapse;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;"><tr style="border-bottom:1px solid #e2e8f0;">${mainCells}</tr><tr><td colspan="5" style="padding:5px 12px;background:white;"><span style="font-size:8px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin-right:10px;">Referred By</span><span style="font-size:11px;font-weight:600;color:#1e293b;">${patient.referredBy || "—"}</span></td></tr></table>${total > 0 ? `<div style="background:#f8fafc;padding:7px 20px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-size:11px;display:flex;gap:6px;"><span style="color:#64748b;">${total} parameters:</span><span style="font-weight:700;color:#059669;">${normal} Normal</span>${low > 0 ? `<span>·</span><span style="font-weight:700;color:#d97706;">${low} Low</span>` : ""}${high > 0 ? `<span>·</span><span style="font-weight:700;color:#dc2626;">${high} High</span>` : ""}</div>` : ""}<div style="padding:14px 20px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">${sections.map(([name, data], i) => renderSection(name, data, i)).join("")}</div></div>${footerBlock}</body></html>`;
}

// ── Main Component ────────────────────────────────────────────────────────────
function ReportViewer({
  report,
  patient = null,
  reportName,
  labInfo = LAB_INFO,
  printType = "PLAIN",
  invoiceId = null,
}) {
  const [dlStatus, setDlStatus] = useState("idle");
  const [shareStatus, setShareStatus] = useState("idle");

  const resolvedPatient = patient ?? EMPTY_PATIENT;
  const isPad = printType === "PAD";

  const resolvedReportName = report.name || reportName || "Lab Report";
  const filename = `${resolvedReportName.replace(/\s+/g, "_")}_report.pdf`;

  // ── invoiceId prop takes priority, fall back to report field ─────────────────
  const shortId = invoiceId || report.invoiceId || "";

  // ── Filter out metadata keys — only keep actual section objects ──────────────
  const sections = Object.entries(report).filter(
    ([key, val]) =>
      !REPORT_META_KEYS.has(key) && val !== null && typeof val === "object" && !Array.isArray(val) && !val.$oid,
  );

  const generateBlob = () =>
    pdf(
      <ReportPDFDocument
        report={report}
        reportName={resolvedReportName}
        shortId={shortId}
        patient={resolvedPatient}
        labInfo={labInfo}
      />,
    ).toBlob();

  // ── Print via hidden iframe — no new tab ─────────────────────────────────────
  const handlePrint = () => {
    const html = buildPrintHTML({
      reportName: resolvedReportName,
      shortId,
      patient: resolvedPatient,
      labInfo,
      sections,
      printType,
    });

    const existing = document.getElementById("ur-print-frame");
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "ur-print-frame";
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1000);
    };
  };

  const handleDownload = async () => {
    setDlStatus("loading");
    try {
      const blob = await generateBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDlStatus("done");
    } catch (e) {
      console.error(e);
      setDlStatus("idle");
      alert("PDF generation failed.");
    } finally {
      setTimeout(() => setDlStatus("idle"), 2500);
    }
  };

  const handleShare = async () => {
    setShareStatus("loading");
    try {
      const blob = await generateBlob();
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: resolvedReportName });
        setShareStatus("done");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShareStatus("copied");
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setShareStatus("idle");
      } else setShareStatus("idle");
    } finally {
      setTimeout(() => setShareStatus("idle"), 2500);
    }
  };

  const dlIcon =
    dlStatus === "loading" ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : dlStatus === "done" ? (
      <Check className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <Download className="w-3.5 h-3.5" />
    );
  const dlLabel = dlStatus === "loading" ? "Generating…" : dlStatus === "done" ? "Downloaded!" : "Download PDF";
  const shIcon =
    shareStatus === "loading" ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : shareStatus === "copied" || shareStatus === "done" ? (
      <Check className="w-3.5 h-3.5 text-emerald-500" />
    ) : (
      <Share2 className="w-3.5 h-3.5" />
    );
  const shLabel =
    shareStatus === "loading"
      ? "Preparing…"
      : shareStatus === "done"
        ? "Shared!"
        : shareStatus === "copied"
          ? "Saved!"
          : "Share";

  return (
    <div className="max-w-2xl mx-auto font-sans">
      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          onClick={handleShare}
          disabled={shareStatus === "loading"}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {shIcon} {shLabel}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-400 transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          {isPad ? "Print (Pad)" : "Print (Plain A4)"}
        </button>
        <button
          onClick={handleDownload}
          disabled={dlStatus === "loading"}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {dlIcon} {dlLabel}
        </button>
      </div>

      {/* Report card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Lab header — hidden on PAD */}
        {!isPad && (
          <div className="bg-slate-800 px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{labInfo.name}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{labInfo.tagline}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
                  <p className="text-slate-500 text-[10px]">{labInfo.address}</p>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 space-y-1">
              <div className="flex items-center justify-end gap-1">
                <Phone className="w-2.5 h-2.5 text-slate-500" />
                <p className="text-slate-400 text-[10px]">{labInfo.phone}</p>
              </div>
              <div className="flex items-center justify-end gap-1">
                <Mail className="w-2.5 h-2.5 text-slate-500" />
                <p className="text-slate-400 text-[10px]">{labInfo.email}</p>
              </div>
              <p className="text-slate-500 text-[10px] font-mono">Reg: {labInfo.regNo}</p>
            </div>
          </div>
        )}

        {/* Report title bar with Invoice No */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <h2 className="text-sm font-bold text-slate-900">{resolvedReportName}</h2>
          </div>
          {shortId && <p className="text-[10px] text-slate-400 font-mono">Invoice No: {shortId}</p>}
        </div>

        <PatientGrid patient={resolvedPatient} />

        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200">
          <SummaryStrip sections={sections} />
        </div>

        <div className="px-5 pt-4 pb-4">
          {sections.map(([sectionName, sectionData], i) => (
            <Section
              key={sectionName}
              sectionName={sectionName}
              sectionData={sectionData}
              index={i}
              showHeader={sectionData.__showTitle !== false}
            />
          ))}
        </div>
      </div>

      {/* Footer — hidden on PAD */}
      {!isPad && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-8 mb-5">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="text-[10px] text-slate-400 mt-1.5">Pathologist Signature &amp; Seal</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="text-[10px] text-slate-400 mt-1.5 text-right">Authorized Signatory</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            For qualified medical professionals only. Interpret results in full clinical context.
            <span className="mx-1.5">·</span>
            {labInfo.name}
            <span className="mx-1.5">·</span>
            {labInfo.phone}
          </p>
        </div>
      )}
    </div>
  );
}

export default ReportViewer;
