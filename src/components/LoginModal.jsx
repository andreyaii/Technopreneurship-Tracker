import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import LoginForm from "./LoginForm";

export default function LoginModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      {/* Dimmed backdrop (brings focus to the modal) */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Solid Non-Transparent White Modal Card with Clean 3D Lift */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 z-10 border border-surface-border shadow-[0_30px_90px_-15px_rgba(0,0,0,0.85)] transform transition-all duration-300 ease-out animate-modalSlideUp select-none sm:select-text"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login dialog"
          className="absolute top-5 right-5 p-2 rounded-xl text-brand-black/40 hover:text-brand-black hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={2.25} />
        </button>

        {/* Modal Headline & Subtext */}
        <h2
          id="modal-headline"
          className="text-2xl sm:text-3xl font-display font-bold text-gray-900 tracking-tight"
        >
          Welcome back
        </h2>

        {/* Login Form with Yellow CTA and Focus Glow */}
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
