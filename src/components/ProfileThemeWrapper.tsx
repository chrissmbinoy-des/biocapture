import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Leaf, Trees, Flower2, Bug, Bird, Fish, Waves, Anchor, Shell } from "lucide-react";

interface ProfileThemeWrapperProps {
  theme: string | null;
  children: ReactNode;
  className?: string;
}

// Theme configurations with decorative elements
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

// Nature theme decorative icons
const NatureDecorations = () => (
  <>
    {/* Top left decorations */}
    <div className="absolute top-2 left-2 opacity-20 pointer-events-none">
      <Leaf className="h-8 w-8 text-green-600 animate-pulse" style={{ animationDuration: '3s' }} />
    </div>
    <div className="absolute top-12 left-6 opacity-15 pointer-events-none">
      <Trees className="h-6 w-6 text-emerald-700" />
    </div>
    
    {/* Top right decorations */}
    <div className="absolute top-4 right-4 opacity-20 pointer-events-none">
      <Flower2 className="h-7 w-7 text-lime-600 animate-bounce" style={{ animationDuration: '4s' }} />
    </div>
    <div className="absolute top-14 right-8 opacity-15 pointer-events-none">
      <Bug className="h-5 w-5 text-green-700" />
    </div>
    
    {/* Bottom decorations */}
    <div className="absolute bottom-4 left-8 opacity-15 pointer-events-none">
      <Bird className="h-6 w-6 text-emerald-600" />
    </div>
    <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none">
      <Leaf className="h-5 w-5 text-green-500 rotate-45" />
    </div>
    
    {/* Floating particles effect */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400/30 rounded-full animate-float" />
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-emerald-400/25 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-lime-400/30 rounded-full animate-float" style={{ animationDelay: '2s' }} />
    </div>
  </>
);

// Ocean theme decorative icons
const OceanDecorations = () => (
  <>
    {/* Top decorations */}
    <div className="absolute top-2 left-3 opacity-20 pointer-events-none">
      <Waves className="h-8 w-8 text-blue-500 animate-pulse" style={{ animationDuration: '2.5s' }} />
    </div>
    <div className="absolute top-10 left-10 opacity-15 pointer-events-none">
      <Fish className="h-6 w-6 text-cyan-600" />
    </div>
    
    {/* Top right */}
    <div className="absolute top-3 right-4 opacity-20 pointer-events-none">
      <Anchor className="h-7 w-7 text-sky-600" />
    </div>
    <div className="absolute top-12 right-8 opacity-15 pointer-events-none">
      <Shell className="h-5 w-5 text-blue-400" />
    </div>
    
    {/* Bottom decorations */}
    <div className="absolute bottom-4 left-6 opacity-20 pointer-events-none">
      <Fish className="h-5 w-5 text-cyan-500 -scale-x-100" />
    </div>
    <div className="absolute bottom-6 right-4 opacity-15 pointer-events-none">
      <Waves className="h-6 w-6 text-blue-400" />
    </div>
    
    {/* Bubble effect */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-3 h-3 bg-blue-300/20 rounded-full animate-bubble" />
      <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-cyan-300/25 rounded-full animate-bubble" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-0 right-1/4 w-2.5 h-2.5 bg-sky-300/20 rounded-full animate-bubble" style={{ animationDelay: '1s' }} />
    </div>
  </>
);

export const ProfileThemeWrapper = ({
  theme,
  children,
  className,
}: ProfileThemeWrapperProps) => {
  const style = theme ? themeStyles[theme] : null;

  return (
    <div
      className={cn(
        "relative transition-all duration-300",
        style ? `bg-gradient-to-br ${style.gradient}` : "",
        className
      )}
    >
      {/* Theme decorations */}
      {theme === "nature" && <NatureDecorations />}
      {theme === "ocean" && <OceanDecorations />}
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Frame styles for avatar - with animations for gold
export const getFrameStyles = (frame: string | null): string => {
  switch (frame) {
    case "gold":
      return "ring-4 ring-yellow-500 ring-offset-2 ring-offset-background shadow-lg shadow-yellow-500/40 animate-golden-glow";
    case "silver":
      return "ring-4 ring-gray-400 ring-offset-2 ring-offset-background shadow-lg shadow-gray-400/30";
    case "bronze":
      return "ring-4 ring-amber-600 ring-offset-2 ring-offset-background shadow-lg shadow-amber-600/30";
    default:
      return "border-2 border-primary";
  }
};

// Title styles with colors and animations
export const getTitleStyles = (titleName: string | null): string => {
  if (!titleName) return "";
  
  const name = titleName.toLowerCase();
  
  if (name.includes("master explorer")) {
    return "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent animate-shimmer font-bold";
  }
  if (name.includes("wildlife champion") || name.includes("mythic")) {
    return "bg-gradient-to-r from-red-400 via-rose-500 to-red-600 bg-clip-text text-transparent animate-shimmer font-bold";
  }
  if (name.includes("gold")) {
    return "text-yellow-500 font-semibold";
  }
  
  return "";
};
