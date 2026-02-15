import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  ShoppingBag,
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
  User,
  Zap,
  Check,
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
  is_active: boolean;
}

interface UserPurchase {
  id: string;
  item_id: string;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
}

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

const categoryIcons: Record<string, React.ReactNode> = {
  profile: <User className="h-4 w-4" />,
  badge: <Award className="h-4 w-4" />,
  boost: <Zap className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  profile: "text-purple-500",
  badge: "text-amber-500",
  boost: "text-[hsl(var(--species-plant))]",
};

// Item-specific styling based on item name/metadata
const getItemStyle = (item: ShopItem): { borderClass: string; badgeClass: string; rarityLabel: string; bgClass: string } => {
  const name = item.name.toLowerCase();
  const meta = item.metadata as Record<string, unknown> | null;
  const rarity = (meta?.rarity as string) || "";
  const category = item.category;

  // Boosts - always green shading
  if (category === "boost") {
    return {
      borderClass: "border-[hsl(var(--species-plant))]/50",
      badgeClass: "border-[hsl(var(--species-plant))] text-[hsl(var(--species-plant))]",
      rarityLabel: "boost",
      bgClass: "bg-gradient-to-br from-[hsl(var(--species-plant))]/15 to-[hsl(var(--species-plant))]/5",
    };
  }

  // Profile items - specific themes
  if (name.includes("nature theme")) {
    return {
      borderClass: "border-[hsl(var(--theme-nature))]/50",
      badgeClass: "border-[hsl(var(--theme-nature))] text-[hsl(var(--theme-nature))]",
      rarityLabel: "nature",
      bgClass: "bg-gradient-to-br from-[hsl(var(--theme-nature))]/15 to-[hsl(var(--theme-nature))]/5",
    };
  }
  if (name.includes("ocean theme")) {
    return {
      borderClass: "border-[hsl(var(--theme-ocean))]/50",
      badgeClass: "border-[hsl(var(--theme-ocean))] text-[hsl(var(--theme-ocean))]",
      rarityLabel: "ocean",
      bgClass: "bg-gradient-to-br from-[hsl(var(--theme-ocean))]/15 to-[hsl(var(--theme-ocean))]/5",
    };
  }
  if (name.includes("gold explorer")) {
    return {
      borderClass: "border-[hsl(var(--rarity-legendary))]/50",
      badgeClass: "border-[hsl(var(--rarity-legendary))] text-[hsl(var(--rarity-legendary))]",
      rarityLabel: "gold",
      bgClass: "bg-gradient-to-br from-[hsl(var(--rarity-legendary))]/15 to-[hsl(var(--rarity-legendary))]/5",
    };
  }
  if (name.includes("wildlife champion")) {
    return {
      borderClass: "border-[hsl(var(--rarity-legendary))]/50",
      badgeClass: "border-[hsl(var(--rarity-legendary))] text-[hsl(var(--rarity-legendary))]",
      rarityLabel: "legendary",
      bgClass: "bg-gradient-to-br from-[hsl(var(--rarity-legendary))]/20 to-[hsl(var(--rarity-legendary))]/5",
    };
  }
  if (name.includes("master explorer")) {
    return {
      borderClass: "border-[hsl(var(--rarity-mythic))]/50",
      badgeClass: "border-[hsl(var(--rarity-mythic))] text-[hsl(var(--rarity-mythic))]",
      rarityLabel: "mythic",
      bgClass: "bg-gradient-to-br from-[hsl(var(--rarity-mythic))]/20 to-[hsl(var(--rarity-mythic))]/5",
    };
  }

  // Badges with rarity metadata
  if (rarity === "legendary") {
    return {
      borderClass: "border-[hsl(var(--rarity-legendary))]/50",
      badgeClass: "border-[hsl(var(--rarity-legendary))] text-[hsl(var(--rarity-legendary))]",
      rarityLabel: "legendary",
      bgClass: "bg-gradient-to-br from-[hsl(var(--rarity-legendary))]/15 to-[hsl(var(--rarity-legendary))]/5",
    };
  }
  if (rarity === "rare" || name.includes("golden butterfly") || name.includes("rainbow feather")) {
    return {
      borderClass: "border-[hsl(var(--rarity-rare))]/50",
      badgeClass: "border-[hsl(var(--rarity-rare))] text-[hsl(var(--rarity-rare))]",
      rarityLabel: "rare",
      bgClass: "bg-gradient-to-br from-[hsl(var(--rarity-rare))]/15 to-[hsl(var(--rarity-rare))]/5",
    };
  }
  if (rarity === "uncommon") {
    return {
      borderClass: "border-green-500/50",
      badgeClass: "border-green-500 text-green-500",
      rarityLabel: "uncommon",
      bgClass: "bg-gradient-to-br from-green-500/10 to-green-500/5",
    };
  }

  // Default - common
  return {
    borderClass: "border-muted",
    badgeClass: "",
    rarityLabel: "",
    bgClass: "",
  };
};

