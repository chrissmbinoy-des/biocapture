import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  Leaf,
  Cat,
  Bug,
  Bird,
  Fish,
  Microscope,
  Users,
  Share2,
  Copy,
  Twitter,
  Facebook,
  Search,
} from "lucide-react";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";
import { IconBadge, getKingdomVariant, IconComponent } from "@/components/IconBadge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeedItem {
  id: string;
  species_name: string;
  scientific_name: string | null;
  kingdom: string;
  confidence: number | null;
  description: string | null;
  image_url: string | null;
  identified_at: string;
  user_id: string;
  user_profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const KINGDOM_LABELS: { [key: string]: string } = {
  plant: "Plant",
  mammal: "Mammal",
  insect: "Insect",
  bird: "Bird",
  reptile: "Reptile",
  fish: "Fish",
  amphibian: "Amphibian",
  other: "Other",
};

const KINGDOM_ICONS: { [key: string]: IconComponent } = {
  plant: Leaf,
  mammal: Cat,
  insect: Bug,
  bird: Bird,
  reptile: CrocodileIcon,
  fish: Fish,
  amphibian: FrogIcon,
  other: Microscope,
};

export default function Feed() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [shareItem, setShareItem] = useState<FeedItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, username, avatar_url")
        .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);
      setSearchResults(data || []);
      setIsSearching(false);
    };
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleUserClick = (targetUserId: string) => {
    if (targetUserId === userId) {
      navigate('/profile');
    } else {
      navigate(`/explorer?share=${targetUserId.slice(-8)}`);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  // Fetch following list
  const { data: following = [] } = useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_followers")
        .select("following_id")
        .eq("follower_id", userId);
      if (error) throw error;
      return data.map((f) => f.following_id);
    },
    enabled: !!userId,
  });

  // Fetch discoveries from followed users
  const { data: feedItems = [], isLoading } = useQuery({
    queryKey: ["feed", userId, following],
    queryFn: async () => {
      if (!userId || following.length === 0) return [];

      const { data: discoveries, error } = await supabase
        .from("species_identifications")
        .select("*")
        .in("user_id", following)
        .order("identified_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user profiles for these discoveries
      const userIds = [...new Set(discoveries?.map((d) => d.user_id) || [])];
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return (discoveries || []).map((d) => ({
        ...d,
        user_profile: profileMap.get(d.user_id),
      })) as FeedItem[];
    },
    enabled: !!userId && following.length > 0,
  });

  const getExplorerName = (item: FeedItem) => {
    if (item.user_profile?.display_name) return item.user_profile.display_name;
    if (item.user_profile?.username) return `@${item.user_profile.username}`;
    return `Explorer #${item.user_id.slice(-4).toUpperCase()}`;
  };

  const shareDiscovery = (platform: "twitter" | "facebook" | "copy") => {
    if (!shareItem) return;
    
    const shareText = `Check out this ${shareItem.species_name} I found! 🌿`;
    const shareUrl = `${window.location.origin}/species?id=${shareItem.id}`;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          "_blank"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast.success("Link copied to clipboard!");
        break;
    }
    setShareItem(null);
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Discovery Feed</h1>
      <p className="text-sm text-muted-foreground mb-4">
        See what explorers you follow have discovered
      </p>

      {/* User Search */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search explorers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {(searchResults.length > 0 || isSearching) && searchQuery.length >= 2 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No explorers found
              </div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => handleUserClick(user.user_id)}
                  className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {(user.display_name || user.username || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {user.display_name || user.username || `Explorer #${user.user_id.slice(-4)}`}
                    </p>
                    {user.username && user.display_name && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : following.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Explorers Followed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start following other explorers to see their discoveries here!
          </p>
          <Link to="/leaderboard">
            <Button>Find Explorers</Button>
          </Link>
        </Card>
      ) : feedItems.length === 0 ? (
        <Card className="p-8 text-center">
          <Leaf className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Discoveries Yet</h3>
          <p className="text-sm text-muted-foreground">
            The explorers you follow haven't made any discoveries yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {/* User header */}
              <div className="flex items-center gap-3 p-3 border-b">
                <Link to={`/explorer?share=${item.user_id.slice(-8)}`}>
                  <Avatar className="h-8 w-8">
                    {item.user_profile?.avatar_url && (
                      <AvatarImage src={item.user_profile.avatar_url} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getExplorerName(item).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/explorer?share=${item.user_id.slice(-8)}`}
                    className="font-medium text-sm hover:underline truncate block"
                  >
                    {getExplorerName(item)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.identified_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShareItem(item)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Image */}
              {item.image_url && (
                <div className="aspect-square bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.species_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{item.species_name}</h3>
                    {item.scientific_name && (
                      <p className="text-xs italic text-muted-foreground">
                        {item.scientific_name}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                    <IconBadge
                      icon={KINGDOM_ICONS[item.kingdom] || Microscope}
                      size="xs"
                      variant={getKingdomVariant(item.kingdom)}
                      withBackground={false}
                    />
                    {KINGDOM_LABELS[item.kingdom]}
                  </Badge>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={!!shareItem} onOpenChange={() => setShareItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Discovery</DialogTitle>
          </DialogHeader>
          {shareItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {shareItem.image_url ? (
                  <img
                    src={shareItem.image_url}
                    alt={shareItem.species_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary/10 rounded flex items-center justify-center">
                    <IconBadge
                      icon={KINGDOM_ICONS[shareItem.kingdom] || Microscope}
                      size="lg"
                      variant={getKingdomVariant(shareItem.kingdom)}
                    />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{shareItem.species_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {KINGDOM_LABELS[shareItem.kingdom]}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareDiscovery("twitter")}
                >
                  <Twitter className="h-5 w-5 mr-3 text-[#1DA1F2]" />
                  Share on Twitter
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareDiscovery("facebook")}
                >
                  <Facebook className="h-5 w-5 mr-3 text-[#4267B2]" />
                  Share on Facebook
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareDiscovery("copy")}
                >
                  <Copy className="h-5 w-5 mr-3" />
                  Copy Link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
