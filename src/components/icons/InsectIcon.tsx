import { SVGProps } from "react";

const InsectIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Butterfly wings - left */}
    <path d="M4 8C4 4 8 3 10 6C10 6 10 10 8 12C6 14 2 12 4 8Z" />
    <path d="M4 16C4 20 8 21 10 18C10 18 10 14 8 12" />
    {/* Butterfly wings - right */}
    <path d="M20 8C20 4 16 3 14 6C14 6 14 10 16 12C18 14 22 12 20 8Z" />
    <path d="M20 16C20 20 16 21 14 18C14 18 14 14 16 12" />
    {/* Body */}
    <ellipse cx="12" cy="12" rx="2" ry="6" />
    {/* Antennae */}
    <path d="M11 6C11 6 9 3 8 2" />
    <path d="M13 6C13 6 15 3 16 2" />
  </svg>
);

export default InsectIcon;
