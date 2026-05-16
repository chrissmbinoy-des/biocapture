// Prefetch route chunks on hover/focus to make navigation feel instant.
// Each entry returns the same dynamic import used in src/App.tsx so Vite
// reuses the already-fetched chunk.
const loaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Index"),
  "/auth": () => import("@/pages/Auth"),
  "/reset-password": () => import("@/pages/ResetPassword"),
  "/install": () => import("@/pages/Install"),
  "/species": () => import("@/pages/Species"),
  "/plants": () => import("@/pages/Plants"),
  "/mammals": () => import("@/pages/Mammals"),
  "/insects": () => import("@/pages/Insects"),
  "/birds": () => import("@/pages/Birds"),
  "/reptiles": () => import("@/pages/Reptiles"),
  "/fish": () => import("@/pages/Fishes"),
  "/amphibians": () => import("@/pages/Amphibians"),
  "/other-organisms": () => import("@/pages/OtherOrganisms"),
  "/ai-assistant": () => import("@/pages/AIAssistant"),
  "/daily-challenges": () => import("@/pages/DailyChallenges"),
  "/badges": () => import("@/pages/Badges"),
  "/collection": () => import("@/pages/Collection"),
  "/leaderboard": () => import("@/pages/Leaderboard"),
  "/login-streak": () => import("@/pages/LoginStreak"),
  "/coin-shop": () => import("@/pages/CoinShop"),
  "/profile": () => import("@/pages/Profile"),
  "/feed": () => import("@/pages/Feed"),
  "/explorer": () => import("@/pages/PublicProfile"),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = loaders[path];
  if (!loader) return;
  prefetched.add(path);
  // Fire-and-forget; ignore errors (offline, etc.)
  loader().catch(() => prefetched.delete(path));
}

export function prefetchAllRoutesIdle() {
  const run = () => {
    Object.keys(loaders).forEach((p) => prefetchRoute(p));
  };
  if (typeof (window as any).requestIdleCallback === "function") {
    (window as any).requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 2000);
  }
}
