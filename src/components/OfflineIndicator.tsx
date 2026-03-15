import { WifiOff, Loader2, CloudUpload } from "lucide-react";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

export const OfflineIndicator = () => {
  const { isOnline, pendingCount, isProcessing } = useOfflineQueue();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!isOnline && (
        <div className="flex items-center gap-1.5 bg-destructive/15 border border-destructive/30 rounded-full px-3 py-1">
          <WifiOff className="w-3.5 h-3.5 text-destructive" />
          <span className="text-xs font-medium text-destructive">Offline</span>
        </div>
      )}
      {pendingCount > 0 && (
        <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 rounded-full px-3 py-1">
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
          ) : (
            <CloudUpload className="w-3.5 h-3.5 text-orange-500" />
          )}
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            {isProcessing ? "Syncing..." : `${pendingCount} pending`}
          </span>
        </div>
      )}
    </div>
  );
};
