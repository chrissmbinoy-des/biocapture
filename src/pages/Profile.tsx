import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Cat,
  Bug,
  Bird,
  Fish,
  Microscope,
  Target,
  Heart,
  Sun,
  Moon,
  Mountain,
  Trees,
  Wind,
  Cloud,
  Snowflake,
  Compass,
  Rainbow,
  Earth,
  Map,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Dumbbell,
  Camera,
  LucideIcon,
} from "lucide-react";

import { BadgeProgressCircle } from "@/components/BadgeProgressCircle";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";
import type { Json } from "@/integrations/supabase/types";

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Bangladesh", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia",
  "Czech Republic", "Denmark", "Egypt", "Ethiopia", "Finland", "France",
  "Germany", "Ghana", "Greece", "Hungary", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Japan", "Kenya", "Malaysia",
  "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway",
  "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Romania",
  "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand",
  "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Vietnam"
];

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
  coins: <Star className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  "plus-circle": <PlusCircle className="h-5 w-5" />,
};

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

interface AllBadge {
  id: string;
  badge_id: string;
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
}

export default function Profile() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [editCountry, setEditCountry] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  // Fetch badges earned with details (for display - limited to selected or first 3)
  const { data: userBadges = [] } = useQuery({
    queryKey: ["userBadgesDetails", userId, userProfile?.display_badges],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      
      const allBadges = (data as UserBadge[]) || [];
      // Return selected badges or first 3
      if (userProfile?.display_badges?.length) {
        return allBadges.filter(ub => userProfile.display_badges?.includes(ub.badge_id)).slice(0, 3);
      }
      return allBadges.slice(0, 3);
    },
    enabled: !!userId,
  });

  // Fetch ALL user badges (for badge selection dialog)
  const { data: allUserBadges = [] } = useQuery({
    queryKey: ["allUserBadges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return (data as AllBadge[]) || [];
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setEditAvatarUrl(publicUrl);
      toast.success('Avatar uploaded!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBadgeToggle = (badgeId: string) => {
    setSelectedBadges(prev => {
      if (prev.includes(badgeId)) {
        return prev.filter(id => id !== badgeId);
      }
      if (prev.length >= 3) {
        toast.error('You can only select up to 3 badges');
        return prev;
      }
      return [...prev, badgeId];
    });
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    
    setSavingProfile(true);
    try {
      const profileData = {
        user_id: userId,
        display_name: editDisplayName.trim() || null,
        bio: editBio.trim() || null,
        country: editCountry || userProfile?.country || null,
        avatar_url: editAvatarUrl || userProfile?.avatar_url || null,
        display_badges: selectedBadges.length > 0 ? selectedBadges : null,
      };

      const { data, error } = await supabase
        .from("user_profiles")
        .upsert(profileData, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data as UserProfile);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["userBadgesDetails"] });
      queryClient.invalidateQueries({ queryKey: ["countryRank"] });
      
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
    setEditCountry(userProfile?.country || "");
    setEditAvatarUrl(userProfile?.avatar_url || "");
    setSelectedBadges(userProfile?.display_badges || []);
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
    return `${window.location.origin}/explorer?share=${userId?.slice(-8)}`;
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
              {userProfile?.avatar_url && (
                <AvatarImage src={userProfile.avatar_url} alt={getExplorerName()} />
              )}
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

            {/* 3 Badge Circles */}
            <div className="flex gap-1 mt-2">
              {userBadges.slice(0, 3).map((ub) => (
                <div key={ub.id} title={ub.badges.name}>
                  <BadgeProgressCircle
                    icon={getBadgeIcon(ub.badges.icon)}
                    progress={1}
                    isEarned={true}
                    size="sm"
                  />
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - userBadges.length) }).map((_, i) => (
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
        <div className="grid grid-cols-3 gap-2 mt-4 bg-background/50 rounded-xl p-3">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Avatar Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Profile Picture</label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  {editAvatarUrl && <AvatarImage src={editAvatarUrl} alt="Preview" />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {getExplorerName().slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    {uploadingAvatar ? "Uploading..." : "Change Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Max 2MB, JPG/PNG</p>
                </div>
              </div>
            </div>

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
            
            {/* Country Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select value={editCountry} onValueChange={setEditCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Badge Selection */}
            {allUserBadges.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Display Badges ({selectedBadges.length}/3)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select up to 3 badges to display on your profile
                </p>
                <ScrollArea className="h-[160px] border rounded-md p-2">
                  <div className="grid grid-cols-3 gap-2">
                    {allUserBadges.map((ub) => {
                      const isSelected = selectedBadges.includes(ub.badge_id);
                      return (
                        <div
                          key={ub.id}
                          className={`p-2 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleBadgeToggle(ub.badge_id)}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <BadgeProgressCircle
                              icon={getBadgeIcon(ub.badges.icon)}
                              progress={1}
                              isEarned={true}
                              size="sm"
                            />
                            <p className="text-[10px] text-center font-medium truncate w-full">
                              {ub.badges.name}
                            </p>
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

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
