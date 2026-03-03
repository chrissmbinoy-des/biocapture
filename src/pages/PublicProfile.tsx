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
  Loader2, Award, Flame, Globe, MapPin, Crown, Medal, Trophy, Star,
  Leaf, Cat, Bug, Bird, Fish, Microscope, Target, Zap, Shield, Heart,
  Sun, Moon, Mountain, Trees, Waves, Wind, Cloud, Snowflake, Sparkles,
  Compass, Rainbow, Earth, Map, Calendar, CalendarDays, CalendarCheck,
  Dumbbell, ArrowLeft, LucideIcon, UserPlus, UserMinus,
} from "lucide-react";
import { BadgeProgressCircle } from "@/components/BadgeProgressCircle";
import { ProfileThemeWrapper, getFrameStyles, getTitleStyles } from "@/components/ProfileThemeWrapper";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";
import type { Json } from "@/integrations/supabase/types";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
  display_badges: string[] | null;
  equipped_items: Json | null;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  icon: string;
  metadata: Json;
}

interface UserPurchase {
  id: string;
  item_id: string;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
  shop_items: ShopItem;
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

interface PublicIdentification {
  id: string;
  species_name: string;
  scientific_name: string | null;
  kingdom: string;
  image_url: string | null;
  identified_at: string;
  confidence: number | null;
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

const getBadgeIcon = (iconStr: string): LucideIcon => {
  if (BADGE_ICON_MAP[iconStr]) return BADGE_ICON_MAP[iconStr];
  const STRING_ICON_MAP: Record<string, LucideIcon> = {
    leaf: Leaf, star: Star, butterfly: Sparkles, feather: Sparkles,
    crown: Crown, award: Award, trophy: Trophy, shield: Shield,
  };
  return STRING_ICON_MAP[iconStr] || Award;
};

const getShopBadgeColor = (item: ShopItem): "green" | "violet" | "gold" | "red" => {
  const meta = item.metadata as Record<string, unknown> | null;
  const rarity = (meta?.rarity as string) || "";
  if (rarity === "legendary") return "gold";
  if (rarity === "rare") return "violet";
  if (rarity === "mythic") return "red";
  return "green";
};

const KINGDOM_COLORS: Record<string, string> = {
  plant: "bg-species-plant/15 text-species-plant border-species-plant/30",
  mammal: "bg-species-mammal/15 text-species-mammal border-species-mammal/30",
  insect: "bg-species-insect/15 text-species-insect border-species-insect/30",
  bird: "bg-species-bird/15 text-species-bird border-species-bird/30",
  reptile: "bg-species-reptile/15 text-species-reptile border-species-reptile/30",
  fish: "bg-species-fish/15 text-species-fish border-species-fish/30",
  amphibian: "bg-species-amphibian/15 text-species-amphibian border-species-amphibian/30",
  other: "bg-species-other/15 text-species-other border-species-other/30",
};

export default function PublicProfile() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("share");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Step 1: Resolve share ID to user_id
  const { data: resolvedUserId, isLoading: resolvingUser } = useQuery({
    queryKey: ["resolveShareId", shareId],
    queryFn: async () => {
      if (!shareId) return null;
      // Try matching from profiles first
      const { data: profiles } = await supabase.from("user_profiles").select("user_id");
      const match = profiles?.find(p => p.user_id.toLowerCase().endsWith(shareId.toLowerCase()));
      if (match) return match.user_id;
      // Fallback to RPC
      const { data: userId } = await supabase.rpc("get_user_id_by_share_id", { share_id: shareId });
      return userId || null;
    },
    enabled: !!shareId,
    staleTime: 5 * 60 * 1000,
  });

