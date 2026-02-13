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

// Nature theme with colorful animated animals and plants spread across the card
const NatureDecorations = () => (
  <>
    {/* Top-left: Tree */}
    <div className="absolute top-0 left-0 w-14 h-16 opacity-25 pointer-events-none animate-sway">
      <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 10L16 35H24L12 55H28V75H36V55H52L40 35H48L32 10Z" fill="#22c55e"/>
        <rect x="28" y="55" width="8" height="20" fill="#8B4513"/>
      </svg>
    </div>
    
    {/* Top-left area: Owl on branch */}
    <div className="absolute top-8 left-14 opacity-40 pointer-events-none animate-owl-bob">
      <svg width="26" height="30" viewBox="0 0 26 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="13" cy="14" rx="10" ry="11" fill="#8B6914"/>
        <circle cx="8" cy="11" r="4" fill="#fef3c7"/>
        <circle cx="18" cy="11" r="4" fill="#fef3c7"/>
        <circle cx="8" cy="11" r="2" fill="#1f2937"/>
        <circle cx="18" cy="11" r="2" fill="#1f2937"/>
        <polygon points="13,14 11,17 15,17" fill="#f97316"/>
        <path d="M3 6L7 10" stroke="#8B6914" strokeWidth="2"/>
        <path d="M23 6L19 10" stroke="#8B6914" strokeWidth="2"/>
        <rect x="6" y="24" width="3" height="4" fill="#d4a574"/>
        <rect x="17" y="24" width="3" height="4" fill="#d4a574"/>
        <rect x="0" y="27" width="26" height="3" rx="1" fill="#6b4226"/>
      </svg>
    </div>
    
    {/* Top-center: Flying bird */}
    <div className="absolute top-6 left-1/3 opacity-50 pointer-events-none animate-fly-bird">
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 10C14 10 6 4 2 6C6 8 8 10 14 10Z" fill="#4ade80" className="animate-wing-flap"/>
        <path d="M14 10C14 10 22 4 26 6C22 8 20 10 14 10Z" fill="#4ade80" className="animate-wing-flap-delay"/>
        <ellipse cx="14" cy="11" rx="4" ry="3" fill="#22c55e"/>
        <circle cx="12" cy="10" r="1" fill="#1f2937"/>
        <path d="M10 11L7 12" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
    
    {/* Second bird flying higher */}
    <div className="absolute top-2 left-1/2 opacity-35 pointer-events-none animate-fly-bird-2">
      <svg width="22" height="16" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 10C14 10 6 4 2 6C6 8 8 10 14 10Z" fill="#60a5fa" className="animate-wing-flap"/>
        <path d="M14 10C14 10 22 4 26 6C22 8 20 10 14 10Z" fill="#60a5fa" className="animate-wing-flap-delay"/>
        <ellipse cx="14" cy="11" rx="4" ry="3" fill="#3b82f6"/>
        <circle cx="12" cy="10" r="1" fill="#1f2937"/>
        <path d="M10 11L7 12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
    
    {/* Top-right: Butterfly */}
    <div className="absolute top-4 right-6 opacity-55 pointer-events-none animate-butterfly">
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="8" cy="8" rx="7" ry="6" fill="#f472b6" className="animate-wing-left"/>
        <ellipse cx="24" cy="8" rx="7" ry="6" fill="#c084fc" className="animate-wing-right"/>
        <ellipse cx="8" cy="16" rx="5" ry="5" fill="#fb923c" className="animate-wing-left"/>
        <ellipse cx="24" cy="16" rx="5" ry="5" fill="#fbbf24" className="animate-wing-right"/>
        <rect x="15" y="4" width="2" height="16" rx="1" fill="#1f2937"/>
      </svg>
    </div>
    
    {/* Dragonfly near top-right */}
    <div className="absolute top-16 right-16 opacity-40 pointer-events-none animate-dragonfly">
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="9" width="16" height="3" rx="1.5" fill="#06b6d4"/>
        <circle cx="24" cy="10" r="3" fill="#22d3ee"/>
        <circle cx="23" cy="9" r="1" fill="#1f2937"/>
        <ellipse cx="14" cy="5" rx="8" ry="3" fill="#67e8f9" fillOpacity="0.5"/>
        <ellipse cx="14" cy="15" rx="8" ry="3" fill="#67e8f9" fillOpacity="0.5"/>
      </svg>
    </div>
    
    {/* Middle-left: Squirrel */}
    <div className="absolute top-1/3 left-2 opacity-35 pointer-events-none animate-deer-walk">
      <svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="16" cy="18" rx="8" ry="6" fill="#d4a574"/>
        <circle cx="10" cy="12" r="5" fill="#d4a574"/>
        <circle cx="8" cy="10" r="1.5" fill="#1f2937"/>
        <path d="M6 8C4 4 8 2 10 6" fill="#d4a574"/>
        <path d="M24 14C28 10 30 14 26 18C22 22 20 18 24 14Z" fill="#c9a068"/>
      </svg>
    </div>
    
    {/* Middle-left lower: Hedgehog */}
    <div className="absolute top-1/2 left-6 opacity-30 pointer-events-none animate-hedgehog-waddle">
      <svg width="30" height="22" viewBox="0 0 30 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="15" cy="14" rx="12" ry="8" fill="#a87c4f"/>
        <path d="M6 10L4 4L8 8" fill="#7c5c33"/>
        <path d="M10 8L9 2L13 7" fill="#7c5c33"/>
        <path d="M14 7L14 1L17 6" fill="#7c5c33"/>
        <path d="M18 8L19 2L22 7" fill="#7c5c33"/>
        <path d="M22 10L25 4L24 9" fill="#7c5c33"/>
        <ellipse cx="8" cy="14" rx="5" ry="4" fill="#deb887"/>
        <circle cx="5" cy="13" r="1.5" fill="#1f2937"/>
        <circle cx="3" cy="14" r="1" fill="#1f2937"/>
      </svg>
    </div>
    
    {/* Middle-center: Second butterfly */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40 pointer-events-none animate-butterfly-2">
      <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="6" cy="6" rx="5" ry="4" fill="#06b6d4" className="animate-wing-left"/>
        <ellipse cx="18" cy="6" rx="5" ry="4" fill="#8b5cf6" className="animate-wing-right"/>
        <ellipse cx="6" cy="12" rx="4" ry="4" fill="#14b8a6" className="animate-wing-left"/>
        <ellipse cx="18" cy="12" rx="4" ry="4" fill="#a855f7" className="animate-wing-right"/>
        <rect x="11" y="3" width="2" height="12" rx="1" fill="#1f2937"/>
      </svg>
    </div>
    
    {/* Ladybug near center-right */}
    <div className="absolute top-[45%] right-1/4 opacity-45 pointer-events-none animate-ladybug-crawl">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="12" r="8" fill="#ef4444"/>
        <line x1="10" y1="4" x2="10" y2="20" stroke="#1f2937" strokeWidth="1.5"/>
        <circle cx="6" cy="10" r="1.5" fill="#1f2937"/>
        <circle cx="14" cy="10" r="1.5" fill="#1f2937"/>
        <circle cx="7" cy="15" r="1.5" fill="#1f2937"/>
        <circle cx="13" cy="15" r="1.5" fill="#1f2937"/>
        <circle cx="10" cy="5" r="3" fill="#1f2937"/>
        <path d="M8 3C6 0 4 1 5 3" stroke="#1f2937" strokeWidth="1"/>
        <path d="M12 3C14 0 16 1 15 3" stroke="#1f2937" strokeWidth="1"/>
      </svg>
    </div>
    
    {/* Middle-right: Rabbit */}
    <div className="absolute top-1/3 right-4 opacity-30 pointer-events-none">
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="22" rx="8" ry="7" fill="#e5e5e5"/>
        <circle cx="14" cy="12" r="6" fill="#e5e5e5"/>
        <ellipse cx="10" cy="4" rx="2" ry="6" fill="#fecaca"/>
        <ellipse cx="18" cy="4" rx="2" ry="6" fill="#fecaca"/>
        <circle cx="11" cy="11" r="1.5" fill="#1f2937"/>
        <circle cx="17" cy="11" r="1.5" fill="#1f2937"/>
        <ellipse cx="14" cy="14" rx="1.5" ry="1" fill="#fca5a5"/>
      </svg>
    </div>
    
    {/* Bottom-left: Flowers */}
    <div className="absolute bottom-4 left-4 opacity-40 pointer-events-none">
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
    
    {/* Mushrooms bottom-left area */}
    <div className="absolute bottom-8 left-16 opacity-35 pointer-events-none">
      <svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="10" cy="12" rx="9" ry="7" fill="#ef4444"/>
        <circle cx="6" cy="10" r="2" fill="#fef3c7"/>
        <circle cx="12" cy="8" r="1.5" fill="#fef3c7"/>
        <circle cx="9" cy="14" r="1" fill="#fef3c7"/>
        <rect x="8" y="18" width="4" height="8" rx="1" fill="#fde68a"/>
        <ellipse cx="24" cy="16" rx="6" ry="5" fill="#a855f7"/>
        <circle cx="22" cy="14" r="1.5" fill="#fef3c7"/>
        <circle cx="26" cy="16" r="1" fill="#fef3c7"/>
        <rect x="22" y="20" width="3" height="6" rx="1" fill="#fde68a"/>
      </svg>
    </div>
    
    {/* Bottom-center: Deer */}
    <div className="absolute bottom-2 left-1/3 opacity-25 pointer-events-none animate-deer-walk">
      <svg width="44" height="36" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    
    {/* Bottom-right: Fox */}
    <div className="absolute bottom-6 right-6 opacity-35 pointer-events-none animate-fox-tail">
      <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="18" rx="12" ry="8" fill="#f97316"/>
        <polygon points="6,8 12,18 2,14" fill="#f97316"/>
        <polygon points="30,8 24,18 34,14" fill="#f97316"/>
        <ellipse cx="18" cy="12" rx="8" ry="6" fill="#f97316"/>
        <ellipse cx="18" cy="14" rx="4" ry="3" fill="#fef3c7"/>
        <circle cx="14" cy="10" r="1.5" fill="#1f2937"/>
        <circle cx="22" cy="10" r="1.5" fill="#1f2937"/>
        <ellipse cx="18" cy="13" rx="1.5" ry="1" fill="#1f2937"/>
        <path d="M34 20C38 18 38 22 34 20" fill="#fb923c" className="animate-tail-wag"/>
      </svg>
    </div>
    
    {/* Snail bottom-right area */}
    <div className="absolute bottom-12 right-14 opacity-30 pointer-events-none animate-snail-crawl">
      <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="10" cy="14" rx="10" ry="4" fill="#fdba74"/>
        <circle cx="14" cy="8" r="6" fill="#a87c4f"/>
        <path d="M14 4C16 4 18 6 18 8C18 10 16 12 14 12C12 12 10 10 12 8" stroke="#7c5c33" strokeWidth="1.5" fill="none"/>
        <circle cx="4" cy="10" r="1" fill="#1f2937"/>
        <path d="M3 8L1 5" stroke="#fdba74" strokeWidth="1.5"/>
        <path d="M5 8L4 5" stroke="#fdba74" strokeWidth="1.5"/>
      </svg>
    </div>
    
    {/* Fireflies scattered */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-yellow-300 animate-firefly" />
      <div className="absolute top-[35%] right-[20%] w-1.5 h-1.5 rounded-full bg-yellow-200 animate-firefly-2" />
      <div className="absolute top-[60%] left-[40%] w-2 h-2 rounded-full bg-lime-300 animate-firefly-3" />
      <div className="absolute top-[15%] right-[35%] w-1.5 h-1.5 rounded-full bg-yellow-300 animate-firefly" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[70%] left-[25%] w-1.5 h-1.5 rounded-full bg-lime-200 animate-firefly-2" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[50%] right-[10%] w-2 h-2 rounded-full bg-yellow-200 animate-firefly-3" style={{ animationDelay: '0.5s' }} />
    </div>
    
    {/* Floating leaves scattered */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 left-[20%] w-4 h-4 animate-float-leaf">
        <svg viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="6" ry="3" fill="#4ade80" transform="rotate(-30 8 8)"/></svg>
      </div>
      <div className="absolute top-1/2 right-1/4 w-3 h-3 animate-float-leaf-2">
        <svg viewBox="0 0 12 12" fill="none"><ellipse cx="6" cy="6" rx="5" ry="2.5" fill="#86efac" transform="rotate(20 6 6)"/></svg>
      </div>
      <div className="absolute bottom-1/3 left-1/2 w-3 h-3 animate-float-leaf-3">
        <svg viewBox="0 0 12 12" fill="none"><ellipse cx="6" cy="6" rx="4" ry="2" fill="#22c55e" transform="rotate(-15 6 6)"/></svg>
      </div>
      <div className="absolute top-2/3 right-1/3 w-3 h-3 animate-float-leaf">
        <svg viewBox="0 0 12 12" fill="none"><ellipse cx="6" cy="6" rx="4" ry="2" fill="#4ade80" transform="rotate(40 6 6)"/></svg>
      </div>
      <div className="absolute top-[10%] left-[60%] w-3 h-3 animate-float-leaf-2" style={{ animationDelay: '3s' }}>
        <svg viewBox="0 0 12 12" fill="none"><ellipse cx="6" cy="6" rx="4" ry="2" fill="#a3e635" transform="rotate(-25 6 6)"/></svg>
      </div>
    </div>
  </>
);

// Ocean theme with colorful animated sea creatures spread across the card
const OceanDecorations = () => (
  <>
    {/* Top-left: Orange fish */}
    <div className="absolute top-4 left-4 opacity-55 pointer-events-none animate-swim">
      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="12" rx="12" ry="8" fill="#f97316"/>
        <polygon points="30,12 36,6 36,18" fill="#fb923c"/>
        <circle cx="10" cy="10" r="2" fill="white"/>
        <circle cx="10" cy="10" r="1" fill="#1f2937"/>
        <path d="M18 6C20 8 22 8 24 6" stroke="#fdba74" strokeWidth="2"/>
        <path d="M18 18C20 16 22 16 24 18" stroke="#fdba74" strokeWidth="2"/>
      </svg>
    </div>
    
    {/* Top-center: Jellyfish */}
    <div className="absolute top-6 left-1/3 opacity-45 pointer-events-none animate-jellyfish">
      <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="10" rx="12" ry="10" fill="#c084fc" fillOpacity="0.7"/>
        <ellipse cx="14" cy="10" rx="8" ry="6" fill="#e879f9" fillOpacity="0.5"/>
        <path d="M6 18Q8 28 6 38" stroke="#d8b4fe" strokeWidth="2" fill="none" className="animate-tentacle"/>
        <path d="M14 20Q16 30 14 40" stroke="#d8b4fe" strokeWidth="2" fill="none" className="animate-tentacle-2"/>
        <path d="M22 18Q20 28 22 38" stroke="#d8b4fe" strokeWidth="2" fill="none" className="animate-tentacle-3"/>
      </svg>
    </div>
    
    {/* Top-right: Blue tropical fish */}
    <div className="absolute top-4 right-4 opacity-50 pointer-events-none animate-swim-2">
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
    
    {/* Middle-left: Seahorse */}
    <div className="absolute top-1/3 left-2 opacity-40 pointer-events-none animate-seahorse">
      <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C16 4 18 8 18 12C18 16 14 18 14 22C14 26 16 28 16 32C16 36 12 38 10 36C8 34 10 30 12 28C14 26 12 24 10 22C8 20 6 16 8 12C10 8 12 4 12 4Z" fill="#ec4899"/>
        <circle cx="10" cy="8" r="1.5" fill="#1f2937"/>
        <path d="M16 6C18 4 20 4 22 6" stroke="#f9a8d4" strokeWidth="1.5"/>
        <path d="M6 12L4 10L2 12" fill="#f472b6"/>
      </svg>
    </div>
    
    {/* Middle-center: Small fish school */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 pointer-events-none animate-swim-school">
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="10" cy="8" rx="6" ry="4" fill="#fbbf24"/>
        <polygon points="16,8 20,5 20,11" fill="#fcd34d"/>
        <ellipse cx="26" cy="16" rx="6" ry="4" fill="#f472b6"/>
        <polygon points="32,16 36,13 36,19" fill="#f9a8d4"/>
        <ellipse cx="14" cy="24" rx="6" ry="4" fill="#4ade80"/>
        <polygon points="20,24 24,21 24,27" fill="#86efac"/>
        <ellipse cx="40" cy="10" rx="5" ry="3" fill="#60a5fa"/>
        <polygon points="45,10 48,7 48,13" fill="#93c5fd"/>
      </svg>
    </div>
    
    {/* Middle-right: Octopus */}
    <div className="absolute top-1/3 right-4 opacity-35 pointer-events-none">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="12" rx="10" ry="8" fill="#a855f7"/>
        <circle cx="14" cy="10" r="2" fill="white"/>
        <circle cx="22" cy="10" r="2" fill="white"/>
        <circle cx="14" cy="10" r="1" fill="#1f2937"/>
        <circle cx="22" cy="10" r="1" fill="#1f2937"/>
        <path d="M6 18Q4 28 8 34" stroke="#c084fc" strokeWidth="3" fill="none"/>
        <path d="M12 20Q10 30 14 36" stroke="#c084fc" strokeWidth="3" fill="none"/>
        <path d="M18 20Q18 32 18 36" stroke="#c084fc" strokeWidth="3" fill="none"/>
        <path d="M24 20Q26 30 22 36" stroke="#c084fc" strokeWidth="3" fill="none"/>
        <path d="M30 18Q32 28 28 34" stroke="#c084fc" strokeWidth="3" fill="none"/>
      </svg>
    </div>
    
    {/* Bottom-left: Sea turtle */}
    <div className="absolute bottom-4 left-4 opacity-40 pointer-events-none animate-turtle">
      <svg width="44" height="32" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    
    {/* Bottom-center: Starfish */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-35 pointer-events-none">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="16,2 18,12 28,12 20,18 23,28 16,22 9,28 12,18 4,12 14,12" fill="#f97316"/>
        <circle cx="16" cy="14" r="3" fill="#fdba74"/>
      </svg>
    </div>
    
    {/* Bottom-right: Crab */}
    <div className="absolute bottom-4 right-4 opacity-40 pointer-events-none">
      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="14" rx="10" ry="7" fill="#ef4444"/>
        <circle cx="14" cy="12" r="1.5" fill="#1f2937"/>
        <circle cx="22" cy="12" r="1.5" fill="#1f2937"/>
        <path d="M4 8L2 4L6 6L8 10" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
        <path d="M32 8L34 4L30 6L28 10" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
        <ellipse cx="2" cy="4" rx="2" ry="3" fill="#ef4444"/>
        <ellipse cx="34" cy="4" rx="2" ry="3" fill="#ef4444"/>
        <rect x="10" y="20" width="3" height="4" fill="#ef4444"/>
        <rect x="16" y="20" width="3" height="4" fill="#ef4444"/>
        <rect x="22" y="20" width="3" height="4" fill="#ef4444"/>
      </svg>
    </div>
    
    {/* Bubbles scattered */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute bottom-0 left-[16%] w-4 h-4 bg-cyan-300/30 rounded-full animate-bubble" />
      <div className="absolute bottom-0 left-1/3 w-3 h-3 bg-blue-300/25 rounded-full animate-bubble" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-0 left-1/2 w-5 h-5 bg-sky-300/20 rounded-full animate-bubble" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-0 left-2/3 w-2 h-2 bg-cyan-400/35 rounded-full animate-bubble" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-0 right-1/4 w-3 h-3 bg-blue-400/25 rounded-full animate-bubble" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 right-[16%] w-4 h-4 bg-sky-400/20 rounded-full animate-bubble" style={{ animationDelay: '0.3s' }} />
    </div>
    
    {/* Waves at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-6 opacity-20 pointer-events-none overflow-hidden">
      <svg className="w-full h-full animate-wave" viewBox="0 0 400 24" preserveAspectRatio="none">
        <path d="M0 16 Q50 8 100 16 T200 16 T300 16 T400 16 V24 H0 Z" fill="#0ea5e9"/>
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
