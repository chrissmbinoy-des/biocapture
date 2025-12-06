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
        {/* House gecko / wall lizard - top view, slanted */}
        <g transform="rotate(-20 12 12)">
          {/* Body - oval */}
          <ellipse cx="12" cy="11" rx="3.5" ry="5" />
          {/* Head - rounded triangle */}
          <ellipse cx="12" cy="4.5" rx="2.8" ry="2.2" />
          {/* Tail - long and tapered */}
          <path d="M12 16 Q12.5 19 13 22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          {/* Front left leg with toes */}
          <path d="M9 7 L5 4 M5 4 L4 3 M5 4 L5 2.5 M5 4 L6 2.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          {/* Front right leg with toes */}
          <path d="M15 7 L19 4 M19 4 L20 3 M19 4 L19 2.5 M19 4 L18 2.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          {/* Back left leg with toes */}
          <path d="M9 14 L5 18 M5 18 L4 19.5 M5 18 L3.5 18 M5 18 L4 17" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          {/* Back right leg with toes */}
          <path d="M15 14 L19 18 M19 18 L20 19.5 M19 18 L20.5 18 M19 18 L20 17" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      </svg>
    );
  }
);

CrocodileIcon.displayName = "CrocodileIcon";

export default CrocodileIcon;
