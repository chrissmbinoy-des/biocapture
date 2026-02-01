import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileThemeWrapperProps {
  theme: string | null;
  children: ReactNode;
  className?: string;
}

// Theme gradient configurations
const themeStyles: Record<string, { gradient: string; accent: string }> = {
  nature: {
    gradient: "from-green-500/20 via-emerald-500/10 to-lime-500/5",
    accent: "border-green-500/30",
  },
  ocean: {
    gradient: "from-blue-500/20 via-cyan-500/10 to-sky-500/5",
    accent: "border-blue-500/30",
  },
};

export const ProfileThemeWrapper = ({
  theme,
  children,
  className,
}: ProfileThemeWrapperProps) => {
  const style = theme ? themeStyles[theme] : null;

  return (
    <div
      className={cn(
        "transition-all duration-300",
        style ? `bg-gradient-to-br ${style.gradient}` : "",
        className
      )}
    >
      {children}
    </div>
  );
};

// Frame styles for avatar
export const getFrameStyles = (frame: string | null): string => {
  switch (frame) {
    case "gold":
      return "ring-4 ring-yellow-500 ring-offset-2 ring-offset-background shadow-lg shadow-yellow-500/30";
    case "silver":
      return "ring-4 ring-gray-400 ring-offset-2 ring-offset-background shadow-lg shadow-gray-400/30";
    case "bronze":
      return "ring-4 ring-amber-600 ring-offset-2 ring-offset-background shadow-lg shadow-amber-600/30";
    default:
      return "border-2 border-primary";
  }
};
