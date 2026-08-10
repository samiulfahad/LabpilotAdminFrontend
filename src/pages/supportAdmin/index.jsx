import { useState, useEffect } from "react";
import { X } from "lucide-react";
import supportAdminService from "../../api/supportAdmin";
import Popup from "../../components/popup"; // adjust path to match your components folder layout
import Modal from "../../components/modal"; // adjust path to match your components folder layout

// ── Format ms-until-expiry into a short "Xh Ym" / "Expired" string ────────
function formatExpiry(expiresAt) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const mins = Math.floor(diffMs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

const VALIDITY_UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 };
const VALIDITY_UNITS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

// ── Small inline spinner for buttons ────────────────────────────────────
function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ── Skeleton row matching the real list-item layout ─────────────────────
function SkeletonRow() {
  return (
    <li className="flex items-center justify-between px-4 py-3">
      <div className="space-y-2">
        <div className="h-3.5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-3 w-14 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-10 animate-pulse rounded bg-slate-100" />
      </div>
    </li>
  );
}

// ── Manage Support Admins ───────────────────────────────────────────────────
// List + create (lab search → select → password) + delete one/all.
// CRUD only — login for these accounts happens on a separate backend.
export default function ManageSupportAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [validityAmount, setValidityAmount] = useState(""); // blank → backend default (1hr)
  const [validityUnit, setValidityUnit] = useState("hours");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // { type: "single", id, label } | { type: "all" } | null
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAdmins = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await supportAdminService.getAll();
      setAdmins(data.supportAdmins);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load support admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // ── Lab search (only while the modal is open and no lab picked yet) ────
  useEffect(() => {
    if (!showAddForm || selectedLab) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLabsLoading(true);
      try {
        const results = await supportAdminService.searchLabs(search);
        if (!cancelled) setLabs(results);
      } catch {
        if (!cancelled) setLabs([]);
      } finally {
        if (!cancelled) setLabsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, showAddForm, selectedLab]);

  const resetAddForm = () => {
    setShowAddForm(false);
    setSearch("");
    setLabs([]);
    setSelectedLab(null);
    setPhone("");
    setPassword("");
    setValidityAmount("");
    setValidityUnit("hours");
    setSubmitError("");
  };

  // Header "X" and footer "Cancel" both close by flipping isOpen to false
  // via resetAddForm — the same path the backdrop/Escape use through the
  // Modal's onClose prop — so every dismissal path animates consistently
  // instead of relying on an imperative ref method Modal may not expose.
  const requestCloseAddForm = () => {
    if (submitting) return;
    resetAddForm();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedLab || !password) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const amount = parseFloat(validityAmount);
      const validityMinutes =
        validityAmount.trim() && !Number.isNaN(amount) && amount > 0
          ? Math.round(amount * VALIDITY_UNIT_MINUTES[validityUnit])
          : undefined;

      await supportAdminService.create({
        labKey: selectedLab.labKey,
        ...(phone.trim() && { phone: phone.trim() }),
        password,
        ...(validityMinutes && { validityMinutes }),
      });
      resetAddForm();
      loadAdmins();
    } catch (err) {
      setSubmitError(err.response?.data?.error || "Failed to create support admin");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete confirm flow (Popup-driven) ──────────────────────────────────
  const requestDelete = (admin) => {
    setDeleteTarget({ type: "single", id: admin._id, label: `${admin.name} (#${admin.labKey})` });
  };

  const requestDeleteAll = () => {
    if (admins.length === 0) return;
    setDeleteTarget({ type: "all" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "single") {
      const { id } = deleteTarget;
      setDeletingId(id);
      try {
        await supportAdminService.deleteOne(id);
        setAdmins((prev) => prev.filter((a) => a._id !== id));
      } catch (err) {
        setError(err.response?.data?.error || "Failed to delete support admin");
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeletingAll(true);
      try {
        await supportAdminService.deleteAll();
        setAdmins([]);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to delete support admins");
      } finally {
        setDeletingAll(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Support Admins</h1>
        <div className="flex gap-2">
          {admins.length > 0 && (
            <button
              type="button"
              onClick={requestDeleteAll}
              disabled={deletingAll}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deletingAll && <Spinner className="h-3.5 w-3.5" />}
              {deletingAll ? "Deleting…" : "Delete All"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Support Admin
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {!loading && admins.length === 0 && !error && (
        <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
          No support admins right now.
        </p>
      )}

      {loading ? (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </ul>
      ) : (
        admins.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {admins.map((admin) => (
              <li key={admin._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {admin.name} <span className="font-mono text-xs text-slate-400">#{admin.labKey}</span>
                  </p>
                  <p className="text-xs text-slate-400">{admin.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${
                      new Date(admin.supportAdminExpiresAt) <= new Date() ? "text-red-500" : "text-teal-600"
                    }`}
                  >
                    {formatExpiry(admin.supportAdminExpiresAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => requestDelete(admin)}
                    disabled={deletingId === admin._id || deletingAll}
                    className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 disabled:opacity-50"
                  >
                    {deletingId === admin._id && <Spinner className="h-3 w-3" />}
                    {deletingId === admin._id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {/* ── Add Support Admin modal ─────────────────────────────────────── */}
      <Modal isOpen={showAddForm} size="sm" onClose={submitting ? undefined : resetAddForm}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">Add Support Admin</h2>
          <button
            type="button"
            onClick={requestCloseAddForm}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!selectedLab ? (
            <div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by lab key…"
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />

              <ul className="mt-3 max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                {labsLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-2">
                      <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-10 animate-pulse rounded bg-slate-100" />
                    </li>
                  ))}

                {!labsLoading &&
                  labs.map((lab) => (
                    <li key={lab._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLab(lab)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                      >
                        <span className="font-medium text-slate-700">{lab.name}</span>
                        <span className="font-mono text-xs text-slate-400">#{lab.labKey}</span>
                      </button>
                    </li>
                  ))}

                {!labsLoading && labs.length === 0 && (
                  <li className="px-3 py-2 text-sm text-slate-400">No labs found</li>
                )}
              </ul>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm">
                <span className="font-medium text-indigo-700">
                  {selectedLab.name} <span className="font-mono text-indigo-400">#{selectedLab.labKey}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLab(null)}
                  className="text-xs font-medium text-indigo-500 hover:underline"
                >
                  Change
                </button>
              </div>

              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (optional — defaults to 01111111111)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />

              <div>
                <input
                  type="number"
                  value={validityAmount}
                  onChange={(e) => setValidityAmount(e.target.value)}
                  placeholder="Validity (optional)"
                  min="1"
                  step="1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />

                <div className="mt-2 flex gap-4">
                  {VALIDITY_UNITS.map((unit) => (
                    <label key={unit.value} className="flex items-center gap-1.5 text-sm text-slate-600">
                      <input
                        type="radio"
                        name="validityUnit"
                        value={unit.value}
                        checked={validityUnit === unit.value}
                        onChange={(e) => setValidityUnit(e.target.value)}
                        className="h-3.5 w-3.5 accent-indigo-600"
                      />
                      {unit.label}
                    </label>
                  ))}
                </div>

                <p className="mt-1 text-xs text-slate-400">Leave blank for the default 1-hour validity.</p>
              </div>

              {submitError && <p className="text-sm text-red-500">{submitError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting && <Spinner />}
                  {submitting ? "Creating…" : "Create Support Admin"}
                </button>
                <button
                  type="button"
                  onClick={requestCloseAddForm}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ── Delete confirmation (single or all) ─────────────────────────── */}
      {deleteTarget && (
        <Popup
          type="warning"
          message={
            deleteTarget.type === "single"
              ? `Delete support admin ${deleteTarget.label}?`
              : `Delete all ${admins.length} support admin${admins.length === 1 ? "" : "s"}?`
          }
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
