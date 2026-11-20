import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Must be less than 72 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^A-Za-z0-9]/, "At least one special character");

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: passwordSchema,
});

const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldownSeconds > 0) {
      toast({
        title: "Temporarily Locked",
        description: `Too many failed attempts. Please wait ${cooldownSeconds} seconds.`,
        variant: "destructive",
      });
      return;
    }

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast({
        title: "Invalid credentials format",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      const nextFail = failCount + 1;
      setFailCount(nextFail);
      if (nextFail >= 5) {
        setCooldownSeconds(60);
        setFailCount(0);
        toast({
          title: "Account locked",
          description: "Too many failed attempts. Cooldown activated for 60 seconds.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: `Invalid credentials. (${5 - nextFail} attempts remaining)`,
          variant: "destructive",
        });
      }
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Login failed", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      toast({ title: "Access denied", description: "You are not an admin.", variant: "destructive" });
      setLoading(false);
      return;
    }

    setFailCount(0);
    toast({ title: "Welcome, Admin!" });
    navigate("/events");
    setLoading(false);
  };

  return (
    <div className="pt-20 min-h-screen bg-background">
      <section className="section-padding max-w-md mx-auto">
        <h1 className="heading-xl text-center text-foreground mb-8">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-6 bg-card p-8 rounded-xl border border-border">
          <div>
            <label className="font-body text-sm text-muted-foreground block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground font-body focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="font-body text-sm text-muted-foreground block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground font-body focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {password.length > 0 && (
              <ul className="mt-3 space-y-1">
                {rules.map((r) => {
                  const ok = r.test(password);
                  return (
                    <li
                      key={r.label}
                      className={`flex items-center gap-2 text-xs font-body ${
                        ok ? "text-green-600" : "text-muted-foreground"
                      }`}
                    >
                      {ok ? <Check size={14} /> : <X size={14} />}
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? "Signing in..."
              : cooldownSeconds > 0
              ? `Wait ${cooldownSeconds}s (Cooldown)`
              : "Sign In"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AdminLogin;
