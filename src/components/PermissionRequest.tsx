import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, MapPin, Mic, Users, Check, X, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PermissionStatus {
  camera: "prompt" | "granted" | "denied";
  location: "prompt" | "granted" | "denied";
  microphone: "prompt" | "granted" | "denied";
  contacts: "prompt" | "granted" | "denied";
}

const PERMISSIONS_KEY = "specassist_permissions_requested";

export function PermissionRequest({ onComplete }: { onComplete: () => void }) {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: "prompt",
    location: "prompt",
    microphone: "prompt",
    contacts: "prompt",
  });
  const [requesting, setRequesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    const updated: Partial<PermissionStatus> = {};

    try {
      const cam = await navigator.permissions.query({ name: "camera" as PermissionName });
      updated.camera = cam.state as PermissionStatus["camera"];
    } catch {
      // API not supported — treat as prompt so user can try
    }

    try {
      const geo = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      updated.location = geo.state as PermissionStatus["location"];
    } catch {
      // API not supported — treat as prompt
    }

    try {
      const mic = await navigator.permissions.query({ name: "microphone" as PermissionName });
      updated.microphone = mic.state as PermissionStatus["microphone"];
    } catch {
      // API not supported — treat as prompt
    }

    // Contacts API is rarely supported; don't mark denied if unavailable
    if (!("contacts" in navigator && (navigator as any).contacts)) {
      updated.contacts = "granted"; // skip — not relevant for this browser
    }

    setPermissions((prev) => ({ ...prev, ...updated }));
  };

  const requestCamera = async () => {
    setRequesting("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissions((p) => ({ ...p, camera: "granted" }));
    } catch {
      setPermissions((p) => ({ ...p, camera: "denied" }));
    }
    setRequesting(null);
  };

  const requestLocation = async () => {
    setRequesting("location");
    try {
      await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      setPermissions((p) => ({ ...p, location: "granted" }));
    } catch {
      setPermissions((p) => ({ ...p, location: "denied" }));
    }
    setRequesting(null);
  };

  const requestMicrophone = async () => {
    setRequesting("microphone");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissions((p) => ({ ...p, microphone: "granted" }));
    } catch {
      setPermissions((p) => ({ ...p, microphone: "denied" }));
    }
    setRequesting(null);
  };

  const requestContacts = async () => {
    setRequesting("contacts");
    try {
      if ("contacts" in navigator && (navigator as any).contacts) {
        await (navigator as any).contacts.select(["name"], { multiple: false });
        setPermissions((p) => ({ ...p, contacts: "granted" }));
      } else {
        // Contacts API not available in this browser
        setPermissions((p) => ({ ...p, contacts: "denied" }));
        toast({
          title: "Not Available",
          description: "Contacts access is not supported in this browser.",
        });
      }
    } catch {
      setPermissions((p) => ({ ...p, contacts: "denied" }));
    }
    setRequesting(null);
  };

  const handleContinue = () => {
    localStorage.setItem(PERMISSIONS_KEY, "true");
    onComplete();
  };

  const allHandled =
    permissions.camera !== "prompt" &&
    permissions.location !== "prompt" &&
    permissions.microphone !== "prompt";

  const items = [
    {
      key: "camera",
      icon: Camera,
      label: "Camera",
      desc: "Take photos to identify species",
      status: permissions.camera,
      request: requestCamera,
      color: "text-species-bird",
      bg: "bg-species-bird/10",
    },
    {
      key: "location",
      icon: MapPin,
      label: "Location",
      desc: "Tag your discoveries on the map",
      status: permissions.location,
      request: requestLocation,
      color: "text-species-plant",
      bg: "bg-species-plant/10",
    },
    {
      key: "microphone",
      icon: Mic,
      label: "Microphone",
      desc: "Record audio for the AI assistant",
      status: permissions.microphone,
      request: requestMicrophone,
      color: "text-species-mammal",
      bg: "bg-species-mammal/10",
    },
    {
      key: "contacts",
      icon: Users,
      label: "Contacts",
      desc: "Invite friends to explore together",
      status: permissions.contacts,
      request: requestContacts,
      color: "text-species-amphibian",
      bg: "bg-species-amphibian/10",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col safe-area-inset">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">App Permissions</h1>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Specassist needs a few permissions to give you the best experience
        </p>

        <div className="w-full max-w-sm space-y-3">
          {items.map((item) => (
            <Card
              key={item.key}
              className="flex items-center gap-3 p-4 border transition-all"
            >
              <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {item.status === "granted" ? (
                <div className="w-8 h-8 rounded-full bg-species-plant/15 flex items-center justify-center">
                  <Check className="h-4 w-4 text-species-plant" />
                </div>
              ) : item.status === "denied" ? (
                <div className="w-8 h-8 rounded-full bg-destructive/15 flex items-center justify-center">
                  <X className="h-4 w-4 text-destructive" />
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs"
                  disabled={requesting === item.key}
                  onClick={item.request}
                >
                  {requesting === item.key ? "..." : "Allow"}
                </Button>
              )}
            </Card>
          ))}
        </div>

        <div className="w-full max-w-sm mt-6 space-y-2">
          <Button className="w-full h-12 font-semibold" onClick={handleContinue}>
            {allHandled ? "Continue" : "Skip & Continue"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You can change permissions anytime in your device settings
          </p>
        </div>
      </div>
    </div>
  );
}

export function usePermissionCheck() {
  const [needsPermissions, setNeedsPermissions] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(PERMISSIONS_KEY);
    setNeedsPermissions(!done);
    setChecked(true);
  }, []);

  const markComplete = () => setNeedsPermissions(false);

  return { needsPermissions, checked, markComplete };
}
