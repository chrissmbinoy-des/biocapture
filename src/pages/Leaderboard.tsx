import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Medal, Award, Crown, Globe, MapPin, Calendar, CalendarDays, CalendarRange } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  species_count: number;
  display_name?: string | null;
  username?: string | null;
  rank: number;
}

type TimeFilter = "all" | "monthly" | "weekly";
type GeoFilter = "worldwide" | "country";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [geoFilter, setGeoFilter] = useState<GeoFilter>("worldwide");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (currentUserId !== null) {
      fetchLeaderboard();
    }
  }, [geoFilter, timeFilter, currentUserId, userCountry]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        const { data: countryData } = await supabase
          .rpc('get_user_country', { target_user_id: user.id });
        setUserCountry(countryData || null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const daysBack = timeFilter === "weekly" ? 7 : timeFilter === "monthly" ? 30 : null;
      let leaderboardData: LeaderboardEntry[] = [];

      if (geoFilter === "worldwide") {
        const { data, error } = await supabase
          .rpc('get_worldwide_leaderboard_timeframe', { 
            limit_count: 50,
            days_back: daysBack
          });

        if (error) {
          console.error("Worldwide leaderboard error:", error);
        } else {
          leaderboardData = data || [];
        }
      } else if (userCountry) {
        const { data, error } = await supabase
          .rpc('get_country_leaderboard_timeframe', { 
            country_filter: userCountry,
            limit_count: 50,
            days_back: daysBack
          });

        if (error) {
          console.error("Country leaderboard error:", error);
        } else {
          leaderboardData = data || [];
        }
      }

      // Fetch user profiles for display names
      if (leaderboardData.length > 0) {
        const userIds = leaderboardData.map(e => e.user_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, username')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        leaderboardData = leaderboardData.map(entry => ({
          ...entry,
          display_name: profileMap.get(entry.user_id)?.display_name,
          username: profileMap.get(entry.user_id)?.username
        }));
      }

      setEntries(leaderboardData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (entry: LeaderboardEntry) => {
    if (entry.user_id === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/explorer?share=${entry.user_id.slice(-8)}`);
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

  const getTimeLabel = () => {
    switch (timeFilter) {
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      default:
        return "All Time";
    }
  };

  const currentUserEntry = entries.find((e) => e.user_id === currentUserId);

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>

      {/* Geographic Filter */}
      <Tabs value={geoFilter} onValueChange={(v) => setGeoFilter(v as GeoFilter)} className="w-full mb-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="worldwide" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Worldwide
          </TabsTrigger>
          <TabsTrigger value="country" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {userCountry || "Country"}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Time Filter */}
      <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="w-full mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            All Time
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1.5 text-xs">
            <CalendarRange className="h-3.5 w-3.5" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-1.5 text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            Weekly
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : geoFilter === "country" && !userCountry ? (
        <Card className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No country data</h3>
          <p className="text-sm text-muted-foreground">
            Identify species with location enabled to see your country leaderboard.
          </p>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No entries yet</h3>
          <p className="text-sm text-muted-foreground">
            {timeFilter !== "all" 
              ? `No species identified ${getTimeLabel().toLowerCase()}. Be the first!`
              : "Start identifying species to climb the leaderboard!"}
          </p>
        </Card>
      ) : (
        <>
          {currentUserEntry && (
            <Card className="p-4 mb-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Your Rank ({getTimeLabel()})</p>
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
                onClick={() => handleUserClick(entry)}
                className={`p-3 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors ${getRankStyle(Number(entry.rank))} ${
                  entry.user_id === currentUserId ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center">{getRankIcon(Number(entry.rank))}</div>
                  <div>
                    <p className="font-medium text-sm">
                      {entry.user_id === currentUserId 
                        ? "You" 
                        : entry.display_name || entry.username || `Explorer #${entry.rank}`}
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
      )}
    </div>
  );
}
