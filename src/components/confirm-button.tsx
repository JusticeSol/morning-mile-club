"use client";

import { useEffect, useState, type ReactNode } from "react";

// Two-tap confirmation on the page itself. Browser confirm() pop-ups are
// silently blocked in some phone and in-app browsers, which made buttons
// look dead. First tap arms the button and shows the warning; a second tap
// within a few seconds runs the action.
export function ConfirmButton({
  onConfirm,
  warning,
  confirmLabel = "Tap again to confirm",
  disabled,
  className,
  armedClassName,
  children,
}: {
  onConfirm: () => void;
  warning: string;
  confirmLabel?: string;
  disabled?: boolean;
  className: string;
  armedClassName: string;
  children: ReactNode;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!armed) return setArmed(true);
          setArmed(false);
          onConfirm();
        }}
        className={armed ? armedClassName : className}
      >
        {armed ? confirmLabel : children}
      </button>
      {armed && (
        <p role="alert" className="text-xs text-navy/70">
          {warning}
        </p>
      )}
    </div>
  );
}
