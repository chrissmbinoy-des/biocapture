import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Award,
  Flame,
  Globe,
  MapPin,
  Crown,
  Medal,
  Trophy,
  Star,
  Leaf,
  Cat,
  Bug,
  Bird,
  Fish,
  Microscope,
  Target,
  Zap,
  Shield,
  Heart,
  Sun,
  Moon,
  Mountain,
  Trees,
  Waves,
  Wind,
  Cloud,
  Snowflake,
  Sparkles,
  Compass,
  Rainbow,
  Earth,
  Map,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Dumbbell,
  ArrowLeft,
  LucideIcon,
} from "lucide-react";
import { BadgeProgressCircle } from "@/components/BadgeProgressCircle";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
  display_badges: string[] | null;
}

interface UserBadge {
  id: string;
  badge_id: string;
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
}

const BADGE_ICON_MAP: { [key: string]: LucideIcon } = {
  "🌿": Leaf,
  "🦁": Cat,
  "🦋": Bug,
  "🦅": Bird,
  "🐟": Fish,
  "🦎": CrocodileIcon as unknown as LucideIcon,
  "🐸": FrogIcon as unknown as LucideIcon,
  "🦠": Microscope,
  "⭐": Star,
  "🌟": Star,
  "🏆": Trophy,
  "🎯": Target,
  "⚡": Zap,
  "👑": Crown,
  "🥇": Medal,
  "🏅": Medal,
  "🎖️": Medal,
  "🛡️": Shield,
  "❤️": Heart,
  "🔥": Flame,
  "☀️": Sun,
  "🌙": Moon,
  "🏔️": Mountain,
  "🌲": Trees,
  "🌊": Waves,
  "💨": Wind,
  "☁️": Cloud,
  "❄️": Snowflake,
  "✨": Sparkles,
  "🧭": Compass,
  "🌈": Rainbow,
  "🌍": Earth,
  "🌏": Globe,
  "🗺️": Map,
  "📅": Calendar,
  "🗓️": CalendarDays,
  "📆": CalendarCheck,
  "💪": Dumbbell,
  "💎": Star,
};

const getBadgeIcon = (iconStr: string): LucideIcon => {
  return BADGE_ICON_MAP[iconStr] || Award;
};

