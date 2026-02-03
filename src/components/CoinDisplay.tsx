import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CoinIcon from "@/components/icons/CoinIcon";

export const CoinDisplay = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Subscribe to real-time changes on user_coins
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`coins-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_coins",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate the query to refetch
          queryClient.invalidateQueries({ queryKey: ["userCoins", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

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
    refetchInterval: 30000, // Also refetch every 30 seconds as backup
  });

  if (!userId) return null;

  return (
    <div className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/30 rounded-full px-3 py-1">
      <CoinIcon className="w-4 h-4 text-yellow-500" />
      <span className="font-semibold text-sm text-yellow-600 dark:text-yellow-400">
        {coinBalance.toLocaleString()}
      </span>
    </div>
  );
};
