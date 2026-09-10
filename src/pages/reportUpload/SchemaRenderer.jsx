// SchemaRenderer.jsx
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Info,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Send,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Activity,
  User,
  Tag,
} from "lucide-react";

// ─── Age Helpers (mirrors SchemaBuilder) ──────────────────────────────────
const emptyAge = () => ({ years: "", months: "", days: "" });
const AGE_NO_LIMIT = { years: 150, months: 11, days: 31 };
const isAgeNoLimit = (age) =>
  !!age && Number(age.years) === 150 && Number(age.months) === 11 && Number(age.days) === 31;

function hasAge(age) {
  return !!age && age.years !== "" && age.years !== undefined && age.years !== null;
}

function ageToValue(age) {
  if (!age || typeof age !== "object") return null;
  const y = Number(age.years) || 0;
  const m = Number(age.months) || 0;
  const d = Number(age.days) || 0;
  return y * 365 + m * 30 + d;
}

function formatAge(age) {
  if (!age) return "—";
  if (isAgeNoLimit(age)) return "∞";
  const y = age.years === "" || age.years === undefined ? 0 : Number(age.years);
  const m = age.months === "" || age.months === undefined ? 0 : Number(age.months);
  const d = age.days === "" || age.days === undefined ? 0 : Number(age.days);
  const parts = [`${y}y`];
  if (m) parts.push(`${m}m`);
  if (d) parts.push(`${d}d`);
  return parts.join(" ");
}

function AgeInputGroup({ value, onChange, isMax }) {
  const val = value || {};
  const displayAsEmpty = isMax && isAgeNoLimit(val);

  const setPart = (key, max) => (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange({ ...val, [key]: "" });
      return;
    }
    const num = Math.max(0, Math.min(max, Number(raw)));
    onChange({ ...val, [key]: num });
  };

  const handleYearsBlur = () => {
    if (isMax && (val.years === "" || val.years === undefined || val.years === null)) {
      onChange({ ...AGE_NO_LIMIT });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={150}
        placeholder={isMax ? "∞" : "Y"}
        title="Years"
        value={displayAsEmpty ? "" : (val.years ?? "")}
        onChange={setPart("years", 150)}
        onBlur={isMax ? handleYearsBlur : undefined}
        className="w-12 px-1.5 py-1.5 border border-gray-200 rounded-md text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
      />
      <span className="text-[10px] text-gray-300">y</span>
      <input
        type="number"
        min={0}
        max={11}
        placeholder="M"
        title="Months"
        value={displayAsEmpty ? "" : (val.months ?? "")}
        onChange={setPart("months", 11)}
        className="w-10 px-1.5 py-1.5 border border-gray-200 rounded-md text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
      />
      <span className="text-[10px] text-gray-300">m</span>
      <input
        type="number"
        min={0}
        max={31}
        placeholder="D"
        title="Days"
        value={displayAsEmpty ? "" : (val.days ?? "")}
        onChange={setPart("days", 31)}
        className="w-10 px-1.5 py-1.5 border border-gray-200 rounded-md text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
      />
      <span className="text-[10px] text-gray-300">d</span>
    </div>
  );
}