export default function PublicProfile() {
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("share");
  const [userId, setUserId] = useState<string | null>(null);

  // Find user by share ID (last 8 chars of user_id)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["publicProfile", shareId],
    queryFn: async () => {
      if (!shareId) return null;
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .ilike("user_id", `%${shareId}`);

      if (error) throw error;
      if (data && data.length > 0) {
        setUserId(data[0].user_id);
        return data[0] as UserProfile;
      }
      return null;
    },
    enabled: !!shareId,
  });

  // Fetch species count
  const { data: speciesCount = 0 } = useQuery({
    queryKey: ["publicSpeciesCount", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("species_identifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  // Fetch unique species count
  const { data: uniqueSpeciesCount = 0 } = useQuery({
    queryKey: ["publicUniqueSpecies", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from("species_identifications")
        .select("species_name")
        .eq("user_id", userId);
      if (error) throw error;
      const unique = new Set(data?.map((s) => s.species_name.toLowerCase()));
      return unique.size;
    },
    enabled: !!userId,
  });

  // Fetch all user badges
  const { data: allUserBadges = [] } = useQuery({
    queryKey: ["publicUserBadges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", userId);
      if (error) throw error;
      return (data as UserBadge[]) || [];
    },
    enabled: !!userId,
  });

  // Get displayed badges (either selected or first 3)
  const displayedBadges = profile?.display_badges?.length
    ? allUserBadges.filter((ub) => profile.display_badges?.includes(ub.badge_id))
    : allUserBadges.slice(0, 3);

  // Fetch login streak
  const { data: streakData } = useQuery({
    queryKey: ["publicStreak", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("login_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch global rank
  const { data: globalRank } = useQuery({
    queryKey: ["publicGlobalRank", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc("get_worldwide_leaderboard", {
        limit_count: 100,
      });
      if (error) throw error;
      const userEntry = data?.find((e: { user_id: string }) => e.user_id === userId);
      return userEntry?.rank || null;
    },
    enabled: !!userId,
  });

  // Fetch country rank
  const { data: countryData } = useQuery({
    queryKey: ["publicCountryRank", userId, profile?.country],
    queryFn: async () => {
      if (!userId || !profile?.country) return { country: null, rank: null };

      const { data: leaderboard } = await supabase.rpc("get_country_leaderboard", {
        country_filter: profile.country,
        limit_count: 100,
      });
      const userEntry = leaderboard?.find((e: { user_id: string }) => e.user_id === userId);
      return { country: profile.country, rank: userEntry?.rank || null };
    },
    enabled: !!userId && !!profile?.country,
  });

  const getExplorerName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.username) return `@${profile.username}`;
    if (!userId) return "Explorer";
    return `Explorer #${userId.slice(-4).toUpperCase()}`;
  };

  const getUsername = () => {
    return profile?.username ? `@${profile.username}` : null;
  };

  const getRankBadge = (rank: number | null, type: "global" | "country") => {
    if (!rank || rank > 100) return null;

    let color = "bg-muted text-muted-foreground";
    let icon = null;
    let label = "";

    if (rank === 1) {
      color = "bg-yellow-500 text-white";
      icon = <Crown className="h-3 w-3" />;
      label = "1st";
    } else if (rank === 2) {
      color = "bg-gray-400 text-white";
      icon = <Medal className="h-3 w-3" />;
      label = "2nd";
    } else if (rank === 3) {
      color = "bg-amber-600 text-white";
      icon = <Medal className="h-3 w-3" />;
      label = "3rd";
    } else if (rank <= 50) {
      color = "bg-primary/80 text-primary-foreground";
      label = `Top 50`;
    } else {
      color = "bg-secondary text-secondary-foreground";
      label = `Top 100`;
    }

    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
        {icon}
        {type === "global" ? <Globe className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
        <span>{label}</span>
      </div>
    );
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This profile doesn't exist or the link is invalid.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/20 px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>

          <div className="flex items-start gap-4">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={getExplorerName()} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getExplorerName().slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Global Rank Badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                {getRankBadge(globalRank ?? null, "global")}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 pt-1">
              <h1 className="text-xl font-bold">{getExplorerName()}</h1>
              {getUsername() && profile.display_name && (
                <p className="text-sm text-muted-foreground">{getUsername()}</p>
              )}

              {/* Streak and Country Rank */}
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {streakData && streakData.current_streak > 0 && (
                  <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">
                    <Flame className="h-3 w-3 mr-1" />
                    {streakData.current_streak} day streak
                  </Badge>
                )}
                {countryData?.rank && getRankBadge(countryData.rank, "country")}
              </div>

              {/* 3 Badge Circles */}
              <div className="flex gap-1 mt-3">
                {displayedBadges.map((ub) => (
                  <div key={ub.id} title={ub.badges.name}>
                    <BadgeProgressCircle
                      icon={getBadgeIcon(ub.badges.icon)}
                      progress={1}
                      isEarned={true}
                      size="sm"
                    />
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - displayedBadges.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="opacity-30">
                    <BadgeProgressCircle
                      icon={Award}
                      progress={0}
                      isEarned={false}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-4">{profile.bio}</p>
          )}

          {/* Country */}
          {profile.country && (
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{profile.country}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-6 bg-background/60 backdrop-blur rounded-xl p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{speciesCount}</p>
              <p className="text-xs text-muted-foreground">Sightings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{uniqueSpeciesCount}</p>
              <p className="text-xs text-muted-foreground">Species</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{allUserBadges.length}</p>
              <p className="text-xs text-muted-foreground">Badges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Earned Badges</h2>
        {allUserBadges.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No badges earned yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {allUserBadges.map((ub) => (
              <Card key={ub.id} className="p-3 text-center">
                <BadgeProgressCircle
                  icon={getBadgeIcon(ub.badges.icon)}
                  progress={1}
                  isEarned={true}
                  size="md"
                />
                <p className="text-xs font-medium mt-2 truncate">{ub.badges.name}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="max-w-lg mx-auto px-4 mt-8">
        <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-accent/10">
          <h3 className="font-semibold mb-2">Want to explore nature too?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Join thousands of explorers identifying species around the world!
          </p>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
