import { SVGProps } from "react";

const PlantIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Stem */}
    <path d="M12 22V12" />
    {/* Left leaf */}
    <path d="M12 12C12 12 8 10 5 6C5 6 10 6 12 12" />
    {/* Right leaf */}
    <path d="M12 8C12 8 16 6 19 2C19 2 14 2 12 8" />
    {/* Small leaf at base */}
    <path d="M12 18C12 18 9 17 7 15" />
    <path d="M12 18C12 18 15 17 17 15" />
  </svg>
);

export default PlantIcon;
