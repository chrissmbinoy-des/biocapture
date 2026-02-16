import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Target, CheckCircle2, Clock, RefreshCw, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BadgeProgressCircle } from "@/components/BadgeProgressCircle";

interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  challenge_type: string;
  target_value: string | null;
  coin_reward: number;
}

interface UserChallenge {
  id: string;
  challenge_template_id: string;
  is_completed: boolean;
  progress: number;
  daily_challenge_templates: ChallengeTemplate;
}

interface WeeklyChallengeTemplate {
  id: string;
  name: string;
  description: string;
  challenge_type: string;
  target_value: string | null;
  coin_reward: number;
}

interface UserWeeklyChallenge {
  id: string;
  challenge_template_id: string;
  is_completed: boolean;
  progress: number;
  weekly_challenge_templates: WeeklyChallengeTemplate;
}

const DailyChallenges = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch user's coin balance
  const { data: coinBalance = 0 } = useQuery({
    queryKey: ["userCoins", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from("user_coins").select("balance").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!userId,
  });

  // ===== DAILY CHALLENGES =====
  const { data: templates = [] } = useQuery({
    queryKey: ["challengeTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_challenge_templates").select("*");
      if (error) throw error;
      return data as ChallengeTemplate[];
    },
  });

  const { data: userChallenges = [], isLoading } = useQuery({
    queryKey: ["userDailyChallenges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("user_daily_challenges")
        .select("*, daily_challenge_templates(*)")
        .eq("user_id", userId).eq("challenge_date", today);
      if (error) throw error;
      return data as UserChallenge[];
    },
    enabled: !!userId,
  });

  const { data: extraChallengeCount = 0 } = useQuery({
    queryKey: ["extraChallengeBoost", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data: purchases } = await supabase
        .from("user_purchases").select("*, shop_items(*)")
        .eq("user_id", userId).eq("is_active", true);
      let extraCount = 0;
      if (purchases) {
        for (const purchase of purchases) {
          const metadata = purchase.shop_items?.metadata as Record<string, unknown>;
          if ((metadata?.type as string) === "extra_challenge") {
            extraCount += (metadata?.count as number) || 1;
          }
        }
      }
      return extraCount;
    },
    enabled: !!userId,
  });

  const generateChallenges = useMutation({
    mutationFn: async () => {
      if (!userId || templates.length === 0) return;
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("user_daily_challenges").select("id").eq("user_id", userId).eq("challenge_date", today);
      const totalChallenges = 3 + extraChallengeCount;
      if (existing && existing.length >= totalChallenges) return;
      const challengesToAdd = totalChallenges - (existing?.length || 0);
      if (challengesToAdd <= 0) return;
      const existingTemplateIds = new Set(userChallenges.map(uc => uc.challenge_template_id));
      const availableTemplates = templates.filter(t => !existingTemplateIds.has(t.id));
      const shuffled = availableTemplates.length >= challengesToAdd
        ? [...availableTemplates].sort(() => Math.random() - 0.5)
        : [...templates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, challengesToAdd);
      const { error } = await supabase.from("user_daily_challenges").insert(
        selected.map((t) => ({
          user_id: userId, challenge_template_id: t.id, challenge_date: today,
          is_completed: false, progress: 0,
        }))
      );
      if (error) throw error;
      if (extraChallengeCount > 0) {
        const { data: purchases } = await supabase
          .from("user_purchases").select("*, shop_items(*)")
          .eq("user_id", userId).eq("is_active", true);
        if (purchases) {
          for (const purchase of purchases) {
            const metadata = purchase.shop_items?.metadata as Record<string, unknown>;
            if ((metadata?.type as string) === "extra_challenge") {
              await supabase.from("user_purchases").update({ is_active: false }).eq("id", purchase.id);
            }
          }
        }
      }
      const { data: coinData } = await supabase
        .from("user_coins").select("id").eq("user_id", userId).maybeSingle();
      if (!coinData) {
        await supabase.from("user_coins").insert({ user_id: userId, balance: 0 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDailyChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["userCoins"] });
      queryClient.invalidateQueries({ queryKey: ["extraChallengeBoost"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate daily challenges", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (userId && templates.length > 0 && userChallenges.length === 0 && !isLoading) {
      generateChallenges.mutate();
    }
  }, [userId, templates, userChallenges.length, isLoading]);

  // ===== WEEKLY CHALLENGES =====
  const { data: weeklyTemplates = [] } = useQuery({
    queryKey: ["weeklyChallengeTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("weekly_challenge_templates").select("*");
      if (error) throw error;
      return data as WeeklyChallengeTemplate[];
    },
  });

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const { data: userWeeklyChallenges = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ["userWeeklyChallenges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const weekStart = getWeekStart();
      const { data, error } = await supabase
        .from("user_weekly_challenges")
        .select("*, weekly_challenge_templates(*)")
        .eq("user_id", userId).eq("week_start", weekStart);
      if (error) throw error;
      return data as UserWeeklyChallenge[];
    },
    enabled: !!userId,
  });

  const generateWeeklyChallenges = useMutation({
    mutationFn: async () => {
      if (!userId || weeklyTemplates.length === 0) return;
      const weekStart = getWeekStart();
      const { data: existing } = await supabase
        .from("user_weekly_challenges").select("id").eq("user_id", userId).eq("week_start", weekStart);
      if (existing && existing.length >= 3) return;
      const shuffled = [...weeklyTemplates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);
      const { error } = await supabase.from("user_weekly_challenges").insert(
        selected.map((t) => ({
          user_id: userId, challenge_template_id: t.id, week_start: weekStart,
          is_completed: false, progress: 0,
        }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWeeklyChallenges"] });
    },
  });

  useEffect(() => {
    if (userId && weeklyTemplates.length > 0 && userWeeklyChallenges.length === 0 && !weeklyLoading) {
      generateWeeklyChallenges.mutate();
    }
  }, [userId, weeklyTemplates, userWeeklyChallenges.length, weeklyLoading]);

  // Time helpers
  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    return `${Math.floor(diff / (1000 * 60 * 60))}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };

  const getTimeUntilWeeklyReset = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMonday = day === 0 ? 1 : (8 - day);
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    const diff = nextMonday.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const renderChallengeCard = (
    challenge: { id: string; is_completed: boolean; progress: number },
    template: { name: string; description: string; coin_reward: number }
  ) => (
    <Card
      key={challenge.id}
      className={`transition-all ${
        challenge.is_completed
          ? "bg-species-plant/10 border-species-plant/30"
          : "hover:border-species-plant/50"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BadgeProgressCircle
              icon={challenge.is_completed ? CheckCircle2 : Target}
              progress={challenge.is_completed ? 1 : challenge.progress}
              isEarned={challenge.is_completed}
              size="sm"
            />
            <CardTitle className="text-base">{template.name}</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
          >
            <Coins className="w-3 h-3 mr-1" />
            {template.coin_reward}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{template.description}</p>
        {!challenge.is_completed && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{challenge.progress} / 1</span>
            </div>
            <Progress value={challenge.progress * 100} className="h-2 [&>div]:bg-species-plant" />
          </div>
        )}
        {challenge.is_completed && (
          <p className="text-sm text-species-plant font-medium">Completed! Coins earned.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header with Coins */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-species-plant/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-species-plant" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Challenges</h1>
            </div>
          </div>
          <Card className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30">
            <CardContent className="p-3 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{coinBalance}</span>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Daily / Weekly */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Weekly
            </TabsTrigger>
          </TabsList>

          {/* Daily Challenges */}
          <TabsContent value="daily" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Resets in {getTimeUntilReset()}
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : userChallenges.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Loading your daily challenges...</p>
                </CardContent>
              </Card>
            ) : (
              userChallenges.map((c) => renderChallengeCard(c, c.daily_challenge_templates))
            )}
          </TabsContent>

          {/* Weekly Challenges */}
          <TabsContent value="weekly" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Resets in {getTimeUntilWeeklyReset()}
            </p>
            {weeklyLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : userWeeklyChallenges.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Loading your weekly challenges...</p>
                </CardContent>
              </Card>
            ) : (
              userWeeklyChallenges.map((c) => renderChallengeCard(c, c.weekly_challenge_templates))
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Complete challenges by identifying species. Progress updates automatically when you make discoveries!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyChallenges;
