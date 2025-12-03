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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <path d="M4 12c0-2 1-4 4-4s4 2 4 4-1 4-4 4" />
        <path d="M12 12c0-2 1-4 4-4s4 2 4 0" />
        <circle cx="19" cy="8" r="1" fill="currentColor" />
        <path d="M21 6l1.5-1" />
        <path d="M21 6l1.5 1" />
      </svg>
    );
  }
);

SnakeIcon.displayName = "SnakeIcon";

export default SnakeIcon;
