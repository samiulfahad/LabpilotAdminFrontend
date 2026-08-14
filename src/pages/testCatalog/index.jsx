import { useEffect, useState } from "react";
import {
  FlaskConical,
  Plus,
  Pencil,
  Trash2,
  X,
  Wifi,
  WifiOff,
  Tag,
  Layers,
  Search,
  AlertCircle,
  ChevronDown,
  Check,
  Star,
} from "lucide-react";
import Modal from "../../components/modal";
import Popup from "../../components/popup";
import testService from "../../api/testService";
import categoryService from "../../api/categoryService";
import schemaService from "../../api/schemaService";

/* ─── Shared Primitives ──────────────────────────────────── */

const TextInput = ({ label, required, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <input
      className="w-full px-3 py-2 text-[13.5px] rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      {...props}
    />
  </div>
);

const SelectInput = ({ label, required, children, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    <select
      className="w-full px-3 py-2 text-[13.5px] rounded-md border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      {...props}
    >
      {children}
    </select>
  </div>
);

const MHead = ({ icon: Icon, title, sub, onClose }) => (
  <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-none">{title}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
    <button
      onClick={onClose}
      className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <X size={14} />
    </button>
  </div>
);

const MFoot = ({ onClose, loading, label, disabled }) => (
  <div className="sticky bottom-0 z-10 flex justify-end gap-2 px-5 py-3.5 bg-gray-50 border-t border-gray-200">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
      {label}
    </button>
  </div>
);

/* ─── No-default flag ─────────────────────────────────────── */

const NoDefaultFlag = ({ compact }) => (
  <span
    className={`inline-flex items-center gap-1 font-semibold text-red-500 ${compact ? "text-[10px]" : "text-[10.5px] px-2 py-0.5 rounded border bg-red-50 border-red-200"}`}
  >
    <AlertCircle size={compact ? 10 : 11} />
    No default schema set
  </span>
);

/* ─── Schema Picker (list schemas already fetched by the parent,
       let the user mark one as default) ─────────────────────── */

const SchemaPicker = ({ schemas, currentDefaultSchemaId, onSetDefault }) => {
  if (schemas.length === 0)
    return (
      <div className="flex items-center gap-3 px-3 py-3 rounded-md border border-dashed border-gray-300 bg-gray-50">
        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
          <WifiOff size={13} className="text-gray-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600">No schemas available</p>
          <p className="text-[10.5px] text-gray-400 mt-0.5">Add a schema to bring this test online</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-1.5">
      {schemas.map((s) => {
        const sid = s._id.toString();
        const isDefault = currentDefaultSchemaId === sid;
        return (
          <div
            key={s._id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition-colors ${isDefault ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"}`}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${isDefault ? "text-amber-700" : "text-gray-700"}`}>
                {s.description || "Untitled schema"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {s.sections?.length > 0 && (
                  <span className="text-[10px] text-gray-300">
                    {s.sections.length} section{s.sections.length !== 1 ? "s" : ""}
                  </span>
                )}
                {s.isActive === false && <span className="text-[10px] text-gray-300">Inactive</span>}
              </div>
            </div>
            {isDefault ? (
              <button
                type="button"
                onClick={() => onSetDefault(null)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-amber-100 text-amber-700 border-amber-300 flex items-center gap-1 hover:bg-amber-200 transition-colors shrink-0"
                title="Click to unset default"
              >
                <Star size={10} className="fill-amber-600 text-amber-600" />
                Default
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSetDefault(sid)}
                className="text-[10px] font-medium px-2 py-0.5 rounded border border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-colors shrink-0"
              >
                Set default
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Modals ─────────────────────────────────────────────── */

const CategoryModal = ({ isOpen, onClose, onSave, initial, mode }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isOpen) setName(initial?.name ?? "");
  }, [isOpen, initial]);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ name });
      onClose();
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <form onSubmit={submit}>
        <MHead
          icon={Tag}
          title={mode === "create" ? "Add Category" : "Edit Category"}
          sub="Test grouping"
          onClose={onClose}
        />
        <div className="px-5 py-5">
          <TextInput
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Haematology"
            autoFocus
          />
        </div>
        <MFoot
          onClose={onClose}
          loading={loading}
          disabled={!name.trim()}
          label={mode === "create" ? "Add Category" : "Save Changes"}
        />
      </form>
    </Modal>
  );
};

const TestModal = ({ isOpen, onClose, onSave, initial, mode, categories, defaultCategoryId, schemas }) => {
  const [form, setForm] = useState({ name: "", categoryId: "", defaultSchemaId: "" });
  const [loading, setLoading] = useState(false);
  const isEdit = mode === "edit";
  const isOnline = schemas.length > 0;

  useEffect(() => {
    if (isOpen)
      setForm(
        initial
          ? { name: initial.name, categoryId: initial.categoryId ?? "", defaultSchemaId: initial.defaultSchemaId ?? "" }
          : { name: "", categoryId: defaultCategoryId ?? "", defaultSchemaId: "" },
      );
  }, [isOpen, initial, defaultCategoryId]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        name: form.name,
        categoryId: form.categoryId,
        ...(isEdit && { defaultSchemaId: form.defaultSchemaId?.trim() || null }),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <form onSubmit={submit}>
        <MHead
          icon={FlaskConical}
          title={isEdit ? "Edit Test" : "Add Test"}
          sub="Test catalog entry"
          onClose={onClose}
        />
        <div className="px-5 py-5 space-y-4">
          <TextInput
            label="Test Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. CBC"
            autoFocus
          />
          <SelectInput
            label="Category"
            required
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">— Select —</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </SelectInput>
          {isEdit && initial?._id && (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-1.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Schemas ({schemas.length})
                </p>
                <div className="flex items-center gap-1.5">
                  {isOnline && !form.defaultSchemaId && <NoDefaultFlag compact />}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[10px] font-semibold ${isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}
                  >
                    {isOnline ? (
                      <>
                        <Wifi size={10} />
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff size={10} />
                        Offline
                      </>
                    )}
                  </span>
                </div>
              </div>
              <SchemaPicker
                schemas={schemas}
                currentDefaultSchemaId={form.defaultSchemaId || null}
                onSetDefault={(id) => setForm((f) => ({ ...f, defaultSchemaId: id ?? "" }))}
              />
            </div>
          )}
        </div>
        <MFoot
          onClose={onClose}
          loading={loading}
          disabled={!form.name.trim() || !form.categoryId}
          label={isEdit ? "Save Changes" : "Add Test"}
        />
      </form>
    </Modal>
  );
};

/* ─── Stat Card ──────────────────────────────────────────── */

const StatCard = ({ icon: Icon, label, value, tone = "neutral", loading }) => {
  const tones = {
    neutral: "bg-gray-100 text-gray-500",
    emerald: "bg-emerald-50 text-emerald-600",
    gray: "bg-gray-100 text-gray-400",
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-gray-200 bg-white">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-gray-900 leading-none tabular-nums">{loading ? "—" : value}</p>
        <p className="text-[11px] text-gray-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
};

/* ─── Category Dropdown ───────────────────────────────────────
   A single compact control replaces the horizontal chip row —
   stays the same width no matter how many categories exist, and
   frees up the toolbar instead of pushing it down a row. */

const CategoryOption = ({ active, tone = "default", label, count, onClick, onEdit, onDelete }) => (
  <div
    className={`group flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors ${active ? "bg-gray-50" : "hover:bg-gray-50"}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2 min-w-0">
      <span className={`w-3.5 shrink-0 ${active ? "text-gray-900" : "text-transparent"}`}>
        <Check size={13} />
      </span>
      <span
        className={`text-[13px] truncate ${tone === "amber" ? "text-amber-600 font-medium" : active ? "text-gray-900 font-semibold" : "text-gray-600 font-medium"}`}
      >
        {label}
      </span>
    </div>
    <div className="flex items-center gap-1 shrink-0">
      <span
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400"}`}
      >
        {count}
      </span>
      {(onEdit || onDelete) && (
        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }}
              className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700"
            >
              <Pencil size={9} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
              }}
              className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-red-500"
            >
              <Trash2 size={9} />
            </button>
          )}
        </span>
      )}
    </div>
  </div>
);

const CategoryDropdown = ({
  loading,
  categories,
  activeCatId,
  totalCount,
  uncategorized,
  countFor,
  activeLabel,
  activeCount,
  onSelect,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors min-w-[190px] justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="flex items-center gap-2 truncate">
          <Layers size={13} className="text-gray-400 shrink-0" />
          <span className="truncate">{activeLabel}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 shrink-0">
            {loading ? "—" : activeCount}
          </span>
        </span>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 w-72 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1.5">
            <CategoryOption
              active={activeCatId === "__all__"}
              label="All Tests"
              count={totalCount}
              onClick={() => {
                onSelect("__all__");
                setOpen(false);
              }}
            />
            {!loading && categories.length > 0 && <div className="h-px bg-gray-100 my-1.5" />}
            {!loading &&
              categories.map((cat) => (
                <CategoryOption
                  key={cat._id}
                  active={activeCatId === cat._id}
                  label={cat.name}
                  count={countFor(cat._id)}
                  onClick={() => {
                    onSelect(cat._id);
                    setOpen(false);
                  }}
                  onEdit={() => {
                    setOpen(false);
                    onEditCategory(cat);
                  }}
                  onDelete={() => {
                    setOpen(false);
                    onDeleteCategory(cat);
                  }}
                />
              ))}
            {!loading && uncategorized.length > 0 && (
              <>
                <div className="h-px bg-gray-100 my-1.5" />
                <CategoryOption
                  active={activeCatId === "__none__"}
                  tone="amber"
                  label="Uncategorized"
                  count={uncategorized.length}
                  onClick={() => {
                    onSelect("__none__");
                    setOpen(false);
                  }}
                />
              </>
            )}
            <div className="h-px bg-gray-100 my-1.5" />
            <button
              onClick={() => {
                setOpen(false);
                onAddCategory();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <Plus size={13} />
              New Category
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Status Badge ───────────────────────────────────────── */

const StatusBadge = ({ online }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${online ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}
  >
    {online ? <Wifi size={9} /> : <WifiOff size={9} />}
    {online ? "Online" : "Offline"}
  </span>
);

/* ─── Table Row ──────────────────────────────────────────── */

const TestRow = ({ test, categoryName, schemas, onEdit, onDelete }) => {
  const online = schemas.length > 0;
  return (
    <tr className="group border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${online ? "bg-emerald-500" : "bg-gray-300"}`} />
          <span className="text-[13px] font-medium text-gray-800">{test.name}</span>
          {online &&
            (test.defaultSchemaId ? (
              <Star size={11} className="fill-amber-500 text-amber-500 shrink-0" title="Default schema set" />
            ) : (
              <AlertCircle size={11} className="text-red-400 shrink-0" title="No default schema set" />
            ))}
        </div>
      </td>
      <td className="px-4 py-3">
        {categoryName ? (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">{categoryName}</span>
        ) : (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-600">Uncategorized</span>
        )}
      </td>
      <td className="px-4 py-3">
        {!online ? (
          <StatusBadge online={false} />
        ) : (
          <div className="flex items-center gap-1.5">
            <StatusBadge online={true} />
            <span className="text-[10px] text-gray-400">
              {schemas.length} schema{schemas.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(test)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(test)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const SkeletonRow = () => (
  <tr className="border-b border-gray-100 last:border-0">
    <td className="px-4 py-3">
      <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-100 rounded w-14 animate-pulse" />
    </td>
    <td className="px-4 py-3" />
  </tr>
);

/* ─── Main Page ──────────────────────────────────────────── */

const TestCatalog = () => {
  const [categories, setCategories] = useState([]);
  const [tests, setTests] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCatId, setActiveCatId] = useState("__all__");
  const [popup, setPopup] = useState({ open: false, type: "success", message: "", onConfirm: null });
  const [catM, setCatM] = useState({ open: false, mode: "create", initial: null });
  const [testM, setTestM] = useState({ open: false, mode: "create", initial: null, defaultCategoryId: null });

  const showPopup = (type, message, onConfirm = null) => setPopup({ open: true, type, message, onConfirm });
  const closePopup = () => setPopup((p) => ({ ...p, open: false, onConfirm: null }));

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, tRes, sRes] = await Promise.all([
        categoryService.getAll(),
        testService.getAll(),
        schemaService.getAll(),
      ]);
      setCategories(Array.isArray(cRes.data) ? cRes.data : (cRes.data?.data ?? []));
      setTests(Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data ?? []));
      setSchemas(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data ?? []));
    } catch {
      showPopup("error", "Failed to load catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const catIds = new Set(categories.map((c) => c._id));
  const catNameById = Object.fromEntries(categories.map((c) => [c._id, c.name]));

  // Schemas grouped by the test they belong to — a test is "online" solely
  // by having at least one entry here, not by any field on the test doc.
  const schemasByTestId = schemas.reduce((acc, s) => {
    const tid = s.testId?.toString ? s.testId.toString() : s.testId;
    if (!tid) return acc;
    (acc[tid] ??= []).push(s);
    return acc;
  }, {});
  const schemasFor = (testId) => schemasByTestId[testId] ?? [];

  const baseTests =
    activeCatId === "__all__"
      ? tests
      : activeCatId === "__none__"
        ? tests.filter((t) => !t.categoryId || !catIds.has(t.categoryId))
        : tests.filter((t) => t.categoryId === activeCatId);

  const q = search.trim().toLowerCase();
  const visibleTests = q ? baseTests.filter((t) => t.name.toLowerCase().includes(q)) : baseTests;

  const totalOnline = tests.filter((t) => schemasFor(t._id).length > 0).length;
  const totalOffline = tests.length - totalOnline;
  const uncategorized = tests.filter((t) => !t.categoryId || !catIds.has(t.categoryId));

  const countFor = (catId) => tests.filter((t) => t.categoryId === catId).length;
  const activeCat = categories.find((c) => c._id === activeCatId);

  const saveCategory = async (data) => {
    try {
      catM.mode === "create"
        ? await categoryService.create(data)
        : await categoryService.update(catM.initial._id, data);
      showPopup("success", catM.mode === "create" ? "Category added!" : "Category updated!");
      fetchAll();
    } catch (e) {
      showPopup("error", e?.response?.data?.message || "Failed.");
      throw e;
    }
  };

  const deleteCategory = (cat) =>
    showPopup("warning", `Delete "${cat.name}"? Tests will become uncategorized.`, async () => {
      try {
        await categoryService.delete(cat._id);
        showPopup("success", "Deleted!");
        fetchAll();
        if (activeCatId === cat._id) setActiveCatId("__all__");
      } catch {
        showPopup("error", "Failed.");
      }
    });

  const saveTest = async (data) => {
    try {
      testM.mode === "create" ? await testService.create(data) : await testService.update(testM.initial._id, data);
      showPopup("success", testM.mode === "create" ? "Test added!" : "Test updated!");
      fetchAll();
    } catch (e) {
      showPopup("error", e?.response?.data?.message || "Failed.");
      throw e;
    }
  };

  const deleteTest = (test) =>
    showPopup("warning", `Delete "${test.name}"?`, async () => {
      try {
        await testService.delete(test._id);
        showPopup("success", "Deleted!");
        fetchAll();
      } catch {
        showPopup("error", "Failed.");
      }
    });

  const openAddTest = () =>
    setTestM({
      open: true,
      mode: "create",
      initial: null,
      defaultCategoryId: activeCatId === "__all__" || activeCatId === "__none__" ? null : activeCatId,
    });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Lab Configuration</p>
          <h1 className="text-xl font-semibold text-gray-900 leading-none">Test Catalog</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatM({ open: true, mode: "create", initial: null })}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Tag size={13} />
            <span className="hidden sm:inline">New Category</span>
          </button>
          <button
            onClick={openAddTest}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">New Test</span>
            <span className="sm:hidden">Test</span>
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={FlaskConical} label="Total Tests" value={tests.length} loading={loading} tone="neutral" />
        <StatCard icon={Layers} label="Categories" value={categories.length} loading={loading} tone="neutral" />
        <StatCard icon={Wifi} label="Online Tests" value={totalOnline} loading={loading} tone="emerald" />
        <StatCard icon={WifiOff} label="Offline Tests" value={totalOffline} loading={loading} tone="gray" />
      </div>

      {/* Empty state */}
      {!loading && categories.length === 0 && tests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-lg border border-dashed border-gray-300">
          <div className="w-14 h-14 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center mb-3">
            <FlaskConical size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">No catalog yet</p>
          <p className="text-xs text-gray-400 mb-5 max-w-[220px]">
            Start by adding a category, then add tests under it.
          </p>
          <button
            onClick={() => setCatM({ open: true, mode: "create", initial: null })}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Tag size={13} />
            Add First Category
          </button>
        </div>
      )}

      {/* Single-column content: horizontal category filter on top, full-width table below */}
      {(loading || categories.length > 0 || tests.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Toolbar: category dropdown + result count + search, all in one row */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50/60 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <CategoryDropdown
                loading={loading}
                categories={categories}
                activeCatId={activeCatId}
                totalCount={tests.length}
                uncategorized={uncategorized}
                countFor={countFor}
                activeLabel={
                  activeCatId === "__all__"
                    ? "All Tests"
                    : activeCatId === "__none__"
                      ? "Uncategorized"
                      : (activeCat?.name ?? "All Tests")
                }
                activeCount={
                  activeCatId === "__all__"
                    ? tests.length
                    : activeCatId === "__none__"
                      ? uncategorized.length
                      : countFor(activeCatId)
                }
                onSelect={setActiveCatId}
                onEditCategory={(cat) => setCatM({ open: true, mode: "edit", initial: cat })}
                onDeleteCategory={deleteCategory}
                onAddCategory={() => setCatM({ open: true, mode: "create", initial: null })}
              />
              <span className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700 tabular-nums">{loading ? "—" : visibleTests.length}</span>{" "}
                tests
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search size={12} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tests…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-40 sm:w-56 pl-7 pr-7 py-1.5 text-xs rounded-md border border-gray-300 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition border-none bg-transparent cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-200">
                  <th className="px-4 py-2.5 font-semibold">Test Name</th>
                  <th className="px-4 py-2.5 font-semibold">Category</th>
                  <th className="px-4 py-2.5 font-semibold">Schemas</th>
                  <th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : visibleTests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-11 h-11 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center mb-3">
                          {search ? (
                            <Search size={18} className="text-gray-300" />
                          ) : (
                            <FlaskConical size={18} className="text-gray-300" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">
                          {search ? `No results for "${search}"` : "No tests here yet"}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                          {search ? "Try a different search term." : "Add a test to get started."}
                        </p>
                        {!search && activeCatId !== "__none__" && (
                          <button
                            onClick={openAddTest}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <Plus size={12} />
                            Add Test
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleTests.map((t) => (
                    <TestRow
                      key={t._id}
                      test={t}
                      categoryName={catNameById[t.categoryId]}
                      schemas={schemasFor(t._id)}
                      onEdit={(t) => setTestM({ open: true, mode: "edit", initial: t, defaultCategoryId: null })}
                      onDelete={deleteTest}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CategoryModal
        isOpen={catM.open}
        onClose={() => setCatM((f) => ({ ...f, open: false }))}
        onSave={saveCategory}
        initial={catM.initial}
        mode={catM.mode}
      />
      <TestModal
        isOpen={testM.open}
        onClose={() => setTestM((f) => ({ ...f, open: false }))}
        onSave={saveTest}
        initial={testM.initial}
        mode={testM.mode}
        categories={categories}
        defaultCategoryId={testM.defaultCategoryId}
        schemas={testM.initial ? schemasFor(testM.initial._id) : []}
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

export default TestCatalog;
