import { useState, useEffect, useCallback, useRef } from "react";
import {
  CreditCard,
  Building2,
  RefreshCw,
  Play,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  X,
  Zap,
  AlertTriangle,
  Loader2,
  Receipt,
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  BadgeCheck,
  Ban,
  BarChart3,
  Trash2,
} from "lucide-react";
import billingService from "../../api/billingService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BST_OFFSET_MS = 6 * 60 * 60 * 1000;

const fmtDate = (ms) => {
  if (!ms) return "—";
  const bstMs = ms + BST_OFFSET_MS;
  const d = new Date(bstMs);
  const floored = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(
    floored,
  );
};

const fmtDateUTC = (ms) =>
  ms
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(
        new Date(ms),
      )
    : "—";

const fmtMonth = (ms) =>
  ms
    ? new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(
        new Date(ms + BST_OFFSET_MS),
      )
    : "—";

const fmtCurrency = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n)
    : "—";

const isOverdue = (ms) => ms && Date.now() > ms;

// ─── Skeleton primitives ──────────────────────────────────────────────────────

const Bone = ({ className = "", style }) => (
  <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} style={style} />
);

const LabCardSkeleton = () => (
  <div className="border border-slate-100 rounded-2xl bg-white shadow-sm p-5">
    <div className="flex items-start gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Bone className="h-4 w-40" />
          <Bone className="h-4 w-16" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-5 w-20 rounded-lg" />
          <Bone className="h-5 w-20 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right space-y-1.5">
          <Bone className="h-3 w-20 ml-auto" />
          <Bone className="h-6 w-28" />
        </div>
        <Bone className="h-9 w-24 rounded-xl" />
      </div>
    </div>
    <div className="mt-4 space-y-2.5">
      <Bone className="h-14 w-full rounded-xl" />
    </div>
  </div>
);

const HistoryRowSkeleton = () => (
  <div className="px-5 py-3 flex items-center gap-3 bg-white/50 border-b border-slate-100">
    <Bone className="h-5 w-14 rounded-md" />
    <div className="min-w-[110px] space-y-1.5">
      <Bone className="h-3.5 w-20" />
      <Bone className="h-3 w-32" />
    </div>
    <Bone className="h-4 w-20" />
    <Bone className="h-3.5 w-16" />
    <Bone className="h-3.5 w-24 ml-auto" />
  </div>
);

const RunRowSkeleton = () => (
  <tr className="border-b border-slate-50">
    {[112, 96, 80, 48, 144, 64, 32].map((w, i) => (
      <td key={i} className="px-4 py-3">
        <Bone className="h-4" style={{ width: w }} />
      </td>
    ))}
  </tr>
);

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

const Btn = ({ children, variant = "primary", loading, disabled, className = "", ...props }) => {
  const base =
    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none";
  const v = {
    primary: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200",
    secondary: "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    ghost: "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
  };
  return (
    <button className={`${base} ${v[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Loader2 size={12} className="animate-spin" />}
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>}
    <input
      className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-slate-50 text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition placeholder:text-slate-300"
      {...props}
    />
  </div>
);

const Select = ({ children, ...props }) => (
  <select
    className="px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl bg-white text-slate-600 outline-none focus:border-indigo-400 transition cursor-pointer"
    {...props}
  >
    {children}
  </select>
);

const Modal = ({ open, onClose, title, children, width = "max-w-md" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full ${width} animate-[fadeUp_0.18s_ease]`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <h3 className="text-[14.5px] font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={13} className="text-slate-400" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status, overdue }) => {
  const styles = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    unpaid: overdue ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200",
    free: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] ?? "bg-slate-100 text-slate-400 border-slate-200"}`}
    >
      {status === "paid" && <CheckCircle2 size={9} />}
      {status === "unpaid" && (overdue ? <AlertTriangle size={9} /> : <Clock size={9} />)}
      {status === "free" && <Zap size={9} />}
      {overdue && status === "unpaid" ? "Overdue" : status}
    </span>
  );
};

const MonthTag = ({ label, isOverdue: over }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${over ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-700 border-amber-100"}`}
  >
    {over && <AlertTriangle size={9} />}
    {label}
  </span>
);

