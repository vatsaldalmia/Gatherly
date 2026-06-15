import { cn } from "@/lib/utils";

export function FairnessScore({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? 80 : size === "sm" ? 40 : 56;
  const stroke = size === "lg" ? 8 : size === "sm" ? 4 : 6;
  const r = (dims - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 85 ? "text-mint" : value >= 65 ? "text-primary" : "text-destructive";
  return (
    <div className="relative" style={{ width: dims, height: dims }}>
      <svg width={dims} height={dims} className="-rotate-90">
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-muted fill-none"
        />
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("fill-none transition-all duration-700", color)}
          stroke="currentColor"
        />
      </svg>
      <div className={cn("absolute inset-0 grid place-items-center font-bold", color, size === "lg" ? "text-lg" : size === "sm" ? "text-[10px]" : "text-sm")}>
        {value}%
      </div>
    </div>
  );
}