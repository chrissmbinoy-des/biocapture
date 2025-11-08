import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Check, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Install Critter Identifier</h1>
          <p className="text-muted-foreground">
            Install our app for the best experience with offline access and quick launch from your home screen!
          </p>
        </div>

        {isInstalled ? (
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 text-primary">
              <Check className="h-6 w-6" />
              <div>
                <p className="font-semibold">App Installed!</p>
                <p className="text-sm text-muted-foreground">You can now use the app from your home screen</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {deferredPrompt && (
              <Button onClick={handleInstall} size="lg" className="w-full">
                <Download className="mr-2 h-5 w-5" />
                Install App
              </Button>
            )}

            {isIOS && (
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span>📱</span> Install on iOS
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    <span>Tap the <strong>Share</strong> button in Safari (bottom of screen)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">3.</span>
                    <span>Tap <strong>Add</strong> in the top right corner</span>
                  </li>
                </ol>
              </Card>
            )}

            {!deferredPrompt && !isIOS && (
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span>📱</span> Install on Android
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    <span>Tap the <strong>menu</strong> button (⋮) in your browser</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    <span>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">3.</span>
                    <span>Follow the prompts to complete installation</span>
                  </li>
                </ol>
              </Card>
            )}
          </>
        )}

        <div className="space-y-3 pt-4">
          <h3 className="font-semibold text-center">Features</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">📸</div>
              <div className="text-sm font-medium">Camera Access</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">📡</div>
              <div className="text-sm font-medium">Offline Mode</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium">Fast Launch</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl mb-2">🏅</div>
              <div className="text-sm font-medium">Badge System</div>
            </Card>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link to="/">
            <Button variant="outline">Go to App</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}