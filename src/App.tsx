import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Species from "./pages/Species";
import Locations from "./pages/Locations";
import Badges from "./pages/Badges";
import EasterEggs from "./pages/EasterEggs";
import Collection from "./pages/Collection";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import Plants from "./pages/Plants";
import Mammals from "./pages/Mammals";
import Insects from "./pages/Insects";
import Birds from "./pages/Birds";
import Reptiles from "./pages/Reptiles";
import Fishes from "./pages/Fishes";
import Amphibians from "./pages/Amphibians";
import OtherOrganisms from "./pages/OtherOrganisms";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/badges" element={<Badges />} />
            <Route path="/easter-eggs" element={<EasterEggs />} />
            <Route path="/collection" element={<Collection />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
