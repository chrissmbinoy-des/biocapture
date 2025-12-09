import { Camera } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function FloatingCameraButton() {
  const location = useLocation();
  
  // Don't show on camera page (Index)
  if (location.pathname === "/") {
    return null;
  }

  return (
    <Link to="/" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <Button
        size="lg"
        className="h-18 w-18 rounded-full bg-species-plant hover:bg-species-plant/90 shadow-lg shadow-species-plant/30 transition-transform duration-200 active:scale-95 hover:scale-105"
        style={{ height: '72px', width: '72px' }}
      >
        <Camera className="h-8 w-8 text-white" />
      </Button>
    </Link>
  );
}