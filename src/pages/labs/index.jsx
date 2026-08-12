// Labs.jsx
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Phone,
  CreditCard,
  X,
  Building2,
  Layers,
  RefreshCw,
  Activity,
  Pencil,
  Power,
  PowerOff,
  Info,
  Lock,
  Zap,
  Ruler,
} from "lucide-react";

import Popup from "../../components/popup";
import labService from "../../api/labService"; // ONLY dependency — lab CRUD

const LIMIT = 20;

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
const BLUE = "#2B5F8A";

const dotGround = {
  backgroundColor: GROUND,
  backgroundImage: `radial-gradient(${LINE} 1px, transparent 1px)`,
  backgroundSize: "15px 15px",
};

const EMPTY_LAB = {
  name: "",
  labKey: "",
  type: "",
  registrationNumber: "",
  isActive: true,
  contact: {
    primary: "",
    secondary: "",
    publicEmail: "",
    privateEmail: "",
    address: "",
    district: "",
    zone: "",
    zoneId: "",
  },
  billing: { feePerInvoice: "", forceInvoiceFee: false, monthlyFee: "", commission: "" },
  limit: {
    maxStaff: "",
    maxProduct: "",
    maxService: "",
    maxMedicine: "",
    maxReferrer: "",
    maxDoctor: "",
    maxAdmissionSpace: "",
  },
  medicalReport: { padHeight: "" },
};

const LAB_TYPE_OPTIONS = [
  { value: "diagnostic", label: "Diagnostic Center", icon: FlaskConical },
  { value: "hospital", label: "Hospital", icon: Building2 },
];

// Backend contactSchema validates zoneId (24-char ObjectId pattern) and
// publicEmail/privateEmail (email format). An empty string satisfies
// neither, so any untouched optional contact field must be dropped from
// the payload entirely rather than sent as "" — otherwise Fastify's
// schema validation 400s before the request even reaches the handler.
const sanitizeContact = (contact) => {
  const out = {};
  for (const [key, value] of Object.entries(contact)) {
    if (value !== "" && value != null) out[key] = value;
  }
  return out;
};

/* ─── Portal shell ────────────────────────────────────────── */

const Sheet = ({ isOpen, onClose, children, width = "560px", zIndex = 70 }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      <div className="absolute inset-0 bg-[#1C2321]/45 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="relative w-full max-h-[88vh] flex flex-col overflow-hidden border"
        style={{ maxWidth: width, background: PAPER, borderColor: LINE, borderRadius: "3px" }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
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

const MonoInput = ({ label, hint, ...props }) => (
  <Field label={label} hint={hint}>
    <input
      className={`${inputBase} font-mono tracking-wide`}
      style={inputStyle}
      onFocus={(e) => (e.target.style.borderColor = TEAL)}
      onBlur={(e) => (e.target.style.borderColor = LINE)}
      {...props}
    />
  </Field>
);

const SelectInput = ({ label, hint, children, ...props }) => (
  <Field label={label} hint={hint}>
    <select className={inputBase} style={inputStyle} {...props}>
      {children}
    </select>
  </Field>
);

const StampToggle = ({ active, onChange, onLabel = "Active", offLabel = "Inactive" }) => (
  <button
    type="button"
    onClick={() => onChange(!active)}
    className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
  >
    <span
      className="w-[18px] h-[18px] flex items-center justify-center shrink-0 transition-colors"
      style={{
        border: `1.5px solid ${active ? TEAL : LINE}`,
        borderRadius: "2px",
        background: active ? TEAL : "white",
      }}
    >
      {active && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    <span className="text-[12px] font-semibold" style={{ color: active ? TEAL_DARK : INK_MUTE }}>
      {active ? onLabel : offLabel}
    </span>
  </button>
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
    className="px-3.5 py-2 text-[11.5px] font-semibold bg-white transition-colors"
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
    className="w-7 h-7 flex items-center justify-center transition-colors"
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

/* ─── Lab type flag ──────────────────────────────────────── */

const LAB_TYPE_META = {
  diagnostic: { label: "Diagnostic", short: "Dx", icon: FlaskConical, color: TEAL, tint: TEAL_TINT },
  hospital: { label: "Hospital", short: "Hosp", icon: Building2, color: RUST, tint: RUST_TINT },
};

const TypeFlag = ({ type, compact }) => {
  const meta = LAB_TYPE_META[type];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide"
      style={{ color: meta.color, background: meta.tint, borderRadius: "2px" }}
    >
      <Icon size={9} />
      {compact ? meta.short : meta.label}
    </span>
  );
};

/* ─── Ledger row-pair ─────────────────────────────────────── */

const Leader = ({ label, value }) =>
  value ? (
    <div className="flex items-baseline gap-2 py-1">
      <span className="text-[10.5px] uppercase tracking-wide shrink-0" style={{ color: INK_MUTE }}>
        {label}
      </span>
      <span className="flex-1 border-b border-dotted translate-y-[-3px]" style={{ borderColor: "#C7C1B2" }} />
      <span className="text-[12.5px] font-medium text-right" style={{ color: INK }}>
        {value}
      </span>
    </div>
  ) : null;

/* ─── Single-section edit modal shell ────────────────────── */

const SectionModal = ({ isOpen, onClose, title, icon: Icon, tone, children, onSave, loading }) => (
  <Sheet isOpen={isOpen} onClose={onClose} width="440px">
    <div
      className="flex items-center justify-between px-5 py-4 border-b"
      style={{ borderColor: LINE, background: PAPER }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ background: tone, borderRadius: "2px" }}
        >
          <Icon size={15} className="text-white" />
        </div>
        <p className="text-[13.5px] font-bold tracking-tight" style={{ color: INK }}>
          {title}
        </p>
      </div>
      <IconBtn icon={X} onClick={onClose} title="Close" />
    </div>
    <div className="flex-1 overflow-y-auto p-5" style={dotGround}>
      <div className="p-4 space-y-4" style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}>
        {children}
      </div>
    </div>
    <div
      className="flex items-center justify-end gap-2 px-5 py-3.5 border-t"
      style={{ borderColor: LINE, background: PAPER }}
    >
      <GhostBtn onClick={onClose}>Cancel</GhostBtn>
      <SolidBtn onClick={onSave} disabled={loading} loading={loading}>
        Save Changes
      </SolidBtn>
    </div>
  </Sheet>
);

/* ─── Section 1: Lab Details modal ───────────────────────── */

const LabDetailsModal = ({ isOpen, onClose, lab, onSaved, showPopup }) => {
  const [form, setForm] = useState({ name: "", type: "", registrationNumber: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lab) {
      setForm({
        name: lab.name ?? "",
        type: lab.type ?? "",
        registrationNumber: lab.registrationNumber ?? "",
      });
    }
  }, [isOpen, lab]);

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await labService.updateLabDetails(lab._id, {
        name: form.name,
        type: form.type || undefined,
        registrationNumber: form.registrationNumber || undefined,
      });
      showPopup("success", "Lab details updated.");
      await onSaved();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.message || "Failed to update lab details.");
    } finally {
      setLoading(false);
    }
  };

  if (!lab) return null;

  return (
    <SectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Lab Details"
      icon={Building2}
      tone={TEAL}
      onSave={handleSave}
      loading={loading}
    >
      <TextInput
        label="Lab Name *"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="City Diagnostic"
      />

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.09em] mb-2" style={{ color: INK_MUTE }}>
          Lab Type <span className="normal-case font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LAB_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const isSelected = form.type === value;
            const c = value === "hospital" ? RUST : TEAL;
            const tint = value === "hospital" ? RUST_TINT : TEAL_TINT;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: f.type === value ? "" : value }))}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold transition-colors cursor-pointer"
                style={{
                  border: `1px solid ${isSelected ? c : LINE}`,
                  borderRadius: "2px",
                  background: isSelected ? tint : "white",
                  color: isSelected ? c : INK_MUTE,
                }}
              >
                <Icon size={13} style={{ color: isSelected ? c : "#B8B2A2" }} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <TextInput
        label="Registration Number"
        value={form.registrationNumber}
        onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
        placeholder="Optional — e.g. DGDA-2024-00123"
      />
    </SectionModal>
  );
};

