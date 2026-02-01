import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ActiveBoost {
  type: string;
  expiresAt: string | null;
}

export const useActiveBoosts = (userId: string | null) => {
  return useQuery({
    queryKey: ["activeBoosts", userId],
    queryFn: async (): Promise<ActiveBoost[]> => {
      if (!userId) return [];

      const now = new Date().toISOString();

      const { data: purchases, error } = await supabase
        .from("user_purchases")
        .select(`
          *,
          shop_items(*)
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      const activeBoosts: ActiveBoost[] = [];

      for (const purchase of purchases || []) {
        const item = purchase.shop_items;
        if (item?.category === "boost") {
          // Check if boost hasn't expired
          if (!purchase.expires_at || new Date(purchase.expires_at) > new Date(now)) {
            const metadata = item.metadata as Record<string, unknown>;
            // Support both 'type' and 'boost_type' for compatibility
            const boostType = (metadata?.type as string) || (metadata?.boost_type as string) || "unknown";
            activeBoosts.push({
              type: boostType,
              expiresAt: purchase.expires_at,
            });
          }
        }
      }

      return activeBoosts;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const hasBoost = (boosts: ActiveBoost[], boostType: string): boolean => {
  return boosts.some((b) => b.type === boostType);
};
