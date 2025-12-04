import { forwardRef, SVGProps } from "react";

interface CrocodileIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const CrocodileIcon = forwardRef<SVGSVGElement, CrocodileIconProps>(
  ({ size = 24, className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        {...props}
      >
        {/* Lacoste-style crocodile silhouette - side view */}
        {/* Body and tail */}
        <path d="M1 14c0 0 1-2 3-2c1 0 2 1 3 1l1-1l1 1l1-1l1 1c1 0 2.5-1 4-1c2 0 3 1 4 2l2-1v3c0 1-1 2-2 2H4c-2 0-3-1-3-2v-2z" />
        {/* Head/snout */}
        <path d="M19 13l4-2v1l-2 2l-2-1z" />
        {/* Legs */}
        <path d="M6 17l-1 3h1l1-2" />
        <path d="M14 17l-1 3h1l1-2" />
        {/* Eye */}
        <circle cx="20" cy="12" r="0.8" fill="white" />
        {/* Back spikes */}
        <path d="M5 12l1-2l1 2" />
        <path d="M8 12l1-2l1 2" />
        <path d="M11 12l1-2l1 2" />
      </svg>
    );
  }
);

CrocodileIcon.displayName = "CrocodileIcon";

export default CrocodileIcon;
