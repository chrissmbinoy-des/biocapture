import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Settings,
  Users,
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

export default function Profile() {
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [equipped, setEquipped] = useState<EquippedItems>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("items");

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

  // Fetch badges earned
  const { data: badgesEarned = 0 } = useQuery({
    queryKey: ["badgesEarned", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) throw error;
      return count || 0;
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

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch user purchases with item details
      const { data: purchasesData, error } = await supabase
        .from("user_purchases")
        .select("*, shop_items(*)")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      setPurchases(purchasesData || []);

      // Load equipped items from localStorage
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

  const getEquippedBadgeDisplay = () => {
    if (equipped.badge) {
      const purchase = purchases.find((p) => p.item_id === equipped.badge);
      if (purchase?.shop_items) {
        return iconMap[purchase.shop_items.icon] || <Award className="h-5 w-5" />;
      }
    }
    return null;
  };

  const getExplorerNumber = () => {
    if (!userId) return "0000";
    return userId.slice(-4).toUpperCase();
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
      {/* Instagram-style Profile Header */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/10 px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Profile Picture */}
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getExplorerNumber().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {getEquippedBadgeDisplay() && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white">
                {getEquippedBadgeDisplay()}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold">Explorer #{getExplorerNumber()}</h1>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            {getEquippedTitle() && (
              <Badge variant="secondary" className="mb-2 text-xs">
                {getEquippedTitle()}
              </Badge>
            )}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <p className="text-xl font-bold">{speciesCount}</p>
                <p className="text-xs text-muted-foreground">Sightings</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{uniqueSpeciesCount}</p>
                <p className="text-xs text-muted-foreground">Species</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{badgesEarned}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coin Balance */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-yellow-500/15 border border-yellow-500/30 rounded-full px-4 py-2">
            <CoinIcon className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-yellow-600 dark:text-yellow-400">{coinBalance.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">coins</span>
          </div>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Share Profile
          </Button>
        </div>
      </div>

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
