import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { create } from "zustand";
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
} from "lucide-react";

// ─── Zustand Store ────────────────────────────────────────────────────────────
const INITIAL_SCHEMA = {
  description: "",
  testId: "",
  isActive: true,
  hasStaticStandardRange: false,
  staticStandardRange: "",
  sections: [{ id: Date.now(), name: "Section A", showTitleInReport: true, fields: [] }],
};

const useSchemaStore = create((set, get) => ({
  tests: [],
  loadingTests: true,
  schema: INITIAL_SCHEMA,
  errors: {},
  fieldErrors: {},

  setTests: (tests) => set({ tests, loadingTests: false }),
  setLoadingTests: (v) => set({ loadingTests: v }),
  setSchema: (schema) => set({ schema }),
  resetSchema: () =>
    set({
      schema: {
        ...INITIAL_SCHEMA,
        sections: [{ id: Date.now(), name: "Section A", showTitleInReport: true, fields: [] }],
      },
      errors: {},
      fieldErrors: {},
    }),
  setSchemaField: (key, value) =>
    set((s) => ({ schema: { ...s.schema, [key]: value }, errors: { ...s.errors, [key]: undefined } })),
  setErrors: (errors) => set({ errors }),
  setFieldErrors: (fieldErrors) => set({ fieldErrors }),

  addSection: () =>
    set((s) => ({
      schema: {
        ...s.schema,
        sections: [
          ...s.schema.sections,
          {
            id: Date.now(),
            name: `Section ${String.fromCharCode(65 + s.schema.sections.length)}`,
            showTitleInReport: true,
            fields: [],
          },
        ],
      },
    })),

  removeSection: (sectionId) =>
    set((s) => ({
      schema: { ...s.schema, sections: s.schema.sections.filter((sec) => sec.id !== sectionId) },
    })),

  updateSection: (sectionId, key, value) =>
    set((s) => ({
      schema: {
        ...s.schema,
        sections: s.schema.sections.map((sec) => (sec.id === sectionId ? { ...sec, [key]: value } : sec)),
      },
    })),

  addField: (sectionId) =>
    set((s) => ({
      schema: {
        ...s.schema,
        sections: s.schema.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                fields: [
                  ...sec.fields,
                  {
                    id: Date.now(),
                    name: "",
                    type: "number",
                    required: false,
                    standardRange: { type: "none", data: {} },
                    unit: "",
                    options: [],
                    maxLength: 200,
                  },
                ],
              }
            : sec,
        ),
      },
    })),

  removeField: (sectionId, fieldId) =>
    set((s) => ({
      schema: {
        ...s.schema,
        sections: s.schema.sections.map((sec) =>
          sec.id === sectionId ? { ...sec, fields: sec.fields.filter((f) => f.id !== fieldId) } : sec,
        ),
      },
    })),

  updateField: (sectionId, fieldId, key, value) =>
    set((s) => ({
      schema: {
        ...s.schema,
        sections: s.schema.sections.map((sec) =>
          sec.id === sectionId
            ? { ...sec, fields: sec.fields.map((f) => (f.id === fieldId ? { ...f, [key]: value } : f)) }
            : sec,
        ),
      },
      fieldErrors: key === "name" ? { ...s.fieldErrors, [fieldId]: undefined } : s.fieldErrors,
    })),

  updateFieldStandardRange: (sectionId, fieldId, rangeType, data) =>
    set((s) => ({
      schema: {
        ...s.schema,
        sections: s.schema.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                fields: sec.fields.map((f) =>
                  f.id === fieldId ? { ...f, standardRange: { type: rangeType, data } } : f,
                ),
              }
            : sec,
        ),
      },
    })),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const FIELD_TYPES = [
  { value: "number", label: "Number", icon: Hash },
  { value: "radio", label: "Radio", icon: ToggleLeft },
  { value: "select", label: "Dropdown", icon: List },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "textarea", label: "Textarea", icon: AlignLeft },
  { value: "input", label: "Text", icon: Type },
];

const RANGE_TYPES = [
  { value: "none", label: "None" },
  { value: "simple", label: "Simple" },
  { value: "age", label: "Age Based" },
  { value: "gender", label: "Gender Based" },
  { value: "combined", label: "Complex (Age + Gender)" },
];

const fieldTypeIcon = (type) => {
  const ft = FIELD_TYPES.find((f) => f.value === type);
  return ft ? ft.icon : Hash;
};

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

