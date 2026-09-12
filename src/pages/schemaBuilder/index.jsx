// SchemaBuilder.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  Plus,
  Trash2,
  ChevronDown,
  GripVertical,
  Search,
  CheckCircle2,
  XCircle,
  FlaskConical,
  AlignLeft,
  Hash,
  ToggleLeft,
  List,
  CheckSquare,
  Type,
  Settings2,
  ChevronRight,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  Info,
  Eye,
  EyeOff,
  Tags,
  SlidersHorizontal,
} from "lucide-react";

// ─── Zustand Store ────────────────────────────────────────────────────────────
// NOTE: uses the immer middleware so every action can just "mutate" the draft
// state directly instead of hand-spreading nested arrays/objects. Requires
// `immer` as a dependency (zustand lists it as an optional peer dep):
//   npm install immer
const INITIAL_SCHEMA = {
  description: "",
  testId: "",
  hasStaticStandardRange: false,
  staticStandardRange: "",
  sections: [{ id: Date.now(), name: "Section A", showTitleInReport: true, fields: [] }],
};

// Prevents the mouse scroll wheel from incrementing/decrementing a focused
// number input. Native <input type="number"> listens for wheel events while
// focused, so the only reliable fix is to blur the input before the browser
// gets a chance to act on the scroll.
const preventWheelChange = (e) => e.currentTarget.blur();

const emptyStandardRange = () => ({ type: "none", data: [] });
const emptyReferenceValue = () => ({ type: "none", data: {} });

const findSection = (s, sectionId) => s.schema.sections.find((sec) => sec.id === sectionId);
const findField = (sec, fieldId) => sec?.fields.find((f) => f.id === fieldId);

const useSchemaStore = create(
  immer((set) => ({
    tests: [],
    loadingTests: true,
    schema: INITIAL_SCHEMA,
    errors: {},
    fieldErrors: {},

    setTests: (tests) =>
      set((s) => {
        s.tests = tests;
        s.loadingTests = false;
      }),
    setLoadingTests: (v) =>
      set((s) => {
        s.loadingTests = v;
      }),
    setSchema: (schema) =>
      set((s) => {
        s.schema = schema;
      }),
    resetSchema: () =>
      set((s) => {
        s.schema = {
          ...INITIAL_SCHEMA,
          sections: [{ id: Date.now(), name: "Section A", showTitleInReport: true, fields: [] }],
        };
        s.errors = {};
        s.fieldErrors = {};
      }),
    setSchemaField: (key, value) =>
      set((s) => {
        s.schema[key] = value;
        s.errors[key] = undefined;
      }),
    setErrors: (errors) =>
      set((s) => {
        s.errors = errors;
      }),
    setFieldErrors: (fieldErrors) =>
      set((s) => {
        s.fieldErrors = fieldErrors;
      }),

    addSection: () =>
      set((s) => {
        s.schema.sections.push({
          id: Date.now(),
          name: `Section ${String.fromCharCode(65 + s.schema.sections.length)}`,
          showTitleInReport: true,
          fields: [],
        });
      }),

    removeSection: (sectionId) =>
      set((s) => {
        s.schema.sections = s.schema.sections.filter((sec) => sec.id !== sectionId);
      }),

    reorderSections: (fromIndex, toIndex) =>
      set((s) => {
        if (fromIndex === toIndex || fromIndex == null || toIndex == null) return;
        const [moved] = s.schema.sections.splice(fromIndex, 1);
        s.schema.sections.splice(toIndex, 0, moved);
      }),

    updateSection: (sectionId, key, value) =>
      set((s) => {
        const sec = findSection(s, sectionId);
        if (sec) sec[key] = value;
      }),

    addField: (sectionId) =>
      set((s) => {
        const sec = findSection(s, sectionId);
        if (!sec) return;
        sec.fields.push({
          id: Date.now(),
          name: "",
          type: "number",
          required: false,
          standardRange: emptyStandardRange(),
          referenceValue: emptyReferenceValue(),
          unit: "",
          options: [],
          maxLength: 200,
        });
      }),

    removeField: (sectionId, fieldId) =>
      set((s) => {
        const sec = findSection(s, sectionId);
        if (sec) sec.fields = sec.fields.filter((f) => f.id !== fieldId);
      }),

    reorderFields: (sectionId, fromIndex, toIndex) =>
      set((s) => {
        if (fromIndex === toIndex || fromIndex == null || toIndex == null) return;
        const sec = findSection(s, sectionId);
        if (!sec) return;
        const [moved] = sec.fields.splice(fromIndex, 1);
        sec.fields.splice(toIndex, 0, moved);
      }),

    updateField: (sectionId, fieldId, key, value) =>
      set((s) => {
        const f = findField(findSection(s, sectionId), fieldId);
        if (f) f[key] = value;
        if (key === "name" && s.fieldErrors[fieldId] !== undefined) s.fieldErrors[fieldId] = undefined;
      }),

    updateFieldStandardRange: (sectionId, fieldId, scope, data) =>
      set((s) => {
        const f = findField(findSection(s, sectionId), fieldId);
        if (f) f.standardRange = { type: scope, data };
      }),

    updateFieldReferenceValue: (sectionId, fieldId, scope, data) =>
      set((s) => {
        const f = findField(findSection(s, sectionId), fieldId);
        if (f) f.referenceValue = { type: scope, data };
      }),
  })),
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const FIELD_TYPES = [
  { value: "number", label: "Number", icon: Hash },
  { value: "radio", label: "Radio", icon: ToggleLeft },
  { value: "select", label: "Dropdown", icon: List },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "textarea", label: "Textarea", icon: AlignLeft },
  { value: "input", label: "Text", icon: Type },
];

