import { SVGProps } from "react";

const FishIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M2 12C2 12 4 6 12 6C18 6 22 10 22 12C22 14 18 18 12 18C4 18 2 12 2 12Z" />
    {/* Tail */}
    <path d="M2 12L0 8L0 16L2 12" />
    {/* Eye */}
    <circle cx="17" cy="12" r="1.5" fill="currentColor" />
    {/* Fins */}
    <path d="M10 6C10 6 12 3 14 6" />
    <path d="M10 18C10 18 12 21 14 18" />
    {/* Gill */}
    <path d="M14 10V14" />
  </svg>
);

export default FishIcon;
