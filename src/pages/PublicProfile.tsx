import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
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
  UserPlus,
  UserMinus,
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
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("share");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // Find user by share ID (last 8 chars of user_id)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["publicProfile", shareId],
    queryFn: async () => {
      if (!shareId) return null;
      
      // First try to find in user_profiles - filter by checking if user_id ends with shareId
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("*");

      if (error) throw error;
      
      // Find profile where user_id ends with the shareId
      const matchedProfile = profiles?.find(p => 
        p.user_id.toLowerCase().endsWith(shareId.toLowerCase())
      );
      
      if (matchedProfile) {
        setProfileUserId(matchedProfile.user_id);
        return matchedProfile as UserProfile;
      }
      
      // If no profile found, check species_identifications to see if user exists
      const { data: species } = await supabase
        .from("species_identifications")
        .select("user_id");
      
      const matchedSpecies = species?.find(s => 
        s.user_id.toLowerCase().endsWith(shareId.toLowerCase())
      );
      
      if (matchedSpecies) {
        const userId = matchedSpecies.user_id;
        setProfileUserId(userId);
        // Return a minimal profile for users without a profile entry
        return {
          id: "",
          user_id: userId,
          username: null,
          display_name: null,
          bio: null,
          country: null,
          avatar_url: null,
          display_badges: null,
        } as UserProfile;
      }
      
      return null;
    },
    enabled: !!shareId,
  });

  // Check if following
  const { data: isFollowing = false } = useQuery({
    queryKey: ["isFollowing", currentUserId, profileUserId],
    queryFn: async () => {
      if (!currentUserId || !profileUserId) return false;
      const { data, error } = await supabase
        .from("user_followers")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", profileUserId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!currentUserId && !!profileUserId && currentUserId !== profileUserId,
  });

  // Fetch follower count
  const { data: followerCount = 0 } = useQuery({
    queryKey: ["followerCount", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return 0;
      const { count, error } = await supabase
        .from("user_followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileUserId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profileUserId,
  });

  // Fetch following count
  const { data: followingCount = 0 } = useQuery({
    queryKey: ["followingCount", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return 0;
      const { count, error } = await supabase
        .from("user_followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileUserId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profileUserId,
  });

  // Fetch species count
  const { data: speciesCount = 0 } = useQuery({
    queryKey: ["publicSpeciesCount", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return 0;
      const { count, error } = await supabase
        .from("species_identifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profileUserId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profileUserId,
  });

  // Fetch unique species count
  const { data: uniqueSpeciesCount = 0 } = useQuery({
    queryKey: ["publicUniqueSpecies", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return 0;
      const { data, error } = await supabase
        .from("species_identifications")
        .select("species_name")
        .eq("user_id", profileUserId);
      if (error) throw error;
      const unique = new Set(data?.map((s) => s.species_name.toLowerCase()));
      return unique.size;
    },
    enabled: !!profileUserId,
  });

  // Fetch all user badges
  const { data: allUserBadges = [] } = useQuery({
    queryKey: ["publicUserBadges", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", profileUserId);
      if (error) throw error;
      return (data as UserBadge[]) || [];
    },
    enabled: !!profileUserId,
  });

  // Get displayed badges (either selected or first 3)
  const displayedBadges = profile?.display_badges?.length
    ? allUserBadges.filter((ub) => profile.display_badges?.includes(ub.badge_id))
    : allUserBadges.slice(0, 3);

  // Fetch login streak
  const { data: streakData } = useQuery({
    queryKey: ["publicStreak", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return null;
      const { data, error } = await supabase
        .from("login_streaks")
        .select("*")
        .eq("user_id", profileUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profileUserId,
  });

  // Fetch global rank
  const { data: globalRank } = useQuery({
    queryKey: ["publicGlobalRank", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return null;
      const { data, error } = await supabase.rpc("get_worldwide_leaderboard", {
        limit_count: 100,
      });
      if (error) throw error;
      const userEntry = data?.find((e: { user_id: string }) => e.user_id === profileUserId);
      return userEntry?.rank || null;
    },
    enabled: !!profileUserId,
  });

  // Fetch country rank
  const { data: countryData } = useQuery({
    queryKey: ["publicCountryRank", profileUserId, profile?.country],
    queryFn: async () => {
      if (!profileUserId || !profile?.country) return { country: null, rank: null };

      const { data: leaderboard } = await supabase.rpc("get_country_leaderboard", {
        country_filter: profile.country,
        limit_count: 100,
      });
      const userEntry = leaderboard?.find((e: { user_id: string }) => e.user_id === profileUserId);
      return { country: profile.country, rank: userEntry?.rank || null };
    },
    enabled: !!profileUserId && !!profile?.country,
  });

  const handleFollow = async () => {
    if (!currentUserId || !profileUserId) {
      toast.error("Please sign in to follow explorers");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("user_followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profileUserId);
        if (error) throw error;
        toast.success("Unfollowed explorer");
      } else {
        const { error } = await supabase
          .from("user_followers")
          .insert({ follower_id: currentUserId, following_id: profileUserId });
        if (error) throw error;
        toast.success("Now following explorer!");
      }
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
      queryClient.invalidateQueries({ queryKey: ["followerCount"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const getExplorerName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.username) return `@${profile.username}`;
    if (!profileUserId) return "Explorer";
    return `Explorer #${profileUserId.slice(-4).toUpperCase()}`;
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

          {/* Follow Button */}
          {currentUserId && currentUserId !== profileUserId && (
            <div className="mt-4">
              <Button
                onClick={handleFollow}
                disabled={followLoading}
                variant={isFollowing ? "outline" : "default"}
                className="w-full"
              >
                {followLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isFollowing ? (
                  <UserMinus className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mt-4 bg-background/60 backdrop-blur rounded-xl p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{speciesCount}</p>
              <p className="text-xs text-muted-foreground">Sightings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{uniqueSpeciesCount}</p>
              <p className="text-xs text-muted-foreground">Species</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{followerCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{followingCount}</p>
              <p className="text-xs text-muted-foreground">Following</p>
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