/* ─── Section 2: Contact modal ────────────────────────────── */

const LabContactModal = ({ isOpen, onClose, lab, onSaved, showPopup }) => {
  const [form, setForm] = useState(EMPTY_LAB.contact);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !lab) return;
    setForm({
      primary: lab.contact?.primary ?? "",
      secondary: lab.contact?.secondary ?? "",
      publicEmail: lab.contact?.publicEmail ?? "",
      privateEmail: lab.contact?.privateEmail ?? "",
      address: lab.contact?.address ?? "",
      district: lab.contact?.district ?? "",
      zone: lab.contact?.zone ?? "",
      zoneId: lab.contact?.zoneId ?? "",
    });
  }, [isOpen, lab]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Strip empty optional fields — the backend rejects "" for
      // zoneId (ObjectId pattern) and publicEmail/privateEmail (email format).
      await labService.updateLabContact(lab._id, sanitizeContact(form));
      showPopup("success", "Contact info updated.");
      await onSaved();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.message || "Failed to update contact.");
    } finally {
      setLoading(false);
    }
  };

  if (!lab) return null;

  return (
    <SectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Contact"
      icon={Phone}
      tone={VIOLET}
      onSave={handleSave}
      loading={loading}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput label="Primary Phone" value={form.primary} onChange={set("primary")} placeholder="01700000000" />
        <TextInput
          label="Secondary Phone"
          value={form.secondary}
          onChange={set("secondary")}
          placeholder="01800000000"
        />
        <TextInput
          label="Public Email"
          type="email"
          value={form.publicEmail}
          onChange={set("publicEmail")}
          placeholder="lab@example.com"
        />
        <TextInput
          label="Private Email"
          type="email"
          value={form.privateEmail}
          onChange={set("privateEmail")}
          placeholder="private@example.com"
        />
        <TextInput label="District" value={form.district} onChange={set("district")} placeholder="Dhaka" />
        <TextInput label="Zone" value={form.zone} onChange={set("zone")} placeholder="Zone name" />
      </div>
      <TextInput label="Address" value={form.address} onChange={set("address")} placeholder="Full address" />
    </SectionModal>
  );
};

/* ─── Section 3: Billing modal ────────────────────────────── */

const LabBillingModal = ({ isOpen, onClose, lab, onSaved, showPopup }) => {
  const [form, setForm] = useState(EMPTY_LAB.billing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lab) {
      setForm({
        feePerInvoice: lab.billing?.feePerInvoice ?? "",
        forceInvoiceFee: lab.billing?.forceInvoiceFee ?? false,
        monthlyFee: lab.billing?.monthlyFee ?? "",
        commission: lab.billing?.commission ?? "",
      });
    }
  }, [isOpen, lab]);

  const setB = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await labService.updateLabBilling(lab._id, {
        feePerInvoice: Number(form.feePerInvoice) || 0,
        forceInvoiceFee: !!form.forceInvoiceFee,
        monthlyFee: Number(form.monthlyFee) || 0,
        commission: Number(form.commission) || 0,
      });
      showPopup("success", "Billing updated.");
      await onSaved();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.message || "Failed to update billing.");
    } finally {
      setLoading(false);
    }
  };

  if (!lab) return null;

  return (
    <SectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Billing"
      icon={CreditCard}
      tone={AMBER}
      onSave={handleSave}
      loading={loading}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MonoInput
          label="Fee / Invoice (৳)"
          type="number"
          value={form.feePerInvoice}
          onChange={setB("feePerInvoice")}
          placeholder="0"
        />
        <MonoInput
          label="Monthly Fee (৳)"
          type="number"
          value={form.monthlyFee}
          onChange={setB("monthlyFee")}
          placeholder="0"
        />
        <MonoInput
          label="Commission (৳)"
          type="number"
          value={form.commission}
          onChange={setB("commission")}
          placeholder="0"
        />
      </div>

      <div
        className="flex items-center justify-between px-3.5 py-3"
        style={{
          border: `1px solid ${form.forceInvoiceFee ? AMBER : LINE}`,
          borderRadius: "2px",
          background: form.forceInvoiceFee ? AMBER_TINT : GROUND,
        }}
      >
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: form.forceInvoiceFee ? AMBER : INK_MUTE }} />
          <div>
            <p className="text-[12.5px] font-semibold leading-none" style={{ color: INK }}>
              Force Invoice Fee
            </p>
            <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
              When on, the invoice fee is always charged for this lab
            </p>
          </div>
        </div>
        <StampToggle
          active={form.forceInvoiceFee}
          onChange={(v) => setForm((f) => ({ ...f, forceInvoiceFee: v }))}
          onLabel="On"
          offLabel="Off"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Fee / invoice", `৳${form.feePerInvoice || 0}`, TEAL],
          ["Monthly", `৳${form.monthlyFee || 0}`, VIOLET],
          ["Commission", `৳${form.commission || 0}`, AMBER],
        ].map(([l, v, c]) => (
          <div key={l} className="text-center py-3" style={{ border: `1px solid ${LINE}`, borderRadius: "2px" }}>
            <p className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: INK_MUTE }}>
              {l}
            </p>
            <p className="text-[15px] font-bold font-mono mt-1" style={{ color: c }}>
              {v}
            </p>
          </div>
        ))}
      </div>
    </SectionModal>
  );
};

