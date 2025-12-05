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
        {/* Sitting frog silhouette - side view */}
        {/* Body */}
        <ellipse cx="10" cy="14" rx="6" ry="4" />
        {/* Head */}
        <circle cx="16" cy="11" r="4" />
        {/* Bulging eye */}
        <circle cx="18" cy="8" r="2" />
        {/* Front leg */}
        <path d="M14 17 L16 20 L18 20 L17 18 L15 16" />
        {/* Back leg (bent) */}
        <path d="M5 14 Q2 16 3 19 L6 19 L5 17 Q6 15 6 14" />
      </svg>
    );
  }
);

FrogIcon.displayName = "FrogIcon";

export default FrogIcon;
