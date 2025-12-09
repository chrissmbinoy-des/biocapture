import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeProgressCircleProps {
  icon: LucideIcon;
  progress: number; // 0 to 1
  isEarned: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { container: 48, stroke: 3, iconSize: 20, radius: 20 },
  md: { container: 64, stroke: 4, iconSize: 28, radius: 26 },
  lg: { container: 80, stroke: 5, iconSize: 36, radius: 34 },
};

export function BadgeProgressCircle({
  icon: Icon,
  progress,
  isEarned,
  size = "md",
  className,
}: BadgeProgressCircleProps) {
  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: config.container, height: config.container }}
    >
      {/* Background circle */}
      <svg
        className="absolute inset-0"
        width={config.container}
        height={config.container}
      >
        <circle
          cx={config.container / 2}
          cy={config.container / 2}
          r={config.radius}
          fill="none"
          stroke="hsl(142, 71%, 45%)"
          strokeWidth={config.stroke}
          opacity={0.2}
        />
        {/* Progress circle */}
        <circle
          cx={config.container / 2}
          cy={config.container / 2}
          r={config.radius}
          fill="none"
          stroke="hsl(142, 71%, 45%)"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          opacity={isEarned ? 1 : 0.6}
          className="transition-all duration-500 ease-out"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "center",
          }}
        />
      </svg>
      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full",
          isEarned
            ? "text-species-plant"
            : "text-species-plant/50"
        )}
      >
        <Icon size={config.iconSize} strokeWidth={1.5} />
      </div>
      {/* Glow effect for earned badges */}
      {isEarned && (
        <div
          className="absolute inset-0 rounded-full bg-species-plant/20 blur-md -z-10"
          style={{ width: config.container, height: config.container }}
        />
      )}
    </div>
  );
}