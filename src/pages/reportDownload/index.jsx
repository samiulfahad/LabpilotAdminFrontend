import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; // ← useSearchParams instead of useLocation
import { ArrowLeft, Eye, Printer, LayoutList, X } from "lucide-react";
import ReportViewer from "./ReportViewer";
import demoReportService from "../../api/demoReportService";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .ur-overlay { display: none; }

  .ur-drawer {
    position: fixed; top: 0; left: 0; bottom: 0; right: 0; z-index: 201;
    background: #f7f8fa; display: flex; flex-direction: column;
    animation: ur-slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  @keyframes ur-slide-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  .ur-drawer.closing { animation: ur-slide-out 0.25s cubic-bezier(0.32, 0, 0.67, 0) forwards; }
  @keyframes ur-slide-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }

  .ur-drawer-header {
    display: flex; align-items: center; gap: 12px; padding: 16px 20px;
    background: #0d1117; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;
  }
  .ur-drawer-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ur-drawer-icon.view { background: rgba(5, 150, 105, 0.25); }

  .ur-drawer-title { flex: 1; min-width: 0; }
  .ur-drawer-title h2 { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.01em; margin: 0; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ur-drawer-title p  { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.3); margin: 2px 0 0; text-transform: uppercase; letter-spacing: 0.07em; }

  .ur-close-btn { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,0.5); transition: all 0.15s; flex-shrink: 0; }
  .ur-close-btn:hover { background: rgba(220,38,38,0.2); border-color: rgba(220,38,38,0.3); color: #fca5a5; }

  .ur-drawer-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
  .ur-drawer-body::-webkit-scrollbar { width: 4px; }
  .ur-drawer-body::-webkit-scrollbar-track { background: transparent; }
  .ur-drawer-body::-webkit-scrollbar-thumb { background: #d1d5de; border-radius: 4px; }

  .ur-print-badge { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.07em; text-transform: uppercase; flex-shrink: 0; }
  .ur-print-badge.plain { background: rgba(37,99,235,0.18); border: 1px solid rgba(37,99,235,0.35); color: #93c5fd; }
  .ur-print-badge.pad   { background: rgba(234,88,12,0.18);  border: 1px solid rgba(234,88,12,0.35);  color: #fdba74; }

  .ur-loading { display: flex; align-items: center; justify-content: center; padding: 80px 24px; flex-direction: column; gap: 12px; }
  .ur-spinner { width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,0.08); border-top-color: #60a5fa; animation: ur-spin 0.7s linear infinite; }
  @keyframes ur-spin { to { transform: rotate(360deg); } }
`;

function StyleInjector() {
  useEffect(() => {
    const id = "ur-styles-v2";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

const HARDCODED_INVOICE_ID = "ABC1234";

const formatDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// patientAge is saved as { years, months, days } (SchemaRenderer's age input).
// A bare number/string is also accepted for reports saved before that change.
function formatPatientAge(age) {
  if (!age) return "";
  if (typeof age === "number" || typeof age === "string") return age !== "" ? `${age} yrs` : "";
  const y = Number(age.years) || 0;
  const m = Number(age.months) || 0;
  const d = Number(age.days) || 0;
  if (!y && !m && !d) return "";
  const parts = [`${y}y`];
  if (m) parts.push(`${m}m`);
  if (d) parts.push(`${d}d`);
  return parts.join(" ");
}

function ErrorState({ message, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e4e7ed",
          borderRadius: 16,
          padding: "36px 32px",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "#fef2f2",
            border: "1.5px solid rgba(220,38,38,0.2)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Eye style={{ width: 20, height: 20, color: "#dc2626" }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0d1117", marginBottom: 8, letterSpacing: "-0.02em" }}>
          {message || "Failed to load report"}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
          Please go back and try again.
        </div>
        <button
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 20px",
            background: "#0d1117",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: 13, height: 13 }} /> Go Back
        </button>
      </div>
    </div>
  );
}

export default function ReportDownload() {
  const { schemaId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ← read query params

  const layout = searchParams.get("layout") ?? "PLAIN"; // ← "PLAIN" | "PAD", default PLAIN
  const isPlain = layout === "PLAIN";

  const [report, setReport] = useState(null);
  const [patient, setPatient] = useState(null);
  const [reportName, setReportName] = useState("Lab Report");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!schemaId) {
      setError("Missing schema ID.");
      setLoading(false);
      return;
    }
    demoReportService
      .getBySchemaId(schemaId)
      .then(({ data }) => {
        setReport(data.report);
        setReportName(data.schemaName ?? "Lab Report");
        setPatient({
          name: data.patientName ?? "",
          age: formatPatientAge(data.patientAge),
          gender: data.patientGender ?? "",
          contact: "01723939836",
          referredBy: "Dr. XXXX (MBBS, FCPS, BCS Health)",
          sampleDate: formatDate(data.sampleCollectionDate),
          reportDate: formatDate(data.reportDate),
        });
      })
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, [schemaId]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => window.close(), 250); // ← close the tab instead of navigate(-1)
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <StyleInjector />
      <div className={`ur-overlay${closing ? " closing" : ""}`} onClick={handleClose} />

      <div className={`ur-drawer${closing ? " closing" : ""}`}>
        <div className="ur-drawer-header">
          <div className="ur-drawer-icon view">
            <Eye style={{ width: 15, height: 15, color: "#6ee7b7" }} />
          </div>
          <div className="ur-drawer-title">
            <h2>View — {reportName}</h2>
            <p>Invoice #{HARDCODED_INVOICE_ID}</p>
          </div>

          <div className={`ur-print-badge ${isPlain ? "plain" : "pad"}`}>
            {isPlain ? <Printer style={{ width: 11, height: 11 }} /> : <LayoutList style={{ width: 11, height: 11 }} />}
            {isPlain ? "Plain A4" : "PAD"}
          </div>

          <button className="ur-close-btn" onClick={handleClose} title="Close (Esc)">
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div className="ur-drawer-body">
          {loading && (
            <div className="ur-loading">
              <div className="ur-spinner" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Loading report…
              </span>
            </div>
          )}
          {!loading && error && <ErrorState message={error} onClose={handleClose} />}
          {!loading && !error && report && (
            <div style={{ padding: "24px 20px" }}>
              <ReportViewer
                report={report}
                patient={patient}
                reportName={reportName}
                printType={layout}
                invoiceId={HARDCODED_INVOICE_ID}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
