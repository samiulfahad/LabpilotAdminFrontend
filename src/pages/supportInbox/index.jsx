/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox,
  ArrowLeft,
  Search,
  X,
  RotateCcw,
  MailWarning,
  MailOpen,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ChevronDown,
  Clock,
  Lock,
  Building2,
  KeyRound,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import Popup from "../../components/popup";
import supportService from "../../api/supportInbox";

/* ────────────────────────────────────────────────────────────────────────
   SLATE — flat design tokens, matching ManageStaff.jsx / Setup.jsx theming.
   ──────────────────────────────────────────────────────────────────────── */
const INK = "#0F172A";
const INK_MUTE = "#64748B";
const PAPER = "#FFFFFF";
const GROUND = "#F8FAFC";
const LINE = "#E2E8F0";
const TEAL = "#2563EB";
const TEAL_DARK = "#1D4ED8";
const TEAL_TINT = "#EFF6FF";
const RUST = "#E11D48";
const RUST_TINT = "#FFF1F2";
const AMBER = "#D97706";
const AMBER_TINT = "#FFFBEB";
const GREEN = "#059669";
const GREEN_TINT = "#ECFDF5";
const INDIGO = "#4F46E5";
const INDIGO_TINT = "#EEF2FF";

const dotGround = { backgroundColor: GROUND };
const pageGradientBg = "bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#eef2ff_0%,#f8fafc_45%,#f8fafc_100%)]";
const bn = "font-['Noto_Sans_Bengali',sans-serif]";
const mono = "font-['IBM_Plex_Mono',monospace]";

/* ─── Status meta ──────────────────────────────────────────────────────── */
const STATUS_META = {
  unread: { label: "অপঠিত", color: RUST, tint: RUST_TINT, icon: MailWarning },
  read: { label: "পঠিত", color: AMBER, tint: AMBER_TINT, icon: MailOpen },
  resolved: { label: "সমাধান হয়েছে", color: GREEN, tint: GREEN_TINT, icon: CheckCircle2 },
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "সব বার্তা" },
  { value: "unread", label: "অপঠিত" },
  { value: "read", label: "পঠিত" },
  { value: "resolved", label: "সমাধান হয়েছে" },
];

/* ─── Error helpers ────────────────────────────────────────────────────── */
const PERMISSION_DENIED_MESSAGE = "আপনার কর্তৃপক্ষ আপনাকে এই কাজটি করার বা এই তথ্যটি পাওয়ার অনুমতি দেয়নি।";
const getErrorMessage = (err, fallback) => {
  if (err?.response?.status === 403) return err?.response?.data?.error ?? PERMISSION_DENIED_MESSAGE;
  return err?.response?.data?.error ?? fallback;
};
const getErrorStatus = (error) => error?.response?.status ?? error?.status ?? null;
const isNetworkError = (err) => err?.isAxiosError === true && !err.response;

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/* ─── Primitives (shared look) ─────────────────────────────────────────── */
const GhostBtn = ({ children, ...props }) => (
  <button
    type="button"
    className={`px-3.5 py-2 text-xs font-semibold bg-white transition-colors ${mono}`}
    style={{ color: INK_MUTE, border: `1px solid ${LINE}`, borderRadius: "7px" }}
    {...props}
  >
    {children}
  </button>
);

