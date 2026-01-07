import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
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
  Grid3X3,
  Edit2,
  Share2,
  Flame,
  Globe,
  MapPin,
  Copy,
  Twitter,
  Facebook,
  Medal,
} from "lucide-react";
import CoinIcon from "@/components/icons/CoinIcon";
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

interface EquippedItems {
  avatar?: string;
  frame?: string;
  theme?: string;
  title?: string;
  badge?: string;
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

const iconMap: Record<string, React.ReactNode> = {
  crown: <Crown className="h-5 w-5" />,
  leaf: <Leaf className="h-5 w-5" />,
  waves: <Waves className="h-5 w-5" />,
  award: <Award className="h-5 w-5" />,
  trophy: <Trophy className="h-5 w-5" />,
  butterfly: <Sparkles className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  feather: <Feather className="h-5 w-5" />,
  coins: <CoinIcon className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  "plus-circle": <PlusCircle className="h-5 w-5" />,
};

const badgeIconMap: Record<string, React.ReactNode> = {
  leaf: <Leaf className="h-3 w-3" />,
  bug: <Sparkles className="h-3 w-3" />,
  bird: <Feather className="h-3 w-3" />,
  fish: <Waves className="h-3 w-3" />,
  paw: <Award className="h-3 w-3" />,
  microscope: <Star className="h-3 w-3" />,
  crown: <Crown className="h-3 w-3" />,
  trophy: <Trophy className="h-3 w-3" />,
  star: <Star className="h-3 w-3" />,
  award: <Award className="h-3 w-3" />,
};

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [equipped, setEquipped] = useState<EquippedItems>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("items");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Fetch species count
  const { data: speciesCount = 0 } = useQuery({
    queryKey: ["speciesCount", userId],
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
    queryKey: ["uniqueSpeciesCount", userId],
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

  // Fetch badges earned with details
  const { data: userBadges = [] } = useQuery({
    queryKey: ["userBadgesDetails", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data as UserBadge[]) || [];
    },
    enabled: !!userId,
  });

  // Fetch coin balance
  const { data: coinBalance = 0 } = useQuery({
    queryKey: ["userCoins", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from("user_coins")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!userId,
  });

  // Fetch login streak
  const { data: streakData } = useQuery({
    queryKey: ["loginStreak", userId],
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
    queryKey: ["globalRank", userId],
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

  // Fetch country and country rank
  const { data: countryData } = useQuery({
    queryKey: ["countryRank", userId],
    queryFn: async () => {
      if (!userId) return { country: null, rank: null };
      // Use country from user profile first
      const profileCountry = userProfile?.country;
      if (!profileCountry) {
        const { data: country } = await supabase.rpc("get_user_country", {
          target_user_id: userId,
        });
        if (!country) return { country: null, rank: null };

        const { data: leaderboard } = await supabase.rpc("get_country_leaderboard", {
          country_filter: country,
          limit_count: 100,
        });
        const userEntry = leaderboard?.find((e: { user_id: string }) => e.user_id === userId);
        return { country, rank: userEntry?.rank || null };
      }

      const { data: leaderboard } = await supabase.rpc("get_country_leaderboard", {
        country_filter: profileCountry,
        limit_count: 100,
      });
      const userEntry = leaderboard?.find((e: { user_id: string }) => e.user_id === userId);
      return { country: profileCountry, rank: userEntry?.rank || null };
    },
    enabled: !!userId,
  });

  const fetchProfileData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch user profile from database
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setUserProfile(profileData);
      }

      // Fetch user purchases with item details
      const { data: purchasesData, error } = await supabase
        .from("user_purchases")
        .select("*, shop_items(*)")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      setPurchases(purchasesData || []);

      // Load equipped items from localStorage (these can still be local)
      const savedEquipped = localStorage.getItem(`equipped_${user.id}`);
      if (savedEquipped) {
        setEquipped(JSON.parse(savedEquipped));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = (item: ShopItem) => {
    const metadata = item.metadata as Record<string, unknown>;
    const itemType = (metadata?.item_type as string) || item.category;

    const newEquipped = { ...equipped, [itemType]: item.id };
    setEquipped(newEquipped);

    if (userId) {
      localStorage.setItem(`equipped_${userId}`, JSON.stringify(newEquipped));
    }

    toast.success(`${item.name} equipped!`);
  };

  const handleUnequip = (itemType: string) => {
    const newEquipped = { ...equipped };
    delete newEquipped[itemType as keyof EquippedItems];
    setEquipped(newEquipped);

    if (userId) {
      localStorage.setItem(`equipped_${userId}`, JSON.stringify(newEquipped));
    }

    toast.success("Item unequipped");
  };

  const handleSaveProfile = async () => {
    if (!userId || !userProfile) return;
    
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          display_name: editDisplayName.trim() || null,
          bio: editBio.trim() || null,
        })
        .eq("user_id", userId);

      if (error) throw error;

      setUserProfile({
        ...userProfile,
        display_name: editDisplayName.trim() || null,
        bio: editBio.trim() || null,
      });
      setIsEditDialogOpen(false);
      toast.success("Profile updated!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const openEditDialog = () => {
    setEditBio(userProfile?.bio || "");
    setEditDisplayName(userProfile?.display_name || "");
    setIsEditDialogOpen(true);
  };

  const isEquipped = (itemId: string) => {
    return Object.values(equipped).includes(itemId);
  };

  const isBoostActive = (purchase: UserPurchase) => {
    if (!purchase.expires_at) return true;
    return new Date(purchase.expires_at) > new Date();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const filterByCategory = (category: string) => {
    return purchases.filter((p) => p.shop_items?.category === category);
  };

  const getEquippedTitle = () => {
    if (equipped.title) {
      const purchase = purchases.find((p) => p.item_id === equipped.title);
      return purchase?.shop_items?.name;
    }
    return null;
  };

  const getExplorerName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (userProfile?.username) return `@${userProfile.username}`;
    if (!userId) return "Explorer #0000";
    return `Explorer #${userId.slice(-4).toUpperCase()}`;
  };

  const getUsername = () => {
    return userProfile?.username ? `@${userProfile.username}` : null;
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

  const getProfileShareUrl = () => {
    return `${window.location.origin}/profile?share=${userId?.slice(-8)}`;
  };

  const shareProfile = (platform: "twitter" | "facebook" | "copy") => {
    const shareText = `Check out my nature explorer profile! I've discovered ${uniqueSpeciesCount} unique species! 🌿`;
    const shareUrl = getProfileShareUrl();

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          "_blank"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(shareUrl);
        toast.success("Profile link copied!");
        break;
    }
    setIsShareDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/10 px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Profile Picture with Rank Badges */}
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getExplorerName().slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Rank indicators on profile picture */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
              {getRankBadge(globalRank ?? null, "global")}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold">{getExplorerName()}</h1>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={openEditDialog}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Title and Streak */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {getEquippedTitle() && (
                <Badge variant="secondary" className="text-xs">
                  {getEquippedTitle()}
                </Badge>
              )}
              {streakData && streakData.current_streak > 0 && (
                <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">
                  <Flame className="h-3 w-3 mr-1" />
                  {streakData.current_streak} day streak
                </Badge>
              )}
              {countryData?.rank && getRankBadge(countryData.rank, "country")}
            </div>

            {/* 3 Badge Squares */}
            <div className="flex gap-1.5 mt-2">
              {userBadges.slice(0, 3).map((ub) => (
                <div
                  key={ub.id}
                  className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center"
                  title={ub.badges.name}
                >
                  {badgeIconMap[ub.badges.icon] || <Award className="h-3.5 w-3.5 text-primary" />}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - userBadges.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-8 h-8 rounded-md bg-muted/50 border border-dashed border-muted-foreground/20 flex items-center justify-center"
                >
                  <Award className="h-3 w-3 text-muted-foreground/30" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Username and Bio */}
        {getUsername() && userProfile?.display_name && (
          <p className="text-xs text-muted-foreground mt-1 px-1">{getUsername()}</p>
        )}
        {userProfile?.bio && (
          <p className="text-sm text-muted-foreground mt-2 px-1">{userProfile.bio}</p>
        )}
        {userProfile?.country && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground px-1">
            <MapPin className="h-3 w-3" />
            <span>{userProfile.country}</span>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 mt-4 bg-background/50 rounded-xl p-3">
          <div className="text-center">
            <p className="text-xl font-bold">{speciesCount}</p>
            <p className="text-[10px] text-muted-foreground">Sightings</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{uniqueSpeciesCount}</p>
            <p className="text-[10px] text-muted-foreground">Species</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{userBadges.length}</p>
            <p className="text-[10px] text-muted-foreground">Badges</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold flex items-center justify-center gap-1">
              <CoinIcon className="w-4 h-4 text-yellow-500" />
              {coinBalance.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Coins</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={openEditDialog}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Your Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareProfile("twitter")}
                >
                  <Twitter className="h-5 w-5 mr-3 text-[#1DA1F2]" />
                  Share on Twitter
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareProfile("facebook")}
                >
                  <Facebook className="h-5 w-5 mr-3 text-[#4267B2]" />
                  Share on Facebook
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareProfile("copy")}
                >
                  <Copy className="h-5 w-5 mr-3" />
                  Copy Profile Link
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {userProfile?.username && (
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Username (cannot be changed)</label>
                <Input
                  value={`@${userProfile.username}`}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
            {userProfile?.country && (
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Country (cannot be changed)</label>
                <Input
                  value={userProfile.country}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Display Name</label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell others about yourself..."
                maxLength={150}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">{editBio.length}/150</p>
            </div>
            <Button onClick={handleSaveProfile} className="w-full" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-transparent h-12">
          <TabsTrigger
            value="items"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Grid3X3 className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger
            value="badges"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Award className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger
            value="boosts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Zap className="h-5 w-5" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Profile Items</h3>
          {filterByCategory("profile").length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No profile items yet</p>
              <p className="text-sm text-muted-foreground">Visit the Coin Shop!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filterByCategory("profile").map((purchase) => {
                const item = purchase.shop_items;
                const isItemEquipped = isEquipped(item.id);

                return (
                  <Card
                    key={purchase.id}
                    className={`p-3 text-center cursor-pointer transition-all ${
                      isItemEquipped ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                    }`}
                    onClick={() => {
                      const metadata = item.metadata as Record<string, unknown>;
                      const itemType = (metadata?.item_type as string) || item.category;
                      isItemEquipped ? handleUnequip(itemType) : handleEquip(item);
                    }}
                  >
                    <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2">
                      {iconMap[item.icon] || <Sparkles className="h-5 w-5" />}
                    </div>
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    {isItemEquipped && (
                      <Badge variant="default" className="text-[10px] mt-1">
                        <Check className="h-3 w-3 mr-0.5" />
                        Equipped
                      </Badge>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges" className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Cosmetic Badges</h3>
          {filterByCategory("badge").length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No cosmetic badges</p>
              <p className="text-sm text-muted-foreground">Visit the Coin Shop!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filterByCategory("badge").map((purchase) => {
                const item = purchase.shop_items;
                const isItemEquipped = isEquipped(item.id);

                return (
                  <Card
                    key={purchase.id}
                    className={`p-3 text-center cursor-pointer transition-all ${
                      isItemEquipped ? "border-amber-500 ring-2 ring-amber-500/20" : "hover:border-amber-500/50"
                    }`}
                    onClick={() => (isItemEquipped ? handleUnequip("badge") : handleEquip(item))}
                  >
                    <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
                      {iconMap[item.icon] || <Award className="h-5 w-5" />}
                    </div>
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    {isItemEquipped && (
                      <Badge className="text-[10px] mt-1 bg-amber-500">
                        <Check className="h-3 w-3 mr-0.5" />
                        Displayed
                      </Badge>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="boosts" className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Active Boosts</h3>
          {filterByCategory("boost").length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No boosts purchased</p>
              <p className="text-sm text-muted-foreground">Visit the Coin Shop!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filterByCategory("boost").map((purchase) => {
                const item = purchase.shop_items;
                const active = isBoostActive(purchase);

                return (
                  <Card
                    key={purchase.id}
                    className={`p-4 ${active ? "border-blue-500 bg-blue-500/5" : "opacity-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          active ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {iconMap[item.icon] || <Zap className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
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
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
