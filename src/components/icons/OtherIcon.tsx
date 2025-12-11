import { SVGProps } from "react";

const OtherIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Microscope body */}
    <path d="M12 2C12 2 14 2 14 4V8" />
    <circle cx="14" cy="11" r="3" />
    {/* Lens */}
    <path d="M14 14V18" />
    {/* Base */}
    <path d="M8 18H20" />
    <path d="M10 18V22H18V18" />
    {/* Eyepiece */}
    <path d="M10 4H14" />
    {/* Arm */}
    <path d="M14 8L18 8V14" />
  </svg>
);

export default OtherIcon;