const ActionBtn = ({ icon: Icon, label, tone = INK_MUTE, tint = "#F1EFE7", ...props }) => (
  <button
    type="button"
    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${mono}`}
    style={{ color: tone, border: `1px solid ${tone}35`, borderRadius: "5px", background: "white" }}
    onMouseEnter={(e) => {
      if (props.disabled) return;
      e.currentTarget.style.background = tint;
      e.currentTarget.style.borderColor = tone;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "white";
      e.currentTarget.style.borderColor = `${tone}35`;
    }}
    {...props}
  >
    <Icon size={12} />
    {label}
  </button>
);

const FilterSelect = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none outline-none cursor-pointer transition-colors text-xs py-[7px] pl-3 pr-[28px] bg-white ${bn}`}
      style={{
        border: `1px solid ${value !== "all" ? TEAL : LINE}`,
        borderRadius: "3px",
        color: value !== "all" ? TEAL_DARK : INK_MUTE,
        background: value !== "all" ? TEAL_TINT : "white",
        boxShadow: value !== "all" ? "0 1px 2px rgba(37,99,235,0.12)" : "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown
      size={12}
      className="absolute right-[9px] top-1/2 -translate-y-1/2 pointer-events-none"
      style={{ color: INK_MUTE }}
    />
  </div>
);

const StatCard = ({ icon: Icon, label, value, tone = TEAL, tint = TEAL_TINT }) => (
  <div
    className="flex items-center gap-3 px-4 py-3.5 transition-shadow"
    style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "4px" }}
  >
    <div
      className="w-10 h-10 flex items-center justify-center shrink-0"
      style={{ background: tint, color: tone, borderRadius: "3px" }}
    >
      <Icon size={17} />
    </div>
    <div>
      <p className={`text-[26px] font-extrabold leading-none ${mono}`} style={{ color: INK }}>
        {value}
      </p>
      <p className={`text-[9px] font-bold uppercase tracking-[0.06em] mt-2 ${mono}`} style={{ color: INK_MUTE }}>
        {label}
      </p>
    </div>
  </div>
);

const Skeleton = () => (
  <div className="flex flex-col gap-2 p-4">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="flex items-center gap-3 px-4 py-3 animate-pulse"
        style={{ background: "white", border: `1px solid ${LINE}`, borderRadius: "8px" }}
      >
        <div className="w-9 h-9 shrink-0" style={{ background: "#EEEBE1", borderRadius: "9px" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/5" style={{ background: "#EEEBE1", borderRadius: "2px" }} />
          <div className="h-2.5 w-3/5" style={{ background: "#F2F0E8", borderRadius: "2px" }} />
        </div>
      </div>
    ))}
  </div>
);

