import React from "react";

/**
 * Animated moving loading icon component.
 * Features an orbital dual-ring SVG with smooth moving dash offsets, glowing particles,
 * and support for custom sizing, text labels, and color themes.
 */
export default function LoadingSpinner({
  size = "md", // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  text = null,
  className = "",
  color = "brand", // 'brand' | 'white' | 'current' | 'dark'
  inline = false,
}) {
  // Size mappings
  const sizeClasses = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const selectedSizeClass = sizeClasses[size] || (typeof size === "string" && size.includes("h-") ? size : "w-6 h-6");

  // Color stroke setups
  let strokeColor = "stroke-amber-400";
  let trackColor = "stroke-neutral-300/30";
  let dotColor = "fill-amber-400";

  if (color === "white") {
    strokeColor = "stroke-white";
    trackColor = "stroke-white/20";
    dotColor = "fill-white";
  } else if (color === "dark") {
    strokeColor = "stroke-neutral-800";
    trackColor = "stroke-neutral-300";
    dotColor = "fill-neutral-900";
  } else if (color === "current") {
    strokeColor = "stroke-current";
    trackColor = "stroke-current/20";
    dotColor = "fill-current";
  }

  const spinnerMarkup = (
    <div className={`relative inline-flex items-center justify-center ${selectedSizeClass} ${className}`}>
      {/* Outer subtle glowing ring */}
      <svg
        className="w-full h-full animate-[spin_2s_linear_infinite]"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ambient glow backdrop */}
        <circle
          cx="25"
          cy="25"
          r="20"
          className={`${trackColor}`}
          strokeWidth="3.5"
        />

        {/* Dynamic moving dash stroke ring */}
        <circle
          cx="25"
          cy="25"
          r="20"
          className={`${strokeColor} origin-center animate-[spinner-dash_1.5s_ease-in-out_infinite]`}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      {/* Counter-rotating inner orbiting accent dot */}
      <div className="absolute inset-0 flex items-center justify-center animate-[spin_1.2s_linear_infinite_reverse] pointer-events-none">
        <span
          className={`absolute top-0.5 ${dotColor} rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]`}
          style={{
            width: size === "xs" || size === "sm" ? "2.5px" : size === "xl" ? "6px" : "4px",
            height: size === "xs" || size === "sm" ? "2.5px" : size === "xl" ? "6px" : "4px",
          }}
        />
      </div>
    </div>
  );

  if (inline || !text) {
    return spinnerMarkup;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      {spinnerMarkup}
      {text && <span className="text-sm font-medium tracking-wide">{text}</span>}
    </div>
  );
}

export { LoadingSpinner };