/* ─── Section 4: Limit modal ──────────────────────────────── */

const LabLimitModal = ({ isOpen, onClose, lab, onSaved, showPopup }) => {
  const [form, setForm] = useState(EMPTY_LAB.limit);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lab) {
      setForm({
        maxStaff: lab.limit?.maxStaff ?? "",
        maxProduct: lab.limit?.maxProduct ?? "",
        maxService: lab.limit?.maxService ?? "",
        maxMedicine: lab.limit?.maxMedicine ?? "",
        maxReferrer: lab.limit?.maxReferrer ?? "",
        maxDoctor: lab.limit?.maxDoctor ?? "",
        maxAdmissionSpace: lab.limit?.maxAdmissionSpace ?? "",
      });
    }
  }, [isOpen, lab]);

  const setL = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await labService.updateLabLimit(lab._id, {
        maxStaff: Number(form.maxStaff) || 0,
        maxProduct: Number(form.maxProduct) || 0,
        maxService: Number(form.maxService) || 0,
        maxMedicine: Number(form.maxMedicine) || 0,
        maxReferrer: Number(form.maxReferrer) || 0,
        maxDoctor: Number(form.maxDoctor) || 0,
        maxAdmissionSpace: Number(form.maxAdmissionSpace) || 0,
      });
      showPopup("success", "Lab limits updated.");
      await onSaved();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.message || "Failed to update limits.");
    } finally {
      setLoading(false);
    }
  };

  if (!lab) return null;

  return (
    <SectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Limits"
      icon={Layers}
      tone={BLUE}
      onSave={handleSave}
      loading={loading}
    >
      <div className="grid grid-cols-3 gap-3">
        <MonoInput label="Max Staff" type="number" value={form.maxStaff} onChange={setL("maxStaff")} placeholder="0" />
        <MonoInput
          label="Max Doctor"
          type="number"
          value={form.maxDoctor}
          onChange={setL("maxDoctor")}
          placeholder="0"
        />
        <MonoInput
          label="Max Product"
          type="number"
          value={form.maxProduct}
          onChange={setL("maxProduct")}
          placeholder="0"
        />
        <MonoInput
          label="Max Service"
          type="number"
          value={form.maxService}
          onChange={setL("maxService")}
          placeholder="0"
        />
        <MonoInput
          label="Max Medicine"
          type="number"
          value={form.maxMedicine}
          onChange={setL("maxMedicine")}
          placeholder="0"
        />
        <MonoInput
          label="Max Referrer"
          type="number"
          value={form.maxReferrer}
          onChange={setL("maxReferrer")}
          placeholder="0"
        />
        <MonoInput
          label="Max Admission Space"
          type="number"
          value={form.maxAdmissionSpace}
          onChange={setL("maxAdmissionSpace")}
          placeholder="0"
        />
      </div>
    </SectionModal>
  );
};

/* ─── Section 5: Medical Report modal ─────────────────────── */

