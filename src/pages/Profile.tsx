import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  Crown,
  Leaf,
  Waves,
  Award,
  Trophy,
  Star,
  Feather,
  Shield,
  PlusCircle,
  Sparkles,
  Zap,
  Check,
  Clock,
  Cat,
  Bug,
  Bird,
  Fish,
  Microscope,
  Target,
  Flame,
  Sun,
  Moon,
  Mountain,
  Trees,
  Wind,
  Cloud,
  Snowflake,
  Medal,
  Heart,
  Compass,
  Rainbow,
  Earth,
  Globe,
  Map,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Dumbbell,
  LucideIcon,
  Settings,
  Share2,
  UserPlus,
  UserMinus,
  MapPin,
  Edit2,
  Camera,
  Grid3X3,
  Twitter,
  Facebook,
  Copy,
} from "lucide-react";
import CoinIcon from "@/components/icons/CoinIcon";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";
import { BadgeProgressCircle } from "@/components/BadgeProgressCircle";
import type { Json } from "@/integrations/supabase/types";

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
  earned_at: string;
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement_type: string;
    requirement_value: string | null;
  };
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  country: string | null;
  display_badges: string[] | null;
}

interface EquippedItems {
  avatar?: string;
  frame?: string;
  theme?: string;
  title?: string;
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
};

const getBadgeIcon = (iconStr: string): LucideIcon => {
  return BADGE_ICON_MAP[iconStr] || Award;
};

const iconMap: Record<string, React.ReactNode> = {
  crown: <Crown className="h-6 w-6" />,
  leaf: <Leaf className="h-6 w-6" />,
  waves: <Waves className="h-6 w-6" />,
  award: <Award className="h-6 w-6" />,
  trophy: <Trophy className="h-6 w-6" />,
  butterfly: <Sparkles className="h-6 w-6" />,
  star: <Star className="h-6 w-6" />,
  feather: <Feather className="h-6 w-6" />,
  coins: <CoinIcon className="h-6 w-6" />,
  shield: <Shield className="h-6 w-6" />,
  "plus-circle": <PlusCircle className="h-6 w-6" />,
};

