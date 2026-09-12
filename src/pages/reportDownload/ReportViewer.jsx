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

const EMPTY_PATIENT = {
  name: "",
  age: "",
  gender: "",
  contact: "",
  referredBy: "",
  sampleDate: "",
  reportDate: "",
};

const REPORT_META_KEYS = new Set(["_id", "name", "reportDate", "sampleCollectionDate"]);

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

function hasEvaluableStatus(field) {
  return Boolean(field?.referenceRange) || Boolean(field?.referenceTag);
}

function getSectionEntries(sectionData) {
  return Object.entries(sectionData).filter(([key]) => key !== "__showTitle");
}

// referenceRange (the matched tier's own bounds, e.g. "70–100", "> 10") is
// checked before referenceTag (its label, e.g. "High") so this only ever
// falls back to showing the tag text here if a field genuinely has no
// stored range — normally both are present together now.
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
        <td className="px-3 py-2.5 text-[10px] font-semibold text-slate-500 border-b border-slate-100">
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

// ── Tailwind class maps for the generated print document ───────────────────
// (mirrors the app's own Tailwind palette — the print doc loads Tailwind
// via the Play CDN so these classes render identically to the app.)
const STATUS_CLASSES = {
  normal: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-600/25", label: "Normal" },
  low: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-600/25", label: "↓ Low" },
  high: { text: "text-red-600", bg: "bg-red-50", border: "border-red-600/25", label: "↑ High" },
  tag: { text: "text-violet-600", bg: "bg-violet-50", border: "border-violet-600/25", label: null },
};