const LabMedicalReportModal = ({ isOpen, onClose, lab, onSaved, showPopup }) => {
  const [form, setForm] = useState({ padHeight: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lab) {
      setForm({ padHeight: lab.medicalReport?.padHeight ?? "" });
    }
  }, [isOpen, lab]);

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await labService.updateLabMedicalReport(lab._id, {
        padHeight: Number(form.padHeight) || 0,
      });
      showPopup("success", "Medical report settings updated.");
      await onSaved();
      onClose();
    } catch (err) {
      showPopup("error", err?.response?.data?.message || "Failed to update medical report settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!lab) return null;

  return (
    <SectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Medical Report"
      icon={Ruler}
      tone={VIOLET}
      onSave={handleSave}
      loading={loading}
    >
      <MonoInput
        label="Pad Height (mm)"
        type="number"
        value={form.padHeight}
        onChange={(e) => setForm((f) => ({ ...f, padHeight: e.target.value }))}
        placeholder="0"
        hint="Top offset used when printing this lab's medical report letterhead."
      />
    </SectionModal>
  );
};

/* ─── Lab View Sheet — with per-section edit pencils ─────── */

const LabViewSheet = ({ isOpen, onClose, lab, onToggleActive }) => {
  if (!lab) return null;

  const SectionHead = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-1.5 mt-4 first:mt-0">
      <Icon size={11} style={{ color: TEAL }} />
      <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: TEAL_DARK }}>
        {title}
      </p>
    </div>
  );

  return (
    <Sheet isOpen={isOpen} onClose={onClose} width="480px">
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: LINE, background: PAPER }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center shrink-0"
            style={{ background: lab.type === "hospital" ? RUST_TINT : TEAL_TINT, borderRadius: "2px" }}
          >
            {lab.type === "hospital" ? (
              <Building2 size={16} style={{ color: RUST }} />
            ) : (
              <FlaskConical size={16} style={{ color: TEAL }} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13.5px] font-bold tracking-tight leading-none" style={{ color: INK }}>
                {lab.name}
              </p>
              <TypeFlag type={lab.type} />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="font-mono text-[10.5px] px-1.5 py-[1px]"
                style={{ background: "#F1EFE7", color: INK_MUTE, borderRadius: "2px" }}
              >
                #{lab.labKey}
              </span>
              <StatusStamp active={lab.isActive} />
            </div>
          </div>
        </div>
        <IconBtn icon={X} onClick={onClose} title="Close" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4" style={dotGround}>
        <div className="p-4 space-y-0" style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}>
          <SectionHead icon={Building2} title="Lab Details" />
          <Leader label="Name" value={lab.name} />
          <Leader label="Lab ID" value={lab.labKey} />
          <Leader label="Type" value={LAB_TYPE_META[lab.type]?.label} />
          <Leader label="Registration No." value={lab.registrationNumber} />

          <SectionHead icon={Phone} title="Contact" />
          <Leader label="Primary" value={lab.contact?.primary} />
          <Leader label="Secondary" value={lab.contact?.secondary} />
          <Leader label="Public email" value={lab.contact?.publicEmail} />
          <Leader label="Private email" value={lab.contact?.privateEmail} />
          <Leader label="District" value={lab.contact?.district} />
          <Leader label="Zone" value={lab.contact?.zone} />
          <Leader label="Address" value={lab.contact?.address} />

          <SectionHead icon={CreditCard} title="Billing" />
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[
              ["Fee / invoice", `৳${lab.billing?.feePerInvoice ?? 0}`, TEAL],
              ["Monthly fee", `৳${lab.billing?.monthlyFee ?? 0}`, VIOLET],
              ["Commission", `৳${lab.billing?.commission ?? 0}`, AMBER],
            ].map(([l, v, c]) => (
              <div key={l} className="text-center py-3" style={{ border: `1px solid ${LINE}`, borderRadius: "2px" }}>
                <p className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: INK_MUTE }}>
                  {l}
                </p>
                <p className="text-[15px] font-bold font-mono mt-1" style={{ color: c }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
          {lab.billing?.forceInvoiceFee && (
            <p
              className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 text-[11px] font-semibold"
              style={{ background: AMBER_TINT, color: AMBER, borderRadius: "2px" }}
            >
              <Zap size={11} /> Invoice fee is forced on for this lab
            </p>
          )}

          <SectionHead icon={Layers} title="Limits" />
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mt-1">
            {[
              ["Staff", lab.limit?.maxStaff ?? 0, TEAL],
              ["Doctor", lab.limit?.maxDoctor ?? 0, BLUE],
              ["Product", lab.limit?.maxProduct ?? 0, VIOLET],
              ["Service", lab.limit?.maxService ?? 0, AMBER],
              ["Medicine", lab.limit?.maxMedicine ?? 0, BLUE],
              ["Referrer", lab.limit?.maxReferrer ?? 0, RUST],
              ["Admission", lab.limit?.maxAdmissionSpace ?? 0, VIOLET],
            ].map(([l, v, c]) => (
              <div key={l} className="text-center py-3" style={{ border: `1px solid ${LINE}`, borderRadius: "2px" }}>
                <p className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: INK_MUTE }}>
                  {l}
                </p>
                <p className="text-[15px] font-bold font-mono mt-1" style={{ color: c }}>
                  {v}
                </p>
              </div>
            ))}
          </div>

          <SectionHead icon={Ruler} title="Medical Report" />
          <Leader label="Pad Height" value={lab.medicalReport?.padHeight ? `${lab.medicalReport.padHeight}mm` : null} />
        </div>
      </div>

      <div
        className="flex items-center justify-between px-5 py-3 border-t"
        style={{ borderColor: LINE, background: PAPER }}
      >
        {lab.isActive ? (
          <SolidBtn tone={RUST} toneDark="#8F3521" onClick={() => onToggleActive(lab)}>
            <PowerOff size={13} /> Deactivate Lab
          </SolidBtn>
        ) : (
          <SolidBtn tone={TEAL} toneDark={TEAL_DARK} onClick={() => onToggleActive(lab)}>
            <Power size={13} /> Activate Lab
          </SolidBtn>
        )}
        <GhostBtn onClick={onClose}>Close</GhostBtn>
      </div>
    </Sheet>
  );
};

/* ─── Lab Create Modal (create only, section tabs) ───────── */

const LAB_TABS = [
  { id: "details", label: "Details", icon: Building2 },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "limit", label: "Limits", icon: Layers },
  { id: "medicalReport", label: "Report", icon: Ruler },
];

