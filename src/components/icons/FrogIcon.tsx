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
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {/* Body */}
        <ellipse cx="12" cy="14" rx="7" ry="5" />
        {/* Left eye bump */}
        <circle cx="7" cy="8" r="3" />
        {/* Right eye bump */}
        <circle cx="17" cy="8" r="3" />
        {/* Left eye */}
        <circle cx="7" cy="8" r="1" fill="currentColor" />
        {/* Right eye */}
        <circle cx="17" cy="8" r="1" fill="currentColor" />
        {/* Left leg */}
        <path d="M5 17l-2 3" />
        <path d="M3 20h3" />
        {/* Right leg */}
        <path d="M19 17l2 3" />
        <path d="M21 20h-3" />
      </svg>
    );
  }
);

FrogIcon.displayName = "FrogIcon";

export default FrogIcon;
