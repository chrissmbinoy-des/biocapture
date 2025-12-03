import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
type IconVariant = "plant" | "mammal" | "insect" | "bird" | "reptile" | "fish" | "amphibian" | "other" | "nonliving" | "default" | "muted";

interface IconBadgeProps {
  icon: LucideIcon;
  size?: IconSize;
  variant?: IconVariant;
  className?: string;
  withBackground?: boolean;
  withGlow?: boolean;
}

const sizeMap: Record<IconSize, { container: string; icon: string }> = {
  xs: { container: "w-6 h-6", icon: "h-3 w-3" },
  sm: { container: "w-8 h-8", icon: "h-4 w-4" },
  md: { container: "w-10 h-10", icon: "h-5 w-5" },
  lg: { container: "w-12 h-12", icon: "h-6 w-6" },
  xl: { container: "w-16 h-16", icon: "h-8 w-8" },
};

const variantStyles: Record<IconVariant, { bg: string; icon: string; glow: string }> = {
  plant: {
    bg: "bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/50 dark:to-green-800/50",
    icon: "text-emerald-600 dark:text-emerald-400",
    glow: "shadow-emerald-300/50 dark:shadow-emerald-500/30",
  },
  mammal: {
    bg: "bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/50 dark:to-amber-800/50",
    icon: "text-orange-600 dark:text-orange-400",
    glow: "shadow-orange-300/50 dark:shadow-orange-500/30",
  },
  insect: {
    bg: "bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/50 dark:to-yellow-800/50",
    icon: "text-amber-700 dark:text-amber-400",
    glow: "shadow-amber-300/50 dark:shadow-amber-500/30",
  },
  bird: {
    bg: "bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/50 dark:to-blue-800/50",
    icon: "text-sky-600 dark:text-sky-400",
    glow: "shadow-sky-300/50 dark:shadow-sky-500/30",
  },
  reptile: {
    bg: "bg-gradient-to-br from-lime-100 to-green-200 dark:from-lime-900/50 dark:to-green-800/50",
    icon: "text-lime-700 dark:text-lime-400",
    glow: "shadow-lime-300/50 dark:shadow-lime-500/30",
  },
  fish: {
    bg: "bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-cyan-900/50 dark:to-blue-800/50",
    icon: "text-cyan-600 dark:text-cyan-400",
    glow: "shadow-cyan-300/50 dark:shadow-cyan-500/30",
  },
  amphibian: {
    bg: "bg-gradient-to-br from-teal-100 to-emerald-200 dark:from-teal-900/50 dark:to-emerald-800/50",
    icon: "text-teal-600 dark:text-teal-400",
    glow: "shadow-teal-300/50 dark:shadow-teal-500/30",
  },
  other: {
    bg: "bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/50 dark:to-violet-800/50",
    icon: "text-purple-600 dark:text-purple-400",
    glow: "shadow-purple-300/50 dark:shadow-purple-500/30",
  },
  nonliving: {
    bg: "bg-gradient-to-br from-slate-200 to-gray-300 dark:from-slate-800/50 dark:to-gray-700/50",
    icon: "text-slate-600 dark:text-slate-400",
    glow: "shadow-slate-300/50 dark:shadow-slate-500/30",
  },
  default: {
    bg: "bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/50 dark:to-green-800/50",
    icon: "text-emerald-600 dark:text-emerald-400",
    glow: "shadow-emerald-300/50 dark:shadow-emerald-500/30",
  },
  muted: {
    bg: "bg-muted",
    icon: "text-muted-foreground",
    glow: "",
  },
};

export function IconBadge({
  icon: Icon,
  size = "md",
  variant = "default",
  className,
  withBackground = true,
  withGlow = false,
}: IconBadgeProps) {
  const sizeStyles = sizeMap[size];
  const variantStyle = variantStyles[variant];

  if (!withBackground) {
    return <Icon className={cn(sizeStyles.icon, variantStyle.icon, className)} />;
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center transition-all",
        sizeStyles.container,
        variantStyle.bg,
        withGlow && `shadow-lg ${variantStyle.glow}`,
        className
      )}
    >
      <Icon className={cn(sizeStyles.icon, variantStyle.icon)} />
    </div>
  );
}

// Helper to get variant from kingdom string
export function getKingdomVariant(kingdom: string): IconVariant {
  const map: Record<string, IconVariant> = {
    plant: "plant",
    mammal: "mammal",
    insect: "insect",
    bird: "bird",
    reptile: "reptile",
    fish: "fish",
    amphibian: "amphibian",
    other: "other",
  };
  return map[kingdom] || "default";
}
