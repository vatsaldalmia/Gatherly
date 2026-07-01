import type { SVGProps } from "react";

// Side-view 3-wheeler auto rickshaw in the lucide stroke style (24×24, stroke 2,
// round caps). Rounded front cabin, flat canopy roof, one front + one rear wheel.
export function AutoRickshaw({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Canopy roof */}
      <path d="M5 6h11" />
      {/* Body: rounded front nose down to chassis, along the bottom, up the boxy rear */}
      <path d="M3 15v-2a7 7 0 0 1 7-7" />
      <path d="M16 6v9" />
      <path d="M3 15h13" />
      {/* Front windscreen post */}
      <path d="M10 6v6H3" />
      {/* Wheels */}
      <circle cx="7" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
    </svg>
  );
}