const LabCreateModal = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState(EMPTY_LAB);
  const [tab, setTab] = useState("details");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTab("details");
    setForm(EMPTY_LAB);
  }, [isOpen]);

  const setC = (k) => (e) => setForm((f) => ({ ...f, contact: { ...f.contact, [k]: e.target.value } }));
  const setB = (k) => (e) => setForm((f) => ({ ...f, billing: { ...f.billing, [k]: e.target.value } }));
  const setLm = (k) => (e) => setForm((f) => ({ ...f, limit: { ...f.limit, [k]: e.target.value } }));
  const setMR = (k) => (e) => setForm((f) => ({ ...f, medicalReport: { ...f.medicalReport, [k]: e.target.value } }));

  const tabIdx = LAB_TABS.findIndex((t) => t.id === tab);
  const isLast = tabIdx === LAB_TABS.length - 1;

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} width="560px">
      <div className="border-b" style={{ borderColor: LINE, background: PAPER }}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center shrink-0"
              style={{ background: TEAL, borderRadius: "2px" }}
            >
              <FlaskConical size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[13.5px] font-bold tracking-tight leading-none" style={{ color: INK }}>
                Register Lab
              </p>
              <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
                Section {tabIdx + 1} of {LAB_TABS.length}
              </p>
            </div>
          </div>
          <IconBtn icon={X} onClick={onClose} title="Close" />
        </div>

        <div className="flex gap-1.5 px-5 pb-3">
          {LAB_TABS.map(({ id, label, icon: Icon }, i) => {
            const isActive = tab === id;
            const isDone = i < tabIdx;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[11.5px] font-bold border-none cursor-pointer transition-colors"
                style={{
                  borderRadius: "2px",
                  background: isActive ? TEAL_TINT : isDone ? "#EEF6F1" : "#F1EFE7",
                  color: isActive ? TEAL_DARK : isDone ? TEAL : INK_MUTE,
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={dotGround}>
        {/* DETAILS */}
        <div className={`${tab === "details" ? "flex" : "hidden"} flex-col gap-4 p-5`}>
          <div
            className="p-4 space-y-4"
            style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Lab Name *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="City Diagnostic"
              />
              <MonoInput
                label="Lab ID (5 digits) *"
                value={form.labKey}
                onChange={(e) => setForm((f) => ({ ...f, labKey: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                placeholder="12345"
                maxLength={5}
              />
            </div>

            <div>
              <label
                className="block text-[10px] font-semibold uppercase tracking-[0.09em] mb-2"
                style={{ color: INK_MUTE }}
              >
                Lab Type <span className="normal-case font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LAB_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const isSelected = form.type === value;
                  const c = value === "hospital" ? RUST : TEAL;
                  const tint = value === "hospital" ? RUST_TINT : TEAL_TINT;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: f.type === value ? "" : value }))}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold transition-colors cursor-pointer"
                      style={{
                        border: `1px solid ${isSelected ? c : LINE}`,
                        borderRadius: "2px",
                        background: isSelected ? tint : "white",
                        color: isSelected ? c : INK_MUTE,
                      }}
                    >
                      <Icon size={13} style={{ color: isSelected ? c : "#B8B2A2" }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <TextInput
              label="Registration Number"
              value={form.registrationNumber}
              onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
              placeholder="Optional — e.g. DGDA-2024-00123"
            />

            <div
              className="flex items-center justify-between px-3.5 py-3"
              style={{ border: `1px solid ${LINE}`, borderRadius: "2px", background: GROUND }}
            >
              <div>
                <p className="text-[12.5px] font-semibold leading-none" style={{ color: INK }}>
                  Lab Status
                </p>
                <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
                  Toggle to activate or deactivate this lab
                </p>
              </div>
              <StampToggle active={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>
          </div>
        </div>

        {/* CONTACT */}
        <div className={`${tab === "contact" ? "flex" : "hidden"} flex-col gap-3 p-5`}>
          <div
            className="p-4 space-y-3"
            style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Primary Phone"
                value={form.contact.primary}
                onChange={setC("primary")}
                placeholder="01700000000"
              />
              <TextInput
                label="Secondary Phone"
                value={form.contact.secondary}
                onChange={setC("secondary")}
                placeholder="01800000000"
              />
              <TextInput
                label="Public Email"
                type="email"
                value={form.contact.publicEmail}
                onChange={setC("publicEmail")}
                placeholder="lab@example.com"
              />
              <TextInput
                label="Private Email"
                type="email"
                value={form.contact.privateEmail}
                onChange={setC("privateEmail")}
                placeholder="private@example.com"
              />
              <TextInput
                label="District"
                value={form.contact.district}
                onChange={setC("district")}
                placeholder="Dhaka"
              />
              <TextInput label="Zone" value={form.contact.zone} onChange={setC("zone")} placeholder="Zone name" />
            </div>
            <TextInput
              label="Address"
              value={form.contact.address}
              onChange={setC("address")}
              placeholder="Full address"
            />
          </div>
        </div>

        {/* BILLING */}
        <div className={`${tab === "billing" ? "flex" : "hidden"} flex-col gap-4 p-5`}>
          <div
            className="p-4 space-y-4"
            style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MonoInput
                label="Fee / Invoice (৳)"
                type="number"
                value={form.billing.feePerInvoice}
                onChange={setB("feePerInvoice")}
                placeholder="0"
              />
              <MonoInput
                label="Monthly Fee (৳)"
                type="number"
                value={form.billing.monthlyFee}
                onChange={setB("monthlyFee")}
                placeholder="0"
              />
              <MonoInput
                label="Commission (৳)"
                type="number"
                value={form.billing.commission}
                onChange={setB("commission")}
                placeholder="0"
              />
            </div>

            <div
              className="flex items-center justify-between px-3.5 py-3"
              style={{
                border: `1px solid ${form.billing.forceInvoiceFee ? AMBER : LINE}`,
                borderRadius: "2px",
                background: form.billing.forceInvoiceFee ? AMBER_TINT : GROUND,
              }}
            >
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: form.billing.forceInvoiceFee ? AMBER : INK_MUTE }} />
                <div>
                  <p className="text-[12.5px] font-semibold leading-none" style={{ color: INK }}>
                    Force Invoice Fee
                  </p>
                  <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
                    When on, the invoice fee is always charged for this lab
                  </p>
                </div>
              </div>
              <StampToggle
                active={form.billing.forceInvoiceFee}
                onChange={(v) => setForm((f) => ({ ...f, billing: { ...f.billing, forceInvoiceFee: v } }))}
                onLabel="On"
                offLabel="Off"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ["Fee / invoice", `৳${form.billing.feePerInvoice || 0}`, TEAL],
                ["Monthly", `৳${form.billing.monthlyFee || 0}`, VIOLET],
                ["Commission", `৳${form.billing.commission || 0}`, AMBER],
              ].map(([l, v, c]) => (
                <div key={l} className="text-center py-3" style={{ border: `1px solid ${LINE}`, borderRadius: "2px" }}>
                  <p className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: INK_MUTE }}>
                    {l}
                  </p>
                  <p className="text-[15px] font-bold font-mono mt-1" style={{ color: c }}>
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LIMITS */}
        <div className={`${tab === "limit" ? "flex" : "hidden"} flex-col gap-4 p-5`}>
          <div
            className="p-4 space-y-4"
            style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}
          >
            <div className="grid grid-cols-3 gap-3">
              <MonoInput
                label="Max Staff"
                type="number"
                value={form.limit.maxStaff}
                onChange={setLm("maxStaff")}
                placeholder="0"
              />
              <MonoInput
                label="Max Doctor"
                type="number"
                value={form.limit.maxDoctor}
                onChange={setLm("maxDoctor")}
                placeholder="0"
              />
              <MonoInput
                label="Max Product"
                type="number"
                value={form.limit.maxProduct}
                onChange={setLm("maxProduct")}
                placeholder="0"
              />
              <MonoInput
                label="Max Service"
                type="number"
                value={form.limit.maxService}
                onChange={setLm("maxService")}
                placeholder="0"
              />
              <MonoInput
                label="Max Medicine"
                type="number"
                value={form.limit.maxMedicine}
                onChange={setLm("maxMedicine")}
                placeholder="0"
              />
              <MonoInput
                label="Max Referrer"
                type="number"
                value={form.limit.maxReferrer}
                onChange={setLm("maxReferrer")}
                placeholder="0"
              />
              <MonoInput
                label="Max Admission Space"
                type="number"
                value={form.limit.maxAdmissionSpace}
                onChange={setLm("maxAdmissionSpace")}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* MEDICAL REPORT */}
        <div className={`${tab === "medicalReport" ? "flex" : "hidden"} flex-col gap-4 p-5`}>
          <div
            className="p-4 space-y-4"
            style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}
          >
            <MonoInput
              label="Pad Height (mm)"
              type="number"
              value={form.medicalReport.padHeight}
              onChange={setMR("padHeight")}
              placeholder="0"
              hint="Top offset used when printing this lab's medical report letterhead."
            />
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between px-5 py-3.5 border-t"
        style={{ borderColor: LINE, background: PAPER }}
      >
        <button
          type="button"
          onClick={() => tabIdx > 0 && setTab(LAB_TABS[tabIdx - 1].id)}
          className={`flex items-center gap-1.5 text-[11.5px] font-semibold bg-transparent border-none cursor-pointer ${tabIdx === 0 ? "invisible" : ""}`}
          style={{ color: INK_MUTE }}
        >
          <ChevronLeft size={14} /> Back
        </button>

        <div className="flex gap-2">
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          {isLast ? (
            <SolidBtn onClick={handleSubmit} disabled={loading} loading={loading}>
              Register Lab
            </SolidBtn>
          ) : (
            <SolidBtn onClick={() => setTab(LAB_TABS[tabIdx + 1].id)}>
              Next <ChevronRight size={14} />
            </SolidBtn>
          )}
        </div>
      </div>
    </Sheet>
  );
};

