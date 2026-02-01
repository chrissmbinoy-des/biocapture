import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface EquippedItems {
  theme?: string | null;
  frame?: string | null;
  title?: string | null;
  badge?: string | null;
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

const STORAGE_KEY = "equipped_items";

export const useEquippedItems = (userId: string | null) => {
  const queryClient = useQueryClient();
  const [equipped, setEquipped] = useState<EquippedItems>({});

  // Fetch user purchases
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["userPurchases", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_purchases")
        .select("*, shop_items(*)")
        .eq("user_id", userId)
        .eq("is_active", true);
      if (error) throw error;
      return (data as UserPurchase[]) || [];
    },
    enabled: !!userId,
  });

  // Load equipped items from localStorage on mount
  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (saved) {
        try {
          setEquipped(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse equipped items:", e);
        }
      }
    }
  }, [userId]);

  // Get the equipped theme style
  const getEquippedTheme = (): string | null => {
    if (!equipped.theme) return null;
    const purchase = purchases.find((p) => p.item_id === equipped.theme);
    if (!purchase?.shop_items?.metadata) return null;
    const meta = purchase.shop_items.metadata as Record<string, unknown>;
    return (meta.style as string) || null;
  };

  // Get the equipped frame style
  const getEquippedFrame = (): string | null => {
    if (!equipped.frame) return null;
    const purchase = purchases.find((p) => p.item_id === equipped.frame);
    if (!purchase?.shop_items?.metadata) return null;
    const meta = purchase.shop_items.metadata as Record<string, unknown>;
    return (meta.style as string) || null;
  };

  // Get the equipped title
  const getEquippedTitle = (): string | null => {
    if (!equipped.title) return null;
    const purchase = purchases.find((p) => p.item_id === equipped.title);
    if (!purchase?.shop_items?.metadata) return null;
    const meta = purchase.shop_items.metadata as Record<string, unknown>;
    return (meta.value as string) || null;
  };

  // Check if an item is equipped
  const isEquipped = (itemId: string): boolean => {
    return Object.values(equipped).includes(itemId);
  };

  // Check if user owns an item
  const ownsItem = (itemId: string): boolean => {
    return purchases.some((p) => p.item_id === itemId);
  };

  // Equip an item
  const equipItem = (item: ShopItem) => {
    const metadata = item.metadata as Record<string, unknown>;
    const itemType = (metadata?.type as string) || item.category;
    
    const newEquipped = { ...equipped, [itemType]: item.id };
    setEquipped(newEquipped);

    if (userId) {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(newEquipped));
    }
  };

  // Unequip an item by type
  const unequipItem = (itemType: keyof EquippedItems) => {
    const newEquipped = { ...equipped };
    delete newEquipped[itemType];
    setEquipped(newEquipped);

    if (userId) {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(newEquipped));
    }
  };

  // Get purchases by category
  const getPurchasesByCategory = (category: string) => {
    return purchases.filter((p) => p.shop_items?.category === category);
  };

  return {
    equipped,
    purchases,
    isLoading,
    getEquippedTheme,
    getEquippedFrame,
    getEquippedTitle,
    isEquipped,
    ownsItem,
    equipItem,
    unequipItem,
    getPurchasesByCategory,
  };
};
