import { SVGProps } from "react";

const BirdIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Body */}
    <path d="M20 12C20 12 18 8 14 8C10 8 8 10 6 12C4 14 2 14 2 14" />
    <path d="M20 12C20 12 18 16 14 16C10 16 8 14 6 12" />
    {/* Head */}
    <circle cx="17" cy="10" r="2" />
    {/* Eye */}
    <circle cx="17.5" cy="9.5" r="0.5" fill="currentColor" />
    {/* Beak */}
    <path d="M19 10L22 9L19 8" />
    {/* Wing detail */}
    <path d="M10 12C10 12 12 10 12 8" />
    {/* Tail */}
    <path d="M2 14L4 16L2 18" />
  </svg>
);

export default BirdIcon;
