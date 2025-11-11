import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
          variant: "destructive",
        });
        onClose();
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    // Apply zoom to video track if supported
    if (stream && videoRef.current) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.zoom) {
        track.applyConstraints({
          advanced: [{ zoom: zoom } as any]
        }).catch(err => console.log("Zoom not supported:", err));
      }
    }
  }, [zoom, stream]);

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        onCapture(imageData);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col safe-area-inset">
      <div className="flex justify-between items-center p-4 border-b bg-background shrink-0">
        <h2 className="text-lg font-semibold">Take Photo</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: `scale(${zoom})` }}
        />
        
        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            disabled={zoom <= 1}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            -
          </Button>
          <span className="text-white font-semibold text-sm min-w-[40px] text-center">
            {zoom.toFixed(1)}x
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(10, zoom + 0.5))}
            disabled={zoom >= 10}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            +
          </Button>
        </div>
      </div>
      <div className="p-4 border-t bg-background shrink-0 safe-bottom">
        <Button 
          onClick={captureImage} 
          size="lg" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
        >
          <Camera className="mr-2 h-6 w-6" />
          Capture Photo
        </Button>
      </div>
    </div>
  );
};
