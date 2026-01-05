import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Lazy load all pages for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Species = lazy(() => import("./pages/Species"));
const Locations = lazy(() => import("./pages/Locations"));
const Badges = lazy(() => import("./pages/Badges"));
const EasterEggs = lazy(() => import("./pages/EasterEggs"));
const Collection = lazy(() => import("./pages/Collection"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DailyChallenges = lazy(() => import("./pages/DailyChallenges"));
const Plants = lazy(() => import("./pages/Plants"));
const Mammals = lazy(() => import("./pages/Mammals"));
const Insects = lazy(() => import("./pages/Insects"));
const Birds = lazy(() => import("./pages/Birds"));
const Reptiles = lazy(() => import("./pages/Reptiles"));
const Fishes = lazy(() => import("./pages/Fishes"));
const Amphibians = lazy(() => import("./pages/Amphibians"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LoginStreak = lazy(() => import("./pages/LoginStreak"));
const OtherOrganisms = lazy(() => import("./pages/OtherOrganisms"));
const CoinShop = lazy(() => import("./pages/CoinShop"));
const Profile = lazy(() => import("./pages/Profile"));

// Optimized QueryClient with stale time to reduce refetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />
            <Route element={<Layout />}>
              <Route path="/species" element={<Species />} />
              <Route path="/plants" element={<Plants />} />
              <Route path="/mammals" element={<Mammals />} />
              <Route path="/insects" element={<Insects />} />
              <Route path="/birds" element={<Birds />} />
              <Route path="/reptiles" element={<Reptiles />} />
              <Route path="/fish" element={<Fishes />} />
              <Route path="/amphibians" element={<Amphibians />} />
              <Route path="/other-organisms" element={<OtherOrganisms />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/daily-challenges" element={<DailyChallenges />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/easter-eggs" element={<EasterEggs />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/login-streak" element={<LoginStreak />} />
              <Route path="/coin-shop" element={<CoinShop />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
