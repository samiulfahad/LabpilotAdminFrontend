import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  LogOut,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import accountService from "../../api/account";
import { useAuthStore } from "../../store/authStore";
import Popup from "../../components/popup";

// ─── Helpers ─────────────────────────────────────────────────────────────

const getErrorMessage = (err, fallback) => err?.response?.data?.error ?? fallback;

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

const timeAgo = (d) => {
  if (!d) return "Never";
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const DeviceIcon = ({ type, className }) => {
  if (type === "mobile") return <Smartphone className={className} />;
  if (type === "tablet") return <Tablet className={className} />;
  return <Monitor className={className} />;
};

// ─── Shared input style (matches Login.jsx) ────────────────────────────────

const inputCls =
  "w-full rounded-[2px] border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-[#0F6E5C]";

// ─── Password Field ─────────────────────────────────────────────────────

const PasswordField = ({ label, value, onChange, disabled }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputCls} pr-16`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-black/50 hover:text-black"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
};

// ─── Change Password Card ───────────────────────────────────────────────

const ChangePasswordCard = ({ onSuccess }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!current) return setError("Current password is required");
    if (next.length < 6) return setError("New password must be at least 6 characters");
    if (next !== confirm) return setError("New passwords do not match");

    try {
      setLoading(true);
      await accountService.changePassword({ currentPassword: current, newPassword: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      onSuccess("Password changed successfully");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to change password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF9F5] rounded-[2px] border border-black/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound size={16} className="text-[#0F6E5C]" />
        <h2 className="text-sm font-semibold">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <PasswordField label="Current Password" value={current} onChange={setCurrent} disabled={loading} />
        <PasswordField label="New Password" value={next} onChange={setNext} disabled={loading} />
        <PasswordField label="Confirm New Password" value={confirm} onChange={setConfirm} disabled={loading} />
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-[2px] bg-[#0F6E5C] text-white text-sm font-medium py-2 px-4 disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Changing…" : "Change Password"}
        </button>
      </form>
    </div>
  );
};

// ─── Session Row ─────────────────────────────────────────────────────────

const SessionRow = ({ session, onRevoke, revoking }) => {
  const { device = {}, isCurrent, lastUsedAt, deviceId } = session;
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-[2px] border p-3 ${
        isCurrent ? "border-[#0F6E5C]/30 bg-[#0F6E5C]/5" : "border-black/10"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <DeviceIcon type={device.deviceType} className="w-4 h-4 mt-0.5 text-black/40 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium capitalize">
            {device.browser || "Unknown"} · {device.os || "Unknown"}
            {isCurrent && <span className="ml-2 text-xs text-[#0F6E5C] font-semibold">This device</span>}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-black/40">
            {device.timezone && (
              <span className="flex items-center gap-1">
                <Globe size={11} /> {device.timezone}
              </span>
            )}
            {device.ip && device.ip !== "unknown" && <span>{device.ip}</span>}
            <span className="flex items-center gap-1">
              <Clock size={11} /> {timeAgo(lastUsedAt)}
            </span>
          </div>
        </div>
      </div>
      {!isCurrent && (
        <button
          onClick={() => onRevoke(deviceId)}
          disabled={revoking}
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          <LogOut size={12} /> Revoke
        </button>
      )}
    </div>
  );
};

// ─── Main Account Page ────────────────────────────────────────────────────

function Account() {
  const navigate = useNavigate();
  const admin = useAuthStore((s) => s.admin);
  const logout = useAuthStore((s) => s.logout);

  const [sessions, setSessions] = useState([]);
  const [loadingSess, setLoadingSess] = useState(true);
  const [sessError, setSessError] = useState("");
  const [revokingId, setRevokingId] = useState(null);
  const [popup, setPopup] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoadingSess(true);
      setSessError("");
      const res = await accountService.getSessions();
      setSessions(res.data.sessions ?? []);
    } catch (err) {
      setSessError(getErrorMessage(err, "Failed to load sessions"));
    } finally {
      setLoadingSess(false);
    }
  };

  const handleRevoke = async (deviceId) => {
    try {
      setRevokingId(deviceId);
      await accountService.revokeSession(deviceId);
      setSessions((prev) => prev.filter((s) => s.deviceId !== deviceId));
    } catch (err) {
      setPopup({ type: "error", message: getErrorMessage(err, "Failed to revoke session") });
    } finally {
      setRevokingId(null);
    }
  };

  const handleConfirmLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F5F4EF] px-4 py-8">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
      {showLogoutPopup && (
        <Popup
          type="logout"
          message="Are you sure you want to log out?"
          confirmText="Log Out"
          cancelText="Cancel"
          onConfirm={handleConfirmLogout}
          onClose={() => setShowLogoutPopup(false)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">My Account</h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-black/50 hover:text-black"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* Identity card */}
        <div className="bg-[#FAF9F5] rounded-[2px] border border-black/10 p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[2px] bg-[#0F6E5C] flex items-center justify-center shrink-0">
              <User size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold">{admin?.username ?? "—"}</p>
              <p className="flex items-center gap-1.5 text-sm text-black/50 mt-0.5">
                <Phone size={12} /> {admin?.phone ?? "—"}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-[2px] bg-[#0F6E5C]/10 text-[#0F6E5C] text-xs font-semibold">
                <Shield size={11} /> System Admin
              </span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="mb-4">
          <ChangePasswordCard onSuccess={(message) => setPopup({ type: "success", message })} />
        </div>

        {/* Active sessions */}
        <div className="bg-[#FAF9F5] rounded-[2px] border border-black/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#0F6E5C]" />
              <h2 className="text-sm font-semibold">Active Sessions</h2>
            </div>
            <button
              onClick={() => setShowLogoutPopup(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>

          {loadingSess ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-black/5 rounded-[2px] animate-pulse" />
              ))}
            </div>
          ) : sessError ? (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} /> {sessError}
            </p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-black/40">No active sessions found</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <SessionRow key={s.deviceId} session={s} onRevoke={handleRevoke} revoking={revokingId === s.deviceId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Account;