/* ─── Message Row ──────────────────────────────────────────────────────── */
const MessageRow = ({ msg, onMarkRead, onMarkResolved, onReopen, onDelete, updating }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[msg.status] ?? STATUS_META.unread;
  const StatusIcon = meta.icon;
  const canDelete = msg.status === "resolved";

  return (
    <div
      className="transition-shadow"
      style={{
        background: "white",
        border: `1px solid ${LINE}`,
        borderRadius: "10px",
        boxShadow: expanded ? "0 4px 14px rgba(28,35,33,0.08)" : "0 1px 2px rgba(28,35,33,0.03)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: meta.tint, color: meta.color }}
        >
          <StatusIcon size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold truncate ${bn}`} style={{ color: INK }}>
              {msg.staffName}
            </span>
            <span
              className={`text-[9.5px] font-bold px-1.5 py-px shrink-0 ${mono}`}
              style={{ color: meta.color, background: meta.tint, borderRadius: "3px" }}
            >
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap mt-1">
            <span className={`text-[11.5px] flex items-center gap-1 ${bn}`} style={{ color: INDIGO }}>
              <Building2 size={11} className="shrink-0" /> {msg.labName || "—"}
            </span>
            {msg.labKey && (
              <span
                className={`text-[10px] font-bold flex items-center gap-1 px-1.5 py-px shrink-0 ${mono}`}
                style={{ color: INDIGO, background: INDIGO_TINT, borderRadius: "3px" }}
              >
                <KeyRound size={9} /> {msg.labKey}
              </span>
            )}
            {msg.contact && (
              <span className={`text-[11px] flex items-center gap-1 ${mono}`} style={{ color: INK_MUTE }}>
                <Phone size={10} className="shrink-0" /> {msg.contact}
              </span>
            )}
          </div>
          <p className={`text-[12px] mt-1.5 ${bn} ${expanded ? "" : "truncate"}`} style={{ color: INK_MUTE }}>
            {msg.message}
          </p>
          <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${mono}`} style={{ color: INK_MUTE }}>
            <Clock size={10} /> {formatDate(msg.createdAt)}
          </p>
        </div>
        <ChevronDown
          size={15}
          className="shrink-0 mt-1"
          style={{ color: INK_MUTE, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: LINE }}>
          <div className="pt-3.5 flex items-center gap-2 flex-wrap">
            {msg.status === "unread" && (
              <ActionBtn
                icon={MailOpen}
                label="পঠিত হিসেবে চিহ্নিত করুন"
                tone={AMBER}
                tint={AMBER_TINT}
                onClick={onMarkRead}
                disabled={updating}
              />
            )}
            {msg.status !== "resolved" && (
              <ActionBtn
                icon={CheckCircle2}
                label="সমাধান হয়েছে"
                tone={GREEN}
                tint={GREEN_TINT}
                onClick={onMarkResolved}
                disabled={updating}
              />
            )}
            {msg.status !== "unread" && (
              <ActionBtn
                icon={RotateCcw}
                label="পুনরায় খুলুন"
                tone={TEAL}
                tint={TEAL_TINT}
                onClick={onReopen}
                disabled={updating}
              />
            )}
            <ActionBtn
              icon={canDelete ? Trash2 : Lock}
              label="মুছে ফেলুন"
              tone={RUST}
              tint={RUST_TINT}
              onClick={onDelete}
              disabled={!canDelete || updating}
              title={!canDelete ? "শুধুমাত্র সমাধান হওয়া বার্তা মুছে ফেলা যাবে।" : undefined}
            />
          </div>
          {!canDelete && (
            <p className={`text-[10.5px] mt-2.5 flex items-center gap-1.5 ${bn}`} style={{ color: INK_MUTE }}>
              <AlertCircle size={11} /> মুছে ফেলার আগে বার্তাটি "সমাধান হয়েছে" হিসেবে চিহ্নিত করুন।
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────────────────── */
const SupportInbox = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [offlinePopup, setOfflinePopup] = useState(false);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const loadMessages = async () => {
    try {
      const res = await supportService.getMessages();
      setMessages(res.data.messages);
    } catch (err) {
      if (isNetworkError(err)) {
        setOfflinePopup(true);
      } else {
        setPopup({ type: "error", message: getErrorMessage(err, "বার্তা লোড করতে ব্যর্থ।") });
      }
    }
  };

  useEffect(() => {
    (async () => {
      await loadMessages();
      setInitialLoading(false);
    })();
  }, []);

  const stats = {
    total: messages.length,
    unread: messages.filter((m) => m.status === "unread").length,
    read: messages.filter((m) => m.status === "read").length,
    resolved: messages.filter((m) => m.status === "resolved").length,
  };

  const filtered = messages.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.staffName?.toLowerCase().includes(q) ||
        m.message?.toLowerCase().includes(q) ||
        m.labName?.toLowerCase().includes(q) ||
        m.labKey?.toLowerCase().includes(q) ||
        m.contact?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (msg, status) => {
    setUpdatingId(msg._id);
    try {
      await supportService.updateStatus(msg._id, status);
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, status } : m)));
    } catch (err) {
      if (isNetworkError(err)) {
        setOfflinePopup(true);
      } else {
        setPopup({ type: "error", message: getErrorMessage(err, "স্ট্যাটাস পরিবর্তন ব্যর্থ।") });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (msg) => {
    try {
      await supportService.deleteMessage(msg._id);
      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      setPopup({ type: "success", message: "বার্তা মুছে ফেলা হয়েছে।" });
    } catch (err) {
      if (isNetworkError(err)) {
        setOfflinePopup(true);
      } else {
        // 409 here means the message stopped being "resolved" between the
        // list load and the click (e.g. reopened elsewhere) — surface the
        // backend's Bangla message as-is, same pattern as staff limit errors.
        if (getErrorStatus(err) === 404) setMessages((prev) => prev.filter((m) => m._id !== msg._id));
        setPopup({ type: "error", message: getErrorMessage(err, "বার্তা মুছতে ব্যর্থ।") });
      }
    }
  };

  const hasFilters = statusFilter !== "all" || search !== "";

  const rowProps = (msg) => ({
    msg,
    updating: updatingId === msg._id,
    onMarkRead: () => handleStatusChange(msg, "read"),
    onMarkResolved: () => handleStatusChange(msg, "resolved"),
    onReopen: () => handleStatusChange(msg, "unread"),
    onDelete: () => setModal({ type: "delete", msg }),
  });

  return (
    <section className={`min-h-screen px-4 sm:px-6 py-6 lg:py-8 ${pageGradientBg} ${bn}`}>
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      {offlinePopup && (
        <Popup
          type="error"
          message="ইন্টারনেট সংযোগ নেই। আপনার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
          onClose={() => setOfflinePopup(false)}
        />
      )}

      {modal?.type === "delete" && (
        <Popup
          type="warning"
          message={`"${modal.msg.staffName}"-এর বার্তাটি স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।`}
          confirmText="Yes, Delete"
          cancelText="Keep"
          onConfirm={() => {
            setModal(null);
            handleDelete(modal.msg);
          }}
          onClose={() => setModal(null)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 flex items-center justify-center shrink-0 rounded-xl shadow-md"
              style={{
                background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
                boxShadow: `0 4px 10px ${TEAL}35`,
              }}
            >
              <Inbox size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold leading-tight" style={{ color: INK }}>
                সাপোর্ট বার্তা
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: INK_MUTE }}>
                স্টাফদের পাঠানো অভিযোগ ও প্রশ্ন পরিচালনা
              </p>
            </div>
          </div>
          <Link to="/setup">
            <GhostBtn>
              <ArrowLeft size={13} />
            </GhostBtn>
          </Link>
        </div>

        {!initialLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatCard icon={Inbox} label="মোট বার্তা" value={stats.total} tone={TEAL} tint={TEAL_TINT} />
            <StatCard icon={MailWarning} label="অপঠিত" value={stats.unread} tone={RUST} tint={RUST_TINT} />
            <StatCard icon={MailOpen} label="পঠিত" value={stats.read} tone={AMBER} tint={AMBER_TINT} />
            <StatCard icon={CheckCircle2} label="সমাধান হয়েছে" value={stats.resolved} tone={GREEN} tint={GREEN_TINT} />
          </div>
        )}

        <div
          className="px-4 py-3 flex flex-wrap items-center gap-2 mb-4"
          style={{ background: "white", border: `1px solid ${LINE}`, borderRadius: "8px" }}
        >
          <div className="relative flex-[1_1_160px]">
            <Search
              size={13}
              className="absolute left-[11px] top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: INK_MUTE }}
            />
            <input
              type="text"
              placeholder="নাম, হাসপাতাল বা বার্তায় খুঁজুন…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full px-3 py-2 text-xs bg-white outline-none transition-colors placeholder:text-[#B8B2A2] pl-8 ${search ? "pr-8" : "pr-3"} ${bn}`}
              style={{ border: `1px solid ${LINE}`, borderRadius: "3px", color: INK }}
              onFocus={(e) => (e.target.style.borderColor = TEAL)}
              onBlur={(e) => (e.target.style.borderColor = LINE)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-[10px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer"
                style={{ color: INK_MUTE }}
              >
                <X size={13} />
              </button>
            )}
          </div>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTER_OPTIONS} />
          {hasFilters && (
            <GhostBtn
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
              }}
            >
              <span className="flex items-center gap-1.5" style={{ color: RUST }}>
                <RotateCcw size={12} /> রিসেট
              </span>
            </GhostBtn>
          )}
        </div>

        {initialLoading ? (
          <div style={{ background: "white", border: `1px solid ${LINE}`, borderRadius: "8px" }}>
            <Skeleton />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 gap-2"
            style={{ color: INK_MUTE, background: "white", border: `1px solid ${LINE}`, borderRadius: "8px" }}
          >
            <AlertCircle size={26} className="opacity-40" />
            <p className={`text-xs ${mono}`}>{hasFilters ? "কোনো বার্তা পাওয়া যায়নি" : "এখনো কোনো বার্তা আসেনি"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <MessageRow key={m._id} {...rowProps(m)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SupportInbox;
