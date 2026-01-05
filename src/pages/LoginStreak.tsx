import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flame, Gift, Check, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BadgeProgressCircle } from "@/components/BadgeProgressCircle";

interface StreakReward {
  id: string;
  streak_days: number;
  coin_reward: number;
  description: string;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
}

export default function LoginStreak() {
  const [rewards, setRewards] = useState<StreakReward[]>([]);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch rewards
      const { data: rewardsData } = await supabase
        .from("streak_rewards")
        .select("*")
        .order("streak_days", { ascending: true });

      setRewards(rewardsData || []);

      // Fetch or create user streak
      const { data: streakData, error: streakError } = await supabase
        .from("login_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (streakError && streakError.code !== "PGRST116") throw streakError;

      const today = new Date().toISOString().split("T")[0];
      
      if (!streakData) {
        // Create new streak record
        const { data: newStreak, error: insertError } = await supabase
          .from("login_streaks")
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_login_date: today,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setUserStreak({
          current_streak: newStreak.current_streak,
          longest_streak: newStreak.longest_streak,
          last_login_date: newStreak.last_login_date,
        });

        toast({
          title: "🔥 Streak Started!",
          description: "Come back tomorrow to keep your streak going!",
        });
      } else {
        const lastLogin = streakData.last_login_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastLogin === today) {
          // Already logged in today
          setUserStreak({
            current_streak: streakData.current_streak,
            longest_streak: streakData.longest_streak,
            last_login_date: streakData.last_login_date,
          });
        } else if (lastLogin === yesterdayStr) {
          // Consecutive day - increment streak
          const newStreak = streakData.current_streak + 1;
          const newLongest = Math.max(newStreak, streakData.longest_streak);

          await supabase
            .from("login_streaks")
            .update({
              current_streak: newStreak,
              longest_streak: newLongest,
              last_login_date: today,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          setUserStreak({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_login_date: today,
          });

          // Check for reward milestones
          const earnedReward = rewardsData?.find((r) => r.streak_days === newStreak);
          if (earnedReward) {
            // Award coins
            const { data: coins } = await supabase
              .from("user_coins")
              .select("balance")
              .eq("user_id", user.id)
              .maybeSingle();

            if (coins) {
              await supabase
                .from("user_coins")
                .update({ balance: coins.balance + earnedReward.coin_reward })
                .eq("user_id", user.id);
            } else {
              await supabase
                .from("user_coins")
                .insert({ user_id: user.id, balance: earnedReward.coin_reward });
            }

            toast({
              title: "🎉 Streak Reward!",
              description: `You earned ${earnedReward.coin_reward} coins for ${earnedReward.description}!`,
            });
          } else {
            toast({
              title: `🔥 ${newStreak}-Day Streak!`,
              description: "Keep it up!",
            });
          }
        } else {
          // Streak broken - reset to 0 (will become 1 on next sighting or app entry with action)
          await supabase
            .from("login_streaks")
            .update({
              current_streak: 0,
              last_login_date: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          setUserStreak({
            current_streak: 0,
            longest_streak: streakData.longest_streak,
            last_login_date: null,
          });

          toast({
            title: "Streak Reset",
            description: "Your streak was reset to 0 days. Start fresh with your next sighting!",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching streak data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStreak = userStreak?.current_streak || 0;
  const longestStreak = userStreak?.longest_streak || 0;

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold">Login Streak</h1>
      </div>

      {/* Current Streak Card */}
      <Card className="p-6 mb-4 bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-4xl font-bold">{currentStreak}</span>
              <span className="text-lg text-muted-foreground">days</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Best Streak</p>
            <p className="text-2xl font-bold text-primary">{longestStreak} days</p>
          </div>
        </div>
      </Card>

      {/* Rewards List */}
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        Streak Rewards
      </h2>

      <div className="space-y-3">
        {rewards.map((reward) => {
          const isEarned = currentStreak >= reward.streak_days;
          const progress = Math.min(currentStreak / reward.streak_days, 1);

          return (
            <Card
              key={reward.id}
              className={`p-4 flex items-center gap-4 ${
                isEarned ? "bg-green-500/10 border-green-500/20" : ""
              }`}
            >
              <BadgeProgressCircle
                icon={isEarned ? Check : Flame}
                progress={progress}
                size="md"
                isEarned={isEarned}
              />
              <div className="flex-1">
                <p className="font-medium">{reward.description}</p>
                <p className="text-sm text-muted-foreground">
                  {reward.streak_days} consecutive days
                </p>
              </div>
              <div className="text-right">
                <Badge variant={isEarned ? "default" : "secondary"} className="text-xs">
                  {reward.coin_reward} coins
                </Badge>
                {isEarned && (
                  <p className="text-xs text-green-500 mt-1">Earned!</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}