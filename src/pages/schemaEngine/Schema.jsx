import { Link } from "react-router-dom";
import { Upload, Pencil, Trash2, Printer, Star } from "lucide-react";

const Btn = ({ icon: Icon, label, onClick, variant = "default", as: Tag = "button", to, state }) => {
  const base =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap";
  const variants = {
    default: "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300",
    red: "border border-red-200 text-red-600 hover:bg-red-50",
    blue: "border border-blue-200 text-blue-600 hover:bg-blue-50",
    indigo: "border border-indigo-200 text-indigo-700 hover:bg-indigo-50",
    amber: "border border-amber-200 text-amber-600 hover:bg-amber-50",
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

const Schema = ({ input, index, onDelete, onSetDefault }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 my-3 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Identity */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">{index + 1}</span>
          </div>
          <div className="min-w-0 flex items-center gap-2">
            {input.isDefault && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex-shrink-0">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Default
              </span>
            )}
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
            label="Print"
            variant="indigo"
            onClick={() => window.open(`/report/${input._id}?layout=PLAIN`, "_blank")}
          />

          <Btn as={Link} to={`/schema-builder/${input._id}`} icon={Pencil} label="Edit" variant="default" />

          {!input.isDefault && <Btn icon={Star} label="Set Default" onClick={onSetDefault} variant="amber" />}

          <Btn icon={Trash2} label="Delete" onClick={onDelete} variant="red" />
        </div>
      </div>
    </div>
  );
};

export default Schema;
