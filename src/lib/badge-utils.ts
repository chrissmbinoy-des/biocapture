import { LucideIcon, Award, Leaf, Cat, Bug, Bird, Fish, Microscope, Star, Trophy, Target, Zap, Crown, Medal, Shield, Heart, Flame, Sun, Moon, Mountain, Trees, Waves, Wind, Cloud, Snowflake, Sparkles, Compass, Rainbow, Earth, Globe, Map, Calendar, CalendarDays, CalendarCheck, Dumbbell } from "lucide-react";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";

export type BadgeColor = "green" | "violet" | "gold" | "red";

export interface BadgeRequirement {
  requirement_type?: string;
  requirement_value?: string | null;
  name?: string;
}

const BADGE_ICON_MAP: { [key: string]: LucideIcon } = {
  "🌿": Leaf, "🦁": Cat, "🦋": Bug, "🦅": Bird, "🐟": Fish,
  "🦎": CrocodileIcon as unknown as LucideIcon,
  "🐸": FrogIcon as unknown as LucideIcon,
  "🦠": Microscope, "⭐": Star, "🌟": Star, "🏆": Trophy, "🎯": Target,
  "⚡": Zap, "👑": Crown, "🥇": Medal, "🏅": Medal, "🎖️": Medal,
  "🛡️": Shield, "❤️": Heart, "🔥": Flame, "☀️": Sun, "🌙": Moon,
  "🏔️": Mountain, "🌲": Trees, "🌊": Waves, "💨": Wind, "☁️": Cloud,
  "❄️": Snowflake, "✨": Sparkles, "🧭": Compass, "🌈": Rainbow,
  "🌍": Earth, "🌏": Globe, "🗺️": Map, "📅": Calendar,
  "🗓️": CalendarDays, "📆": CalendarCheck, "💪": Dumbbell, "💎": Star,
};

export const getBadgeIcon = (iconStr: string): LucideIcon => {
  return BADGE_ICON_MAP[iconStr] || Award;
};

export const getBadgeColor = (badge: BadgeRequirement): BadgeColor => {
  const { requirement_type, requirement_value } = badge;

  if (requirement_type === "total_count") {
    const val = parseInt(requirement_value || "1");
    if (val <= 25) return "green";
    if (val <= 75) return "violet";
    if (val <= 150) return "gold";
    return "red";
  }

  if (requirement_type === "kingdom_count") {
    try {
      const req = JSON.parse(requirement_value || "{}");
      const count = req.count || 1;
      if (count <= 1) return "green";
      if (count <= 10) return "violet";
      return "gold";
    } catch { return "green"; }
  }

  if (requirement_type === "kingdom_diversity") {
    const val = parseInt(requirement_value || "1");
    if (val <= 3) return "green";
    if (val <= 5) return "violet";
    return "gold";
  }

  if (requirement_type === "challenge_count") {
    const val = parseInt(requirement_value || "1");
    if (val <= 1) return "green";
    if (val <= 10) return "violet";
    return "gold";
  }

  if (requirement_type === "streak") {
    const val = parseInt(requirement_value || "1");
    if (val <= 3) return "green";
    if (val <= 7) return "violet";
    return "gold";
  }

  if (requirement_type === "single_rare") return "violet";
  if (requirement_type === "location_count") return "violet";

  // Fallback: check name
  const lowerName = (badge.name || "").toLowerCase();
  if (lowerName.includes("rare")) return "violet";
  if (lowerName.includes("legendary")) return "gold";
  if (lowerName.includes("mythic")) return "red";

  return "green";
};

export const BADGE_COLOR_HSL: Record<BadgeColor, string> = {
  green: "hsl(142, 71%, 45%)",
  violet: "hsl(270, 70%, 55%)",
  gold: "hsl(45, 90%, 55%)",
  red: "hsl(0, 75%, 55%)",
};

export const getDifficultyLabel = (color: BadgeColor): string => {
  switch (color) {
    case "green": return "Easy";
    case "violet": return "Hard";
    case "gold": return "Expert";
    case "red": return "Legendary";
  }
};

export const RARITY_ORDER: Record<string, number> = { green: 0, violet: 1, gold: 2, red: 3 };

export const KINGDOM_LABELS: { [key: string]: string } = {
  plant: "Plants", mammal: "Mammals", insect: "Insects", bird: "Birds",
  reptile: "Reptiles", fish: "Fish", amphibian: "Amphibians", other: "Other",
};
