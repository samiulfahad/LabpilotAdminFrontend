// LabStaff.jsx
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  UserCog,
  UserPlus,
  Headset,
  Search,
  FlaskConical,
  Building2,
  X,
  ChevronDown,
  Pencil,
  SlidersHorizontal,
  Power,
  Trash2,
  Send,
  Check,
} from "lucide-react";

import Popup from "../../components/popup";
import labStaffService from "../../api/labStaffService";

/* ────────────────────────────────────────────────────────────────────────
   LEDGER — design tokens
   ──────────────────────────────────────────────────────────────────────── */
const INK = "#1C2321";
const INK_MUTE = "#79746A";
const PAPER = "#FAF9F5";
const GROUND = "#F5F4EF";
const LINE = "#DBD6C9";
const TEAL = "#0F6E5C";
const TEAL_DARK = "#0B5747";
const TEAL_TINT = "#E7F0EC";
const RUST = "#B3432B";
const RUST_TINT = "#F7E6E1";
const AMBER = "#A9762C";
const AMBER_TINT = "#F3E9D6";
const VIOLET = "#5B4E8C";
const VIOLET_TINT = "#EBE8F5";

const dotGround = {
  backgroundColor: GROUND,
  backgroundImage: `radial-gradient(${LINE} 1px, transparent 1px)`,
  backgroundSize: "15px 15px",
};

// Display labels for permission modules — falls back to the raw key (title-cased)
// for any module not listed here, so a new module added on the backend still renders.
const MODULE_LABELS = {
  invoice: "Invoice",
  expense: "Expense",
  dailyReport: "Daily Reports",
  testReport: "Test Reports",
  setup: "Setup",
  billing: "Billing",
  indoorPatient: "Indoor Patient",
};

const moduleLabel = (mod) => {
  if (!mod) return "Other";
  return MODULE_LABELS[mod] || mod.charAt(0).toUpperCase() + mod.slice(1);
};

/* ─── Primitives ─────────────────────────────────────────── */

const Field = ({ label, hint, children }) => (
  <div>
    {label && (
      <label className="block text-[10px] font-semibold uppercase tracking-[0.09em] mb-1.5" style={{ color: INK_MUTE }}>
        {label}
      </label>
    )}
    {children}
    {hint && (
      <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
        {hint}
      </p>
    )}
  </div>
);

const inputBase = "w-full px-3 py-2.5 text-[13px] bg-white outline-none transition-colors placeholder:text-[#B8B2A2]";
const inputStyle = { border: `1px solid ${LINE}`, borderRadius: "2px", color: INK, fontFamily: "inherit" };

const TextInput = ({ label, hint, ...props }) => (
  <Field label={label} hint={hint}>
    <input
      className={inputBase}
      style={inputStyle}
      onFocus={(e) => (e.target.style.borderColor = TEAL)}
      onBlur={(e) => (e.target.style.borderColor = LINE)}
      {...props}
    />
  </Field>
);

const StatusStamp = ({ active }) => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-[0.08em] select-none"
    style={{
      color: active ? TEAL_DARK : "#9B9587",
      border: `1px dashed ${active ? TEAL : "#C7C1B2"}`,
      borderRadius: "2px",
      transform: "rotate(-1.5deg)",
    }}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

const GhostBtn = ({ children, ...props }) => (
  <button
    type="button"
    className="px-3.5 py-2 text-[11.5px] font-semibold bg-white transition-colors disabled:opacity-60"
    style={{ color: INK_MUTE, border: `1px solid ${LINE}`, borderRadius: "2px" }}
    {...props}
  >
    {children}
  </button>
);

