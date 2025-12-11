import { SVGProps } from "react";

const MammalIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Paw pad - main */}
    <ellipse cx="12" cy="14" rx="5" ry="4.5" />
    {/* Toe pads */}
    <circle cx="8" cy="7" r="2" />
    <circle cx="12" cy="5" r="2" />
    <circle cx="16" cy="7" r="2" />
    {/* Dew claw */}
    <circle cx="6" cy="11" r="1.5" />
    <circle cx="18" cy="11" r="1.5" />
  </svg>
);

export default MammalIcon;
