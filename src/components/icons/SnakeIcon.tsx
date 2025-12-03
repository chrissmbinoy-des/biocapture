import { forwardRef, SVGProps } from "react";

interface SnakeIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const SnakeIcon = forwardRef<SVGSVGElement, SnakeIconProps>(
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
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {/* Simple S-curve snake body */}
        <path d="M4 6c3-2 6 0 8 2s5 4 8 2" />
        <path d="M20 10c-3 2-6 0-8-2s-5-4-8-2" />
        <path d="M4 14c3-2 6 0 8 2s5 4 8 2" />
        {/* Snake head */}
        <circle cx="20" cy="6" r="2" fill="currentColor" />
      </svg>
    );
  }
);

SnakeIcon.displayName = "SnakeIcon";

export default SnakeIcon;