const SolidBtn = ({ children, tone = TEAL, toneDark = TEAL_DARK, loading, ...props }) => (
  <button
    type="button"
    className="flex items-center gap-2 px-4 py-2 text-[11.5px] font-bold text-white transition-colors disabled:opacity-60"
    style={{ background: tone, borderRadius: "2px" }}
    onMouseEnter={(e) => !props.disabled && (e.currentTarget.style.background = toneDark)}
    onMouseLeave={(e) => (e.currentTarget.style.background = tone)}
    {...props}
  >
    {loading && <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
    {children}
  </button>
);

const IconBtn = ({ icon: Icon, tone = INK_MUTE, tint = "#F1EFE7", title, ...props }) => (
  <button
    title={title}
    type="button"
    className="w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-40"
    style={{ color: INK_MUTE, border: `1px solid ${LINE}`, borderRadius: "2px", background: "white" }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = tone;
      e.currentTarget.style.background = tint;
      e.currentTarget.style.borderColor = tone;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = INK_MUTE;
      e.currentTarget.style.background = "white";
      e.currentTarget.style.borderColor = LINE;
    }}
    {...props}
  >
    <Icon size={12} />
  </button>
);

/* ─── Permissions grid — grouped by module ─────────────────── */

const PermissionsGrid = ({ catalog, value, onChange }) => {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of catalog) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module).push(p);
    }
    return Array.from(map.entries());
  }, [catalog]);

  const toggle = (key) => onChange({ ...value, [key]: !value[key] });

  const toggleModule = (perms, allOn) => {
    const next = { ...value };
    perms.forEach((p) => (next[p.key] = !allOn));
    onChange(next);
  };

  if (catalog.length === 0) {
    return (
      <p className="text-[11.5px]" style={{ color: INK_MUTE }}>
        No permissions available.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {grouped.map(([mod, perms]) => {
        const allOn = perms.every((p) => value[p.key]);
        return (
          <div key={mod} style={{ border: `1px solid ${LINE}`, borderRadius: "2px" }}>
            <div
              className="flex items-center justify-between px-3 py-2 border-b"
              style={{ borderColor: LINE, background: GROUND }}
            >
              <p className="text-[10.5px] font-bold uppercase tracking-[0.06em]" style={{ color: INK }}>
                {moduleLabel(mod)}
              </p>
              <button
                type="button"
                onClick={() => toggleModule(perms, allOn)}
                className="text-[10px] font-semibold"
                style={{ color: TEAL }}
              >
                {allOn ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {perms.map((p) => {
                const checked = Boolean(value[p.key]);
                return (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none"
                    style={{ background: checked ? TEAL_TINT : "transparent", borderRadius: "2px" }}
                  >
                    <span
                      className="w-4 h-4 flex items-center justify-center shrink-0"
                      style={{
                        border: `1px solid ${checked ? TEAL : LINE}`,
                        background: checked ? TEAL : "white",
                        borderRadius: "2px",
                      }}
                      onClick={() => toggle(p.key)}
                    >
                      {checked && <Check size={11} className="text-white" />}
                    </span>
                    <span className="text-[12px]" style={{ color: INK }} onClick={() => toggle(p.key)}>
                      {p.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Lab picker (dropdown, searchable) ───────────────────── */

const LabPicker = ({ labs, loading, selectedLab, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return labs;
    return labs.filter((l) => l.name.toLowerCase().includes(q) || String(l.labKey).toLowerCase().includes(q));
  }, [labs, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white transition-colors"
        style={{ border: `1px solid ${LINE}`, borderRadius: "2px" }}
      >
        {selectedLab ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 flex items-center justify-center shrink-0"
              style={{ background: selectedLab.type === "hospital" ? RUST_TINT : TEAL_TINT, borderRadius: "2px" }}
            >
              {selectedLab.type === "hospital" ? (
                <Building2 size={14} style={{ color: RUST }} />
              ) : (
                <FlaskConical size={14} style={{ color: TEAL }} />
              )}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[13px] font-bold truncate" style={{ color: INK }}>
                {selectedLab.name}
              </p>
              <p className="text-[10.5px] font-mono" style={{ color: INK_MUTE }}>
                #{selectedLab.labKey}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-[13px]" style={{ color: INK_MUTE }}>
            {loading ? "Loading labs…" : "Select a lab…"}
          </span>
        )}
        <ChevronDown size={15} style={{ color: INK_MUTE }} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-20 flex flex-col"
          style={{
            background: "white",
            border: `1px solid ${LINE}`,
            borderRadius: "2px",
            boxShadow: "0 8px 24px rgba(28,35,33,0.14)",
            maxHeight: "340px",
          }}
        >
          <div className="p-2 border-b" style={{ borderColor: LINE }}>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#B8B2A2" }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or Lab ID…"
                className="w-full pl-8 pr-2 py-2 text-[12.5px] outline-none"
                style={{ border: `1px solid ${LINE}`, borderRadius: "2px", color: INK }}
              />
            </div>
          </div>
          <div className="overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-[12px]" style={{ color: INK_MUTE }}>
                No labs found.
              </p>
            ) : (
              filtered.map((lab) => (
                <button
                  key={lab._id}
                  type="button"
                  onClick={() => {
                    onSelect(lab);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left cursor-pointer transition-colors"
                  style={{ background: "transparent", border: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = GROUND)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-7 h-7 flex items-center justify-center shrink-0"
                    style={{ background: lab.type === "hospital" ? RUST_TINT : TEAL_TINT, borderRadius: "2px" }}
                  >
                    {lab.type === "hospital" ? (
                      <Building2 size={12} style={{ color: RUST }} />
                    ) : (
                      <FlaskConical size={12} style={{ color: TEAL }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold truncate" style={{ color: INK }}>
                      {lab.name}
                    </p>
                    <p className="text-[10px] font-mono" style={{ color: INK_MUTE }}>
                      #{lab.labKey}
                    </p>
                  </div>
                  <StatusStamp active={lab.isActive} />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Modal shell (shared by Add Admin / Add Staff / Permissions / Adjustment) ─── */

const ModalShell = ({ isOpen, onClose, icon: Icon, title, subtitle, children, footer, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1C2321]/45 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? "max-w-[640px]" : "max-w-[540px]"} max-h-[88vh] flex flex-col overflow-hidden border`}
        style={{ background: PAPER, borderColor: LINE, borderRadius: "3px" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: LINE, background: PAPER }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center shrink-0"
              style={{ background: TEAL, borderRadius: "2px" }}
            >
              <Icon size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold tracking-tight leading-none" style={{ color: INK }}>
                {title}
              </p>
              {subtitle && (
                <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <IconBtn icon={X} onClick={onClose} title="Close" />
        </div>

        <div className="flex-1 overflow-y-auto p-5" style={dotGround}>
          <div
            className="p-4 space-y-4"
            style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}
          >
            {children}
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-5 py-3.5 border-t"
          style={{ borderColor: LINE, background: PAPER }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
};

/* ─── Add Admin modal ─────────────────────────────────────── */

const AddAdminModal = ({ isOpen, onClose, lab, onCreated, showPopup }) => {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ name: "", phone: "" });
  }, [isOpen]);

  const handleSave = async () => {
    if (loading) return;
    if (!form.name.trim() || !form.phone.trim()) {
      showPopup("error", "Name and phone are required.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await labStaffService.createAdmin(lab._id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      showPopup(
        "success",
        data.smsSent
          ? `Admin "${data.name}" created — password-set link sent via SMS.`
          : `Admin "${data.name}" created, but the SMS failed to send. Resend the link once that's wired up.`,
      );
      await onCreated();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.message || "Failed to create admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen && !!lab}
      onClose={onClose}
      icon={ShieldCheck}
      title="Add Admin"
      subtitle={lab?.name}
      footer={
        <>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <SolidBtn onClick={handleSave} disabled={loading} loading={loading}>
            <UserPlus size={13} /> Create Admin
          </SolidBtn>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput
          label="Name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Full name"
        />
        <TextInput
          label="Phone *"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="01700000000"
          hint="BD mobile — password-set link is sent here via SMS."
        />
      </div>
    </ModalShell>
  );
};

/* ─── Add Staff modal ──────────────────────────────────────── */

const emptyStaffForm = { name: "", email: "", phone: "", maxLabAdjustment: "", permissions: {} };

const AddStaffModal = ({ isOpen, onClose, lab, catalog, onCreated, showPopup }) => {
  const [form, setForm] = useState(emptyStaffForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setForm(emptyStaffForm);
  }, [isOpen]);

  const handleSave = async () => {
    if (loading) return;
    if (!form.name.trim() || !form.phone.trim()) {
      showPopup("error", "Name and phone are required.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await labStaffService.createStaff(lab._id, {
        name: form.name.trim(),
        ...(form.email.trim() && { email: form.email.trim() }),
        phone: form.phone.trim(),
        permissions: form.permissions,
        maxLabAdjustment: form.maxLabAdjustment === "" ? 0 : Number(form.maxLabAdjustment),
      });
      showPopup(
        "success",
        data.smsSent ? "Staff created — password-set link sent via SMS." : "Staff created, but the SMS failed to send.",
      );
      await onCreated();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.error || err?.response?.data?.message || "Failed to create staff.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen && !!lab}
      onClose={onClose}
      icon={UserCog}
      title="Add Staff"
      subtitle={lab?.name}
      wide
      footer={
        <>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <SolidBtn onClick={handleSave} disabled={loading} loading={loading}>
            <UserPlus size={13} /> Create Staff
          </SolidBtn>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput
          label="Name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Full name"
        />
        <TextInput
          label="Phone *"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="01700000000"
          hint="Password-set link is sent here via SMS."
        />
        <TextInput
          label="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="optional@example.com"
        />
        <TextInput
          label="Max Lab/Bill Adjustment"
          type="number"
          min="0"
          value={form.maxLabAdjustment}
          onChange={(e) => setForm((f) => ({ ...f, maxLabAdjustment: e.target.value }))}
          placeholder="0"
          hint="0 = discount/adjustment disabled for this staff."
        />
      </div>

      <div>
        <label
          className="block text-[10px] font-semibold uppercase tracking-[0.09em] mb-1.5"
          style={{ color: INK_MUTE }}
        >
          Permissions
        </label>
        <PermissionsGrid
          catalog={catalog}
          value={form.permissions}
          onChange={(permissions) => setForm((f) => ({ ...f, permissions }))}
        />
      </div>
    </ModalShell>
  );
};

/* ─── Edit Permissions modal ───────────────────────────────── */

const EditPermissionsModal = ({ isOpen, onClose, lab, staff, catalog, onSaved, showPopup }) => {
  const [perms, setPerms] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && staff) setPerms(staff.permissions || {});
  }, [isOpen, staff]);

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await labStaffService.updatePermissions(lab._id, staff._id, perms);
      showPopup("success", "Permissions updated.");
      await onSaved();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.error || "Failed to update permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen && !!staff}
      onClose={onClose}
      icon={Pencil}
      title="Edit Permissions"
      subtitle={staff?.name}
      wide
      footer={
        <>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <SolidBtn onClick={handleSave} disabled={loading} loading={loading}>
            <Check size={13} /> Save Permissions
          </SolidBtn>
        </>
      }
    >
      <PermissionsGrid catalog={catalog} value={perms} onChange={setPerms} />
    </ModalShell>
  );
};

/* ─── Edit Adjustment modal ────────────────────────────────── */

const EditAdjustmentModal = ({ isOpen, onClose, lab, staff, onSaved, showPopup }) => {
  const [value, setValue] = useState("0");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && staff) setValue(String(staff.maxLabAdjustment ?? 0));
  }, [isOpen, staff]);

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await labStaffService.updateAdjustment(lab._id, staff._id, Number(value) || 0);
      showPopup("success", "Adjustment limit updated.");
      await onSaved();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.error || "Failed to update adjustment limit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen && !!staff}
      onClose={onClose}
      icon={SlidersHorizontal}
      title="Edit Adjustment Limit"
      subtitle={staff?.name}
      footer={
        <>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <SolidBtn onClick={handleSave} disabled={loading} loading={loading}>
            <Check size={13} /> Save
          </SolidBtn>
        </>
      }
    >
      <TextInput
        label="Max Lab/Bill Adjustment"
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        hint="0 = discount/adjustment disabled for this staff."
      />
    </ModalShell>
  );
};

/* ─── Role meta ─────────────────────────────────────────────── */

const ROLE_META = {
  admin: { label: "Admin", icon: ShieldCheck, color: TEAL, tint: TEAL_TINT },
  staff: { label: "Staff", icon: UserCog, color: VIOLET, tint: VIOLET_TINT },
  supportAdmin: { label: "Support", icon: Headset, color: AMBER, tint: AMBER_TINT },
};

/* ─── Main Page ──────────────────────────────────────────── */

const LabStaff = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState(null);

  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [catalog, setCatalog] = useState([]);

  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [permissionsTarget, setPermissionsTarget] = useState(null);
  const [adjustmentTarget, setAdjustmentTarget] = useState(null);
  const [busyId, setBusyId] = useState(null); // row-level action spinner

  const [popup, setPopup] = useState({ open: false, type: "success", message: "", onConfirm: null });
  const showPopup = (type, message, onConfirm = null) => setPopup({ open: true, type, message, onConfirm });
  const closePopup = () => setPopup((p) => ({ ...p, open: false, onConfirm: null }));

  // Labs for the picker
  useEffect(() => {
    setLabsLoading(true);
    labStaffService
      .getLabsForPicker()
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        setLabs(list);
        const labIdParam = searchParams.get("labId");
        if (labIdParam) {
          const match = list.find((l) => l._id === labIdParam);
          if (match) setSelectedLab(match);
        }
      })
      .catch(() => showPopup("error", "Failed to load labs."))
      .finally(() => setLabsLoading(false));
  }, []);

  // Permission catalog — grouped by module in PermissionsGrid
  useEffect(() => {
    labStaffService
      .getPermissions()
      .then((r) => {
        const body = r?.data ?? r; // handles both a raw axios response and an interceptor-unwrapped one
        const list = Array.isArray(body?.permissions) ? body.permissions : Array.isArray(body) ? body : [];
        // Defensive: drop any malformed entries missing key/module so the grid never renders on bad data
        setCatalog(list.filter((p) => p && typeof p.key === "string" && typeof p.module === "string"));
      })
      .catch(() => showPopup("error", "Failed to load permissions list."));
  }, []);

  // Only show permissions relevant to this lab's type (hospitalOnly hidden for non-hospitals)
  const visibleCatalog = useMemo(
    () => catalog.filter((p) => p.for === "both" || (p.for === "hospitalOnly" && selectedLab?.type === "hospital")),
    [catalog, selectedLab?.type],
  );

  const fetchStaff = async (labId) => {
    setStaffLoading(true);
    try {
      const r = await labStaffService.getAllStaff(labId);
      setStaffList(Array.isArray(r.data) ? r.data : []);
    } catch {
      showPopup("error", "Failed to load staff.");
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedLab) {
      setStaffList([]);
      return;
    }
    fetchStaff(selectedLab._id);
  }, [selectedLab?._id]);

  const handleSelectLab = (lab) => {
    setSelectedLab(lab);
    setSearchParams(lab ? { labId: lab._id } : {});
  };

  const refreshStaff = () => (selectedLab ? fetchStaff(selectedLab._id) : Promise.resolve());

  const runRowAction = async (member, action, successMsg) => {
    setBusyId(member._id);
    try {
      await action();
      showPopup("success", successMsg);
      await refreshStaff();
    } catch (err) {
      showPopup("error", err?.response?.data?.error || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = (member) => {
    const activating = !member.isActive;
    runRowAction(
      member,
      () =>
        activating
          ? labStaffService.activateStaff(selectedLab._id, member._id)
          : labStaffService.deactivateStaff(selectedLab._id, member._id),
      activating ? "Staff activated." : "Staff deactivated.",
    );
  };

  const handleDelete = (member) => {
    showPopup("error", `Permanently delete "${member.name}"? This cannot be undone.`, () => {
      closePopup();
      runRowAction(member, () => labStaffService.deleteStaff(selectedLab._id, member._id), "Staff deleted.");
    });
  };

  const handleResend = (member) => {
    runRowAction(
      member,
      () => labStaffService.resendPasswordSetup(selectedLab._id, member._id),
      "Password-set link resent.",
    );
  };

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8" style={dotGround}>
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 flex items-center justify-center shrink-0"
            style={{ background: VIOLET, borderRadius: "2px" }}
          >
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none" style={{ color: INK }}>
              Lab Staff
            </h1>
            <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
              Manage staff and admins per lab
            </p>
          </div>
        </div>

        {/* Lab picker */}
        <div className="mb-5">
          <LabPicker labs={labs} loading={labsLoading} selectedLab={selectedLab} onSelect={handleSelectLab} />
        </div>

        {!selectedLab ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center rounded-xl"
            style={{ background: PAPER, border: `2px dashed ${LINE}` }}
          >
            <div
              className="w-12 h-12 flex items-center justify-center mb-3 rounded-lg"
              style={{ border: `2px dashed ${LINE}` }}
            >
              <Users size={20} style={{ color: "#C7C1B2" }} />
            </div>
            <p className="text-[13px] font-bold mb-1" style={{ color: INK_MUTE }}>
              No lab selected
            </p>
            <p className="text-[11px] max-w-[260px]" style={{ color: INK_MUTE }}>
              Pick a lab above to view and manage its staff.
            </p>
          </div>
        ) : (
          <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "8px" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: LINE }}>
              <div>
                <p className="text-[13px] font-bold leading-none" style={{ color: INK }}>
                  {staffList.length} member{staffList.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
                  {selectedLab.name} · #{selectedLab.labKey}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <GhostBtn onClick={() => setAddStaffOpen(true)}>
                  <span className="inline-flex items-center gap-1.5">
                    <UserCog size={13} /> Add Staff
                  </span>
                </GhostBtn>
                <SolidBtn onClick={() => setAddAdminOpen(true)}>
                  <UserPlus size={13} /> Add Admin
                </SolidBtn>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-2">
              {staffLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 animate-pulse"
                    style={{ background: "white", border: `1px solid ${LINE}`, borderRadius: "2px" }}
                  >
                    <div className="w-8 h-8 shrink-0" style={{ background: "#EEEBE1", borderRadius: "2px" }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/5" style={{ background: "#EEEBE1", borderRadius: "2px" }} />
                      <div className="h-2.5 w-3/5" style={{ background: "#F2F0E8", borderRadius: "2px" }} />
                    </div>
                  </div>
                ))
              ) : staffList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="w-12 h-12 flex items-center justify-center mb-3"
                    style={{ border: `2px dashed ${LINE}`, borderRadius: "2px" }}
                  >
                    <Users size={18} style={{ color: "#C7C1B2" }} />
                  </div>
                  <p className="text-[13px] font-bold mb-1" style={{ color: INK_MUTE }}>
                    No staff yet
                  </p>
                  <p className="text-[11px] mb-5 max-w-[240px]" style={{ color: INK_MUTE }}>
                    Add an admin or staff member to get started.
                  </p>
                  <div className="flex items-center gap-2">
                    <GhostBtn onClick={() => setAddStaffOpen(true)}>
                      <span className="inline-flex items-center gap-1.5">
                        <UserCog size={14} /> Add Staff
                      </span>
                    </GhostBtn>
                    <SolidBtn onClick={() => setAddAdminOpen(true)}>
                      <UserPlus size={14} /> Add Admin
                    </SolidBtn>
                  </div>
                </div>
              ) : (
                staffList.map((member) => {
                  const meta = ROLE_META[member.role] ?? ROLE_META.staff;
                  const Icon = meta.icon;
                  const isAdmin = member.role === "admin";
                  const isBusy = busyId === member._id;
                  return (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors"
                      style={{ background: "white", border: `1px solid ${LINE}`, borderRadius: "2px" }}
                    >
                      <div
                        className="w-8 h-8 flex items-center justify-center shrink-0"
                        style={{ background: meta.tint, color: meta.color, borderRadius: "2px" }}
                      >
                        <Icon size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[12.5px] font-bold leading-none" style={{ color: INK }}>
                            {member.name}
                          </p>
                          <span
                            className="px-1.5 py-[1px] text-[9px] font-bold"
                            style={{ color: meta.color, background: meta.tint, borderRadius: "2px" }}
                          >
                            {meta.label}
                          </span>
                          {!member.isActive && <StatusStamp active={false} />}
                          {member.password == null && (
                            <span
                              className="px-1.5 py-[1px] text-[9px] font-bold"
                              style={{ color: AMBER, background: AMBER_TINT, borderRadius: "2px" }}
                            >
                              Pending Setup
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
                          {member.phone}
                          {member.email ? ` · ${member.email}` : ""}
                          {!isAdmin && typeof member.maxLabAdjustment === "number" && (
                            <span> · Adj. limit: {member.maxLabAdjustment}</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {member.password == null && (
                          <IconBtn
                            icon={Send}
                            title="Resend password-set link"
                            disabled={isBusy}
                            onClick={() => handleResend(member)}
                          />
                        )}
                        {!isAdmin && (
                          <>
                            <IconBtn
                              icon={Pencil}
                              title="Edit permissions"
                              disabled={isBusy}
                              onClick={() => setPermissionsTarget(member)}
                            />
                            <IconBtn
                              icon={SlidersHorizontal}
                              title="Edit adjustment limit"
                              disabled={isBusy}
                              onClick={() => setAdjustmentTarget(member)}
                            />
                            <IconBtn
                              icon={Power}
                              tone={member.isActive ? RUST : TEAL}
                              tint={member.isActive ? RUST_TINT : TEAL_TINT}
                              title={member.isActive ? "Deactivate" : "Activate"}
                              disabled={isBusy}
                              onClick={() => handleToggleActive(member)}
                            />
                            <IconBtn
                              icon={Trash2}
                              tone={RUST}
                              tint={RUST_TINT}
                              title="Delete"
                              disabled={isBusy}
                              onClick={() => handleDelete(member)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <AddAdminModal
        isOpen={addAdminOpen}
        onClose={() => setAddAdminOpen(false)}
        lab={selectedLab}
        onCreated={refreshStaff}
        showPopup={showPopup}
      />

      <AddStaffModal
        isOpen={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        lab={selectedLab}
        catalog={visibleCatalog}
        onCreated={refreshStaff}
        showPopup={showPopup}
      />

      <EditPermissionsModal
        isOpen={!!permissionsTarget}
        onClose={() => setPermissionsTarget(null)}
        lab={selectedLab}
        staff={permissionsTarget}
        catalog={visibleCatalog}
        onSaved={refreshStaff}
        showPopup={showPopup}
      />

      <EditAdjustmentModal
        isOpen={!!adjustmentTarget}
        onClose={() => setAdjustmentTarget(null)}
        lab={selectedLab}
        staff={adjustmentTarget}
        onSaved={refreshStaff}
        showPopup={showPopup}
      />

      {popup.open && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={closePopup}
          onConfirm={popup.onConfirm}
          confirmText="Yes, proceed"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default LabStaff;