export default function Profile() {
  const { userId: urlUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [equipped, setEquipped] = useState<EquippedItems>({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("discoveries");
  const [equippedTitle, setEquippedTitle] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  // Stats
  const [speciesCount, setSpeciesCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [countryRank, setCountryRank] = useState<number | null>(null);
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    display_name: "",
    bio: "",
    country: "",
  });
  
  // Display badges for profile
  const [displayBadges, setDisplayBadges] = useState<string[]>([]);

  useEffect(() => {
    fetchProfileData();
  }, [urlUserId]);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
      
      const targetUserId = urlUserId || user.id;
      setViewingUserId(targetUserId);
      setIsOwnProfile(targetUserId === user.id);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", targetUserId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setDisplayBadges(profileData.display_badges || []);
        setEditForm({
          username: profileData.username || "",
          display_name: profileData.display_name || "",
          bio: profileData.bio || "",
          country: profileData.country || "",
        });
      } else if (targetUserId === user.id) {
        // Create profile for current user if it doesn't exist
        const { data: newProfile } = await supabase
          .from("user_profiles")
          .insert({ user_id: user.id })
          .select()
          .single();
        if (newProfile) {
          setProfile(newProfile);
        }
      }

      // Fetch species count
      const { count: speciesCountData } = await supabase
        .from("species_identifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", targetUserId);
      setSpeciesCount(speciesCountData || 0);

      // Fetch followers count
      const { count: followersData } = await supabase
        .from("user_followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);
      setFollowersCount(followersData || 0);

      // Fetch following count
      const { count: followingData } = await supabase
        .from("user_followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);
      setFollowingCount(followingData || 0);

      // Check if current user follows this profile
      if (targetUserId !== user.id) {
        const { data: followData } = await supabase
          .from("user_followers")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)
          .single();
        setIsFollowing(!!followData);
      }

      // Fetch login streak
      const { data: streakData } = await supabase
        .from("login_streaks")
        .select("current_streak")
        .eq("user_id", targetUserId)
        .single();
      setCurrentStreak(streakData?.current_streak || 0);

      // Fetch ranks
      const { data: globalRankData } = await supabase
        .rpc('get_worldwide_leaderboard', { limit_count: 100 });
      const userGlobalRank = globalRankData?.find((e: any) => e.user_id === targetUserId);
      setGlobalRank(userGlobalRank?.rank || null);

      // Fetch country rank
      const { data: userCountry } = await supabase
        .rpc('get_user_country', { target_user_id: targetUserId });
      if (userCountry) {
        const { data: countryRankData } = await supabase
          .rpc('get_country_leaderboard', { country_filter: userCountry, limit_count: 100 });
        const userCountryRank = countryRankData?.find((e: any) => e.user_id === targetUserId);
        setCountryRank(userCountryRank?.rank || null);
      }

      // Fetch user purchases with item details
      const { data: purchasesData } = await supabase
        .from("user_purchases")
        .select("*, shop_items(*)")
        .eq("user_id", targetUserId)
        .eq("is_active", true);
      setPurchases(purchasesData || []);

      // Fetch earned badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", targetUserId)
        .order("earned_at", { ascending: false });
      setEarnedBadges(badgesData || []);

      // Load equipped items from localStorage (only for own profile)
      if (targetUserId === user.id) {
        const savedEquipped = localStorage.getItem(`equipped_${user.id}`);
        if (savedEquipped) {
          const parsedEquipped = JSON.parse(savedEquipped);
          setEquipped(parsedEquipped);
          
          if (parsedEquipped.title) {
            const titlePurchase = purchasesData?.find(p => p.item_id === parsedEquipped.title);
            if (titlePurchase) {
              setEquippedTitle(titlePurchase.shop_items?.name || null);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || !viewingUserId) return;
    
    try {
      if (isFollowing) {
        await supabase
          .from("user_followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", viewingUserId);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast.success("Unfollowed");
      } else {
        await supabase
          .from("user_followers")
          .insert({ follower_id: currentUserId, following_id: viewingUserId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success("Following!");
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUserId) return;
    
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          username: editForm.username || null,
          display_name: editForm.display_name || null,
          bio: editForm.bio || null,
          country: editForm.country || null,
          display_badges: displayBadges,
        })
        .eq("user_id", currentUserId);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...editForm, display_badges: displayBadges } : null);
      setShowEditProfile(false);
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const toggleDisplayBadge = (badgeId: string) => {
    setDisplayBadges(prev => {
      if (prev.includes(badgeId)) {
        return prev.filter(id => id !== badgeId);
      }
      if (prev.length >= 3) {
        toast.error("Maximum 3 display badges allowed");
        return prev;
      }
      return [...prev, badgeId];
    });
  };

  const handleEquip = (item: ShopItem) => {
    if (!isOwnProfile) return;
    
    const metadata = item.metadata as Record<string, unknown>;
    const itemType = metadata?.item_type as string;
    if (!itemType) return;

    const newEquipped = { ...equipped, [itemType]: item.id };
    setEquipped(newEquipped);

    if (currentUserId) {
      localStorage.setItem(`equipped_${currentUserId}`, JSON.stringify(newEquipped));
    }

    if (itemType === 'title') {
      setEquippedTitle(item.name);
    }

    toast.success(`${item.name} equipped!`);
  };

  const handleUnequip = (itemType: string) => {
    if (!isOwnProfile) return;
    
    const newEquipped = { ...equipped };
    delete newEquipped[itemType as keyof EquippedItems];
    setEquipped(newEquipped);

    if (currentUserId) {
      localStorage.setItem(`equipped_${currentUserId}`, JSON.stringify(newEquipped));
    }

    if (itemType === 'title') {
      setEquippedTitle(null);
    }

    toast.success("Item unequipped");
  };

  const isEquipped = (itemId: string) => Object.values(equipped).includes(itemId);

  const isBoostActive = (purchase: UserPurchase) => {
    if (!purchase.expires_at) return true;
    return new Date(purchase.expires_at) > new Date();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const filterByCategory = (category: string) => purchases.filter((p) => p.shop_items?.category === category);

  const getRankBadge = () => {
    const rank = globalRank || countryRank;
    if (!rank) return null;
    
    if (rank === 1) return <Badge className="bg-yellow-500 text-yellow-950">#1</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-gray-950">#2</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-amber-950">#3</Badge>;
    if (rank <= 50) return <Badge variant="outline" className="border-primary text-primary">Top 50</Badge>;
    if (rank <= 100) return <Badge variant="outline">Top 100</Badge>;
    return null;
  };

  const handleShare = (platform: string) => {
    const profileUrl = `${window.location.origin}/profile/${viewingUserId}`;
    const text = `Check out ${profile?.display_name || profile?.username || "this explorer"}'s species discoveries!`;
    
    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied!");
        setShowShareDialog(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  // Get display badges for header
  const getDisplayBadgesForHeader = () => {
    if (displayBadges.length === 0) return earnedBadges.slice(0, 3);
    return earnedBadges.filter(b => displayBadges.includes(b.badge_id)).slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || "Explorer";

  return (
    <div className="pb-20">
      {/* Instagram-style Header */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/20 p-4">
        <div className="flex items-start gap-4">
          {/* Avatar with rank badge */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-2 border-background shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-primary-foreground" />
              )}
            </div>
            {getRankBadge() && (
              <div className="absolute -bottom-1 -right-1">
                {getRankBadge()}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold truncate">{displayName}</h1>
              {/* Display badges near username */}
              <div className="flex gap-1">
                {getDisplayBadgesForHeader().map((userBadge) => (
                  <div key={userBadge.id} className="w-5 h-5">
                    <BadgeProgressCircle
                      icon={getBadgeIcon(userBadge.badges.icon)}
                      progress={1}
                      isEarned={true}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {equippedTitle && (
              <Badge variant="secondary" className="mb-2 bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                {equippedTitle}
              </Badge>
            )}

            {profile?.country && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                {profile.country}
              </div>
            )}

            <div className="flex gap-4 text-center">
              <div>
                <p className="font-bold text-lg">{speciesCount}</p>
                <p className="text-xs text-muted-foreground">Species</p>
              </div>
              <div>
                <p className="font-bold text-lg">{followersCount}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="font-bold text-lg">{followingCount}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 mt-3 bg-background/50 rounded-lg p-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">{currentStreak} day streak</span>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm text-muted-foreground mt-3">{profile.bio}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {isOwnProfile ? (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowEditProfile(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                className="flex-1"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
          <TabsTrigger value="discoveries" className="flex items-center gap-1 text-xs rounded-none">
            <Grid3X3 className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-1 text-xs rounded-none">
            <Award className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-1 text-xs rounded-none">
            <Sparkles className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="boosts" className="flex items-center gap-1 text-xs rounded-none">
            <Zap className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <div className="p-4">
          <TabsContent value="discoveries" className="mt-0">
            <Card className="p-6 text-center">
              <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {speciesCount > 0 
                  ? `${speciesCount} species discovered`
                  : "No species discovered yet"}
              </p>
              <Link to={`/plants`}>
                <Button variant="link" className="mt-2">View Collection</Button>
              </Link>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="mt-0">
            <div className="space-y-3">
              {earnedBadges.length === 0 ? (
                <Card className="p-6 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {earnedBadges.map((userBadge) => (
                    <Card 
                      key={userBadge.id} 
                      className={`p-3 text-center bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 ${
                        displayBadges.includes(userBadge.badge_id) ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => isOwnProfile && toggleDisplayBadge(userBadge.badge_id)}
                    >
                      <div className="flex justify-center mb-2">
                        <BadgeProgressCircle
                          icon={getBadgeIcon(userBadge.badges.icon)}
                          progress={1}
                          isEarned={true}
                          size="lg"
                        />
                      </div>
                      <h3 className="font-semibold text-xs truncate">{userBadge.badges.name}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(userBadge.earned_at).toLocaleDateString()}
                      </p>
                      {displayBadges.includes(userBadge.badge_id) && (
                        <Badge variant="secondary" className="mt-1 text-[8px]">Display</Badge>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-0">
            <div className="space-y-3">
              {filterByCategory("profile").length === 0 ? (
                <Card className="p-6 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No profile items yet</p>
                  {isOwnProfile && (
                    <Link to="/coin-shop">
                      <Button variant="link" className="mt-2">Visit Shop</Button>
                    </Link>
                  )}
                </Card>
              ) : (
                filterByCategory("profile").map((purchase) => {
                  const item = purchase.shop_items;
                  const equippedItem = isEquipped(item.id);
                  const metadata = item.metadata as Record<string, unknown>;

                  return (
                    <Card key={purchase.id} className={`p-4 ${equippedItem ? "border-primary" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                          {iconMap[item.icon] || <Sparkles className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{metadata?.item_type as string}</p>
                        </div>
                        {isOwnProfile && (
                          <Button
                            size="sm"
                            variant={equippedItem ? "outline" : "default"}
                            onClick={() => equippedItem ? handleUnequip(metadata?.item_type as string) : handleEquip(item)}
                          >
                            {equippedItem ? "Unequip" : "Equip"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="boosts" className="mt-0">
            <div className="space-y-3">
              {filterByCategory("boost").length === 0 ? (
                <Card className="p-6 text-center">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No active boosts</p>
                  {isOwnProfile && (
                    <Link to="/coin-shop">
                      <Button variant="link" className="mt-2">Visit Shop</Button>
                    </Link>
                  )}
                </Card>
              ) : (
                filterByCategory("boost").map((purchase) => {
                  const item = purchase.shop_items;
                  const active = isBoostActive(purchase);

                  return (
                    <Card key={purchase.id} className={`p-4 ${active ? "border-blue-500 bg-blue-500/5" : "opacity-50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"}`}>
                          {iconMap[item.icon] || <Zap className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          {purchase.expires_at && (
                            <div className="flex items-center gap-1 mt-1 text-xs">
                              <Clock className="h-3 w-3" />
                              <span className={active ? "text-blue-500" : "text-destructive"}>
                                {getTimeRemaining(purchase.expires_at)}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge variant={active ? "default" : "secondary"}>
                          {active ? "Active" : "Expired"}
                        </Badge>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="mx-4 max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Customize your profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="your_username"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Country</label>
              <Input
                value={editForm.country}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                placeholder="Your Country"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Display Badges (select up to 3)</label>
              <div className="grid grid-cols-4 gap-2">
                {earnedBadges.map((userBadge) => (
                  <div
                    key={userBadge.id}
                    className={`p-2 rounded-lg cursor-pointer border-2 transition-all ${
                      displayBadges.includes(userBadge.badge_id)
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/50"
                    }`}
                    onClick={() => toggleDisplayBadge(userBadge.badge_id)}
                  >
                    <BadgeProgressCircle
                      icon={getBadgeIcon(userBadge.badges.icon)}
                      progress={1}
                      isEarned={true}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditProfile(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveProfile}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="mx-4 max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Share Profile</DialogTitle>
            <DialogDescription>Share your discoveries with friends</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" className="flex flex-col gap-2 h-auto py-4" onClick={() => handleShare("twitter")}>
              <Twitter className="h-6 w-6" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-2 h-auto py-4" onClick={() => handleShare("facebook")}>
              <Facebook className="h-6 w-6" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button variant="outline" className="flex flex-col gap-2 h-auto py-4" onClick={() => handleShare("copy")}>
              <Copy className="h-6 w-6" />
              <span className="text-xs">Copy Link</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
