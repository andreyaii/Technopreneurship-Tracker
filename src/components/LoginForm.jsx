import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IdCard, KeyRound, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Mock student login form. Google Sheets authentication will replace
 * the AuthContext `login` / projectService.authenticateStudent bodies later.
 * The form fields (student number + PIN) can stay the same.
 */
export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [studentNo, setStudentNo] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  const handlePinChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(digitsOnly);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!studentNo.trim() || pin.length !== 4) {
      setError(`Enter your ${role === "adviser" ? "Adviser ID" : "Student Number"} and a 4-digit PIN.`);
      return;
    }

    const result = await login(studentNo, pin, role);
    if (result.success) {
      navigate(role === "adviser" ? "/projects" : "/dashboard");
    } else {
      setError(result.message || "Login failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-semibold text-gray-800">
          Log in as
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium focus:bg-white focus:text-gray-900 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/30 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="student" className="text-gray-900 bg-white">Student</option>
          <option value="adviser" className="text-gray-900 bg-white">Adviser</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="studentNo" className="text-sm font-semibold text-gray-800">
          {role === "adviser" ? "Adviser ID" : "Student Number"}
        </label>
        <div className="relative">
          <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
          <input
            id="studentNo"
            type="text"
            inputMode="text"
            autoComplete="username"
            placeholder={role === "adviser" ? "adviser" : "e.g. 22-5657-518"}
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
            disabled={isLoading}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:bg-white focus:text-gray-900 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/30 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pin" className="text-sm font-semibold text-gray-800">
          4-Digit PIN
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="••••"
            value={pin}
            onChange={handlePinChange}
            maxLength={4}
            disabled={isLoading}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium tracking-[0.3em] placeholder:text-gray-400 placeholder:tracking-normal focus:bg-white focus:text-gray-900 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/30 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-brand-black bg-brand-yellow-soft border border-brand-yellow rounded-xl px-3.5 py-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-brand-black" strokeWidth={2.25} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand-yellow text-brand-black text-sm font-bold hover:bg-brand-yellow-dark active:scale-[0.99] transition-all duration-200 shadow-md hover:shadow-brand-yellow/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-brand-black" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 text-brand-black" strokeWidth={2.5} />
            <span>Log in</span>
          </>
        )}
      </button>
    </form>
  );
}
