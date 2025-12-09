import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Medal, Award, Crown, Globe, MapPin } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  species_count: number;
  rank: number;
}

export default function Leaderboard() {
  const [worldwideEntries, setWorldwideEntries] = useState<LeaderboardEntry[]>([]);
  const [countryEntries, setCountryEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("worldwide");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Fetch worldwide leaderboard using the database function
      const { data: worldwideData, error: worldwideError } = await supabase
        .rpc('get_worldwide_leaderboard', { limit_count: 50 });

      if (worldwideError) {
        console.error("Worldwide leaderboard error:", worldwideError);
      } else {
        setWorldwideEntries(worldwideData || []);
      }

      // Get user's country
      if (user) {
        const { data: countryData } = await supabase
          .rpc('get_user_country', { target_user_id: user.id });
        
        if (countryData) {
          setUserCountry(countryData);
          
          // Fetch country leaderboard
          const { data: countryLeaderboard, error: countryError } = await supabase
            .rpc('get_country_leaderboard', { 
              country_filter: countryData, 
              limit_count: 50 
            });

          if (countryError) {
            console.error("Country leaderboard error:", countryError);
          } else {
            setCountryEntries(countryLeaderboard || []);
          }
        }
      }
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

  const renderLeaderboardList = (entries: LeaderboardEntry[]) => {
    if (entries.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No entries yet</h3>
          <p className="text-sm text-muted-foreground">
            Start identifying species to climb the leaderboard!
          </p>
        </Card>
      );
    }

    const currentUserEntry = entries.find((e) => e.user_id === currentUserId);

    return (
      <>
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

        <div className="space-y-2">
          {entries.map((entry) => (
            <Card
              key={entry.user_id}
              className={`p-3 flex items-center justify-between ${getRankStyle(Number(entry.rank))} ${
                entry.user_id === currentUserId ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center">{getRankIcon(Number(entry.rank))}</div>
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
      </>
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
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="worldwide" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Worldwide
          </TabsTrigger>
          <TabsTrigger value="country" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {userCountry || "Country"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="worldwide">
          {renderLeaderboardList(worldwideEntries)}
        </TabsContent>

        <TabsContent value="country">
          {userCountry ? (
            renderLeaderboardList(countryEntries)
          ) : (
            <Card className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No country data</h3>
              <p className="text-sm text-muted-foreground">
                Identify species with location enabled to see your country leaderboard.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