// ─── Range Logic ──────────────────────────────────────────────────────────────
export function getStandardRangeInfo(field, patientAge, patientGender) {
  const sr = field.standardRange;
  if (!sr || sr.type === "none") return null;
  const mode = sr.mode || "range";

  if (mode === "range") {
    if (sr.type === "simple" && sr.data) {
      return { mode, min: parseFloat(sr.data.min), max: parseFloat(sr.data.max) };
    }
    if (sr.type === "age" && hasAge(patientAge) && Array.isArray(sr.data)) {
      const ageVal = ageToValue(patientAge);
      const row = sr.data.find((r) => ageVal >= ageToValue(r.minAge) && ageVal <= ageToValue(r.maxAge));
      if (row) return { mode, min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
    }
    if (sr.type === "gender" && patientGender && sr.data) {
      const g = sr.data[patientGender];
      if (g) return { mode, min: parseFloat(g.min), max: parseFloat(g.max) };
    }
    if (sr.type === "combined" && hasAge(patientAge) && patientGender && Array.isArray(sr.data)) {
      const ageVal = ageToValue(patientAge);
      const row = sr.data.find(
        (r) => r.gender === patientGender && ageVal >= ageToValue(r.minAge) && ageVal <= ageToValue(r.maxAge),
      );
      if (row) return { mode, min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
    }
    return null;
  }

  let tiers = [];
  if (sr.type === "simple" && Array.isArray(sr.data)) {
    tiers = sr.data;
  } else if (sr.type === "age" && hasAge(patientAge) && Array.isArray(sr.data)) {
    const ageVal = ageToValue(patientAge);
    const bracket = sr.data.find((b) => ageVal >= ageToValue(b.minAge) && ageVal <= ageToValue(b.maxAge));
    tiers = bracket?.tiers || [];
  } else if (sr.type === "gender" && patientGender && sr.data) {
    tiers = sr.data[patientGender] || [];
  } else if (sr.type === "combined" && hasAge(patientAge) && patientGender && Array.isArray(sr.data)) {
    const ageVal = ageToValue(patientAge);
    const bracket = sr.data.find(
      (b) => b.gender === patientGender && ageVal >= ageToValue(b.minAge) && ageVal <= ageToValue(b.maxAge),
    );
    tiers = bracket?.tiers || [];
  }
  if (!tiers || tiers.length === 0) return null;
  return { mode, tiers };
}

export function getStandardRange(field, patientAge, patientGender) {
  const info = getStandardRangeInfo(field, patientAge, patientGender);
  if (!info || info.mode !== "range") return null;
  return { min: info.min, max: info.max };
}

function tierMatches(t, v) {
  const comparator = t.comparator || "between";
  const min = t.min === "" || t.min === null || t.min === undefined ? null : parseFloat(t.min);
  const max = t.max === "" || t.max === null || t.max === undefined ? null : parseFloat(t.max);
  switch (comparator) {
    case "gt":
      return min !== null && v > min;
    case "gte":
      return min !== null && v >= min;
    case "lt":
      return max !== null && v < max;
    case "lte":
      return max !== null && v <= max;
    case "between":
    default: {
      const lo = min === null ? -Infinity : min;
      const hi = max === null ? Infinity : max;
      return v >= lo && v <= hi;
    }
  }
}

function formatTierRange(t) {
  const comparator = t.comparator || "between";
  const hasMin = t.min !== "" && t.min !== null && t.min !== undefined;
  const hasMax = t.max !== "" && t.max !== null && t.max !== undefined;
  switch (comparator) {
    case "gt":
      return hasMin ? `> ${t.min}` : "—";
    case "gte":
      return hasMin ? `≥ ${t.min}` : "—";
    case "lt":
      return hasMax ? `< ${t.max}` : "—";
    case "lte":
      return hasMax ? `≤ ${t.max}` : "—";
    case "between":
    default:
      if (hasMin && hasMax) return `${t.min}–${t.max}`;
      if (hasMin) return `≥ ${t.min}`;
      if (hasMax) return `≤ ${t.max}`;
      return "—";
  }
}

export function evaluateStatus(value, rangeInfo) {
  if (!rangeInfo || value === "" || value === null || value === undefined) return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;

  if (rangeInfo.mode === "range") {
    let status = "normal";
    if (v < rangeInfo.min) status = "low";
    else if (v > rangeInfo.max) status = "high";
    return { kind: "range", status };
  }

  const tier = rangeInfo.tiers.find((t) => tierMatches(t, v));
  if (!tier) return null;
  const label = (tier.label || "").toLowerCase();
  let status = "tag";
  if (/low/.test(label)) status = "low";
  else if (/high/.test(label)) status = "high";
  else if (/normal|unremarkable|negative/.test(label)) status = "normal";
  return { kind: "tagged", status, label: tier.label };
}

export function getRangeStatus(value, range) {
  if (!range) return "neutral";
  const res = evaluateStatus(value, { mode: "range", ...range });
  return res ? res.status : "neutral";
}

// ─── Reference Value Logic (text/textarea fields) ─────────────────────────────
export function getReferenceValue(field, patientAge, patientGender) {
  const rv = field.referenceValue;
  if (!rv || rv.type === "none") return null;
  if (rv.type === "simple") return rv.data?.value || null;
  if (rv.type === "age" && hasAge(patientAge) && Array.isArray(rv.data)) {
    const ageVal = ageToValue(patientAge);
    const row = rv.data.find((r) => ageVal >= ageToValue(r.minAge) && ageVal <= ageToValue(r.maxAge));
    return row?.value || null;
  }
  if (rv.type === "gender" && patientGender && rv.data) {
    return rv.data[patientGender]?.value || null;
  }
  if (rv.type === "combined" && hasAge(patientAge) && patientGender && Array.isArray(rv.data)) {
    const ageVal = ageToValue(patientAge);
    const row = rv.data.find(
      (r) => r.gender === patientGender && ageVal >= ageToValue(r.minAge) && ageVal <= ageToValue(r.maxAge),
    );
    return row?.value || null;
  }
  return null;
}

export function hydrateValuesFromReport(schema, existingReport) {
  if (!existingReport || !schema?.sections) return {};
  const values = {};
  schema.sections.forEach((section, si) => {
    const sectionData = existingReport[section.name];
    if (!sectionData) return;
    section.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const fieldData = sectionData[field.name];
      if (!fieldData) return;
      values[key] = fieldData.value ?? fieldData;
    });
  });
  return values;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function RangeTooltip({ field }) {
  const [open, setOpen] = useState(false);
  const sr = field.standardRange;
  if (!sr || sr.type === "none") return null;
  const mode = sr.mode || "range";

  return (
    <div className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="inline-flex items-center leading-none p-0 border-0 bg-transparent cursor-pointer"
        type="button"
      >
        <Info className="w-3 h-3 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-800 text-gray-200 text-[11px] rounded-lg py-2.5 px-3 shadow-xl border border-white/10 pointer-events-none">
          <div className="text-[9px] font-bold uppercase tracking-wider text-blue-400 mb-1.5">
            {mode === "tagged" ? "Reference Tiers" : "Reference Ranges"}
          </div>

          {mode === "range" && sr.type === "simple" && sr.data && (
            <div className="text-gray-400 leading-7 font-mono text-[10.5px]">
              {sr.data.min} – {sr.data.max} {field.unit || ""}
            </div>
          )}
          {mode === "range" &&
            sr.type === "age" &&
            Array.isArray(sr.data) &&
            sr.data.map((r, i) => (
              <div key={i} className="text-gray-400 leading-7 font-mono text-[10.5px]">
                Age {formatAge(r.minAge)}–{formatAge(r.maxAge)}:{" "}
                <span className="text-gray-200 font-medium">
                  {r.minValue}–{r.maxValue}
                </span>
              </div>
            ))}
          {mode === "range" &&
            sr.type === "gender" &&
            sr.data &&
            Object.entries(sr.data).map(([g, v]) => (
              <div key={g} className="text-gray-400 leading-7 font-mono text-[10.5px] capitalize">
                {g}:{" "}
                <span className="text-gray-200 font-medium">
                  {v.min}–{v.max}
                </span>
              </div>
            ))}
          {mode === "range" &&
            sr.type === "combined" &&
            Array.isArray(sr.data) &&
            sr.data.map((r, i) => (
              <div key={i} className="text-gray-400 leading-7 font-mono text-[10.5px] capitalize">
                {r.gender} {formatAge(r.minAge)}–{formatAge(r.maxAge)}:{" "}
                <span className="text-gray-200 font-medium">
                  {r.minValue}–{r.maxValue}
                </span>
              </div>
            ))}

          {mode === "tagged" &&
            sr.type === "simple" &&
            Array.isArray(sr.data) &&
            sr.data.map((t, i) => (
              <div key={i} className="text-gray-400 leading-7 font-mono text-[10.5px]">
                {t.label}: <span className="text-gray-200 font-medium">{formatTierRange(t)}</span>
              </div>
            ))}
          {mode === "tagged" &&
            sr.type === "age" &&
            Array.isArray(sr.data) &&
            sr.data.map((b, i) => (
              <div key={i}>
                <div className="text-gray-500 text-[9px] uppercase tracking-wide mt-1.5 mb-0.5">
                  Age {formatAge(b.minAge)}–{formatAge(b.maxAge)}
                </div>
                {(b.tiers || []).map((t, j) => (
                  <div key={j} className="text-gray-400 leading-7 font-mono text-[10.5px]">
                    {t.label}: <span className="text-gray-200 font-medium">{formatTierRange(t)}</span>
                  </div>
                ))}
              </div>
            ))}
          {mode === "tagged" &&
            sr.type === "gender" &&
            sr.data &&
            Object.entries(sr.data).map(([g, tiers]) => (
              <div key={g}>
                <div className="text-gray-500 text-[9px] uppercase tracking-wide mt-1.5 mb-0.5 capitalize">{g}</div>
                {(tiers || []).map((t, j) => (
                  <div key={j} className="text-gray-400 leading-7 font-mono text-[10.5px]">
                    {t.label}: <span className="text-gray-200 font-medium">{formatTierRange(t)}</span>
                  </div>
                ))}
              </div>
            ))}
          {mode === "tagged" &&
            sr.type === "combined" &&
            Array.isArray(sr.data) &&
            sr.data.map((b, i) => (
              <div key={i}>
                <div className="text-gray-500 text-[9px] uppercase tracking-wide mt-1.5 mb-0.5 capitalize">
                  {b.gender}, {formatAge(b.minAge)}–{formatAge(b.maxAge)}
                </div>
                {(b.tiers || []).map((t, j) => (
                  <div key={j} className="text-gray-400 leading-7 font-mono text-[10.5px]">
                    {t.label}: <span className="text-gray-200 font-medium">{formatTierRange(t)}</span>
                  </div>
                ))}
              </div>
            ))}

          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}

// ─── Patient Form ─────────────────────────────────────────────────────────────

function PatientForm({ patient, onChange }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
      <div className="flex items-center gap-2.5 px-4.5 py-2.5 bg-gray-900">
        <User className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[10px] font-bold text-white/55 uppercase tracking-widest">Patient Info</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3">
        <div className="p-3.5 px-4.5 border-r-0 sm:border-r border-gray-200 col-span-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
            Patient Name
          </label>
          <input
            className="w-full bg-transparent border-0 outline-none text-sm font-semibold text-gray-900"
            type="text"
            placeholder="Enter name"
            value={patient.patientName}
            onChange={(e) => onChange("patientName", e.target.value)}
          />
        </div>
        <div className="p-3.5 px-4.5 border-r-0 sm:border-r border-gray-200">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Age</label>
          <AgeInputGroup value={patient.age} onChange={(v) => onChange("age", v)} />
        </div>
        <div className="p-3.5 px-4.5">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
            Gender
          </label>
          <div className="flex gap-2 mt-0.5">
            {["male", "female", "other"].map((g) => {
              const sel = patient.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => onChange("gender", sel ? "" : g)}
                  className={`px-3 py-1 rounded-md text-[13px] font-medium border transition-colors capitalize ${
                    sel ? "bg-gray-900 border-gray-900 text-white" : "bg-transparent border-gray-200 text-gray-600"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-3.5 px-4.5 border-t border-gray-200 sm:col-span-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
            Sample Collection Date
          </label>
          <input
            className="w-full bg-transparent border-0 outline-none text-sm font-semibold text-gray-900"
            type="date"
            value={patient.sampleCollectionDate}
            onChange={(e) => onChange("sampleCollectionDate", e.target.value)}
          />
        </div>
        <div className="p-3.5 px-4.5 border-t border-gray-200 sm:col-span-2">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
            Report Date
          </label>
          <input
            className="w-full bg-transparent border-0 outline-none text-sm font-semibold text-gray-900"
            type="date"
            value={patient.reportDate}
            onChange={(e) => onChange("reportDate", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Shared Row Layout ─────────────────────────────────────────────────────

function FieldRow({ field, control, refNode, error }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 py-3.5 border-b border-gray-100 last:border-b-0 ${
        error ? "bg-red-50/50 -mx-4.5 px-4.5" : ""
      }`}
    >
      <div className="sm:col-span-3 flex items-start pt-2">
        <span className="text-[13px] font-semibold text-gray-700 leading-snug">
          {field.name}
          {field.required && <span className="inline-block w-1 h-1 rounded-full bg-blue-600 ml-1 align-middle" />}
        </span>
      </div>
      <div className="sm:col-span-5">{control}</div>
      <div className="sm:col-span-4 flex items-start pt-2">
        {refNode || <span className="text-[11px] text-gray-300">—</span>}
      </div>
      {error && <div className="sm:col-span-12 text-[11px] text-red-600 -mt-1">{error}</div>}
    </div>
  );
}

function RangeBadge({ evaluated }) {
  if (!evaluated) return null;
  if (evaluated.kind === "range") {
    if (evaluated.status === "normal") {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-600 border-emerald-600/25">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Normal
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
          evaluated.status === "low"
            ? "bg-orange-50 text-orange-600 border-orange-600/25"
            : "bg-red-50 text-red-600 border-red-600/25"
        }`}
      >
        {evaluated.status === "low" ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
        {evaluated.status === "low" ? "Low" : "High"}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
        evaluated.status === "low"
          ? "bg-orange-50 text-orange-600 border-orange-600/25"
          : evaluated.status === "high"
            ? "bg-red-50 text-red-600 border-red-600/25"
            : evaluated.status === "normal"
              ? "bg-emerald-50 text-emerald-600 border-emerald-600/25"
              : "bg-violet-50 text-violet-600 border-violet-600/25 normal-case"
      }`}
    >
      {evaluated.status === "low" && <TrendingDown className="w-2.5 h-2.5" />}
      {evaluated.status === "high" && <TrendingUp className="w-2.5 h-2.5" />}
      {evaluated.status === "normal" && <CheckCircle2 className="w-2.5 h-2.5" />}
      {evaluated.status === "tag" && <Tag className="w-2.5 h-2.5" />}
      {evaluated.label}
    </span>
  );
}

function RangeRefContent({ field, rangeInfo, evaluated, hasValue }) {
  const rangeText =
    rangeInfo?.mode === "range" ? `${rangeInfo.min}–${rangeInfo.max}${field.unit ? ` ${field.unit}` : ""}` : null;
  if (!rangeInfo) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {rangeText ? (
        <span className="font-mono text-[11px] text-gray-500">{rangeText}</span>
      ) : (
        <span className="font-mono text-[11px] text-gray-500">Tiered ref.</span>
      )}
      {hasValue && <RangeBadge evaluated={evaluated} />}
      <RangeTooltip field={field} />
    </div>
  );
}

// ─── Number Field ─────────────────────────────────────────────────────────────

const STATUS_RING = {
  ok: "border-emerald-600 ring-2 ring-emerald-600/10",
  low: "border-orange-600 ring-2 ring-orange-600/10",
  high: "border-red-600 ring-2 ring-red-600/10",
  tag: "border-violet-600 ring-2 ring-violet-600/10",
};

function NumberField({ field, value, onChange, error, patientAge, patientGender }) {
  const rangeInfo = getStandardRangeInfo(field, patientAge, patientGender);
  const evaluated = evaluateStatus(value, rangeInfo);
  const hasValue = value !== "" && value !== null && value !== undefined;

  let statusCls = "border-gray-200";
  if (error) statusCls = "border-red-600 ring-2 ring-red-600/10 bg-red-50";
  else if (hasValue && evaluated) {
    const key = evaluated.status === "normal" ? "ok" : evaluated.status;
    statusCls = STATUS_RING[key] || statusCls;
  }

  const control = (
    <div
      className={`relative bg-white border-[1.5px] rounded-lg transition-colors focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 ${statusCls}`}
    >
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter result"
        className={`w-full bg-transparent border-0 outline-none font-mono text-sm font-medium text-gray-900 py-2.5 pl-3 ${
          field.unit ? "pr-14" : "pr-3"
        }`}
      />
      {field.unit && (
        <span className="absolute right-0 top-0 h-full px-2.5 flex items-center bg-gray-100 border-l border-gray-200 rounded-r-lg font-mono text-[10px] font-medium text-gray-600 uppercase tracking-wide pointer-events-none">
          {field.unit}
        </span>
      )}
    </div>
  );

  return (
    <FieldRow
      field={field}
      error={error}
      control={control}
      refNode={<RangeRefContent field={field} rangeInfo={rangeInfo} evaluated={evaluated} hasValue={hasValue} />}
    />
  );
}

// ─── Radio ────────────────────────────────────────────────────────────────────

function ToggleOption({ selected, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium border-[1.5px] transition-colors min-h-[38px] ${
        selected
          ? "bg-gray-900 border-gray-900 text-white shadow-md"
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-500 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function RadioField({ field, options = [], value, onChange, error }) {
  const control = (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <ToggleOption key={opt} selected={sel} onClick={() => onChange(value === opt ? "" : opt)}>
            <span
              className={`inline-block w-3 h-3 rounded-full flex-shrink-0 border-2 ${
                sel
                  ? "border-white/50 bg-white shadow-[inset_0_0_0_2.5px_theme(colors.gray.900)]"
                  : "border-gray-300 bg-transparent"
              }`}
            />
            {opt}
          </ToggleOption>
        );
      })}
    </div>
  );
  return <FieldRow field={field} error={error} control={control} />;
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function DropdownField({ field, options = [], value, onChange, error }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest(".sr2-dd-wrap")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const control = (
    <div className="sr2-dd-wrap relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-lg border-[1.5px] bg-white cursor-pointer transition-all py-2.5 px-3 ${
          open ? "border-blue-600 ring-2 ring-blue-600/10 outline-none" : error ? "border-red-600" : "border-gray-200"
        }`}
      >
        <span className={`font-mono text-sm font-medium ${!value ? "text-gray-300" : "text-gray-900"}`}>
          {value || "Select…"}
        </span>
        <ChevronDown
          className={`w-[15px] h-[15px] text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border-[1.5px] border-gray-200 rounded-lg shadow-xl overflow-y-auto max-h-[200px]">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`w-full text-left px-3.5 py-2.5 text-[13.5px] border-0 cursor-pointer flex items-center justify-between min-h-[42px] ${
                value === opt
                  ? "bg-gray-900 text-white font-semibold"
                  : "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
              {value === opt && <CheckCircle2 className="w-[13px] h-[13px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return <FieldRow field={field} error={error} control={control} />;
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function CheckboxField({ field, options = [], value = [], onChange, error }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  const control = (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const checked = value.includes(opt);
        return (
          <ToggleOption key={opt} selected={checked} onClick={() => toggle(opt)}>
            <span
              className={`w-3.5 h-3.5 rounded flex-shrink-0 border-2 flex items-center justify-center ${
                checked ? "border-white/50 bg-white" : "border-gray-300 bg-transparent"
              }`}
            >
              {checked && (
                <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="#0d1117"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            {opt}
          </ToggleOption>
        );
      })}
    </div>
  );
  return <FieldRow field={field} error={error} control={control} />;
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

function TextareaField({ field, value, onChange, error, patientAge, patientGender }) {
  const maxLength = field.maxLength || 200;
  const refValue = getReferenceValue(field, patientAge, patientGender);

  const control = (
    <div>
      <div
        className={`border-[1.5px] rounded-lg bg-white transition-colors focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 ${
          error ? "border-red-600 bg-red-50" : "border-gray-200"
        }`}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={3}
          placeholder="Enter result"
          className="w-full bg-transparent border-0 outline-none resize-none text-[13.5px] text-gray-900 p-3"
        />
      </div>
      <div className="font-mono text-[10px] text-gray-400 text-right mt-1">
        {(value || "").length}/{maxLength}
      </div>
    </div>
  );

  const refNode = refValue ? (
    <span className="font-mono text-[11px] text-gray-500 flex items-center gap-1">
      <Tag className="w-[9px] h-[9px] text-violet-600" />
      {refValue}
    </span>
  ) : null;

  return <FieldRow field={field} error={error} control={control} refNode={refNode} />;
}

// ─── Text Input ───────────────────────────────────────────────────────────────

function TextInputField({ field, value, onChange, error, patientAge, patientGender }) {
  const maxLength = field.maxLength || 200;
  const refValue = getReferenceValue(field, patientAge, patientGender);

  const control = (
    <div>
      <div
        className={`relative border-[1.5px] rounded-lg bg-white transition-colors focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 ${
          error ? "border-red-600 bg-red-50" : "border-gray-200"
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder="Enter result"
          className="w-full bg-transparent border-0 outline-none text-[13.5px] text-gray-900 py-2.5 px-3"
        />
      </div>
      <div className="font-mono text-[10px] text-gray-400 text-right mt-1">
        {(value || "").length}/{maxLength}
      </div>
    </div>
  );

  const refNode = refValue ? (
    <span className="font-mono text-[11px] text-gray-500 flex items-center gap-1">
      <Tag className="w-[9px] h-[9px] text-violet-600" />
      {refValue}
    </span>
  ) : null;

  return <FieldRow field={field} error={error} control={control} refNode={refNode} />;
}

// ─── Section Panel ────────────────────────────────────────────────────────────

function SectionPanel({ section, sectionIndex, values, onChange, errors, patientAge, patientGender }) {
  const [collapsed, setCollapsed] = useState(false);
  const fieldCount = section.fields.length;
  const filledCount = section.fields.filter((f) => {
    const v = values[`${sectionIndex}_${f.name}`];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const hasError = section.fields.some((f) => errors[`${sectionIndex}_${f.name}`]);
  const complete = filledCount === fieldCount && fieldCount > 0;
  const pct = fieldCount > 0 ? (filledCount / fieldCount) * 100 : 0;

  const rows = (
    <div className="px-4.5">
      <div className="hidden sm:grid grid-cols-12 gap-4 pt-3 pb-1.5 border-b border-gray-200">
        <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parameter</div>
        <div className="col-span-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Result</div>
        <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ref</div>
      </div>
      {section.fields.map((field) => {
        const key = `${sectionIndex}_${field.name}`;
        const val = values[key] ?? (field.type === "checkbox" ? [] : "");
        const err = errors[key];
        return (
          <div key={key}>
            {field.type === "number" && (
              <NumberField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                patientAge={patientAge}
                patientGender={patientGender}
              />
            )}
            {field.type === "radio" && (
              <RadioField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
              />
            )}
            {field.type === "select" && (
              <DropdownField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
              />
            )}
            {field.type === "checkbox" && (
              <CheckboxField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
              />
            )}
            {field.type === "textarea" && (
              <TextareaField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                patientAge={patientAge}
                patientGender={patientGender}
              />
            )}
            {field.type === "input" && (
              <TextInputField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                patientAge={patientAge}
                patientGender={patientGender}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className={`bg-white border rounded-xl overflow-visible shadow-sm transition-shadow hover:shadow-md ${hasError ? "border-red-600/40" : "border-gray-200"}`}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`flex items-center gap-3 px-4.5 py-3.5 w-full text-left border-0 cursor-pointer rounded-t-xl transition-colors ${
          hasError ? "bg-red-900" : "bg-gray-900 hover:bg-gray-800"
        }`}
      >
        <div
          className={`w-7 h-7 rounded-md font-mono text-[11px] font-semibold flex items-center justify-center flex-shrink-0 border ${
            complete
              ? "bg-blue-600 border-blue-600 text-white"
              : hasError
                ? "bg-red-600 border-red-600 text-white"
                : "bg-white/10 border-white/15 text-white/70"
          }`}
        >
          {sectionIndex + 1}
        </div>
        <span className="flex-1 text-[13px] font-semibold text-white/90 tracking-wide">{section.name}</span>
        <span
          className={`font-mono text-[10px] font-medium px-2.5 py-1 rounded-full border ${
            complete ? "bg-blue-600/30 text-blue-300 border-blue-600/40" : "bg-white/10 text-white/45 border-white/10"
          }`}
        >
          {filledCount}/{fieldCount}
        </span>
        <ChevronDown
          className={`w-[15px] h-[15px] text-white/30 transition-transform flex-shrink-0 ${!collapsed ? "rotate-180" : ""}`}
        />
      </button>
      <div className="h-0.5 bg-white/[0.06]">
        <div className="h-full bg-blue-600 transition-all duration-500 w-[var(--pct)]" style={{ "--pct": `${pct}%` }} />
      </div>
      {!collapsed && rows}
    </div>
  );
}

// ─── Build Payload ────────────────────────────────────────────────────────────

function buildPayload(schema, values, patient) {
  const report = {};
  schema.sections.forEach((sec, si) => {
    const sd = {};
    sec.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const val = values[key];
      if (val !== "" && val !== undefined && val !== null && !(Array.isArray(val) && val.length === 0)) {
        const entry = {
          value: val,
          ...(field.unit ? { unit: field.unit } : {}),
        };

        if (field.type === "number") {
          const rangeInfo = getStandardRangeInfo(field, patient.age, patient.gender);
          if (rangeInfo?.mode === "range") {
            entry.referenceRange = `${rangeInfo.min}–${rangeInfo.max}`;
          } else if (rangeInfo?.mode === "tagged") {
            const evaluated = evaluateStatus(val, rangeInfo);
            if (evaluated) entry.referenceTag = evaluated.label;
          }
        } else if (field.type === "input" || field.type === "textarea") {
          const refValue = getReferenceValue(field, patient.age, patient.gender);
          if (refValue) entry.referenceValue = refValue;
        }

        sd[field.name] = entry;
      }
    });
    if (Object.keys(sd).length > 0) report[sec.name] = { ...sd, __showTitle: sec.showTitleInReport !== false };
  });

  return {
    schemaId: schema._id,
    patientName: patient.patientName,
    patientAge: patient.age,
    patientGender: patient.gender,
    sampleCollectionDate: patient.sampleCollectionDate,
    reportDate: patient.reportDate,
    report,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

function SchemaRenderer({ schema, onSubmit, loading = false }) {
  const [patient, setPatient] = useState({
    patientName: "",
    age: emptyAge(),
    gender: "",
    sampleCollectionDate: "",
    reportDate: "",
  });
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({});
    setErrors({});
  }, [JSON.stringify(schema?.sections)]);

  const handlePatientChange = (field, val) => setPatient((p) => ({ ...p, [field]: val }));
  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    schema.sections.forEach((sec, si) => {
      sec.fields.forEach((field) => {
        if (!field.required) return;
        const key = `${si}_${field.name}`;
        const val = values[key];
        if (field.type === "checkbox") {
          if (!val || val.length === 0) errs[key] = "At least one option is required";
        } else {
          if (val === "" || val === undefined || val === null) errs[key] = "This field is required";
        }
      });
    });
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit?.(buildPayload(schema, values, patient));
  };

  const handleReset = () => {
    setValues({});
    setPatient({ patientName: "", age: emptyAge(), gender: "", sampleCollectionDate: "", reportDate: "" });
    setErrors({});
  };

  if (!schema || !schema.sections) return null;

  const allKeys = schema.sections.flatMap((sec, si) => sec.fields.map((f) => `${si}_${f.name}`));
  const hasFields = schema.sections.some((s) => s.fields.length > 0);
  const totalFields = allKeys.length;
  const totalFilled = allKeys.filter((k) => {
    const v = values[k];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const progress = totalFields > 0 ? (totalFilled / totalFields) * 100 : null;

  const numEvaluations = schema.sections.flatMap((sec, si) =>
    sec.fields
      .filter((f) => f.type === "number")
      .map((f) => {
        const rangeInfo = getStandardRangeInfo(f, patient.age, patient.gender);
        return evaluateStatus(values[`${si}_${f.name}`], rangeInfo);
      }),
  );
  const abnormalCount = numEvaluations.filter((e) => e && (e.status === "high" || e.status === "low")).length;
  const normalCount = numEvaluations.filter((e) => e && e.status === "normal").length;

  if (!hasFields) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 bg-gray-100 border-[1.5px] border-gray-200 rounded-xl flex items-center justify-center mb-4">
            <Eye className="w-[22px] h-[22px] text-gray-300" />
          </div>
          <p className="font-bold text-gray-600 text-sm">No fields configured</p>
          <p className="text-gray-400 text-[13px] mt-1">Add fields in the Builder to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="max-w-[1600px] mx-auto py-7 px-5 pb-14">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Activity className="w-[18px] h-[18px] text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] text-gray-400 uppercase tracking-wider mb-1">Lab Report Entry</div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {schema.description || "Lab Report"}
              </h1>
            </div>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" }}>
            {progress !== null && (
              <div className="bg-gray-100 border border-gray-200 rounded-lg py-3 px-3.5 flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Progress</span>
                <span
                  className={`font-mono text-xl font-semibold leading-none ${progress === 100 ? "text-emerald-600" : "text-blue-600"}`}
                >
                  {Math.round(progress)}%
                </span>
              </div>
            )}
            <div className="bg-gray-100 border border-gray-200 rounded-lg py-3 px-3.5 flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Filled</span>
              <span className="font-mono text-xl font-semibold leading-none text-gray-900">
                {totalFilled}
                <span className="text-[13px] text-gray-400 font-normal">/{totalFields}</span>
              </span>
            </div>
            <div className="bg-gray-100 border border-gray-200 rounded-lg py-3 px-3.5 flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">In Range</span>
              <span
                className={`font-mono text-xl font-semibold leading-none ${normalCount > 0 ? "text-emerald-600" : "text-gray-900"}`}
              >
                {normalCount}
              </span>
            </div>
            <div className="bg-gray-100 border border-gray-200 rounded-lg py-3 px-3.5 flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Abnormal</span>
              <span
                className={`font-mono text-xl font-semibold leading-none ${abnormalCount > 0 ? "text-red-600" : "text-gray-900"}`}
              >
                {abnormalCount}
              </span>
            </div>
          </div>

          {progress !== null && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Completion</span>
                <span className="font-mono text-[11px] text-gray-600">
                  {totalFilled} / {totalFields} fields
                </span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 w-[var(--pct)] ${
                    progress === 100 ? "bg-emerald-600" : "bg-gradient-to-r from-blue-600 to-cyan-600"
                  }`}
                  style={{ "--pct": `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {abnormalCount > 0 && (
          <div className="flex items-start gap-3 py-3 px-4 rounded-lg border-l-[3px] border-orange-600 bg-orange-50 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-orange-800 mb-0.5">
                Abnormal Values Detected
              </div>
              <div className="text-[12.5px] leading-relaxed text-orange-700">
                {abnormalCount} result{abnormalCount > 1 ? "s" : ""} outside the standard reference range — please
                review before submitting.
              </div>
            </div>
          </div>
        )}

        <PatientForm patient={patient} onChange={handlePatientChange} />

        <div className="flex flex-col gap-2.5 mb-4">
          {schema.sections.map((section, si) => (
            <SectionPanel
              key={si}
              section={section}
              sectionIndex={si}
              values={values}
              onChange={handleChange}
              errors={errors}
              patientAge={patient.age}
              patientGender={patient.gender}
            />
          ))}
        </div>

        {schema.hasStaticStandardRange && schema.staticStandardRange && (
          <div className="flex items-start gap-3 py-3 px-4 rounded-lg border-l-[3px] border-orange-600 bg-orange-50 mb-3">
            <Info className="w-[15px] h-[15px] text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-orange-800 mb-0.5">
                Standard Reference
              </div>
              <div className="text-[12.5px] leading-relaxed text-orange-700">{schema.staticStandardRange}</div>
            </div>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="flex items-start gap-3 py-3 px-4 rounded-lg border-l-[3px] border-red-600 bg-red-50 mb-3">
            <XCircle className="w-[15px] h-[15px] text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-red-800 mb-0.5">Validation Failed</div>
              <div className="text-[12.5px] leading-relaxed text-red-700">
                {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} require attention before
                submitting.
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 py-4 px-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-1.5 text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Form validated on submit</span>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              className="flex items-center gap-1.5 py-2.5 px-4 border-[1.5px] border-gray-200 rounded-lg bg-white text-gray-600 text-[13px] font-semibold tracking-wide cursor-pointer transition-colors hover:border-gray-800 hover:text-gray-900 hover:bg-gray-100 min-h-[42px]"
              onClick={handleReset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              className="flex items-center gap-2 py-2.5 px-6 rounded-lg bg-blue-600 text-white text-[13px] font-bold tracking-wide border-0 cursor-pointer transition-all shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 min-h-[42px]"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {loading ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchemaRenderer;
