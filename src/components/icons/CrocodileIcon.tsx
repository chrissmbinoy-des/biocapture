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
        {/* Crocodile head - side view */}
        {/* Long snout/head */}
        <path d="M2 10 L2 14 L22 16 L22 10 L2 10 Z" />
        {/* Jaw line */}
        <path d="M2 14 L20 15.5" fill="none" stroke="white" strokeWidth="0.5" />
        {/* Eye */}
        <circle cx="18" cy="12" r="1.5" fill="white" />
        <circle cx="18" cy="12" r="0.7" />
        {/* Nostril */}
        <circle cx="4" cy="11.5" r="0.8" fill="white" />
      </svg>
    );
  }
);

CrocodileIcon.displayName = "CrocodileIcon";

export default CrocodileIcon;
