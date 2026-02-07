import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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

// Nature theme with colorful animated animals and plants
const NatureDecorations = () => (
  <>
    {/* Animated Trees */}
    <div className="absolute top-0 left-0 w-16 h-20 opacity-30 pointer-events-none animate-sway">
      <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 10L16 35H24L12 55H28V75H36V55H52L40 35H48L32 10Z" fill="#22c55e"/>
        <rect x="28" y="55" width="8" height="20" fill="#8B4513"/>
      </svg>
    </div>
    
    {/* Colorful Butterfly - animated flying */}
    <div className="absolute top-8 right-8 opacity-60 pointer-events-none animate-butterfly">
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="8" cy="8" rx="7" ry="6" fill="#f472b6" className="animate-wing-left"/>
        <ellipse cx="24" cy="8" rx="7" ry="6" fill="#c084fc" className="animate-wing-right"/>
        <ellipse cx="8" cy="16" rx="5" ry="5" fill="#fb923c" className="animate-wing-left"/>
        <ellipse cx="24" cy="16" rx="5" ry="5" fill="#fbbf24" className="animate-wing-right"/>
        <rect x="15" y="4" width="2" height="16" rx="1" fill="#1f2937"/>
      </svg>
    </div>
    
    {/* Green Bird flying */}
    <div className="absolute top-4 left-1/3 opacity-50 pointer-events-none animate-fly-bird">
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 10C14 10 6 4 2 6C6 8 8 10 14 10Z" fill="#4ade80" className="animate-wing-flap"/>
        <path d="M14 10C14 10 22 4 26 6C22 8 20 10 14 10Z" fill="#4ade80" className="animate-wing-flap-delay"/>
        <ellipse cx="14" cy="11" rx="4" ry="3" fill="#22c55e"/>
        <circle cx="12" cy="10" r="1" fill="#1f2937"/>
        <path d="M10 11L7 12" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
    
    {/* Deer silhouette */}
    <div className="absolute bottom-4 right-4 opacity-25 pointer-events-none animate-deer-walk">
      <svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8C12 8 8 2 6 4C8 6 10 8 10 10" stroke="#8B4513" strokeWidth="2"/>
        <path d="M16 8C16 8 20 2 22 4C20 6 18 8 18 10" stroke="#8B4513" strokeWidth="2"/>
        <ellipse cx="14" cy="16" rx="8" ry="6" fill="#d4a574"/>
        <ellipse cx="20" cy="24" rx="12" ry="8" fill="#d4a574"/>
        <rect x="12" y="30" width="3" height="10" fill="#8B4513"/>
        <rect x="20" y="30" width="3" height="10" fill="#8B4513"/>
        <rect x="26" y="30" width="3" height="10" fill="#8B4513"/>
        <circle cx="10" cy="14" r="1.5" fill="#1f2937"/>
      </svg>
    </div>
    
    {/* Colorful flowers */}
    <div className="absolute bottom-8 left-8 opacity-40 pointer-events-none">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="4" fill="#f472b6" className="animate-bloom"/>
        <circle cx="12" cy="6" r="3" fill="#fb7185"/>
        <circle cx="18" cy="10" r="3" fill="#fb7185"/>
        <circle cx="6" cy="10" r="3" fill="#fb7185"/>
        <circle cx="10" cy="16" r="3" fill="#fb7185"/>
        <circle cx="14" cy="16" r="3" fill="#fb7185"/>
        <rect x="11" y="16" width="2" height="16" fill="#22c55e"/>
        <ellipse cx="8" cy="28" rx="4" ry="2" fill="#4ade80"/>
      </svg>
    </div>
    
    {/* Second butterfly */}
    <div className="absolute bottom-1/3 left-1/4 opacity-50 pointer-events-none animate-butterfly-2">
      <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="6" cy="6" rx="5" ry="4" fill="#06b6d4" className="animate-wing-left"/>
        <ellipse cx="18" cy="6" rx="5" ry="4" fill="#8b5cf6" className="animate-wing-right"/>
        <ellipse cx="6" cy="12" rx="4" ry="4" fill="#14b8a6" className="animate-wing-left"/>
        <ellipse cx="18" cy="12" rx="4" ry="4" fill="#a855f7" className="animate-wing-right"/>
        <rect x="11" y="3" width="2" height="12" rx="1" fill="#1f2937"/>
      </svg>
    </div>
    
    {/* Floating leaves */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 left-1/5 w-4 h-4 animate-float-leaf">
        <svg viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="6" ry="3" fill="#4ade80" transform="rotate(-30 8 8)"/></svg>
      </div>
      <div className="absolute top-1/2 right-1/4 w-3 h-3 animate-float-leaf-2">
        <svg viewBox="0 0 12 12" fill="none"><ellipse cx="6" cy="6" rx="5" ry="2.5" fill="#86efac" transform="rotate(20 6 6)"/></svg>
      </div>
      <div className="absolute bottom-1/4 left-1/2 w-3 h-3 animate-float-leaf-3">
        <svg viewBox="0 0 12 12" fill="none"><ellipse cx="6" cy="6" rx="4" ry="2" fill="#22c55e" transform="rotate(-15 6 6)"/></svg>
      </div>
    </div>
  </>
);

// Ocean theme with colorful animated sea creatures
const OceanDecorations = () => (
  <>
    {/* Colorful Fish swimming */}
    <div className="absolute top-10 left-4 opacity-60 pointer-events-none animate-swim">
      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="12" rx="12" ry="8" fill="#f97316"/>
        <polygon points="30,12 36,6 36,18" fill="#fb923c"/>
        <circle cx="10" cy="10" r="2" fill="white"/>
        <circle cx="10" cy="10" r="1" fill="#1f2937"/>
        <path d="M18 6C20 8 22 8 24 6" stroke="#fdba74" strokeWidth="2"/>
        <path d="M18 18C20 16 22 16 24 18" stroke="#fdba74" strokeWidth="2"/>
      </svg>
    </div>
    
    {/* Blue tropical fish */}
    <div className="absolute top-1/3 right-6 opacity-50 pointer-events-none animate-swim-2">
      <svg width="32" height="22" viewBox="0 0 32 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="11" rx="10" ry="7" fill="#3b82f6"/>
        <polygon points="24,11 32,5 32,17" fill="#60a5fa"/>
        <path d="M14 4L16 0L18 4" fill="#60a5fa"/>
        <circle cx="8" cy="9" r="2" fill="white"/>
        <circle cx="8" cy="9" r="1" fill="#1f2937"/>
        <path d="M4 11L2 13" stroke="#fbbf24" strokeWidth="1.5"/>
        <ellipse cx="14" cy="11" rx="6" ry="4" fill="#93c5fd" fillOpacity="0.5"/>
      </svg>
    </div>
    
    {/* Sea turtle */}
    <div className="absolute bottom-8 left-1/4 opacity-40 pointer-events-none animate-turtle">
      <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="24" cy="20" rx="16" ry="12" fill="#14b8a6"/>
        <ellipse cx="24" cy="20" rx="12" ry="8" fill="#2dd4bf"/>
        <path d="M24 12L28 8L24 14L20 8Z" fill="#5eead4"/>
        <ellipse cx="10" cy="14" rx="6" ry="3" fill="#14b8a6" transform="rotate(-30 10 14)"/>
        <ellipse cx="38" cy="14" rx="6" ry="3" fill="#14b8a6" transform="rotate(30 38 14)"/>
        <ellipse cx="10" cy="26" rx="5" ry="3" fill="#14b8a6" transform="rotate(30 10 26)"/>
        <ellipse cx="38" cy="26" rx="5" ry="3" fill="#14b8a6" transform="rotate(-30 38 26)"/>
        <ellipse cx="8" cy="10" rx="4" ry="3" fill="#14b8a6"/>
        <circle cx="6" cy="9" r="1" fill="#1f2937"/>
      </svg>
    </div>
    
    {/* Jellyfish */}
    <div className="absolute top-12 right-1/3 opacity-50 pointer-events-none animate-jellyfish">
      <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="10" rx="12" ry="10" fill="#c084fc" fillOpacity="0.7"/>
        <ellipse cx="14" cy="10" rx="8" ry="6" fill="#e879f9" fillOpacity="0.5"/>
        <path d="M6 18Q8 28 6 38" stroke="#d8b4fe" strokeWidth="2" fill="none" className="animate-tentacle"/>
        <path d="M14 20Q16 30 14 40" stroke="#d8b4fe" strokeWidth="2" fill="none" className="animate-tentacle-2"/>
        <path d="M22 18Q20 28 22 38" stroke="#d8b4fe" strokeWidth="2" fill="none" className="animate-tentacle-3"/>
      </svg>
    </div>
    
    {/* Small colorful fish school */}
    <div className="absolute bottom-1/4 right-8 opacity-40 pointer-events-none animate-swim-school">
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="8" cy="6" rx="5" ry="3" fill="#fbbf24"/>
        <polygon points="13,6 17,3 17,9" fill="#fcd34d"/>
        <ellipse cx="20" cy="12" rx="5" ry="3" fill="#f472b6"/>
        <polygon points="25,12 29,9 29,15" fill="#f9a8d4"/>
        <ellipse cx="10" cy="18" rx="5" ry="3" fill="#4ade80"/>
        <polygon points="15,18 19,15 19,21" fill="#86efac"/>
        <ellipse cx="32" cy="8" rx="4" ry="2.5" fill="#60a5fa"/>
        <polygon points="36,8 39,6 39,10" fill="#93c5fd"/>
      </svg>
    </div>
    
    {/* Seahorse */}
    <div className="absolute bottom-6 right-1/4 opacity-35 pointer-events-none animate-seahorse">
      <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C16 4 18 8 18 12C18 16 14 18 14 22C14 26 16 28 16 32C16 36 12 38 10 36C8 34 10 30 12 28C14 26 12 24 10 22C8 20 6 16 8 12C10 8 12 4 12 4Z" fill="#ec4899"/>
        <circle cx="10" cy="8" r="1.5" fill="#1f2937"/>
        <path d="M16 6C18 4 20 4 22 6" stroke="#f9a8d4" strokeWidth="1.5"/>
        <path d="M6 12L4 10L2 12" fill="#f472b6"/>
      </svg>
    </div>
    
    {/* Bubbles */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute bottom-0 left-1/5 w-4 h-4 bg-cyan-300/30 rounded-full animate-bubble" />
      <div className="absolute bottom-0 left-1/3 w-3 h-3 bg-blue-300/25 rounded-full animate-bubble" style={{ animationDelay: '0.7s' }} />
      <div className="absolute bottom-0 left-1/2 w-5 h-5 bg-sky-300/20 rounded-full animate-bubble" style={{ animationDelay: '1.4s' }} />
      <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-cyan-400/35 rounded-full animate-bubble" style={{ animationDelay: '2.1s' }} />
      <div className="absolute bottom-0 right-1/3 w-3 h-3 bg-blue-400/25 rounded-full animate-bubble" style={{ animationDelay: '0.3s' }} />
    </div>
    
    {/* Waves at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 pointer-events-none overflow-hidden">
      <svg className="w-full h-full animate-wave" viewBox="0 0 400 32" preserveAspectRatio="none">
        <path d="M0 20 Q50 10 100 20 T200 20 T300 20 T400 20 V32 H0 Z" fill="#0ea5e9"/>
      </svg>
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