  // Step 2: Fetch profile data using resolved user ID
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["publicProfile", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return null;
      const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", resolvedUserId).maybeSingle();
      if (error) throw error;
      return (data as UserProfile) || {
        id: "", user_id: resolvedUserId, username: null, display_name: null,
        bio: null, country: null, avatar_url: null, display_badges: null, equipped_items: null,
      } as UserProfile;
    },
    enabled: !!resolvedUserId,
    staleTime: 60 * 1000,
  });

  // All dependent queries use resolvedUserId directly - no stale state issues
  const { data: isFollowing = false } = useQuery({
    queryKey: ["isFollowing", currentUserId, resolvedUserId],
    queryFn: async () => {
      if (!currentUserId || !resolvedUserId) return false;
      const { data } = await supabase.from("user_followers").select("id")
        .eq("follower_id", currentUserId).eq("following_id", resolvedUserId).maybeSingle();
      return !!data;
    },
    enabled: !!currentUserId && !!resolvedUserId && currentUserId !== resolvedUserId,
    staleTime: 30 * 1000,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["followerCount", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return 0;
      const { count } = await supabase.from("user_followers").select("*", { count: "exact", head: true }).eq("following_id", resolvedUserId);
      return count || 0;
    },
    enabled: !!resolvedUserId,
    staleTime: 30 * 1000,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ["followingCount", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return 0;
      const { count } = await supabase.from("user_followers").select("*", { count: "exact", head: true }).eq("follower_id", resolvedUserId);
      return count || 0;
    },
    enabled: !!resolvedUserId,
    staleTime: 30 * 1000,
  });

  const { data: speciesCount = 0 } = useQuery({
    queryKey: ["publicSpeciesCount", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return 0;
      const { data } = await supabase.rpc("get_user_species_count", { target_user_id: resolvedUserId });
      return data || 0;
    },
    enabled: !!resolvedUserId,
    staleTime: 60 * 1000,
  });

  const { data: uniqueSpeciesCount = 0 } = useQuery({
    queryKey: ["publicUniqueSpecies", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return 0;
      const { data } = await supabase.rpc("get_user_unique_species_count", { target_user_id: resolvedUserId });
      return data || 0;
    },
    enabled: !!resolvedUserId,
    staleTime: 60 * 1000,
  });

  const { data: allUserBadges = [] } = useQuery({
    queryKey: ["publicUserBadges", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      const { data, error } = await supabase.from("user_badges").select("*, badges(*)").eq("user_id", resolvedUserId);
      if (error) throw error;
      return (data as UserBadge[]) || [];
    },
    enabled: !!resolvedUserId,
    staleTime: 60 * 1000,
  });

  const displayedEarnedBadges = profile?.display_badges?.length
    ? allUserBadges.filter((ub) => profile.display_badges?.includes(ub.badge_id))
    : allUserBadges.slice(0, 3);

  const { data: userPurchases = [] } = useQuery({
    queryKey: ["publicUserPurchases", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      const { data, error } = await supabase.from("user_purchases").select("*, shop_items(*)")
        .eq("user_id", resolvedUserId).eq("is_active", true);
      if (error) throw error;
      return (data as UserPurchase[]) || [];
    },
    enabled: !!resolvedUserId,
    staleTime: 60 * 1000,
  });

  const displayedShopBadges = profile?.display_badges?.length
    ? userPurchases.filter(p => p.shop_items?.category === "badge" && profile.display_badges?.includes(p.shop_items.id))
    : [];

  const equippedItems = (profile?.equipped_items as Record<string, string>) || {};

  const getEquippedTheme = (): string | null => {
    if (!equippedItems.theme) return null;
    const purchase = userPurchases.find((p) => p.item_id === equippedItems.theme);
    if (!purchase?.shop_items?.metadata) return null;
    return ((purchase.shop_items.metadata as Record<string, unknown>).style as string) || null;
  };

  const getEquippedFrame = (): string | null => {
    if (!equippedItems.frame) return null;
    const purchase = userPurchases.find((p) => p.item_id === equippedItems.frame);
    if (!purchase?.shop_items?.metadata) return null;
    return ((purchase.shop_items.metadata as Record<string, unknown>).style as string) || null;
  };

  const getEquippedTitle = (): string | null => {
    if (!equippedItems.title) return null;
    const purchase = userPurchases.find((p) => p.item_id === equippedItems.title);
    if (!purchase?.shop_items?.metadata) return null;
    const meta = purchase.shop_items.metadata as Record<string, unknown>;
    return (meta.value as string) || purchase.shop_items.name;
  };

  const { data: streakData } = useQuery({
    queryKey: ["publicStreak", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return null;
      const { data } = await supabase.from("login_streaks").select("*").eq("user_id", resolvedUserId).maybeSingle();
      return data;
    },
    enabled: !!resolvedUserId,
    staleTime: 60 * 1000,
  });

  const { data: globalRank } = useQuery({
    queryKey: ["publicGlobalRank", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return null;
      const { data } = await supabase.rpc("get_worldwide_leaderboard", { limit_count: 100 });
      return data?.find((e: { user_id: string }) => e.user_id === resolvedUserId)?.rank || null;
    },
    enabled: !!resolvedUserId,
    staleTime: 60 * 1000,
  });

  const { data: recentObservations = [] } = useQuery({
    queryKey: ["publicObservations", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      const { data, error } = await supabase.rpc("get_user_recent_identifications", {
        target_user_id: resolvedUserId,
        limit_count: 20,
      });
      if (error) throw error;
      return (data as PublicIdentification[]) || [];
    },
    enabled: !!resolvedUserId,
    staleTime: 60 * 1000,
  });

  const handleFollow = async () => {
    if (!currentUserId || !resolvedUserId) {
      toast.error("Please sign in to follow explorers");
      return;
    }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("user_followers").delete()
          .eq("follower_id", currentUserId).eq("following_id", resolvedUserId);
        toast.success("Unfollowed explorer");
      } else {
        await supabase.from("user_followers").insert({ follower_id: currentUserId, following_id: resolvedUserId });
        toast.success("Now following explorer!");
      }
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
      queryClient.invalidateQueries({ queryKey: ["followerCount"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const getExplorerName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.username) return `@${profile.username}`;
    if (!resolvedUserId) return "Explorer";
    return `Explorer #${resolvedUserId.slice(-4).toUpperCase()}`;
  };

  const getUsername = () => profile?.username ? `@${profile.username}` : null;

  const getRankBadge = (rank: number | null, type: "global" | "country") => {
    if (!rank || rank > 100) return null;
    let color = "bg-muted text-muted-foreground";
    let icon = null;
    let label = "";
    if (rank === 1) { color = "bg-yellow-500 text-white"; icon = <Crown className="h-3 w-3" />; label = "1st"; }
    else if (rank === 2) { color = "bg-gray-400 text-white"; icon = <Medal className="h-3 w-3" />; label = "2nd"; }
    else if (rank === 3) { color = "bg-amber-600 text-white"; icon = <Medal className="h-3 w-3" />; label = "3rd"; }
    else if (rank <= 50) { color = "bg-primary/80 text-primary-foreground"; label = "Top 50"; }
    else { color = "bg-secondary text-secondary-foreground"; label = "Top 100"; }
    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
        {icon}
        {type === "global" ? <Globe className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
        <span>{label}</span>
      </div>
    );
  };

  if (resolvingUser || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !resolvedUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">This profile doesn't exist or the link is invalid.</p>
          <Link to="/"><Button><ArrowLeft className="h-4 w-4 mr-2" />Go Home</Button></Link>
        </Card>
      </div>
    );
  }

  const equippedTheme = getEquippedTheme();
  const equippedFrame = getEquippedFrame();
  const equippedTitle = getEquippedTitle();

  return (
    <div className="min-h-screen bg-background pb-8">
      <ProfileThemeWrapper theme={equippedTheme} className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />Back
          </Link>

          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className={`h-24 w-24 shadow-lg ${getFrameStyles(equippedFrame)}`}>
                {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={getExplorerName()} /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getExplorerName().slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                {getRankBadge(globalRank ?? null, "global")}
              </div>
            </div>

            <div className="flex-1 pt-1">
              <h1 className="text-xl font-bold">{getExplorerName()}</h1>
              {getUsername() && profile.display_name && (
                <p className="text-sm text-muted-foreground">{getUsername()}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {equippedTitle && (
                  <Badge variant="secondary" className={`text-xs ${getTitleStyles(equippedTitle)}`}>
                    {equippedTitle}
                  </Badge>
                )}
                {streakData && streakData.current_streak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                    <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streakData.current_streak}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 mt-3">
                {displayedEarnedBadges.slice(0, 3 - displayedShopBadges.length).map((ub) => (
                  <div key={ub.id} title={ub.badges.name}>
                    <BadgeProgressCircle icon={getBadgeIcon(ub.badges.icon)} progress={1} isEarned={true} size="sm" />
                  </div>
                ))}
                {displayedShopBadges.slice(0, 3 - displayedEarnedBadges.length).map((purchase) => (
                  <div key={purchase.id} title={purchase.shop_items.name}>
                    <BadgeProgressCircle icon={getBadgeIcon(purchase.shop_items.icon)} progress={1} isEarned={true} size="sm" color={getShopBadgeColor(purchase.shop_items)} />
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - displayedEarnedBadges.length - displayedShopBadges.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="opacity-30">
                    <BadgeProgressCircle icon={Award} progress={0} isEarned={false} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {profile.bio && <p className="text-sm text-muted-foreground mt-4">{profile.bio}</p>}
          {profile.country && (
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /><span>{profile.country}</span>
            </div>
          )}

          {currentUserId && resolvedUserId && currentUserId !== resolvedUserId && (
            <div className="mt-4">
              <Button onClick={handleFollow} disabled={followLoading} variant={isFollowing ? "outline" : "default"} className="w-full">
                {followLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isFollowing ? <UserMinus className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mt-4 bg-background/60 backdrop-blur rounded-xl p-4">
            <div className="text-center"><p className="text-2xl font-bold">{speciesCount}</p><p className="text-xs text-muted-foreground">Sightings</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{uniqueSpeciesCount}</p><p className="text-xs text-muted-foreground">Species</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{followerCount}</p><p className="text-xs text-muted-foreground">Followers</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{followingCount}</p><p className="text-xs text-muted-foreground">Following</p></div>
          </div>
        </div>
      </ProfileThemeWrapper>

      {recentObservations.length > 0 && (
        <div className="max-w-lg mx-auto px-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">Recent Observations</h2>
          <div className="grid grid-cols-2 gap-3">
            {recentObservations.map((obs) => (
              <Card key={obs.id} className="overflow-hidden">
                {obs.image_url && (
                  <div className="aspect-square bg-muted">
                    <img src={obs.image_url} alt={obs.species_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{obs.species_name}</h3>
                  {obs.scientific_name && (
                    <p className="text-xs text-muted-foreground italic truncate">{obs.scientific_name}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${KINGDOM_COLORS[obs.kingdom] || ""}`}>
                      {obs.kingdom}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(obs.identified_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
