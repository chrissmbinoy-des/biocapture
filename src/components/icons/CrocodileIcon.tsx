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
        {/* Simple crocodile silhouette */}
        <path d="M2 13c0-1 0.5-2 2-2h10c2 0 3 0 5-1l3-2v2l-2 2v1c0 1-0.5 2-2 2H4c-1 0-2-0.5-2-2z" />
        {/* Snout */}
        <path d="M20 10l3-1v2l-3 1z" />
        {/* Tail spike */}
        <path d="M2 12l-1-1h1z" />
        {/* Back ridges */}
        <circle cx="6" cy="10.5" r="0.8" />
        <circle cx="9" cy="10.5" r="0.8" />
        <circle cx="12" cy="10.5" r="0.8" />
        {/* Legs */}
        <path d="M6 15v2l1 0.5h1v-1l-1-0.5v-1z" />
        <path d="M14 15v2l1 0.5h1v-1l-1-0.5v-1z" />
        {/* Eye */}
        <circle cx="18" cy="10" r="0.6" fill="white" />
      </svg>
    );
  }
);

CrocodileIcon.displayName = "CrocodileIcon";

export default CrocodileIcon;