/* ─── Stat tally card ────────────────────────────────────── */

const StatCard = ({ icon: Icon, label, value, tone = TEAL, tint = TEAL_TINT }) => (
  <div
    className="flex items-center gap-3 px-4 py-3.5"
    style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: "2px" }}
  >
    <div
      className="w-9 h-9 flex items-center justify-center shrink-0"
      style={{ background: tint, color: tone, borderRadius: "2px" }}
    >
      <Icon size={16} />
    </div>
    <div>
      <p className="text-lg font-bold font-mono leading-none" style={{ color: INK }}>
        {value}
      </p>
      <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
        {label}
      </p>
    </div>
  </div>
);

/* ─── Compact edit dropdown (avoids the action row overflowing) ──── */

const EditMenu = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const items = [
    { key: "details", label: "Details", icon: Building2, color: TEAL_DARK },
    { key: "contact", label: "Contact", icon: Phone, color: VIOLET },
    { key: "billing", label: "Billing", icon: CreditCard, color: AMBER },
    { key: "limit", label: "Limits", icon: Layers, color: BLUE },
    { key: "medicalReport", label: "Report", icon: Ruler, color: VIOLET },
  ];

  return (
    <div className="relative shrink-0" ref={ref}>
      <IconBtn icon={Pencil} title="Edit lab" onClick={() => setOpen((o) => !o)} />
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-20 py-1 w-36"
          style={{
            background: "white",
            border: `1px solid ${LINE}`,
            borderRadius: "2px",
            boxShadow: "0 4px 14px rgba(28,35,33,0.12)",
          }}
        >
          {items.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onSelect(key);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[11.5px] font-semibold cursor-pointer transition-colors"
              style={{ color: INK, background: "transparent", border: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = GROUND)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon size={12} style={{ color }} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Lab card — modern, clean ────────────────────────────── */

const LabCard = ({ lab, onView, onEditSection, onToggleActive }) => (
  <div
    className="group flex flex-col rounded-xl bg-white transition-all duration-150"
    style={{
      border: `1px solid ${LINE}`,
      opacity: lab.isActive ? 1 : 0.65,
      boxShadow: "0 1px 2px rgba(28,35,33,0.04)",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(28,35,33,0.08)")}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(28,35,33,0.04)")}
  >
    {/* Header */}
    <div className="flex items-start gap-3 px-4 pt-4 pb-3">
      <div
        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
        style={{ background: lab.type === "hospital" ? RUST_TINT : TEAL_TINT }}
      >
        {lab.type === "hospital" ? (
          <Building2 size={17} style={{ color: RUST }} />
        ) : (
          <FlaskConical size={17} style={{ color: TEAL }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold leading-snug truncate" style={{ color: INK }}>
          {lab.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="font-mono text-[10.5px]" style={{ color: INK_MUTE }}>
            #{lab.labKey}
          </span>
          <span style={{ color: "#D8D3C6" }}>·</span>
          <TypeFlag type={lab.type} compact />
        </div>
      </div>

      <StatusStamp active={lab.isActive} />
    </div>

    {/* Meta strip */}
    {(lab.contact?.primary || lab.registrationNumber) && (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 -mt-1">
        {lab.contact?.primary && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: INK_MUTE }}>
            <Phone size={10} /> {lab.contact.primary}
          </span>
        )}
        {lab.registrationNumber && (
          <span className="flex items-center gap-1 font-mono text-[11px]" style={{ color: INK_MUTE }}>
            <Lock size={10} /> {lab.registrationNumber}
          </span>
        )}
        {lab.billing?.forceInvoiceFee && (
          <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: AMBER }}>
            <Zap size={10} /> Forced fee
          </span>
        )}
      </div>
    )}

    {/* Billing stats */}
    <div className="grid grid-cols-3 gap-2 px-4 pb-4">
      {[
        [`৳${lab.billing?.feePerInvoice ?? 0}`, "Invoice"],
        [`৳${lab.billing?.monthlyFee ?? 0}`, "Monthly"],
        [`৳${lab.billing?.commission ?? 0}`, "Comm."],
      ].map(([v, l]) => (
        <div key={l} className="rounded-lg py-2 text-center" style={{ background: GROUND }}>
          <p className="text-[12px] font-bold font-mono leading-none" style={{ color: TEAL_DARK }}>
            {v}
          </p>
          <p className="text-[9px] uppercase tracking-wide mt-1" style={{ color: INK_MUTE }}>
            {l}
          </p>
        </div>
      ))}
    </div>

    {/* Divider */}
    <div style={{ borderTop: `1px solid ${LINE}` }} />

    {/* Actions */}
    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
      <EditMenu onSelect={(section) => onEditSection(lab, section)} />

      <div className="flex items-center gap-1 shrink-0">
        <IconBtn icon={Info} tone={VIOLET} tint={VIOLET_TINT} title="View lab" onClick={() => onView(lab)} />
        {lab.isActive ? (
          <IconBtn
            icon={PowerOff}
            tone={RUST}
            tint={RUST_TINT}
            title="Deactivate lab"
            onClick={() => onToggleActive(lab)}
          />
        ) : (
          <IconBtn icon={Power} tone={TEAL} tint={TEAL_TINT} title="Activate lab" onClick={() => onToggleActive(lab)} />
        )}
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="flex flex-col rounded-xl bg-white animate-pulse" style={{ border: `1px solid ${LINE}` }}>
    <div className="flex items-start gap-3 px-4 pt-4 pb-3">
      <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: "#EEEBE1" }} />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-3/5 rounded" style={{ background: "#EEEBE1" }} />
        <div className="h-2.5 w-2/5 rounded" style={{ background: "#F2F0E8" }} />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 px-4 pb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-11 rounded-lg" style={{ background: GROUND }} />
      ))}
    </div>
    <div style={{ borderTop: `1px solid ${LINE}` }} />
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="h-6 w-28 rounded" style={{ background: "#F2F0E8" }} />
      <div className="flex gap-1">
        <div className="w-7 h-7 rounded" style={{ background: "#EEEBE1" }} />
        <div className="w-7 h-7 rounded" style={{ background: "#EEEBE1" }} />
      </div>
    </div>
  </div>
);