// ── Print HTML builder — Tailwind (via Play CDN) for all visual styling.
// The only two rules that cannot be expressed as a class (@page, and
// -webkit-print-color-adjust, neither of which attaches to an element) are
// kept in a two-line <style> block; everything else below is Tailwind.
function buildPrintHTML({ reportName, shortId, patient, labInfo, sections, printType }) {
  const isPad = printType === "PAD";

  const renderSection = (sectionName, sectionData, index) => {
    const showHeader = sectionData.__showTitle !== false;
    const entries = getSectionEntries(sectionData);
    const hasUnits = entries.some(([, v]) => Boolean(v.unit));

    const unitHeader = hasUnits
      ? `<th class="py-[5px] px-3 text-left text-[9px] font-bold text-gray-500 uppercase tracking-[0.05em] w-[12%]">Unit</th>`
      : "";

    const rows = entries
      .map(([name, field]) => {
        const value = formatValue(field);
        const unit = field.unit || "";
        const ref = getRefDisplay(field);
        const status = hasEvaluableStatus(field) ? getStatus(field) : null;
        const isAb = status === "low" || status === "high";
        const cfg = status ? STATUS_CLASSES[status] : null;
        const pillLabel = status === "tag" ? field.referenceTag || "—" : cfg?.label;
        return `<tr class="${isAb ? "bg-rose-50" : "bg-white"}">
        <td class="py-[7px] px-3 text-xs text-gray-700 border-b border-slate-100">${name}</td>
        <td class="py-[7px] px-3 text-xs font-bold ${isAb ? "text-red-700" : "text-gray-900"} border-b border-slate-100">${value || "—"}</td>
        ${hasUnits ? `<td class="py-[7px] px-3 text-[10px] font-semibold text-slate-500 border-b border-slate-100">${unit || "—"}</td>` : ""}
        <td class="py-[7px] px-3 text-[11px] text-gray-500 border-b border-slate-100">${ref || "—"}</td>
        <td class="py-[7px] px-3 border-b border-slate-100">${
          status
            ? `<span class="text-[9px] font-bold py-0.5 px-[7px] rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}">${pillLabel}</span>`
            : `<span class="text-[11px] text-slate-300">—</span>`
        }</td>
      </tr>`;
      })
      .join("");

    const headerHTML = showHeader
      ? `<div class="bg-slate-700 py-2 px-3.5 flex items-center gap-2">
          <span class="w-5 h-5 bg-white/15 rounded flex items-center justify-center text-white text-[9px] font-bold">${String.fromCharCode(65 + index)}</span>
          <span class="text-white text-xs font-semibold flex-1">${sectionName}</span>
          <span class="text-slate-400 text-[9px]">${entries.length} parameter${entries.length !== 1 ? "s" : ""}</span>
        </div>`
      : "";

    return `<div class="border border-slate-200 rounded-lg overflow-hidden mb-2.5">
      ${headerHTML}
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="py-[5px] px-3 text-left text-[9px] font-bold text-gray-500 uppercase tracking-[0.05em] w-[34%]">Parameter</th>
            <th class="py-[5px] px-3 text-left text-[9px] font-bold text-gray-500 uppercase tracking-[0.05em] w-[16%]">Result</th>
            ${unitHeader}
            <th class="py-[5px] px-3 text-left text-[9px] font-bold text-gray-500 uppercase tracking-[0.05em] w-[24%]">Ref. Range</th>
            <th class="py-[5px] px-3 text-left text-[9px] font-bold text-gray-500 uppercase tracking-[0.05em] w-[18%]">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
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
        `<td class="py-1.5 px-3 bg-white align-top border-r border-slate-200 w-1/5">
          <div class="text-[8px] font-bold text-gray-400 uppercase tracking-[0.06em]">${label}</div>
          <div class="text-[11px] font-semibold text-slate-800 mt-0.5">${value || "—"}</div>
        </td>`,
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
    ? `<div class="h-[1.5in] bg-white"></div>`
    : `<div class="bg-slate-800 py-4 px-5 flex items-start justify-between rounded-t-[10px]">
        <div>
          <div class="text-[15px] font-bold text-white">${labInfo.name}</div>
          <div class="text-[10px] text-slate-400 mt-[3px]">${labInfo.tagline}</div>
          <div class="text-[9px] text-slate-500 mt-1">📍 ${labInfo.address}</div>
        </div>
        <div class="text-right">
          <div class="text-[9px] text-slate-400">📞 ${labInfo.phone}</div>
          <div class="text-[9px] text-slate-400 mt-0.5">✉ ${labInfo.email}</div>
          <div class="text-[9px] text-slate-500 mt-1 font-mono">Reg: ${labInfo.regNo}</div>
        </div>
      </div>`;

  const footerBlock = isPad
    ? ""
    : `<div class="py-2.5 px-5 border-t border-slate-100 bg-white print:fixed print:bottom-0 print:left-0 print:right-0">
        <table class="w-full max-w-[680px] mx-auto mb-2">
          <tr>
            <td class="w-[45%] pr-5">
              <div class="h-[30px] border-b border-dashed border-slate-300"></div>
              <div class="text-[9px] text-slate-400 mt-[3px]">Pathologist Signature &amp; Seal</div>
            </td>
            <td class="w-[10%]"></td>
            <td class="w-[45%] pl-5">
              <div class="h-[30px] border-b border-dashed border-slate-300"></div>
              <div class="text-[9px] text-slate-400 mt-[3px] text-right">Authorized Signatory</div>
            </td>
          </tr>
        </table>
        <div class="text-[9px] text-slate-400 text-center max-w-[680px] mx-auto">
          For qualified medical professionals only. Interpret results in full clinical context. · ${labInfo.name} · ${labInfo.phone}
        </div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${reportName}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  /* The only two rules with no Tailwind/class-based equivalent: @page has
     no selector to attach a class to, and -webkit-print-color-adjust has
     no Tailwind utility. Everything else in this document is Tailwind. */
  @page { size: A4; margin: 14mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head>
<body class="font-sans bg-white text-slate-800 m-0 p-0">
  <div class="max-w-[680px] mx-auto ${isPad ? "pb-5" : "pb-[90px]"}">
    ${topBlock}
    <div class="bg-slate-100 py-2 px-5 flex items-center justify-between border-l border-r border-b border-slate-200">
      <div class="text-sm font-bold text-slate-900">${reportName}</div>
      ${shortId ? `<div class="text-[9px] text-slate-400 font-mono">Invoice No: ${shortId}</div>` : ""}
    </div>
    <table class="w-full border-collapse border-l border-r border-b border-slate-200">
      <tr class="border-b border-slate-200">${mainCells}</tr>
      <tr>
        <td colspan="5" class="py-[5px] px-3 bg-white">
          <span class="text-[8px] font-bold text-gray-400 uppercase tracking-[0.06em] mr-2.5">Referred By</span>
          <span class="text-[11px] font-semibold text-slate-800">${patient.referredBy || "—"}</span>
        </td>
      </tr>
    </table>
    ${
      total > 0
        ? `<div class="bg-slate-50 py-[7px] px-5 border-l border-r border-b border-slate-200 text-[11px] flex gap-1.5">
            <span class="text-slate-500">${total} parameters:</span>
            <span class="font-bold text-emerald-600">${normal} Normal</span>
            ${low > 0 ? `<span>·</span><span class="font-bold text-amber-600">${low} Low</span>` : ""}
            ${high > 0 ? `<span>·</span><span class="font-bold text-red-600">${high} High</span>` : ""}
          </div>`
        : ""
    }
    <div class="p-3.5 px-5 border-l border-r border-slate-200">
      ${sections.map(([name, data], i) => renderSection(name, data, i)).join("")}
    </div>
  </div>
  ${footerBlock}
</body>
</html>`;
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

  const shortId = invoiceId || report.invoiceId || "";

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
    iframe.className = "fixed top-0 left-0 w-0 h-0 border-0 invisible";
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
