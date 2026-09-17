import { User, ShieldCheck } from "lucide-react";

/**
 * Dual-card / segmented selector for logging in as Student or Adviser.
 * Mutually exclusive options: active state highlights with brand yellow border and background tint;
 * inactive state remains neutral gray.
 */
export default function RoleSelector({ role, onChange, disabled = false }) {
  const isStudent = role === "student";
  const isAdviser = role === "adviser";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-gray-800">
        Log in as
      </span>

      <div
        role="radiogroup"
        aria-label="Select login role"
        className="grid grid-cols-2 gap-3"
      >
        {/* Student Option Card */}
        <button
          type="button"
          role="radio"
          aria-checked={isStudent}
          disabled={disabled}
          onClick={() => onChange("student")}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed ${
            isStudent
              ? "border-brand-yellow bg-brand-yellow/10 ring-2 ring-brand-yellow/40 shadow-xs"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 text-gray-600"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isStudent
                ? "bg-brand-yellow text-brand-black shadow-xs"
                : "bg-gray-200/80 text-gray-500"
            }`}
          >
            <User className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <p
            className={`text-sm ${
              isStudent ? "font-bold text-gray-900" : "font-medium text-gray-600"
            }`}
          >
            Student
          </p>
        </button>

        {/* Adviser Option Card */}
        <button
          type="button"
          role="radio"
          aria-checked={isAdviser}
          disabled={disabled}
          onClick={() => onChange("adviser")}
          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed ${
            isAdviser
              ? "border-brand-yellow bg-brand-yellow/10 ring-2 ring-brand-yellow/40 shadow-xs"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 text-gray-600"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isAdviser
                ? "bg-brand-yellow text-brand-black shadow-xs"
                : "bg-gray-200/80 text-gray-500"
            }`}
          >
            <ShieldCheck className="w-4 h-4" strokeWidth={2.4} />
          </div>
          <p
            className={`text-sm ${
              isAdviser ? "font-bold text-gray-900" : "font-medium text-gray-600"
            }`}
          >
            Adviser
          </p>
        </button>
      </div>
    </div>
  );
}
