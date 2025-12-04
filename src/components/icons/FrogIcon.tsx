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
        {/* Frog outline - top view */}
        {/* Left eye */}
        <circle cx="7" cy="7" r="3" />
        {/* Right eye */}
        <circle cx="17" cy="7" r="3" />
        {/* Body */}
        <ellipse cx="12" cy="14" rx="8" ry="6" />
        {/* Front legs */}
        <path d="M4 12l-2 4" />
        <path d="M20 12l2 4" />
        {/* Back legs */}
        <path d="M6 18l-3 3" />
        <path d="M18 18l3 3" />
      </svg>
    );
  }
);

FrogIcon.displayName = "FrogIcon";

export default FrogIcon;