function SimpleRangeInput({ data, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Min Value</label>
        <input
          type="number"
          value={data?.min || ""}
          onChange={(e) => onChange({ ...data, min: e.target.value })}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Max Value</label>
        <input
          type="number"
          value={data?.max || ""}
          onChange={(e) => onChange({ ...data, max: e.target.value })}
          placeholder="100"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
        />
      </div>
    </div>
  );
}

function AgeRangeInput({ data = [], onChange }) {
  const rows = Array.isArray(data) ? data : [];
  const addRow = () => onChange([...rows, { minAge: "", maxAge: "", minValue: "", maxValue: "" }]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const handleMaxAgeBlur = (i, val) => {
    if (val === "" || val === null || val === undefined) update(i, "maxAge", 999);
  };

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-5 gap-2 items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
          {[
            ["minAge", "Min Age", false],
            ["maxAge", "Max Age", true],
            ["minValue", "Min Val", false],
            ["maxValue", "Max Val", false],
          ].map(([k, lbl, isMaxAge]) => (
            <div key={k}>
              <label className="text-xs text-gray-400 block mb-0.5">{lbl}</label>
              <input
                type="number"
                value={isMaxAge && (row[k] === 999 || row[k] === "") ? "" : row[k] || ""}
                placeholder={isMaxAge ? "∞ (no limit)" : ""}
                onChange={(e) => update(i, k, e.target.value)}
                onBlur={isMaxAge ? (e) => handleMaxAgeBlur(i, e.target.value) : undefined}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          ))}
          <button
            onClick={() => removeRow(i)}
            className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded-md transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Age Range
      </button>
    </div>
  );
}