export default function CoinShop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [confirmPurchase, setConfirmPurchase] = useState<ShopItem | null>(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch shop items
      const { data: itemsData, error: itemsError } = await supabase
        .from("shop_items")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch user purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("user_purchases")
        .select("*")
        .eq("user_id", user.id);

      if (purchasesError) throw purchasesError;
      setPurchases(purchasesData || []);

      // Fetch coin balance
      const { data: coinData } = await supabase
        .from("user_coins")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      setCoinBalance(coinData?.balance || 0);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  const inititatePurchase = (item: ShopItem) => {
    if (coinBalance < item.price) {
      toast.error("Not enough coins!");
      return;
    }
    setConfirmPurchase(item);
  };

  const handlePurchase = async (item: ShopItem) => {
    setConfirmPurchase(null);
    setPurchasing(item.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deduct coins
      const { error: coinError } = await supabase
        .from("user_coins")
        .update({ balance: coinBalance - item.price })
        .eq("user_id", user.id);

      if (coinError) throw coinError;

      // Calculate expiry for boosts - always 24 hours
      let expiresAt = null;
      if (item.category === "boost") {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        expiresAt = expiry.toISOString();
      }

      // Create purchase record
      const { error: purchaseError } = await supabase
        .from("user_purchases")
        .insert({
          user_id: user.id,
          item_id: item.id,
          expires_at: expiresAt,
        });

      if (purchaseError) throw purchaseError;

      setCoinBalance((prev) => prev - item.price);
      setPurchases((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          item_id: item.id,
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_active: true,
        },
      ]);

      toast.success(`Successfully purchased ${item.name}!`);
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to complete purchase");
    } finally {
      setPurchasing(null);
    }
  };

  const isOwned = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    // Boosts can be re-purchased after expiry
    if (item?.category === "boost") {
      return purchases.some((p) => p.item_id === itemId && p.expires_at && new Date(p.expires_at) > new Date());
    }
    return purchases.some((p) => p.item_id === itemId);
  };

  const filterItemsByCategory = (category: string) => {
    return items.filter((item) => item.category === category);
  };

  const renderItem = (item: ShopItem) => {
    const owned = isOwned(item.id);
    const canAfford = coinBalance >= item.price;
    const itemStyle = getItemStyle(item);

    return (
      <Card
        key={item.id}
        className={`p-4 border-2 transition-all ${itemStyle.borderClass} ${itemStyle.bgClass} ${
          owned ? "opacity-75" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[item.category]} bg-current/10`}
          >
            <span className={categoryColors[item.category]}>
              {iconMap[item.icon] || <Sparkles className="h-6 w-6" />}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{item.name}</h3>
              {itemStyle.rarityLabel && (
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${itemStyle.badgeClass}`}
                >
                  {itemStyle.rarityLabel}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>
            <div className="flex items-center justify-end">
              {owned ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Owned
                </Badge>
              ) : (
                <Button
                  size="sm"
                  disabled={!canAfford || purchasing === item.id}
                  onClick={() => inititatePurchase(item)}
                  className="h-8 flex items-center gap-1.5"
                  variant={canAfford ? "default" : "secondary"}
                >
                  {purchasing === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CoinIcon className="h-4 w-4" />
                      <span className="font-bold">{item.price}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Coin Shop</h1>
      </div>

      <Card className="p-4 mb-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CoinIcon className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-2xl font-bold">{coinBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Purchase Confirmation Dialog */}
      <AlertDialog open={!!confirmPurchase} onOpenChange={() => setConfirmPurchase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPurchase && (
                <div className="space-y-2">
                  <p>Are you sure you want to purchase <strong>{confirmPurchase.name}</strong>?</p>
                  <div className="flex items-center gap-2 justify-center p-3 bg-muted rounded-lg">
                    <CoinIcon className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold text-lg">{confirmPurchase.price}</span>
                    <span className="text-muted-foreground">coins</span>
                  </div>
                  <p className="text-xs">
                    Balance after purchase: {coinBalance - confirmPurchase.price} coins
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmPurchase && handlePurchase(confirmPurchase)}>
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs">
            {categoryIcons.profile}
            Profile
          </TabsTrigger>
          <TabsTrigger value="badge" className="flex items-center gap-1.5 text-xs">
            {categoryIcons.badge}
            Badges
          </TabsTrigger>
          <TabsTrigger value="boost" className="flex items-center gap-1.5 text-xs">
            {categoryIcons.boost}
            Boosts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-3">
            {filterItemsByCategory("profile").map(renderItem)}
          </div>
        </TabsContent>

        <TabsContent value="badge">
          <div className="grid gap-3">
            {filterItemsByCategory("badge").map(renderItem)}
          </div>
        </TabsContent>

        <TabsContent value="boost">
          <div className="grid gap-3">
            {filterItemsByCategory("boost").map(renderItem)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
