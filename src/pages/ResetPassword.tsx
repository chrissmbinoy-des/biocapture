import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const recoveryDetected = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check hash for recovery type
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    if (hashParams.get("type") === "recovery") {
      recoveryDetected.current = true;
      setIsRecovery(true);
      setChecking(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryDetected.current = true;
        setIsRecovery(true);
        setChecking(false);
      }
    });

    // Also check if there's already an active session (recovery token was already consumed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !recoveryDetected.current) {
        // If we have a session and arrived at this page, it's likely a recovery redirect
        // Check if the URL had recovery params (they may have been consumed already)
        if (hash.includes("access_token") || hash.includes("type=recovery")) {
          recoveryDetected.current = true;
          setIsRecovery(true);
        }
      }
      setChecking(false);
    });

    // Fallback: give Supabase a moment to process the token
    const timeout = setTimeout(() => {
      if (!recoveryDetected.current) {
        // One more session check after delay
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            recoveryDetected.current = true;
            setIsRecovery(true);
          }
          setChecking(false);
        });
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Failed to reset password", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <KeyRound className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-4">This link is invalid or has expired.</p>
          <Button onClick={() => navigate("/auth")}>Back to Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <KeyRound className="h-10 w-10 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-muted-foreground mt-1">Enter your new password below</p>
        </div>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
