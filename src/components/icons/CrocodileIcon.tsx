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
        {/* Lizard - top view, slightly slanted */}
        {/* Body */}
        <ellipse cx="12" cy="12" rx="4" ry="7" transform="rotate(-15 12 12)" />
        {/* Head */}
        <ellipse cx="12" cy="4" rx="2.5" ry="2" transform="rotate(-15 12 12)" />
        {/* Tail */}
        <path d="M13 18 Q14 21 16 23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Front left leg */}
        <path d="M9 8 L4 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Front right leg */}
        <path d="M15 9 L20 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Back left leg */}
        <path d="M9 15 L4 19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Back right leg */}
        <path d="M15 16 L20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
);

CrocodileIcon.displayName = "CrocodileIcon";

export default CrocodileIcon;
