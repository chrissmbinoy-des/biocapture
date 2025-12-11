import { SVGProps } from "react";

const CoinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Outer coin ring */}
    <circle cx="12" cy="12" r="10" />
    {/* Inner ring detail */}
    <circle cx="12" cy="12" r="7" />
    {/* Center star/burst pattern */}
    <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
    <path d="M7.76 7.76l1.42 1.42M14.82 14.82l1.42 1.42M7.76 16.24l1.42-1.42M14.82 9.18l1.42-1.42" />
    {/* Center dot */}
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export default CoinIcon;
