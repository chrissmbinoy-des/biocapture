import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal, Award, Crown } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  species_count: number;
  rank: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get species count per user
      const { data, error } = await supabase
        .from("species_identifications")
        .select("user_id");

      if (error) throw error;

      // Count species per user
      const userCounts: { [key: string]: number } = {};
      data?.forEach((row) => {
        userCounts[row.user_id] = (userCounts[row.user_id] || 0) + 1;
      });

      // Convert to array and sort
      const sorted = Object.entries(userCounts)
        .map(([user_id, species_count]) => ({ user_id, species_count, rank: 0 }))
        .sort((a, b) => b.species_count - a.species_count)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setEntries(sorted.slice(0, 50)); // Top 50
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentUserEntry = entries.find((e) => e.user_id === currentUserId);

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>

      {currentUserEntry && (
        <Card className="p-4 mb-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-xl font-bold">#{currentUserEntry.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Species Found</p>
              <p className="text-xl font-bold text-primary">{currentUserEntry.species_count}</p>
            </div>
          </div>
        </Card>
      )}

      {entries.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No entries yet</h3>
          <p className="text-sm text-muted-foreground">
            Start identifying species to climb the leaderboard!
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card
              key={entry.user_id}
              className={`p-3 flex items-center justify-between ${getRankStyle(entry.rank)} ${
                entry.user_id === currentUserId ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>
                <div>
                  <p className="font-medium text-sm">
                    {entry.user_id === currentUserId ? "You" : `Explorer #${entry.rank}`}
                  </p>
                  {entry.user_id === currentUserId && (
                    <Badge variant="secondary" className="text-xs">Your Profile</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{entry.species_count}</p>
                <p className="text-xs text-muted-foreground">species</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}