const RANGE_SCOPES = [
  { value: "none", label: "None" },
  { value: "simple", label: "Simple" },
  { value: "age", label: "Age Based" },
  { value: "gender", label: "Gender Based" },
  { value: "combined", label: "Complex (Age + Gender)" },
];

// Reference Value on text/textarea fields uses its own scope set — no
// age/gender segmentation, just how the reference note itself is authored.
const REFERENCE_VALUE_SCOPES = [
  { value: "none", label: "None" },
  { value: "keyvalue", label: "Key-Value Pair" },
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
];

const TIER_COMPARATORS = [
  { value: "between", label: "Between" },
  { value: "gt", label: "> Greater than" },
  { value: "gte", label: "≥ At least" },
  { value: "lt", label: "< Less than" },
  { value: "lte", label: "≤ At most" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male", symbol: "♂", classes: "bg-blue-100 text-blue-600" },
  { value: "female", label: "Female", symbol: "♀", classes: "bg-pink-100 text-pink-600" },
  { value: "other", label: "Other", symbol: "⚧", classes: "bg-purple-100 text-purple-600" },
];

const fieldTypeIcon = (type) => {
  const ft = FIELD_TYPES.find((f) => f.value === type);
  return ft ? ft.icon : Hash;
};

const defaultDataForScope = (scope) => {
  if (scope === "age" || scope === "combined") return [];
  if (scope === "gender") return { male: [], female: [], other: [] };
  return []; // "simple" (and "none") — flat list of tiers
};

const newTier = () => ({ id: Date.now() + Math.random(), label: "", comparator: "between", min: "", max: "" });

const emptyAge = () => ({ years: "", months: "", days: "" });
const AGE_NO_LIMIT = { years: 150, months: 11, days: 31 };
const isAgeNoLimit = (age) =>
  !!age && Number(age.years) === 150 && Number(age.months) === 11 && Number(age.days) === 31;

// Parses shorthand like "5y2m6d", "2Y", "10m", "1y 2m 5d", or a bare number
// (treated as years) into { years, months, days }. Order/case/spacing don't
// matter; each present unit is clamped to its valid range.
function parseAgeShorthand(raw) {
  const s = (raw || "").trim();
  if (!s) return null;

  const yMatch = s.match(/(\d+)\s*y/i);
  const mMatch = s.match(/(\d+)\s*m/i);
  const dMatch = s.match(/(\d+)\s*d/i);

  let years = yMatch ? Number(yMatch[1]) : 0;
  let months = mMatch ? Number(mMatch[1]) : 0;
  let days = dMatch ? Number(dMatch[1]) : 0;

  if (!yMatch && !mMatch && !dMatch) {
    const bare = Number(s.replace(/[^\d]/g, ""));
    if (Number.isNaN(bare)) return null;
    years = bare;
  }

  return {
    years: Math.max(0, Math.min(150, years)),
    months: Math.max(0, Math.min(11, months)),
    days: Math.max(0, Math.min(31, days)),
  };
}

// Compact shorthand for pre-filling the input when editing an existing value,
// e.g. { years: 1, months: 2, days: 5 } -> "1y2m5d".
function toAgeShorthand(val) {
  if (!val) return "";
  const y = Number(val.years) || 0;
  const m = Number(val.months) || 0;
  const d = Number(val.days) || 0;
  if (!y && !m && !d) return "";
  return `${y ? `${y}y` : ""}${m ? `${m}m` : ""}${d ? `${d}d` : ""}`;
}

// Full-word readout shown below the input, e.g. "1 year 2 months 5 days".
function formatAgeReadout(val) {
  const y = Number(val?.years) || 0;
  const m = Number(val?.months) || 0;
  const d = Number(val?.days) || 0;
  const parts = [];
  if (y) parts.push(`${y} year${y === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} month${m === 1 ? "" : "s"}`);
  if (d) parts.push(`${d} day${d === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" ") : "0 years";
}

// Data shape is always { years, months, days } — unchanged. The UI is now a
// single free-typed shorthand field (e.g. "5y2m6d", "2y", "10m") that gets
// parsed behind the scenes into that same shape, with a readable readout
// shown underneath so the user can confirm what was captured.
function AgeInputGroup({ value, onChange, isMax }) {
  const val = value || {};
  const displayAsEmpty = isMax && isAgeNoLimit(val);
  const [text, setText] = useState(displayAsEmpty ? "" : toAgeShorthand(val));

  // Re-sync the local text when the underlying value changes from elsewhere
  // (schema load, reset, etc.) rather than from this input's own typing.
  useEffect(() => {
    setText(displayAsEmpty ? "" : toAgeShorthand(val));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val.years, val.months, val.days, displayAsEmpty]);

  const commit = () => {
    if (!text.trim()) {
      onChange(isMax ? { ...AGE_NO_LIMIT } : emptyAge());
      return;
    }
    const parsed = parseAgeShorthand(text);
    if (parsed) onChange(parsed);
    else setText(displayAsEmpty ? "" : toAgeShorthand(val)); // revert on garbage input
  };

  return (
    <div className="flex flex-col gap-1 w-48">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit();
            e.currentTarget.blur();
          }
        }}
        placeholder={isMax ? "∞ (no limit)" : "e.g. 5y2m6d"}
        title="Type e.g. 5y2m6d, 2y, 10m, 3d"
        className="w-full px-3.5 py-3 border border-gray-200 rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
      />
      <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-50 rounded-full w-fit truncate max-w-full">
        {displayAsEmpty ? "No limit" : formatAgeReadout(val)}
      </span>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TestSearchSelect({ tests, value, onChange, error }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const selected = tests.find((t) => t._id === value);
  const filtered = tests.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between px-3 py-2.5 border rounded-lg cursor-pointer bg-white transition-all ${
          error
            ? "border-red-400 ring-1 ring-red-300"
            : open
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-gray-400" />
          <span className={selected ? "text-gray-800 font-medium text-sm" : "text-gray-400 text-sm"}>
            {selected ? selected.name : "Select a test..."}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tests..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No tests found</div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t._id}
                  onClick={() => {
                    onChange(t._id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                    t._id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 opacity-50" />
                  {t.name}
                  {t._id === value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-blue-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Each row is a manually-labeled range: user types the label (e.g. "Low",
// "Normal", "High") and a condition — nothing is auto-generated.
function TierListEditor({ tiers = [], onChange, dense }) {
  const rows = Array.isArray(tiers) ? tiers : [];
  const addTier = () => onChange([...rows, newTier()]);
  const removeTier = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const comparatorOf = (t) => t.comparator || "between";

  const setComparator = (i, comparator) =>
    onChange(
      rows.map((r, idx) => {
        if (idx !== i) return r;
        if (comparator === "between") return { ...r, comparator };
        if (comparator === "gt" || comparator === "gte") return { ...r, comparator, max: "" };
        if (comparator === "lt" || comparator === "lte") return { ...r, comparator, min: "" };
        return { ...r, comparator };
      }),
    );

  return (
    <div className="space-y-2 w-full">
      {rows.map((tier, i) => {
        const comparator = comparatorOf(tier);
        return (
          <div
            key={tier.id || i}
            className={`flex flex-wrap items-end gap-2 ${dense ? "p-1.5" : "p-2"} bg-white rounded-lg border border-gray-200 w-full`}
          >
            <div className="w-44 flex-shrink-0">
              {!dense && <label className="text-xs text-gray-400 block mb-0.5">Label</label>}
              <input
                value={tier.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder="Low, Normal…"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>

            <div className="w-28 flex-shrink-0">
              {!dense && <label className="text-xs text-gray-400 block mb-0.5">Condition</label>}
              <select
                value={comparator}
                onChange={(e) => setComparator(i, e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
              >
                {TIER_COMPARATORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {comparator === "between" && (
              <>
                <div className="flex-1 min-w-[80px]">
                  {!dense && <label className="text-xs text-gray-400 block mb-0.5">Min</label>}
                  <input
                    type="number"
                    value={tier.min}
                    onChange={(e) => update(i, "min", e.target.value)}
                    placeholder="Min"
                    onWheel={preventWheelChange}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div className="flex-1 min-w-[80px]">
                  {!dense && <label className="text-xs text-gray-400 block mb-0.5">Max</label>}
                  <input
                    type="number"
                    value={tier.max}
                    onChange={(e) => update(i, "max", e.target.value)}
                    placeholder="Max"
                    onWheel={preventWheelChange}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
              </>
            )}

            {(comparator === "gt" || comparator === "gte") && (
              <div className="flex-1 min-w-[100px]">
                {!dense && <label className="text-xs text-gray-400 block mb-0.5">Value</label>}
                <input
                  type="number"
                  value={tier.min}
                  onChange={(e) => update(i, "min", e.target.value)}
                  placeholder="e.g. 10"
                  onWheel={preventWheelChange}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
            )}

            {(comparator === "lt" || comparator === "lte") && (
              <div className="flex-1 min-w-[100px]">
                {!dense && <label className="text-xs text-gray-400 block mb-0.5">Value</label>}
                <input
                  type="number"
                  value={tier.max}
                  onChange={(e) => update(i, "max", e.target.value)}
                  placeholder="e.g. 5"
                  onWheel={preventWheelChange}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
            )}

            <button
              onClick={() => removeTier(i)}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      <button
        onClick={addTier}
        className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1 hover:bg-teal-50 rounded-md transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Range
      </button>
    </div>
  );
}

function RangesSimpleInput({ data = [], onChange }) {
  return (
    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 w-full">
      <TierListEditor tiers={data} onChange={onChange} />
    </div>
  );
}

function RangesAgeInput({ data = [], onChange }) {
  const brackets = Array.isArray(data) ? data : [];
  const addBracket = () => onChange([...brackets, { minAge: emptyAge(), maxAge: { ...AGE_NO_LIMIT }, tiers: [] }]);
  const removeBracket = (i) => onChange(brackets.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(brackets.map((b, idx) => (idx === i ? { ...b, [key]: val } : b)));

  return (
    <div className="space-y-3 w-full">
      {brackets.map((b, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 w-full">
          <div className="flex flex-wrap items-end gap-3 w-full">
            <div>
              <label className="text-xs text-gray-400 block mb-0.5">Min Age</label>
              <AgeInputGroup value={b.minAge} onChange={(v) => update(i, "minAge", v)} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-0.5">Max Age (∞ = no limit)</label>
              <AgeInputGroup value={b.maxAge} onChange={(v) => update(i, "maxAge", v)} isMax />
            </div>
            <span className="text-xs text-gray-400 pb-2">ranges for this age bracket:</span>
            <button
              onClick={() => removeBracket(i)}
              className="ml-auto p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <TierListEditor tiers={b.tiers} onChange={(tiers) => update(i, "tiers", tiers)} dense />
        </div>
      ))}
      <button
        onClick={addBracket}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded-md transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Age Bracket
      </button>
    </div>
  );
}

function RangesGenderInput({ data = {}, onChange }) {
  const update = (gender, tiers) => onChange({ ...data, [gender]: tiers });
  return (
    <div className="space-y-3 w-full">
      {GENDER_OPTIONS.map(({ value: gender, label, symbol, classes }) => (
        <div key={gender} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${classes}`}>{symbol}</span>
          </div>
          <TierListEditor tiers={data[gender] || []} onChange={(tiers) => update(gender, tiers)} dense />
        </div>
      ))}
    </div>
  );
}

