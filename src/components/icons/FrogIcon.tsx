import { forwardRef, SVGProps } from "react";

interface FrogIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const FrogIcon = forwardRef<SVGSVGElement, FrogIconProps>(
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
        {/* Simple frog face - top view */}
        {/* Left eye */}
        <circle cx="6" cy="8" r="4" />
        {/* Right eye */}
        <circle cx="18" cy="8" r="4" />
        {/* Body/head connecting eyes */}
        <rect x="6" y="6" width="12" height="12" rx="4" />
        {/* Mouth smile */}
        <path d="M8 14 Q12 17 16 14" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4"/>
      </svg>
    );
  }
);

FrogIcon.displayName = "FrogIcon";

export default FrogIcon;
