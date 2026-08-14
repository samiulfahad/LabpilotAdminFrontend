import { Link } from "react-router-dom";
import { Upload, Pencil, PowerOff, Power, Trash2, Printer, LayoutList } from "lucide-react";

const Btn = ({ icon: Icon, label, onClick, variant = "default", as: Tag = "button", to, state }) => {
  const base =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap";
  const variants = {
    default: "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300",
    amber: "border border-amber-200 text-amber-600 hover:bg-amber-50",
    green: "border border-emerald-200 text-emerald-600 hover:bg-emerald-50",
    red: "border border-red-200 text-red-600 hover:bg-red-50",
    blue: "border border-blue-200 text-blue-600 hover:bg-blue-50",
    purple: "border border-purple-200 text-purple-600 hover:bg-purple-50",
    indigo: "border border-indigo-200 text-indigo-700 hover:bg-indigo-50",
    orange: "border border-orange-200 text-orange-600 hover:bg-orange-50",
  };

  if (Tag === Link) {
    return (
      <Link to={to} state={state} className={`${base} ${variants[variant]}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${base} ${variants[variant]}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
};

const Schema = ({ input, index, onDelete, onActivate, onDeactivate, onSetDefault }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 my-3 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Identity */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">{index + 1}</span>
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${input.isActive ? "bg-emerald-500" : "bg-red-400"}`}
              title={input.isActive ? "Active" : "Inactive"}
            />
            {input.description ? (
              <p className="text-sm text-gray-700 truncate">{input.description}</p>
            ) : (
              <p className="text-sm text-gray-400 italic truncate">No description</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Btn
            icon={Upload}
            label="Upload"
            variant="blue"
            onClick={() => window.open(`/schema-renderer/${input._id}`, "_blank")}
          />

          <Btn
            icon={Printer}
            label="Print A4"
            variant="indigo"
            onClick={() => window.open(`/report/${input._id}?layout=PLAIN`, "_blank")}
          />

          <Btn
            icon={LayoutList}
            label="Print PAD"
            variant="orange"
            onClick={() => window.open(`/report/${input._id}?layout=PAD`, "_blank")}
          />

          <Btn as={Link} to={`/schema-builder/${input._id}`} icon={Pencil} label="Edit" variant="default" />

          {input.isActive ? (
            <Btn icon={PowerOff} label="Deactivate" onClick={onDeactivate} variant="amber" />
          ) : (
            <Btn icon={Power} label="Activate" onClick={onActivate} variant="green" />
          )}

          <Btn icon={Trash2} label="Delete" onClick={onDelete} variant="red" />
        </div>
      </div>
    </div>
  );
};

export default Schema;