function RangesCombinedInput({ data = [], onChange }) {
  const brackets = Array.isArray(data) ? data : [];
  const addBracket = () =>
    onChange([...brackets, { gender: "male", minAge: emptyAge(), maxAge: { ...AGE_NO_LIMIT }, tiers: [] }]);
  const removeBracket = (i) => onChange(brackets.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(brackets.map((b, idx) => (idx === i ? { ...b, [key]: val } : b)));

  return (
    <div className="space-y-3 w-full">
      {brackets.map((b, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 w-full">
          <div className="flex flex-wrap items-end gap-3 w-full">
            <div>
              <label className="text-xs text-gray-400 block mb-0.5">Gender</label>
              <select
                value={b.gender}
                onChange={(e) => update(i, "gender", e.target.value)}
                className="w-24 px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-0.5">Min Age</label>
              <AgeInputGroup value={b.minAge} onChange={(v) => update(i, "minAge", v)} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-0.5">Max Age (∞ = no limit)</label>
              <AgeInputGroup value={b.maxAge} onChange={(v) => update(i, "maxAge", v)} isMax />
            </div>
            <button
              onClick={() => removeBracket(i)}
              className="ml-auto p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <TierListEditor tiers={b.tiers} onChange={(tiers) => update(i, "tiers", tiers)} dense />
        </div>
      ))}
      <button
        onClick={addBracket}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded-md transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Bracket
      </button>
    </div>
  );
}

function RefTextInput({ data = {}, onChange }) {
  return (
    <div className="w-full">
      <label className="text-xs text-gray-500 mb-1 block">Reference / Standard Value</label>
      <input
        value={data.value || ""}
        onChange={(e) => onChange({ ...data, value: e.target.value })}
        placeholder="e.g. White, Clear, Negative"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
      />
    </div>
  );
}

function RefTextareaInput({ data = {}, onChange }) {
  return (
    <div className="w-full">
      <label className="text-xs text-gray-500 mb-1 block">Reference / Standard Text</label>
      <textarea
        value={data.value || ""}
        onChange={(e) => onChange({ ...data, value: e.target.value })}
        rows={3}
        placeholder="Enter longer multi-line reference details..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 resize-none"
      />
    </div>
  );
}

const newKeyValue = () => ({ id: Date.now() + Math.random(), key: "", value: "" });

function RefKeyValueInput({ data = [], onChange }) {
  const rows = Array.isArray(data) ? data : [];
  const addRow = () => onChange([...rows, newKeyValue()]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  return (
    <div className="space-y-2 w-full">
      {rows.map((row, i) => (
        <div
          key={row.id || i}
          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 w-full"
        >
          <input
            value={row.key}
            onChange={(e) => update(i, "key", e.target.value)}
            placeholder="Key (e.g. Color)"
            className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
          />
          <input
            value={row.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder="Value (e.g. Straw Yellow)"
            className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
          />
          <button
            onClick={() => removeRow(i)}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 hover:bg-amber-50 rounded-md transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Pair
      </button>
    </div>
  );
}

function OptionsInput({ options = [], onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    if (input.trim()) {
      onChange([...options, input.trim()]);
      setInput("");
    }
  };
  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
          >
            {opt}
            <button
              onClick={() => onChange(options.filter((_, idx) => idx !== i))}
              className="text-blue-400 hover:text-blue-700 ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {options.length === 0 && <span className="text-xs text-gray-400 italic">No options added</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Type an option and press Enter..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
        />
        <button
          onClick={add}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StandardRangeSection({ field, sectionId }) {
  const { updateFieldStandardRange, updateField } = useSchemaStore();
  const scope = field.standardRange?.type || "none";
  const data = field.standardRange?.data;

  const setScope = (newScope) => {
    updateFieldStandardRange(sectionId, field.id, newScope, defaultDataForScope(newScope));
  };

  const setData = (newData) => updateFieldStandardRange(sectionId, field.id, scope, newData);

  return (
    <div className="space-y-4 p-4 bg-violet-50/50 rounded-xl border border-violet-100 w-full">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Standard Range Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
          >
            {RANGE_SCOPES.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Unit</label>
          <input
            value={field.unit || ""}
            onChange={(e) => updateField(sectionId, field.id, "unit", e.target.value)}
            placeholder="e.g. mmHg, bpm, mg/dL"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
      </div>

      {scope !== "none" && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-500" />
            Ranges
          </label>
          {scope === "simple" && <RangesSimpleInput data={data} onChange={setData} />}
          {scope === "age" && <RangesAgeInput data={data} onChange={setData} />}
          {scope === "gender" && <RangesGenderInput data={data} onChange={setData} />}
          {scope === "combined" && <RangesCombinedInput data={data} onChange={setData} />}
        </div>
      )}
    </div>
  );
}

function ReferenceValueSection({ field, sectionId }) {
  const { updateFieldReferenceValue } = useSchemaStore();
  const scope = field.referenceValue?.type || "none";
  const data = field.referenceValue?.data;

  const setScope = (newScope) => {
    const shape = newScope === "keyvalue" ? [] : {};
    updateFieldReferenceValue(sectionId, field.id, newScope, shape);
  };
  const setData = (newData) => updateFieldReferenceValue(sectionId, field.id, scope, newData);

  return (
    <div className="space-y-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100 w-full">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">Reference Value Type</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 bg-white"
        >
          {REFERENCE_VALUE_SCOPES.map((rt) => (
            <option key={rt.value} value={rt.value}>
              {rt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">Shown side-by-side with the entered value in the report/preview.</p>
      </div>

      {scope === "text" && <RefTextInput data={data} onChange={setData} />}
      {scope === "textarea" && <RefTextareaInput data={data} onChange={setData} />}
      {scope === "keyvalue" && <RefKeyValueInput data={data} onChange={setData} />}
    </div>
  );
}

// FieldCard now accepts drag handlers from its parent SectionCard so the
// whole header row can be picked up (click-and-hold) to reorder fields.
function FieldCard({ field, sectionId, fieldError, onDragStart, onDragOver, onDrop, isDragging }) {
  const [expanded, setExpanded] = useState(true);
  const { updateField, removeField } = useSchemaStore();
  const Icon = fieldTypeIcon(field.type);

  useEffect(() => {
    if (fieldError) setExpanded(true);
  }, [fieldError]);

  const isOptionType = ["radio", "select", "checkbox"].includes(field.type);
  const isTextType = ["textarea", "input"].includes(field.type);
  const isNumberType = field.type === "number";

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all hover:shadow-sm ${
        fieldError ? "border-red-300 ring-1 ring-red-200" : "border-gray-200 hover:border-gray-300"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver?.(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop?.(e);
        }}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
          expanded ? "bg-white" : fieldError ? "bg-red-50" : "bg-gray-50"
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-1.5 bg-gray-100 rounded-md cursor-grab active:cursor-grabbing" title="Drag to reorder">
          <GripVertical className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <div
          className={`p-1.5 rounded-md ${isNumberType ? "bg-violet-50" : isOptionType ? "bg-emerald-50" : "bg-amber-50"}`}
        >
          <Icon
            className={`w-3.5 h-3.5 ${isNumberType ? "text-violet-500" : isOptionType ? "text-emerald-500" : "text-amber-500"}`}
          />
        </div>
        <span className="font-medium text-sm text-gray-700 flex-1 truncate">
          {field.name || <span className="text-gray-400 italic font-normal">Untitled Field</span>}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
            {FIELD_TYPES.find((f) => f.value === field.type)?.label}
          </span>
          {isNumberType && field.standardRange?.type && field.standardRange.type !== "none" && (
            <span className="text-xs px-2 py-0.5 bg-violet-50 text-violet-500 rounded-full flex items-center gap-1">
              <Tags className="w-3 h-3" /> Ranges set
            </span>
          )}
          {isTextType && field.referenceValue?.type && field.referenceValue.type !== "none" && (
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">Reference set</span>
          )}
          {field.required && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">Required</span>}
          {fieldError && !expanded && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {fieldError}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeField(sectionId, field.id);
            }}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="p-4 border-t border-gray-100 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                Field Name <span className="text-red-400">*</span>
              </label>
              <input
                value={field.name}
                onChange={(e) => updateField(sectionId, field.id, "name", e.target.value)}
                placeholder="e.g. Hemoglobin"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all ${
                  fieldError ? "border-red-400 ring-1 ring-red-200" : "border-gray-200"
                }`}
              />
              {fieldError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldError}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Field Type</label>
              <select
                value={field.type}
                onChange={(e) => {
                  updateField(sectionId, field.id, "type", e.target.value);
                  updateField(sectionId, field.id, "standardRange", emptyStandardRange());
                  updateField(sectionId, field.id, "referenceValue", emptyReferenceValue());
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateField(sectionId, field.id, "required", !field.required)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                field.required
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {field.required ? "Required" : "Optional"}
            </button>
          </div>

          {isNumberType && <StandardRangeSection field={field} sectionId={sectionId} />}

          {isOptionType && (
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <label className="text-xs font-medium text-gray-600 block mb-2">Options</label>
              <OptionsInput
                options={field.options || []}
                onChange={(opts) => updateField(sectionId, field.id, "options", opts)}
              />
            </div>
          )}

          {isTextType && (
            <>
              <div className="w-40">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Max Length</label>
                <input
                  type="number"
                  value={field.maxLength ?? 200}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    updateField(sectionId, field.id, "maxLength", Number.isNaN(parsed) ? 200 : parsed);
                  }}
                  onWheel={preventWheelChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
              <ReferenceValueSection field={field} sectionId={sectionId} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// SectionCard now owns its own field-drag state and drives reorderFields;
// it also accepts drag handlers from the parent list so whole sections can
// be reordered by grabbing the section header.
function SectionCard({
  section,
  index,
  total,
  fieldErrors,
  sectionError,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}) {
  const [expanded, setExpanded] = useState(true);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState(null);
  const { updateSection, removeSection, addField, reorderFields } = useSchemaStore();
  const hasFieldError = section.fields.some((f) => fieldErrors[f.id]);
  const hasError = hasFieldError || !!sectionError;
  const showTitle = section.showTitleInReport !== false;

  return (
    <div className={`border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${isDragging ? "opacity-40" : ""}`}>
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver?.(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop?.(e);
        }}
        className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" title="Drag to reorder" />
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${hasError ? "bg-red-500" : "bg-blue-500"}`}
        >
          <span className="text-white text-xs font-bold">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={section.name}
            onChange={(e) => updateSection(section.id, "name", e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className={`w-full font-semibold text-gray-800 text-sm bg-transparent border-b focus:outline-none pb-0.5 transition-colors ${
              sectionError ? "border-red-400" : "border-transparent focus:border-blue-400"
            }`}
            placeholder="Section Name"
          />
          {sectionError && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {sectionError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">
            {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
          </span>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              updateSection(section.id, "showTitleInReport", !showTitle);
            }}
            title={
              showTitle
                ? "Section title visible in report — click to hide"
                : "Section title hidden in report — click to show"
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              showTitle
                ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
            }`}
          >
            {showTitle ? (
              <>
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">Title in report</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" />
                <span className="hidden sm:inline">Title hidden</span>
              </>
            )}
          </button>
          {total > 1 && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                removeSection(section.id);
              }}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-3 bg-white">
          {section.fields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">No fields yet</p>
              <p className="text-xs text-gray-300 mt-0.5">Add a field to this section</p>
            </div>
          ) : (
            section.fields.map((field, fi) => (
              <FieldCard
                key={field.id}
                field={field}
                sectionId={section.id}
                fieldError={fieldErrors[field.id]}
                isDragging={draggedFieldIndex === fi}
                onDragStart={() => setDraggedFieldIndex(fi)}
                onDragOver={() => {}}
                onDrop={() => {
                  if (draggedFieldIndex !== null && draggedFieldIndex !== fi) {
                    reorderFields(section.id, draggedFieldIndex, fi);
                  }
                  setDraggedFieldIndex(null);
                }}
              />
            ))
          )}
          <button
            onClick={() => addField(section.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-200 rounded-xl text-sm text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>
      )}
    </div>
  );
}

import SchemaRenderer from "../reportUpload/SchemaRenderer";
import schemaService from "../../api/schemaService";
import testService from "../../api/testService";

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-20 bg-gray-100 rounded-lg" />
      <div className="h-48 bg-gray-100 rounded-xl" />
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  );
}

function normalizeAgeValue(raw, isMax) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return {
      years: raw.years ?? "",
      months: raw.months ?? "",
      days: raw.days ?? "",
    };
  }
  if (raw === undefined || raw === null || raw === "") {
    return isMax ? { ...AGE_NO_LIMIT } : emptyAge();
  }
  if (isMax && Number(raw) >= 999) return { ...AGE_NO_LIMIT };
  return { years: Number(raw), months: 0, days: 0 };
}

function normalizeAgeRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((r) => ({
    ...r,
    ...(r.minAge !== undefined ? { minAge: normalizeAgeValue(r.minAge, false) } : {}),
    ...(r.maxAge !== undefined ? { maxAge: normalizeAgeValue(r.maxAge, true) } : {}),
  }));
}

function normalizeAgeData(scope, data) {
  if (scope !== "age" && scope !== "combined") return data;
  return normalizeAgeRows(data);
}

function normalizeSchema(apiSchema) {
  return {
    ...apiSchema,
    sections: (apiSchema.sections || []).map((sec) => ({
      ...sec,
      id: sec.id ?? sec._id ?? Date.now() + Math.random(),
      showTitleInReport: sec.showTitleInReport !== false,
      fields: (sec.fields || []).map((f) => ({
        ...f,
        id: f.id ?? f._id ?? Date.now() + Math.random(),
        maxLength: f.maxLength || 200,
        standardRange: f.standardRange
          ? {
              type: f.standardRange.type || "none",
              data: normalizeAgeData(
                f.standardRange.type,
                f.standardRange.data || defaultDataForScope(f.standardRange.type || "none"),
              ),
            }
          : emptyStandardRange(),
        referenceValue: f.referenceValue
          ? {
              type: f.referenceValue.type || "none",
              data: f.referenceValue.data ?? (f.referenceValue.type === "keyvalue" ? [] : {}),
            }
          : emptyReferenceValue(),
      })),
    })),
  };
}

// ─── Main SchemaBuilder ───────────────────────────────────────────────────────
export default function SchemaBuilder() {
  const {
    tests,
    loadingTests,
    schema,
    errors,
    fieldErrors,
    setTests,
    setLoadingTests,
    setSchema,
    resetSchema,
    setSchemaField,
    addSection,
    reorderSections,
    setErrors,
    setFieldErrors,
  } = useSchemaStore();

  const navigate = useNavigate();
  const { schemaId } = useParams();
  const isEditMode = Boolean(schemaId);

  const [loadingSchema, setLoadingSchema] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState(null);
  // Drives the toast's enter/exit transition using Tailwind transition
  // utilities instead of a CSS @keyframes animation. Starts false so the
  // toast mounts off-position/transparent, then flips true a frame later
  // so the browser animates the transition instead of snapping instantly.
  const [toastVisible, setToastVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");

  const showToast = (type, message) => {
    setToast({ type, message });
    setToastVisible(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setToastVisible(true)));
    setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToast(null), 300);
    }, 3500);
  };

  useEffect(() => {
    if (!isEditMode) {
      resetSchema();
    }
  }, [isEditMode]);

  useEffect(() => {
    const loadTests = async () => {
      setLoadingTests(true);
      try {
        const response = await testService.getAll();
        setTests(response.data);
      } catch (e) {
        console.error("Failed to load test list:", e);
        setTests([]);
      }
    };
    loadTests();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    const loadSchema = async () => {
      setLoadingSchema(true);
      setLoadError(null);
      try {
        const response = await schemaService.getById(schemaId);
        setSchema(normalizeSchema(response.data));
      } catch (e) {
        console.error("Failed to load schema:", e);
        setLoadError(e?.response?.data?.message || e?.message || "Failed to load schema. Please try again.");
      } finally {
        setLoadingSchema(false);
      }
    };
    loadSchema();
  }, [schemaId]);

  const validate = () => {
    const errs = {};
    if (!schema.testId) errs.testId = "Please select a test";
    if (!schema.description.trim()) errs.description = "Description is required";

    const seenSections = new Map();
    const sectionErrs = {};
    schema.sections.forEach((sec) => {
      const name = sec.name.trim();
      if (!name) {
        sectionErrs[sec.id] = "Section name is required";
        return;
      }
      const key = name.toLowerCase();
      if (seenSections.has(key)) {
        sectionErrs[sec.id] = "Duplicate section name";
        sectionErrs[seenSections.get(key)] = "Duplicate section name";
      } else {
        seenSections.set(key, sec.id);
      }
    });
    if (Object.keys(sectionErrs).length > 0) errs.sections = sectionErrs;

    const fErrs = {};
    schema.sections.forEach((sec) => {
      const seen = new Map();
      sec.fields.forEach((f) => {
        const name = f.name.trim();
        if (!name) {
          fErrs[f.id] = "Field name is required";
          return;
        }
        const key = name.toLowerCase();
        if (seen.has(key)) {
          fErrs[f.id] = "Duplicate field name in this section";
          fErrs[seen.get(key)] = "Duplicate field name in this section";
        } else {
          seen.set(key, f.id);
        }
      });
    });
    setFieldErrors(fErrs);
    return { errs, hasFieldErrors: Object.keys(fErrs).length > 0 };
  };

  const getOutput = () => ({
    description: schema.description,
    testId: schema.testId,
    hasStaticStandardRange: schema.hasStaticStandardRange,
    staticStandardRange: schema.staticStandardRange,
    sections: schema.sections.map(({ id, ...sec }) => ({
      ...sec,
      showTitleInReport: sec.showTitleInReport !== false,
      fields: sec.fields.map(({ id, ...f }) => f),
    })),
  });

  const handleSave = async () => {
    const { errs, hasFieldErrors } = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0 || hasFieldErrors) return;

    setSaving(true);
    const payload = getOutput();

    try {
      if (isEditMode) {
        await schemaService.update(schemaId, payload);
        showToast("success", "Schema updated successfully");
      } else {
        const response = await schemaService.create(payload);
        showToast("success", "Schema saved successfully");
        const newId = response?.data?._id;
        if (newId) navigate(`/schema-builder/${newId}`, { replace: true });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Save failed:", e);
      showToast(
        "error",
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loadingTests || loadingSchema;

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium border transition-all duration-300 ease-out ${
            toastVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          } ${
            toast.type === "success"
              ? "bg-white border-emerald-200 text-emerald-700"
              : "bg-white border-red-200 text-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link to="/schema-engine" className="hover:text-blue-600 transition-colors">
            Schemas
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">{isEditMode ? "Edit Schema" : "New Schema"}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              to="/schema-engine"
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-700 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900 truncate">{isEditMode ? "Edit Schema" : "New Schema"}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                {isEditMode && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded text-xs border border-blue-100">
                    Editing
                  </span>
                )}
                {schema.testId && (
                  <>
                    <span>Test · {tests.find((t) => t._id === schema.testId)?.name || "—"}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving || isLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm border ${
                saved
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-blue-600 border-blue-600 hover:bg-blue-700 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : saved ? "Saved!" : isEditMode ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <XCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span className="flex-1">{loadError}</span>
          <button onClick={() => window.location.reload()} className="text-xs font-medium underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Settings2 className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-800 text-sm">Basic Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  Test <span className="text-red-400">*</span>
                </label>
                <TestSearchSelect
                  tests={tests}
                  value={schema.testId}
                  onChange={(v) => setSchemaField("testId", v)}
                  error={errors.testId}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <input
                  value={schema.description}
                  onChange={(e) => setSchemaField("description", e.target.value)}
                  placeholder="Brief description of this schema"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all ${errors.description ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Static Standard Range</span>
                    <span className="text-xs text-gray-400">(Optional global range)</span>
                  </div>
                  <button
                    onClick={() => setSchemaField("hasStaticStandardRange", !schema.hasStaticStandardRange)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${schema.hasStaticStandardRange ? "bg-blue-500" : "bg-gray-300"}`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${schema.hasStaticStandardRange ? "translate-x-5" : ""}`}
                    />
                  </button>
                </div>
                {schema.hasStaticStandardRange && (
                  <textarea
                    value={schema.staticStandardRange}
                    onChange={(e) => setSchemaField("staticStandardRange", e.target.value)}
                    rows={2}
                    placeholder="Enter static standard range details..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab("builder")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "builder" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Builder
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "preview" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Form Preview
                </button>
              </div>
              {activeTab === "preview" && <span className="text-xs text-gray-400 italic">Live preview</span>}
              {activeTab === "builder" && (
                <details className="relative group">
                  <summary className="list-none flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer select-none transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                    JSON
                  </summary>
                  <div className="absolute right-0 top-full mt-2 z-30 w-[520px] max-w-[90vw] border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                    <pre className="p-4 text-xs bg-gray-900 text-green-300 overflow-auto max-h-72 font-mono leading-relaxed">
                      {JSON.stringify(getOutput(), null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>

            {activeTab === "builder" ? (
              <div className="px-5 py-5 space-y-4">
                {schema.sections.map((section, i) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    index={i}
                    total={schema.sections.length}
                    fieldErrors={fieldErrors}
                    sectionError={errors.sections?.[section.id]}
                    isDragging={draggedSectionIndex === i}
                    onDragStart={() => setDraggedSectionIndex(i)}
                    onDragOver={() => {}}
                    onDrop={() => {
                      if (draggedSectionIndex !== null && draggedSectionIndex !== i) {
                        reorderSections(draggedSectionIndex, i);
                      }
                      setDraggedSectionIndex(null);
                    }}
                  />
                ))}
                <button
                  onClick={addSection}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-sm text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>
            ) : (
              <div className="px-5 py-5">
                <SchemaRenderer schema={getOutput()} />
              </div>
            )}
          </div>

          <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-gradient-to-t from-white via-white to-transparent">
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3.5 shadow-lg shadow-gray-100">
              <Link
                to="/schema-engine"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Schemas
              </Link>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All changes saved
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || isLoading}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                    saved ? "bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saved ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving…" : saved ? "Saved!" : isEditMode ? "Update Schema" : "Save Schema"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
