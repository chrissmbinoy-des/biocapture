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
        {/* Frog head - front view with bulging eyes */}
        {/* Left bulging eye */}
        <circle cx="6" cy="8" r="4" />
        {/* Right bulging eye */}
        <circle cx="18" cy="8" r="4" />
        {/* Head/face */}
        <ellipse cx="12" cy="14" rx="8" ry="6" />
        {/* Smile */}
        <path d="M6 15 Q12 19 18 15" fill="none" stroke="white" strokeWidth="1.5" />
      </svg>
    );
  }
);

FrogIcon.displayName = "FrogIcon";

export default FrogIcon;