// ─── Month/Year Picker ────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MonthYearPicker = ({ value, onChange, label, maxYear, maxMonth, minYear = 2020 }) => {
  const [viewYear, setViewYear] = useState(value?.year ?? new Date().getFullYear());
  const isDisabled = (y, m) => y < minYear || (maxYear && (y > maxYear || (y === maxYear && m > maxMonth)));

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            disabled={viewYear <= minYear}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={13} className="text-slate-500" />
          </button>
          <span className="text-[13px] font-bold text-slate-700">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            disabled={maxYear && viewYear >= maxYear}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={13} className="text-slate-500" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 p-2">
          {MONTHS.map((m, i) => {
            const mn = i + 1;
            const dis = isDisabled(viewYear, mn);
            const sel = value?.year === viewYear && value?.month === mn;
            return (
              <button
                key={m}
                type="button"
                disabled={dis}
                onClick={() => onChange({ year: viewYear, month: mn })}
                className={`py-1.5 rounded-lg text-[12px] font-semibold transition cursor-pointer ${
                  sel
                    ? "bg-indigo-500 text-white shadow-sm"
                    : !dis
                      ? "hover:bg-indigo-50 text-slate-700"
                      : "text-slate-200 cursor-not-allowed"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
        {value && (
          <div className="px-3 pb-2.5 pt-1.5 flex items-center justify-between border-t border-slate-50">
            <span className="text-[12px] text-indigo-600 font-semibold">
              {MONTHS[value.month - 1]} {value.year}
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[11px] text-slate-400 hover:text-red-500 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Lab History Drawer ───────────────────────────────────────────────────────

const LabHistoryDrawer = ({ labKey, onPay, onExtend }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const limit = 12;

  const load = useCallback(
    async (skip = 0) => {
      setLoading(true);
      setError("");
      try {
        const res = await billingService.getLabHistoryByKey(labKey, { skip, limit });
        setData(res.data);
      } catch (e) {
        setError(e?.response?.data?.error ?? "Failed to load history");
      } finally {
        setLoading(false);
      }
    },
    [labKey],
  );

  useEffect(() => {
    load(page * limit);
  }, [load, page]);

  const bills = data?.bills ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-slate-50/60 border-t border-slate-100">
      <div className="px-5 py-3 flex items-center gap-3 flex-wrap border-b border-slate-100 bg-white/70 min-h-[44px]">
        {loading && !data ? (
          <>
            <Bone className="h-3.5 w-24" />
            <Bone className="h-3.5 w-20" />
            <Bone className="h-3.5 w-16 ml-auto" />
          </>
        ) : (
          <>
            {[
              { key: "paid", label: "Paid", color: "text-emerald-600" },
              { key: "unpaid", label: "Unpaid", color: "text-amber-600" },
              { key: "free", label: "Free", color: "text-slate-400" },
            ].map(
              ({ key, label, color }) =>
                data?.stats?.[key]?.count > 0 && (
                  <span key={key} className="text-[12px]">
                    <span className={`font-bold ${color}`}>
                      {data.stats[key].count} {label}
                    </span>
                    {data.stats[key].total > 0 && (
                      <span className="text-slate-400 ml-1">({fmtCurrency(data.stats[key].total)})</span>
                    )}
                  </span>
                ),
            )}
            <span className="text-[11px] text-slate-300 ml-auto">{total} total</span>
          </>
        )}
      </div>

      {error && (
        <div className="px-5 py-4 text-[12px] text-red-500 flex items-center gap-1.5">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {loading ? (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <HistoryRowSkeleton key={i} />
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="px-5 py-6 text-[13px] text-slate-400 text-center">No billing history</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {bills.map((bill) => {
            const over = isOverdue(bill.dueDate) && bill.status === "unpaid";
            return (
              <div
                key={bill._id}
                className={`px-5 py-3 flex items-center gap-3 flex-wrap transition-colors ${over ? "bg-red-50/40" : "bg-white/50"}`}
              >
                <StatusBadge status={bill.status} overdue={over} />
                <div className="min-w-[110px]">
                  <div className="text-[12.5px] font-semibold text-slate-700">{fmtMonth(bill.billingPeriodStart)}</div>
                  <div className="text-[11px] text-slate-400">
                    {fmtDate(bill.billingPeriodStart)} – {fmtDate(bill.billingPeriodEnd)}
                  </div>
                </div>
                <span className="text-[13px] font-bold text-slate-800 min-w-[90px]">
                  {fmtCurrency(bill.totalAmount)}
                </span>
                {bill.invoiceCount != null && (
                  <span className="text-[11.5px] text-slate-400">{bill.invoiceCount} inv.</span>
                )}
                {bill.status === "paid" && bill.paidAt && (
                  <span className="text-[11.5px] text-emerald-600 font-medium flex items-center gap-1">
                    <BadgeCheck size={12} /> Paid {fmtDateUTC(bill.paidAt)}
                  </span>
                )}
                {bill.status === "unpaid" && (
                  <span
                    className={`text-[11.5px] flex items-center gap-1 ${over ? "text-red-500 font-semibold" : "text-slate-400"}`}
                  >
                    {over ? <AlertTriangle size={11} /> : <Clock size={11} />}
                    Due {fmtDate(bill.dueDate)}
                  </span>
                )}
                {bill.breakdown && (
                  <div className="flex flex-wrap gap-1 w-full mt-1">
                    {Object.entries(bill.breakdown).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-[10.5px] bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5"
                      >
                        <span className="text-slate-400 capitalize">{k}:</span>{" "}
                        <span className="font-bold text-slate-600">
                          {typeof v === "boolean" ? (v ? "Yes" : "No") : typeof v === "number" ? fmtCurrency(v) : v}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                {bill.status === "unpaid" && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Btn variant="success" className="!px-2.5 !py-1.5 !text-[11px]" onClick={() => onPay(bill)}>
                      <CheckCircle2 size={10} /> Pay
                    </Btn>
                    <Btn variant="secondary" className="!px-2.5 !py-1.5 !text-[11px]" onClick={() => onExtend(bill)}>
                      <Calendar size={10} /> Extend
                    </Btn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="px-5 py-3 flex items-center justify-between border-t border-slate-100">
          <span className="text-[11.5px] text-slate-400">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <Btn
              variant="ghost"
              className="!px-2 !py-1 !text-[11px]"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={11} /> Prev
            </Btn>
            <Btn
              variant="ghost"
              className="!px-2 !py-1 !text-[11px]"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight size={11} />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Unpaid Lab Row ───────────────────────────────────────────────────────────

const UnpaidLabRow = ({ lab, onPay, onExtend }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="flex items-start gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[14px] font-bold text-slate-800 truncate">{lab.labName ?? "Unknown Lab"}</span>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-200">
              {lab.labKey}
            </span>
            {!lab.isActive && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Ban size={9} /> Inactive
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lab.unpaidMonths.map((um) => (
              <MonthTag key={um.billingId} label={um.month} isOverdue={um.isOverdue} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium">Total Unpaid</div>
            <div className="text-[16px] font-black text-amber-600">{fmtCurrency(lab.unpaidTotal)}</div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer border border-slate-200"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            History
          </button>
        </div>
      </div>

      {lab.unpaidMonths.length > 0 && (
        <div className="px-5 pb-4 flex flex-col gap-2">
          {lab.unpaidMonths.map((um) => (
            <div
              key={um.billingId}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border flex-wrap ${um.isOverdue ? "bg-red-50/60 border-red-100" : "bg-amber-50/40 border-amber-100"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-bold text-slate-700">{um.month}</span>
                  {um.isOverdue && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                      <AlertTriangle size={9} /> OVERDUE
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {fmtDate(um.billingPeriodStart)} – {fmtDate(um.billingPeriodEnd)} · Due {fmtDate(um.dueDate)} ·{" "}
                  {um.invoiceCount} inv.
                </div>
              </div>
              <span className="text-[13px] font-black text-slate-800">{fmtCurrency(um.totalAmount)}</span>
              <div className="flex items-center gap-1.5">
                <Btn
                  variant="success"
                  className="!px-2.5 !py-1.5 !text-[11px]"
                  onClick={() =>
                    onPay({
                      _id: um.billingId,
                      labId: lab.labId,
                      totalAmount: um.totalAmount,
                      dueDate: um.dueDate,
                      month: um.month,
                    })
                  }
                >
                  <CheckCircle2 size={10} /> Pay
                </Btn>
                <Btn
                  variant="secondary"
                  className="!px-2.5 !py-1.5 !text-[11px]"
                  onClick={() => onExtend({ _id: um.billingId, dueDate: um.dueDate, month: um.month })}
                >
                  <Calendar size={10} /> Extend
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && <LabHistoryDrawer labKey={lab.labKey} onPay={onPay} onExtend={onExtend} />}
    </div>
  );
};

// ─── Run Row ──────────────────────────────────────────────────────────────────

const RunRow = ({ run, onRetry }) => (
  <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition group">
    <td className="px-4 py-3 text-[12.5px] font-bold text-slate-700">{run.period}</td>
    <td className="px-4 py-3 text-[12px] text-slate-500">{fmtDateUTC(run.triggeredAt)}</td>
    <td className="px-4 py-3 text-[12px] text-slate-500">{run.triggeredBy}</td>
    <td className="px-4 py-3 text-[12px] text-slate-700 font-semibold">{run.totalLabs}</td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2 text-[11.5px]">
        <span className="text-emerald-600 font-bold">{run.generated} gen</span>
        <span className="text-slate-200">·</span>
        <span className="text-slate-400">{run.free} free</span>
        <span className="text-slate-200">·</span>
        <span className="text-slate-400">{run.skipped} skip</span>
      </div>
    </td>
    <td className="px-4 py-3">
      {run.failedCount > 0 ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
          <AlertCircle size={10} /> {run.failedCount} failed
        </span>
      ) : (
        <span className="text-[11px] text-emerald-500 font-bold">✓ All OK</span>
      )}
    </td>
    <td className="px-4 py-3 opacity-0 group-hover:opacity-100 transition">
      {run.failedCount > 0 && (
        <Btn variant="danger" className="!px-2.5 !py-1.5 !text-[11px]" onClick={() => onRetry(run)}>
          <RotateCcw size={10} /> Retry
        </Btn>
      )}
    </td>
  </tr>
);

// ─── Month Overview Tab ───────────────────────────────────────────────────────

const MonthOverviewTab = ({ showToast }) => {
  const [months, setMonths] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billsError, setBillsError] = useState("");
  const [billsSkip, setBillsSkip] = useState(0);
  const [billsTotal, setBillsTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const BILLS_LIMIT = 30;

  const loadPeriods = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError("");
    try {
      const res = await billingService.getMonthOverview();
      const m = res.data.months ?? [];
      setMonths(m);
      if (m.length > 0 && !selectedPeriod) setSelectedPeriod(m[0]);
    } catch {
      setOverviewError("Failed to load billing periods");
    } finally {
      setOverviewLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const loadBills = useCallback(async (periodStart, skip) => {
    if (periodStart == null) return;
    setBillsLoading(true);
    setBillsError("");
    try {
      const res = await billingService.getBillsByPeriod({ periodStart, skip, limit: BILLS_LIMIT });
      setBills(res.data.bills ?? []);
      setBillsTotal(res.data.total ?? 0);
    } catch {
      setBillsError("Failed to load labs for this period");
    } finally {
      setBillsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      setBillsSkip(0);
      loadBills(selectedPeriod.periodStart, 0);
    }
  }, [selectedPeriod, loadBills]);

  useEffect(() => {
    if (selectedPeriod) loadBills(selectedPeriod.periodStart, billsSkip);
  }, [billsSkip]); // eslint-disable-line

  const handleDeletePeriod = async () => {
    if (!selectedPeriod) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await billingService.deletePeriodBills(selectedPeriod.periodStart);
      setDeleteModal(false);
      showToast(`Deleted ${res.data.deleted} bills for ${selectedPeriod.label} ✓`);
      setMonths((prev) => {
        const next = prev.filter((m) => m.periodStart !== selectedPeriod.periodStart);
        setSelectedPeriod(next[0] ?? null);
        return next;
      });
      setBills([]);
      setBillsTotal(0);
    } catch (e) {
      setDeleteError(e?.response?.data?.error ?? "Failed to delete period bills");
    } finally {
      setDeleteLoading(false);
    }
  };

  const billsPages = Math.ceil(billsTotal / BILLS_LIMIT);
  const billsPage = Math.floor(billsSkip / BILLS_LIMIT);

  const sp = selectedPeriod;
  const total = sp?.totalLabs ?? 0;
  const paidPct = total ? Math.round(((sp?.paid?.count ?? 0) / total) * 100) : 0;
  const unpaidPct = total ? Math.round(((sp?.unpaid?.count ?? 0) / total) * 100) : 0;
  const freePct = total ? Math.round(((sp?.free?.count ?? 0) / total) * 100) : 0;

  return (
    <div>
      {/* ── Period selector bar ── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
        <BarChart3 size={14} className="text-slate-300" />
        <span className="text-[13px] font-semibold text-slate-600">Billing Period</span>
        {overviewLoading ? (
          <Bone className="h-9 w-40 rounded-xl" />
        ) : (
          <select
            className="px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold outline-none focus:border-indigo-400 transition cursor-pointer"
            value={selectedPeriod?.period ?? ""}
            onChange={(e) => {
              const m = months.find((x) => x.period === e.target.value);
              if (m) setSelectedPeriod(m);
            }}
          >
            {months.map((m) => (
              <option key={m.period} value={m.period}>
                {m.label}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Btn
            variant="secondary"
            onClick={() => selectedPeriod && loadBills(selectedPeriod.periodStart, billsSkip)}
            loading={billsLoading}
          >
            <RefreshCw size={12} /> Refresh
          </Btn>
          {selectedPeriod && (
            <Btn
              variant="danger"
              onClick={() => {
                setDeleteError("");
                setDeleteModal(true);
              }}
            >
              <Trash2 size={12} /> Delete Period
            </Btn>
          )}
        </div>
      </div>

      {overviewError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-[13px] text-red-500 flex items-center gap-2 mb-4">
          <AlertCircle size={14} /> {overviewError}
        </div>
      )}

      {/* ── Stats cards ── */}
      {sp && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            {
              label: "Total Labs",
              value: sp.totalLabs,
              color: "text-slate-900",
              sub: sp.label,
              border: "border-slate-100",
            },
            {
              label: "Paid",
              value: sp.paid?.count ?? 0,
              color: "text-emerald-700",
              sub: fmtCurrency(sp.paid?.total ?? 0),
              border: "border-emerald-100",
            },
            {
              label: "Unpaid",
              value: sp.unpaid?.count ?? 0,
              color: "text-amber-700",
              sub: fmtCurrency(sp.unpaid?.total ?? 0),
              border: "border-amber-100",
            },
            {
              label: "Free",
              value: sp.free?.count ?? 0,
              color: "text-slate-500",
              sub: "no charge",
              border: "border-slate-100",
            },
          ].map(({ label, value, color, sub, border }) => (
            <div key={label} className={`bg-white border ${border} rounded-2xl p-4 shadow-sm`}>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</div>
              <div className={`text-[24px] font-black leading-tight ${color}`}>{value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {sp && total > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2 text-[11.5px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Paid {paidPct}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Unpaid {unpaidPct}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Free {freePct}%
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-slate-100 flex">
            {paidPct > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${paidPct}%` }} />}
            {unpaidPct > 0 && <div className="bg-amber-400 h-full" style={{ width: `${unpaidPct}%` }} />}
            {freePct > 0 && <div className="bg-slate-300 h-full" style={{ width: `${freePct}%` }} />}
          </div>
        </div>
      )}

      {/* ── Bills table ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          {["Lab", "Status", "Amount", "Due / Paid"].map((h) => (
            <div key={h} className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {h}
            </div>
          ))}
        </div>

        {billsError && (
          <div className="px-5 py-4 text-[12px] text-red-500 flex items-center gap-1.5">
            <AlertCircle size={13} /> {billsError}
          </div>
        )}

        {billsLoading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center">
                <div className="space-y-1.5">
                  <Bone className="h-3.5 w-36" />
                  <Bone className="h-3 w-20" />
                </div>
                <Bone className="h-5 w-14 rounded-md" />
                <Bone className="h-4 w-20" />
                <Bone className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-slate-400">No bills found for this period</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {bills.map((bill) => {
              const over = isOverdue(bill.dueDate) && bill.status === "unpaid";
              return (
                <div
                  key={bill._id}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center transition-colors ${over ? "bg-red-50/30" : "hover:bg-slate-50/60"}`}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-800 truncate">{bill.labName ?? "—"}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-400">{bill.labKey}</span>
                      {!bill.isActive && (
                        <span className="text-[10px] text-slate-300 font-bold flex items-center gap-0.5">
                          <Ban size={8} /> inactive
                        </span>
                      )}
                      {bill.invoiceCount != null && (
                        <span className="text-[11px] text-slate-400">{bill.invoiceCount} inv.</span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={bill.status} overdue={over} />
                  <span className="text-[13px] font-black text-slate-800 tabular-nums">
                    {fmtCurrency(bill.totalAmount)}
                  </span>
                  <div className="text-right">
                    {bill.status === "paid" && bill.paidAt ? (
                      <span className="text-[11.5px] text-emerald-600 font-medium flex items-center gap-1 justify-end">
                        <BadgeCheck size={11} /> {fmtDateUTC(bill.paidAt)}
                      </span>
                    ) : bill.status === "unpaid" ? (
                      <span
                        className={`text-[11.5px] flex items-center gap-1 justify-end ${over ? "text-red-500 font-bold" : "text-slate-400"}`}
                      >
                        {over ? <AlertTriangle size={10} /> : <Clock size={10} />}
                        {fmtDate(bill.dueDate)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-300">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {billsPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11.5px] text-slate-400">
              {billsTotal} labs · page {billsPage + 1} of {billsPages}
            </span>
            <div className="flex gap-1.5">
              <Btn
                variant="ghost"
                className="!px-2 !py-1 !text-[11px]"
                disabled={billsSkip === 0 || billsLoading}
                onClick={() => setBillsSkip((s) => Math.max(0, s - BILLS_LIMIT))}
              >
                <ChevronLeft size={11} /> Prev
              </Btn>
              <Btn
                variant="ghost"
                className="!px-2 !py-1 !text-[11px]"
                disabled={billsSkip + BILLS_LIMIT >= billsTotal || billsLoading}
                onClick={() => setBillsSkip((s) => s + BILLS_LIMIT)}
              >
                Next <ChevronRight size={11} />
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      <Modal open={deleteModal} onClose={() => !deleteLoading && setDeleteModal(false)} title="Delete Period Bills">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-[13px] text-red-700 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle size={14} /> This action is irreversible.
            </p>
            <p>
              All <span className="font-bold">{sp?.totalLabs ?? 0} bills</span> for{" "}
              <span className="font-bold">{sp?.label}</span> will be permanently deleted, including any paid records.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[12px]">
            {[
              { label: "Paid", value: sp?.paid?.count ?? 0, color: "text-emerald-700" },
              { label: "Unpaid", value: sp?.unpaid?.count ?? 0, color: "text-amber-700" },
              { label: "Free", value: sp?.free?.count ?? 0, color: "text-slate-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-slate-400 mb-0.5">{label}</div>
                <div className={`text-[18px] font-black ${color}`}>{value}</div>
              </div>
            ))}
          </div>
          {deleteError && (
            <p className="text-[12px] text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> {deleteError}
            </p>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="secondary" onClick={() => setDeleteModal(false)} disabled={deleteLoading}>
              Cancel
            </Btn>
            <Btn variant="danger" onClick={handleDeletePeriod} loading={deleteLoading}>
              <Trash2 size={13} /> Delete {sp?.totalLabs ?? 0} Bills
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "unpaid", label: "Unpaid Bills", icon: Clock },
  { id: "runs", label: "Billing Runs", icon: Activity },
  { id: "overview", label: "Month Overview", icon: BarChart3 },
  { id: "lab", label: "Lab Lookup", icon: Building2 },
];

const UNPAID_LIMIT = 20;

export default function AdminBilling() {
  const [tab, setTab] = useState("unpaid");

  const [unpaidLabs, setUnpaidLabs] = useState([]);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [unpaidLoading, setUnpaidLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [unpaidSkip, setUnpaidSkip] = useState(0);
  const searchTimer = useRef(null);

  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsFilter, setRunsFilter] = useState({ hasErrors: "", skip: 0, limit: 20 });

  const [labKeyInput, setLabKeyInput] = useState("");
  const [labData, setLabData] = useState(null);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState("");

  const [payModal, setPayModal] = useState(null);
  const [extendModal, setExtendModal] = useState(null);
  const [extendDate, setExtendDate] = useState("");
  const [generateModal, setGenerateModal] = useState(false);
  const [genPeriod, setGenPeriod] = useState(null);
  const [genDueDate, setGenDueDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUnpaid = useCallback(async (skip, searchVal) => {
    setUnpaidLoading(true);
    try {
      const params = { skip, limit: UNPAID_LIMIT };
      if (searchVal) params.search = searchVal;
      const res = await billingService.getUnpaidLabs(params);
      setUnpaidLabs(res.data.labs);
      setUnpaidTotal(res.data.total);
    } catch {
      showToast("Failed to fetch unpaid labs", "error");
    } finally {
      setUnpaidLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "unpaid") fetchUnpaid(unpaidSkip, search);
  }, [tab, unpaidSkip, search, fetchUnpaid]);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setUnpaidSkip(0);
      setSearch(val);
    }, 400);
  };

  const fetchRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const params = { skip: runsFilter.skip, limit: runsFilter.limit };
      if (runsFilter.hasErrors) params.hasErrors = runsFilter.hasErrors;
      const res = await billingService.getRuns(params);
      setRuns(res.data.runs);
    } catch {
      showToast("Failed to fetch runs", "error");
    } finally {
      setRunsLoading(false);
    }
  }, [runsFilter]);

  useEffect(() => {
    if (tab === "runs") fetchRuns();
  }, [tab, fetchRuns]);

  const handleLabLookup = async () => {
    const key = labKeyInput.trim();
    if (!key) {
      setLabError("Please enter a Lab Key.");
      return;
    }
    setLabLoading(true);
    setLabError("");
    setLabData(null);
    try {
      const res = await billingService.getLabSummaryByKey(key);
      setLabData(res.data);
    } catch (e) {
      setLabError(e?.response?.data?.error ?? "Lab not found.");
    } finally {
      setLabLoading(false);
    }
  };

  const handlePay = async () => {
    if (!payModal) return;
    setActionLoading(true);
    try {
      await billingService.markPaid(payModal._id, payModal.labId);
      showToast("Bill marked as paid ✓");
      setPayModal(null);
      fetchUnpaid(unpaidSkip, search);
    } catch (e) {
      showToast(e?.response?.data?.error ?? "Failed to mark paid", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!extendModal || !extendDate) return;
    setActionLoading(true);
    try {
      await billingService.updateDueDate(extendModal._id, extendDate);
      showToast("Due date updated ✓");
      setExtendModal(null);
      setExtendDate("");
      fetchUnpaid(unpaidSkip, search);
    } catch (e) {
      showToast(e?.response?.data?.error ?? "Failed to update due date", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const body = {};
      if (genPeriod?.year) body.year = genPeriod.year;
      if (genPeriod?.month) body.month = genPeriod.month;
      if (genDueDate) body.dueDate = genDueDate;
      await billingService.generate(body);
      showToast("Bill generation started ✓");
      setGenerateModal(false);
      setGenPeriod(null);
      setGenDueDate("");
    } catch (e) {
      showToast(e?.response?.data?.error ?? "Failed to start generation", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async (run) => {
    try {
      await billingService.retryFailed(run._id);
      showToast(`Retrying ${run.failedCount} failed lab(s) ✓`);
      fetchRuns();
    } catch (e) {
      showToast(e?.response?.data?.error ?? "Retry failed", "error");
    }
  };

  // Compute "now" in BST (not the browser's local timezone) so this matches
  // the backend's nowBST()-based validation in POST /billing/generate.
  const bstNow = new Date(Date.now() + BST_OFFSET_MS);
  const currentMonth1 = bstNow.getUTCMonth() + 1;
  const maxYear = currentMonth1 === 1 ? bstNow.getUTCFullYear() - 1 : bstNow.getUTCFullYear();
  const maxMonth = currentMonth1 === 1 ? 12 : currentMonth1 - 1;

  const unpaidPages = Math.ceil(unpaidTotal / UNPAID_LIMIT);
  const unpaidPage = Math.floor(unpaidSkip / UNPAID_LIMIT);

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-8 py-8">
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-[13px] font-semibold animate-[fadeUp_0.2s_ease] ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
        >
          {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-200">
              <CreditCard size={15} className="text-white" />
            </div>
            <h1 className="text-[22px] font-black text-slate-900 tracking-tight">Billing</h1>
          </div>
          <p className="text-[13px] text-slate-400 ml-10">Manage lab invoices, billing runs &amp; payments</p>
        </div>
        <Btn onClick={() => setGenerateModal(true)}>
          <Play size={13} /> Generate Bills
        </Btn>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 mb-6 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${tab === t.id ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            >
              <Icon size={13} /> {t.label}
              {t.id === "unpaid" && unpaidTotal > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === "unpaid" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}
                >
                  {unpaidTotal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── UNPAID BILLS TAB ─── */}
      {tab === "unpaid" && (
        <div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
              <input
                className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-slate-50 text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition placeholder:text-slate-300"
                placeholder="Search by lab name or key…"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
              />
            </div>
            <Btn variant="secondary" onClick={() => fetchUnpaid(unpaidSkip, search)} loading={unpaidLoading}>
              <RefreshCw size={12} /> Refresh
            </Btn>
            {!unpaidLoading && (
              <span className="ml-auto text-[12px] text-slate-400">
                {unpaidTotal} lab{unpaidTotal !== 1 ? "s" : ""} with unpaid bills
              </span>
            )}
          </div>

          {unpaidLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <LabCardSkeleton key={i} />
              ))}
            </div>
          ) : unpaidLabs.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl py-20 text-center shadow-sm">
              <CheckCircle2 size={28} className="text-emerald-300 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-slate-400">
                {search ? "No results found" : "All labs are paid up!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidLabs.map((lab) => (
                <UnpaidLabRow
                  key={lab.labId}
                  lab={lab}
                  onPay={setPayModal}
                  onExtend={(bill) => {
                    setExtendModal(bill);
                    setExtendDate("");
                  }}
                />
              ))}
            </div>
          )}

          {unpaidPages > 1 && !unpaidLoading && (
            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-[12px] text-slate-400">
                Page {unpaidPage + 1} of {unpaidPages}
              </span>
              <div className="flex gap-2">
                <Btn
                  variant="secondary"
                  className="!px-3 !py-1.5 !text-[12px]"
                  disabled={unpaidSkip === 0}
                  onClick={() => setUnpaidSkip((s) => Math.max(0, s - UNPAID_LIMIT))}
                >
                  ← Prev
                </Btn>
                <Btn
                  variant="secondary"
                  className="!px-3 !py-1.5 !text-[12px]"
                  disabled={unpaidSkip + UNPAID_LIMIT >= unpaidTotal}
                  onClick={() => setUnpaidSkip((s) => s + UNPAID_LIMIT)}
                >
                  Next →
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── RUNS TAB ─── */}
      {tab === "runs" && (
        <div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
            <Filter size={13} className="text-slate-300" />
            <Select
              value={runsFilter.hasErrors}
              onChange={(e) => setRunsFilter((f) => ({ ...f, hasErrors: e.target.value, skip: 0 }))}
            >
              <option value="">All runs</option>
              <option value="true">With errors only</option>
            </Select>
            <Btn variant="secondary" onClick={fetchRuns} loading={runsLoading}>
              <RefreshCw size={12} /> Refresh
            </Btn>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {["Period", "Triggered At", "By", "Total Labs", "Results", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <RunRowSkeleton key={i} />)
                  ) : runs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-300 text-[13px]">
                        No runs found
                      </td>
                    </tr>
                  ) : (
                    runs.map((r) => <RunRow key={r._id} run={r} onRetry={handleRetry} />)
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MONTH OVERVIEW TAB ─── */}
      {tab === "overview" && <MonthOverviewTab showToast={showToast} />}

      {/* ─── LAB LOOKUP TAB ─── */}
      {tab === "lab" && (
        <div className="max-w-2xl">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mb-4">
            <p className="text-[13px] font-semibold text-slate-600 mb-3">Look up a lab by its Key</p>
            <div className="flex gap-2">
              <Input
                placeholder="Lab Key (e.g. 11111)"
                value={labKeyInput}
                onChange={(e) => setLabKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLabLookup()}
              />
              <Btn onClick={handleLabLookup} loading={labLoading} disabled={!labKeyInput.trim()}>
                <Search size={13} /> Lookup
              </Btn>
            </div>
            {labError && (
              <p className="text-[12px] text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle size={11} /> {labError}
              </p>
            )}
          </div>

          {labLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Bone className="h-5 w-48" />
                    <Bone className="h-3.5 w-24" />
                  </div>
                  <Bone className="h-7 w-16 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
                    <Bone className="h-3 w-12" />
                    <Bone className="h-7 w-10" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {labData && !labLoading && (
            <div className="space-y-4 animate-[fadeUp_0.2s_ease]">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[17px] font-black text-slate-900">{labData.lab?.name ?? "—"}</p>
                    <p className="text-[12px] font-mono text-slate-400 mt-0.5">{labData.lab?.labKey}</p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${labData.lab?.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200"}`}
                  >
                    {labData.lab?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Paid", key: "paid", border: "border-emerald-100" },
                  { label: "Unpaid", key: "unpaid", border: "border-amber-100" },
                  { label: "Free", key: "free", border: "border-slate-100" },
                ].map(({ label, key, border }) => (
                  <div key={key} className={`bg-white rounded-2xl border ${border} p-4 shadow-sm`}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-[22px] font-black text-slate-900 leading-tight">
                      {labData.stats?.[key]?.count ?? 0}
                    </p>
                    {labData.stats?.[key]?.total > 0 && (
                      <p className="text-[11.5px] text-slate-400 mt-0.5">{fmtCurrency(labData.stats[key].total)}</p>
                    )}
                  </div>
                ))}
              </div>

              {labData.currentBill ? (
                <div
                  className={`bg-white border rounded-2xl p-5 shadow-sm ${labData.currentBill.isOverdue ? "border-red-200 bg-red-50/20" : "border-amber-100"}`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      {labData.currentBill.isOverdue ? (
                        <AlertTriangle size={16} className="text-red-500" />
                      ) : (
                        <Clock size={16} className="text-amber-500" />
                      )}
                      <span className="text-[14px] font-bold text-slate-800">Current Unpaid Bill</span>
                    </div>
                    <span className="text-[20px] font-black text-slate-900">
                      {fmtCurrency(labData.currentBill.amount)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[12px] mb-4">
                    <div>
                      <span className="text-slate-400">Period: </span>
                      <span className="font-semibold text-slate-700">
                        {fmtDate(labData.currentBill.billingPeriodStart)} –{" "}
                        {fmtDate(labData.currentBill.billingPeriodEnd)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Due: </span>
                      <span
                        className={`font-semibold ${labData.currentBill.isOverdue ? "text-red-600" : "text-slate-700"}`}
                      >
                        {fmtDate(labData.currentBill.dueDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Invoices: </span>
                      <span className="font-semibold text-slate-700">{labData.currentBill.invoiceCount}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Btn
                      variant="success"
                      onClick={() =>
                        setPayModal({ ...labData.currentBill, _id: labData.currentBill.id, labId: labData.lab?._id })
                      }
                    >
                      <CheckCircle2 size={13} /> Mark as Paid
                    </Btn>
                    <Btn
                      variant="secondary"
                      onClick={() => {
                        setExtendModal({ ...labData.currentBill, _id: labData.currentBill.id });
                        setExtendDate("");
                      }}
                    >
                      <Calendar size={13} /> Extend Due Date
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center shadow-sm">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-500 font-medium">No unpaid bills for this lab</p>
                </div>
              )}

              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Receipt size={14} className="text-slate-400" />
                  <span className="text-[13px] font-bold text-slate-700">Full Billing History</span>
                </div>
                <LabHistoryDrawer
                  labKey={labData.lab?.labKey}
                  onPay={setPayModal}
                  onExtend={(bill) => {
                    setExtendModal(bill);
                    setExtendDate("");
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PAY MODAL ─── */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Confirm Payment">
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-[13px] text-emerald-700">
            Mark this bill as paid? This will unblock the lab immediately.
          </div>
          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
            <div className="bg-slate-50 rounded-xl p-3">
              <span className="text-slate-400 block mb-0.5">Amount</span>
              <span className="font-bold text-slate-800">{fmtCurrency(payModal?.totalAmount ?? payModal?.amount)}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <span className="text-slate-400 block mb-0.5">Period</span>
              <span className="font-bold text-slate-800">
                {payModal?.month ?? fmtMonth(payModal?.billingPeriodStart)}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <span className="text-slate-400 block mb-0.5">Due Date</span>
              <span className="font-bold text-slate-800">{fmtDate(payModal?.dueDate)}</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="secondary" onClick={() => setPayModal(null)}>
              Cancel
            </Btn>
            <Btn variant="success" onClick={handlePay} loading={actionLoading}>
              <CheckCircle2 size={13} /> Confirm Payment
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ─── EXTEND MODAL ─── */}
      <Modal open={!!extendModal} onClose={() => setExtendModal(null)} title="Extend Due Date">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[12px] text-amber-700">
            Max extension: <strong>+10 days</strong> from current due date ({fmtDate(extendModal?.dueDate)}).
            {extendModal?.month && <span className="ml-1 font-semibold">· {extendModal.month}</span>}
          </div>
          <Input label="New Due Date" type="date" value={extendDate} onChange={(e) => setExtendDate(e.target.value)} />
          <div className="flex gap-2 justify-end pt-1">
            <Btn variant="secondary" onClick={() => setExtendModal(null)}>
              Cancel
            </Btn>
            <Btn onClick={handleExtend} loading={actionLoading} disabled={!extendDate}>
              <Calendar size={13} /> Update Due Date
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ─── GENERATE MODAL ─── */}
      <Modal
        open={generateModal}
        onClose={() => {
          setGenerateModal(false);
          setGenPeriod(null);
          setGenDueDate("");
        }}
        title="Generate Bills"
        width="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-[12.5px] text-slate-500">
            Leave period blank to auto-generate for the previous BST month.
          </p>
          <MonthYearPicker
            label="Billing Period (optional)"
            value={genPeriod}
            onChange={setGenPeriod}
            maxYear={maxYear}
            maxMonth={maxMonth}
            minYear={2020}
          />
          <Input
            label="Due Date (optional)"
            type="date"
            value={genDueDate}
            onChange={(e) => setGenDueDate(e.target.value)}
          />
          <div className="flex gap-2 justify-end pt-1">
            <Btn
              variant="secondary"
              onClick={() => {
                setGenerateModal(false);
                setGenPeriod(null);
                setGenDueDate("");
              }}
            >
              Cancel
            </Btn>
            <Btn onClick={handleGenerate} loading={actionLoading}>
              <Play size={13} /> Start Generation
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
