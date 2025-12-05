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
        {/* Lacoste-style crocodile - walking pose */}
        {/* Main body + tail */}
        <path d="M1 12 Q3 10 5 11 L15 11 Q17 10 19 9 L22 8 L23 9 L22 10 Q21 11 19 12 L18 13 Q17 14 15 14 L5 14 Q3 15 1 14 Z" />
        {/* Jaw/mouth detail */}
        <path d="M22 10 L23 11 L21 11 Z" />
        {/* Front leg */}
        <path d="M15 14 L16 17 L17 17 L18 17 L17 15 L15 14" />
        {/* Back leg */}
        <path d="M6 14 L5 17 L4 17 L3 17 L4 15 L6 14" />
        {/* Eye */}
        <circle cx="20" cy="9.5" r="0.8" fill="white" />
        {/* Back spikes */}
        <path d="M8 11 L8.5 9 L9 11" />
        <path d="M11 11 L11.5 9 L12 11" />
        <path d="M14 11 L14.5 9.5 L15 11" />
      </svg>
    );
  }
);

CrocodileIcon.displayName = "CrocodileIcon";

export default CrocodileIcon;
