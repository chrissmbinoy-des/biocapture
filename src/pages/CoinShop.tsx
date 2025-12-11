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
  boost: "text-blue-500",
};

const rarityColors: Record<string, string> = {
  common: "border-muted",
  uncommon: "border-green-500/50",
  rare: "border-blue-500/50",
  legendary: "border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent",
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

      // Calculate expiry for boosts
      let expiresAt = null;
      if (item.category === "boost" && item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)) {
        const meta = item.metadata as Record<string, unknown>;
        if (meta.duration_hours) {
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + Number(meta.duration_hours));
          expiresAt = expiry.toISOString();
        }
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
    return purchases.some((p) => p.item_id === itemId);
  };

  const getRarity = (item: ShopItem): string => {
    if (item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)) {
      const meta = item.metadata as Record<string, unknown>;
      return (meta.rarity as string) || "common";
    }
    return "common";
  };

  const filterItemsByCategory = (category: string) => {
    return items.filter((item) => item.category === category);
  };

  const renderItem = (item: ShopItem) => {
    const owned = isOwned(item.id);
    const rarity = getRarity(item);
    const canAfford = coinBalance >= item.price;

    return (
      <Card
        key={item.id}
        className={`p-4 border-2 transition-all ${rarityColors[rarity] || ""} ${
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
              {rarity !== "common" && (
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${
                    rarity === "legendary"
                      ? "border-amber-500 text-amber-500"
                      : rarity === "rare"
                      ? "border-blue-500 text-blue-500"
                      : "border-green-500 text-green-500"
                  }`}
                >
                  {rarity}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CoinIcon className="h-4 w-4 text-yellow-500" />
                <span className="font-bold text-sm">{item.price}</span>
              </div>
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
                  className="h-8"
                >
                  {purchasing === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buy"
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
