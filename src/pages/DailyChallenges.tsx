import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, Target, CheckCircle2, Clock, RefreshCw, Leaf } from "lucide-react";
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
        .from("user_coins")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!userId,
  });

  // Fetch all challenge templates
  const { data: templates = [] } = useQuery({
    queryKey: ["challengeTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_challenge_templates")
        .select("*");
      if (error) throw error;
      return data as ChallengeTemplate[];
    },
  });

  // Fetch user's daily challenges
  const { data: userChallenges = [], isLoading } = useQuery({
    queryKey: ["userDailyChallenges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("user_daily_challenges")
        .select("*, daily_challenge_templates(*)")
        .eq("user_id", userId)
        .eq("challenge_date", today);
      
      if (error) throw error;
      return data as UserChallenge[];
    },
    enabled: !!userId,
  });

  // Generate daily challenges mutation
  const generateChallenges = useMutation({
    mutationFn: async () => {
      if (!userId || templates.length === 0) return;

      const today = new Date().toISOString().split("T")[0];
      
      // Check if challenges already exist for today
      const { data: existing } = await supabase
        .from("user_daily_challenges")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_date", today);

      if (existing && existing.length >= 3) return;

      // Pick 3 random templates
      const shuffled = [...templates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);

      // Insert challenges
      const challengesToInsert = selected.map((t) => ({
        user_id: userId,
        challenge_template_id: t.id,
        challenge_date: today,
        is_completed: false,
        progress: 0,
      }));

      const { error } = await supabase
        .from("user_daily_challenges")
        .insert(challengesToInsert);

      if (error) throw error;

      // Initialize coins if not exists
      const { data: coinData } = await supabase
        .from("user_coins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!coinData) {
        await supabase.from("user_coins").insert({ user_id: userId, balance: 0 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDailyChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["userCoins"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate daily challenges",
        variant: "destructive",
      });
    },
  });

  // Generate challenges on mount if needed
  useEffect(() => {
    if (userId && templates.length > 0 && userChallenges.length === 0 && !isLoading) {
      generateChallenges.mutate();
    }
  }, [userId, templates, userChallenges.length, isLoading]);

  // Get time until reset
  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

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
              <h1 className="text-2xl font-bold text-foreground">Daily Challenges</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Resets in {getTimeUntilReset()}
              </p>
            </div>
          </div>
          <Card className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30">
            <CardContent className="p-3 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400">
                {coinBalance}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Challenges List */}
        <div className="space-y-4">
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
            userChallenges.map((challenge) => {
              const template = challenge.daily_challenge_templates;
              const isCompleted = challenge.is_completed;

              return (
                <Card
                  key={challenge.id}
                  className={`transition-all ${
                    isCompleted
                      ? "bg-species-plant/10 border-species-plant/30"
                      : "hover:border-species-plant/50"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <BadgeProgressCircle
                          icon={isCompleted ? CheckCircle2 : Target}
                          progress={isCompleted ? 1 : challenge.progress}
                          isEarned={isCompleted}
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
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    {!isCompleted && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{challenge.progress} / 1</span>
                        </div>
                        <Progress value={challenge.progress * 100} className="h-2 [&>div]:bg-species-plant" />
                      </div>
                    )}
                    {isCompleted && (
                      <p className="text-sm text-species-plant font-medium">
                        Completed! Coins earned.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

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
