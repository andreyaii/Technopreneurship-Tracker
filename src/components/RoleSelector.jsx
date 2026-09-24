import { User, ShieldCheck } from "lucide-react";

/**
 * Two-option selectable pill/toggle component side-by-side:
 * [Icon] Student and [Icon] Adviser.
 */
export default function RoleSelector({ role, onChange, disabled = false }) {
  const isStudent = role === "student";
  const isAdviser = role === "adviser";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Log in as
      </span>

      <div
        role="radiogroup"
        aria-label="Select login role"
        className="grid grid-cols-2 p-1.5 bg-gray-100 rounded-xl border border-gray-200/80 gap-1.5"
      >
        {/* Student Option Pill */}
        <button
          type="button"
          role="radio"
          aria-checked={isStudent}
          disabled={disabled}
          onClick={() => onChange("student")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed ${
            isStudent
              ? "bg-white text-gray-900 shadow-sm border border-gray-200/90"
              : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              isStudent ? "bg-brand-yellow text-brand-black" : "text-gray-400"
            }`}
          >
            <User className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span>Student</span>
        </button>

        {/* Adviser Option Pill */}
        <button
          type="button"
          role="radio"
          aria-checked={isAdviser}
          disabled={disabled}
          onClick={() => onChange("adviser")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed ${
            isAdviser
              ? "bg-white text-gray-900 shadow-sm border border-gray-200/90"
              : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              isAdviser ? "bg-brand-yellow text-brand-black" : "text-gray-400"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span>Adviser</span>
        </button>
      </div>
    </div>
  );
}