function GenderRangeInput({ data = {}, onChange }) {
  const update = (gender, key, val) => onChange({ ...data, [gender]: { ...(data[gender] || {}), [key]: val } });
  return (
    <div className="space-y-3">
      {["male", "female"].map((gender) => (
        <div key={gender} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm font-medium capitalize text-gray-700">{gender}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${gender === "male" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}
            >
              {gender === "male" ? "♂" : "♀"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["min", "max"].map((k) => (
              <div key={k}>
                <label className="text-xs text-gray-400 mb-1 block capitalize">{k}</label>
                <input
                  type="number"
                  value={data[gender]?.[k] || ""}
                  onChange={(e) => update(gender, k, e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CombinedRangeInput({ data = [], onChange }) {
  const rows = Array.isArray(data) ? data : [];
  const addRow = () => onChange([...rows, { gender: "male", minAge: "", maxAge: 999, minValue: "", maxValue: "" }]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i, key, val) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-6 gap-2 items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">Gender</label>
            <select
              value={row.gender}
              onChange={(e) => update(i, "gender", e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          {[
            ["minAge", "Min Age"],
            ["maxAge", "Max Age"],
            ["minValue", "Min Val"],
            ["maxValue", "Max Val"],
          ].map(([k, lbl]) => (
            <div key={k}>
              <label className="text-xs text-gray-400 block mb-0.5">{lbl}</label>
              <input
                type="number"
                value={k === "maxAge" && (row[k] === 999 || row[k] === "") ? "" : row[k] || ""}
                placeholder={k === "maxAge" ? "∞ (no limit)" : ""}
                onChange={(e) => update(i, k, e.target.value === "" ? "" : Number(e.target.value))}
                onBlur={(e) => {
                  if (k === "maxAge" && e.target.value === "") update(i, "maxAge", 999);
                }}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          ))}
          <button
            onClick={() => removeRow(i)}
            className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded-md transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Range
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
    <div className="space-y-2">
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

function FieldCard({ field, sectionId, fieldError }) {
  const [expanded, setExpanded] = useState(true);
  const { updateField, removeField, updateFieldStandardRange } = useSchemaStore();
  const Icon = fieldTypeIcon(field.type);

  useEffect(() => {
    if (fieldError) setExpanded(true);
  }, [fieldError]);

  const isOptionType = ["radio", "select", "checkbox"].includes(field.type);
  const isTextType = ["textarea", "input"].includes(field.type);
  const isNumberType = field.type === "number";

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all hover:shadow-sm ${fieldError ? "border-red-300 ring-1 ring-red-200" : "border-gray-200 hover:border-gray-300"}`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${expanded ? "bg-white" : fieldError ? "bg-red-50" : "bg-gray-50"}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-1.5 bg-gray-100 rounded-md">
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
          {field.required && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">Required</span>}
          {fieldError && !expanded && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Name required
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
                  updateFieldStandardRange(sectionId, field.id, "none", {});
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

          {isNumberType && (
            <div className="space-y-4 p-4 bg-violet-50/50 rounded-xl border border-violet-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Standard Range Type</label>
                  <select
                    value={field.standardRange?.type || "none"}
                    onChange={(e) =>
                      updateFieldStandardRange(
                        sectionId,
                        field.id,
                        e.target.value,
                        e.target.value === "age" || e.target.value === "combined" ? [] : {},
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
                  >
                    {RANGE_TYPES.map((rt) => (
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
              {field.standardRange?.type === "simple" && (
                <SimpleRangeInput
                  data={field.standardRange.data}
                  onChange={(data) => updateFieldStandardRange(sectionId, field.id, "simple", data)}
                />
              )}
              {field.standardRange?.type === "age" && (
                <AgeRangeInput
                  data={field.standardRange.data}
                  onChange={(data) => updateFieldStandardRange(sectionId, field.id, "age", data)}
                />
              )}
              {field.standardRange?.type === "gender" && (
                <GenderRangeInput
                  data={field.standardRange.data}
                  onChange={(data) => updateFieldStandardRange(sectionId, field.id, "gender", data)}
                />
              )}
              {field.standardRange?.type === "combined" && (
                <CombinedRangeInput
                  data={field.standardRange.data}
                  onChange={(data) => updateFieldStandardRange(sectionId, field.id, "combined", data)}
                />
              )}
            </div>
          )}

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
            <div className="w-40">
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Max Length</label>
              <input
                type="number"
                value={field.maxLength || 200}
                onChange={(e) => updateField(sectionId, field.id, "maxLength", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, index, total, fieldErrors }) {
  const [expanded, setExpanded] = useState(true);
  const { updateSection, removeSection, addField } = useSchemaStore();
  const hasSectionError = section.fields.some((f) => fieldErrors[f.id]);
  const showTitle = section.showTitleInReport !== false;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${hasSectionError ? "bg-red-500" : "bg-blue-500"}`}
        >
          <span className="text-white text-xs font-bold">{index + 1}</span>
        </div>
        <input
          value={section.name}
          onChange={(e) => updateSection(section.id, "name", e.target.value)}
          className="flex-1 font-semibold text-gray-800 text-sm bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none pb-0.5 transition-colors"
          placeholder="Section Name"
        />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">
            {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
          </span>
          <button
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
              onClick={() => removeSection(section.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
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
            section.fields.map((field) => (
              <FieldCard key={field.id} field={field} sectionId={section.id} fieldError={fieldErrors[field.id]} />
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
  const [activeTab, setActiveTab] = useState("builder");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Reset store when mounting in create mode ──
  useEffect(() => {
    if (!isEditMode) {
      resetSchema();
    }
  }, [isEditMode]);

  // ── Load tests ──
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

  // ── Load schema in edit mode ──
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

    const fErrs = {};
    schema.sections.forEach((sec) => {
      sec.fields.forEach((f) => {
        if (!f.name.trim()) fErrs[f.id] = "Field name is required";
      });
    });
    setFieldErrors(fErrs);
    return { errs, hasFieldErrors: Object.keys(fErrs).length > 0 };
  };

  const getOutput = () => ({
    description: schema.description,
    testId: schema.testId,
    isActive: schema.isActive,
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
    if (Object.keys(errs).length > 0) setErrors(errs);
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
      <style>{`@keyframes slideInRight { from { opacity: 0; transform: translateX(1rem); } to { opacity: 1; transform: translateX(0); } }`}</style>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all border ${
            toast.type === "success"
              ? "bg-white border-emerald-200 text-emerald-700"
              : "bg-white border-red-200 text-red-600"
          }`}
          style={{ animation: "slideInRight 0.25s ease" }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Breadcrumb + page title */}
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
              onClick={() => setSchemaField("isActive", !schema.isActive)}
              className={`relative flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                schema.isActive
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
              }`}
            >
              <span
                className={`w-7 h-4 rounded-full flex-shrink-0 transition-colors relative ${schema.isActive ? "bg-emerald-400" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${schema.isActive ? "left-3.5" : "left-0.5"}`}
                />
              </span>
              {schema.isActive ? "Active" : "Inactive"}
            </button>

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

      {/* Schema load error banner */}
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
          {/* Basic Info Card */}
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

              {/* Static Standard Range */}
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

          {/* Builder / Preview */}
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

          {/* Sticky bottom bar */}
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
