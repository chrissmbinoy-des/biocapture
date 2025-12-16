import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function Profile() {
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [equipped, setEquipped] = useState<EquippedItems>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    fetchProfileData();
  }, []);

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
    const itemType = metadata?.item_type as string;

    if (!itemType) return;

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
    return `${hours}h ${minutes}m remaining`;
  };

  const filterByCategory = (category: string) => {
    return purchases.filter((p) => p.shop_items?.category === category);
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      {/* Current Equipped Preview */}
      <Card className="p-4 mb-6 bg-gradient-to-br from-primary/10 to-accent/10">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Currently Equipped</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(equipped).length === 0 ? (
            <p className="text-sm text-muted-foreground">No items equipped. Visit the shop to purchase items!</p>
          ) : (
            Object.entries(equipped).map(([type, itemId]) => {
              const purchase = purchases.find((p) => p.item_id === itemId);
              if (!purchase) return null;
              return (
                <Badge key={type} variant="secondary" className="capitalize">
                  {purchase.shop_items?.name}
                </Badge>
              );
            })
          )}
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-1.5 text-xs">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="boosts" className="flex items-center gap-1.5 text-xs">
            <Zap className="h-4 w-4" />
            Boosts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-3">
            {filterByCategory("profile").length === 0 ? (
              <Card className="p-6 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No profile items yet</p>
                <p className="text-sm text-muted-foreground">Visit the Coin Shop to purchase customizations!</p>
              </Card>
            ) : (
              filterByCategory("profile").map((purchase) => {
                const item = purchase.shop_items;
                const equipped = isEquipped(item.id);
                const metadata = item.metadata as Record<string, unknown>;

                return (
                  <Card key={purchase.id} className={`p-4 ${equipped ? "border-primary" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                        {iconMap[item.icon] || <Sparkles className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{metadata?.item_type as string}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={equipped ? "outline" : "default"}
                        onClick={() => equipped ? handleUnequip(metadata?.item_type as string) : handleEquip(item)}
                      >
                        {equipped ? "Unequip" : "Equip"}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <div className="space-y-3">
            {filterByCategory("badge").length === 0 ? (
              <Card className="p-6 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No cosmetic badges yet</p>
                <p className="text-sm text-muted-foreground">Visit the Coin Shop to purchase badges!</p>
              </Card>
            ) : (
              filterByCategory("badge").map((purchase) => {
                const item = purchase.shop_items;
                const equipped = isEquipped(item.id);

                return (
                  <Card key={purchase.id} className={`p-4 ${equipped ? "border-amber-500" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        {iconMap[item.icon] || <Award className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={equipped ? "outline" : "default"}
                        onClick={() => equipped ? handleUnequip("badge") : handleEquip(item)}
                      >
                        {equipped ? <Check className="h-4 w-4" /> : "Display"}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="boosts">
          <div className="space-y-3">
            {filterByCategory("boost").length === 0 ? (
              <Card className="p-6 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No active boosts</p>
                <p className="text-sm text-muted-foreground">Visit the Coin Shop to purchase boosts!</p>
              </Card>
            ) : (
              filterByCategory("boost").map((purchase) => {
                const item = purchase.shop_items;
                const active = isBoostActive(purchase);
                const metadata = item.metadata as Record<string, unknown>;

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
      </Tabs>
    </div>
  );
}