/* ─── Pagination ──────────────────────────────────────────── */

const Pagination = ({ page, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);
  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: LINE }}>
      <p className="text-[11.5px]" style={{ color: INK_MUTE }}>
        Showing{" "}
        <strong style={{ color: INK }}>
          {from}–{to}
        </strong>{" "}
        of <strong style={{ color: INK }}>{total}</strong> labs
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ border: `1px solid ${LINE}`, background: "white", color: INK_MUTE, borderRadius: "2px" }}
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="w-8 h-8 text-[11.5px] font-bold font-mono transition-colors"
            style={
              p === page
                ? { background: TEAL, color: "white", border: "none", borderRadius: "2px" }
                : { border: `1px solid ${LINE}`, background: "white", color: INK_MUTE, borderRadius: "2px" }
            }
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ border: `1px solid ${LINE}`, background: "white", color: INK_MUTE, borderRadius: "2px" }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────── */

const Labs = () => {
  const [labs, setLabs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewLab, setViewLab] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // { lab, section: "details"|"contact"|"billing"|"limit"|"medicalReport" }
  const [popup, setPopup] = useState({ open: false, type: "success", message: "", onConfirm: null });
  const debounceRef = useRef(null);

  const showPopup = (type, message, onConfirm = null) => setPopup({ open: true, type, message, onConfirm });
  const closePopup = () => setPopup((p) => ({ ...p, open: false, onConfirm: null }));

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const r = await labService.getStats();
      setStats(r.data);
    } catch {
      // stats are supplementary — the list still loads without them
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLabs = async (p, q, opts = {}) => {
    opts.isSearch ? setSearchLoading(true) : setLoading(true);
    try {
      const res = await labService.getLabs({ page: p, limit: LIMIT, labKey: q.trim() });
      const d = res.data;
      setLabs(Array.isArray(d) ? d : (d.data ?? []));
      setTotal(Array.isArray(d) ? d.length : (d.total ?? 0));
      setTotalPages(Array.isArray(d) ? 1 : (d.totalPages ?? 1));
    } catch {
      showPopup("error", "Failed to load labs.");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLabs(1, "");
  }, []);

  const handlePageChange = (p) => {
    setPage(p);
    fetchLabs(p, search);
  };
  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
    fetchLabs(1, "");
  };
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchLabs(1, val, { isSearch: true });
    }, 400);
  };

  const handleCreate = async (form) => {
    try {
      await labService.createLab({
        name: form.name,
        labKey: form.labKey,
        type: form.type || undefined,
        registrationNumber: form.registrationNumber || undefined,
        // Strip empty optional fields — the backend rejects "" for
        // zoneId (ObjectId pattern) and publicEmail/privateEmail (email format).
        contact: sanitizeContact(form.contact),
        isActive: form.isActive,
        billing: {
          feePerInvoice: Number(form.billing.feePerInvoice) || 0,
          forceInvoiceFee: !!form.billing.forceInvoiceFee,
          monthlyFee: Number(form.billing.monthlyFee) || 0,
          commission: Number(form.billing.commission) || 0,
        },
        limit: {
          maxStaff: Number(form.limit.maxStaff) || 0,
          maxProduct: Number(form.limit.maxProduct) || 0,
          maxService: Number(form.limit.maxService) || 0,
          maxMedicine: Number(form.limit.maxMedicine) || 0,
          maxReferrer: Number(form.limit.maxReferrer) || 0,
          maxDoctor: Number(form.limit.maxDoctor) || 0,
          maxAdmissionSpace: Number(form.limit.maxAdmissionSpace) || 0,
        },
        medicalReport: {
          padHeight: Number(form.medicalReport.padHeight) || 0,
        },
      });
      showPopup("success", "Lab registered successfully!");
      fetchStats();
      handleClearSearch();
    } catch (err) {
      showPopup("error", err?.response?.data?.message || "Failed to create lab.");
      throw err;
    }
  };

  // Refetch a single lab (e.g. after a section edit) and keep the view sheet,
  // edit target, list, and stats all in sync with the latest data.
  const refreshLab = async (labId) => {
    try {
      const r = await labService.getLabById(labId);
      setViewLab((v) => (v && v._id === labId ? r.data : v));
      setEditTarget((t) => (t && t.lab._id === labId ? { ...t, lab: r.data } : t));
    } catch {
      // if the single-lab fetch fails, the list refresh below still runs
    }
    fetchStats();
    fetchLabs(page, search);
  };

  // Actually performs the activate/deactivate call after the user confirms.
  const performToggleActive = async (lab) => {
    try {
      if (lab.isActive) await labService.deactivateLab(lab._id);
      else await labService.activateLab(lab._id);
      showPopup("success", lab.isActive ? "Lab deactivated." : "Lab activated.");
      refreshLab(lab._id);
    } catch (err) {
      showPopup("error", err?.response?.data?.message || "Failed to update status.");
    }
  };

  // Opens a confirmation popup before flipping a lab's active status.
  const handleToggleActive = (lab) => {
    const type = lab.isActive ? "deactivate" : "activate";
    setPopup({
      open: true,
      type,
      message: lab.isActive
        ? `"${lab.name}" will be deactivated. Staff will lose access until it's reactivated.`
        : `"${lab.name}" will be activated and regain full access.`,
      onConfirm: () => performToggleActive(lab),
    });
  };

  const isSearchMode = search.trim().length > 0;

  return (
    <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8" style={dotGround}>
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center shrink-0"
              style={{ background: TEAL, borderRadius: "2px" }}
            >
              <FlaskConical size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none" style={{ color: INK }}>
                Laboratories
              </h1>
              <p className="text-[10.5px] mt-1" style={{ color: INK_MUTE }}>
                Registered labs and network overview
              </p>
            </div>
          </div>
          <SolidBtn onClick={() => setCreateModalOpen(true)}>
            <Plus size={14} /> Register Lab
          </SolidBtn>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard
            icon={Layers}
            label="Total labs"
            value={statsLoading ? "—" : (stats?.total ?? 0)}
            tone={TEAL}
            tint={TEAL_TINT}
          />
          <StatCard
            icon={Activity}
            label="Active"
            value={statsLoading ? "—" : (stats?.active ?? 0)}
            tone={VIOLET}
            tint={VIOLET_TINT}
          />
          <StatCard
            icon={PowerOff}
            label="Inactive"
            value={statsLoading ? "—" : (stats?.inactive ?? 0)}
            tone={AMBER}
            tint={AMBER_TINT}
          />
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {searchLoading ? (
                <RefreshCw size={14} className="animate-spin" style={{ color: TEAL }} />
              ) : (
                <Search size={14} style={{ color: "#B8B2A2" }} />
              )}
            </div>
            <input
              type="text"
              placeholder="Search by Lab ID…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-[13px] bg-white outline-none transition-colors placeholder:text-[#B8B2A2]"
              style={{ border: `1px solid ${LINE}`, borderRadius: "2px", color: INK }}
              onFocus={(e) => (e.target.style.borderColor = TEAL)}
              onBlur={(e) => (e.target.style.borderColor = LINE)}
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center border-none cursor-pointer"
                style={{ background: "#EEEBE1", color: INK_MUTE, borderRadius: "2px" }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {isSearchMode && !searchLoading && (
            <div
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] shrink-0"
              style={{ background: GROUND, border: `1px solid ${LINE}`, borderRadius: "2px", color: INK_MUTE }}
            >
              {total === 0 ? "No results for" : `${total} result${total !== 1 ? "s" : ""} for`}
              <strong style={{ color: INK }}>"{search}"</strong>
              <button
                onClick={handleClearSearch}
                className="border-none cursor-pointer bg-transparent flex"
                style={{ color: INK_MUTE }}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Lab list */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : labs.length === 0 ? (
            <div
              className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-xl"
              style={{ background: PAPER, border: `2px dashed ${LINE}` }}
            >
              <div
                className="w-12 h-12 flex items-center justify-center mb-3 rounded-lg"
                style={{ border: `2px dashed ${LINE}` }}
              >
                <FlaskConical size={20} style={{ color: "#C7C1B2" }} />
              </div>
              <p className="text-[13px] font-bold mb-1" style={{ color: INK_MUTE }}>
                {isSearchMode ? `No labs match "${search}"` : "No labs registered yet"}
              </p>
              <p className="text-[11px] mb-5 max-w-[260px]" style={{ color: INK_MUTE }}>
                {isSearchMode
                  ? "Try a different Lab ID or clear the search."
                  : "Register your first lab to get started."}
              </p>
              {isSearchMode ? (
                <GhostBtn onClick={handleClearSearch}>
                  <X size={13} className="inline mr-1" /> Clear Search
                </GhostBtn>
              ) : (
                <SolidBtn onClick={() => setCreateModalOpen(true)}>
                  <Plus size={14} /> Register First Lab
                </SolidBtn>
              )}
            </div>
          ) : (
            labs.map((lab) => (
              <LabCard
                key={lab._id}
                lab={lab}
                onView={(l) => setViewLab(l)}
                onEditSection={(l, section) => setEditTarget({ lab: l, section })}
                onToggleActive={handleToggleActive}
              />
            ))
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />
      </div>

      <LabViewSheet
        isOpen={!!viewLab}
        onClose={() => setViewLab(null)}
        lab={viewLab}
        onToggleActive={handleToggleActive}
      />

      <LabCreateModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSubmit={handleCreate} />

      <LabDetailsModal
        isOpen={editTarget?.section === "details"}
        onClose={() => setEditTarget(null)}
        lab={editTarget?.lab}
        onSaved={() => refreshLab(editTarget.lab._id)}
        showPopup={showPopup}
      />
      <LabContactModal
        isOpen={editTarget?.section === "contact"}
        onClose={() => setEditTarget(null)}
        lab={editTarget?.lab}
        onSaved={() => refreshLab(editTarget.lab._id)}
        showPopup={showPopup}
      />
      <LabBillingModal
        isOpen={editTarget?.section === "billing"}
        onClose={() => setEditTarget(null)}
        lab={editTarget?.lab}
        onSaved={() => refreshLab(editTarget.lab._id)}
        showPopup={showPopup}
      />
      <LabLimitModal
        isOpen={editTarget?.section === "limit"}
        onClose={() => setEditTarget(null)}
        lab={editTarget?.lab}
        onSaved={() => refreshLab(editTarget.lab._id)}
        showPopup={showPopup}
      />
      <LabMedicalReportModal
        isOpen={editTarget?.section === "medicalReport"}
        onClose={() => setEditTarget(null)}
        lab={editTarget?.lab}
        onSaved={() => refreshLab(editTarget.lab._id)}
        showPopup={showPopup}
      />

      {popup.open && (
        <Popup
          type={popup.type}
          message={popup.message}
          onClose={closePopup}
          onConfirm={popup.onConfirm}
          confirmText={
            popup.type === "deactivate" ? "Deactivate" : popup.type === "activate" ? "Activate" : "Yes, proceed"
          }
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default Labs;
