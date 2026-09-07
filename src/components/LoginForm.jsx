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
  const [error, setError] = useState("");

  const handlePinChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(digitsOnly);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!studentNo.trim() || pin.length !== 4) {
      setError("Enter your Student Number and a 4-digit PIN.");
      return;
    }

    const result = await login(studentNo, pin);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message || "Login failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="studentNo" className="text-sm font-medium text-brand-black">
          Student Number
        </label>
        <div className="relative">
          <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-brand-black/35" strokeWidth={2} />
          <input
            id="studentNo"
            type="text"
            inputMode="text"
            autoComplete="username"
            placeholder="e.g. 22-5657-518"
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-border bg-surface-muted text-sm font-medium placeholder:text-brand-black/30 focus:bg-white focus:border-brand-black outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pin" className="text-sm font-medium text-brand-black">
          4-Digit PIN
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-brand-black/35" strokeWidth={2} />
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="••••"
            value={pin}
            onChange={handlePinChange}
            maxLength={4}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-border bg-surface-muted text-sm font-medium tracking-[0.3em] placeholder:text-brand-black/30 placeholder:tracking-normal focus:bg-white focus:border-brand-black outline-none transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-brand-black bg-brand-yellow-soft border border-brand-yellow rounded-xl px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.25} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-black text-white text-sm font-semibold hover:bg-brand-ink transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" strokeWidth={2.25} />
            Log in
          </>
        )}
      </button>
    </form>
  );
}
