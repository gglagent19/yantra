import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "@/lib/router";
import { authApi } from "../api/auth";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Loader2 } from "lucide-react";

type AuthMode = "sign_in" | "sign_up";

export function AuthPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
  });

  useEffect(() => {
    if (session) {
      navigate(nextPath, { replace: true });
    }
  }, [session, navigate, nextPath]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "sign_in") {
        await authApi.signInEmail({ email: email.trim(), password });
        return;
      }
      await authApi.signUpEmail({
        name: name.trim(),
        email: email.trim(),
        password,
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      navigate(nextPath, { replace: true });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Authentication failed");
    },
  });

  const canSubmit =
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    (mode === "sign_in" || (name.trim().length > 0 && password.trim().length >= 8));

  if (isSessionLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
      {/* Decorative background blurs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/20 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#0061ff] flex items-center justify-center text-white">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-headline tracking-tight text-foreground">
                {mode === "sign_in" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Architect AI Platform
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === "sign_in"
              ? "Sign in with your credentials to continue."
              : "Set up your account to get started."}
          </p>
        </div>

        {/* Form */}
        <form
          className="p-8 space-y-5"
          method="post"
          action={mode === "sign_up" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email"}
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            if (!canSubmit) {
              setError("Please fill in all required fields.");
              return;
            }
            mutation.mutate();
          }}
        >
          {mode === "sign_up" && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-semibold text-foreground/70">Full Name</label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                autoFocus
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-foreground/70">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoFocus={mode === "sign_in"}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-foreground/70">Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={mode === "sign_up" ? "Minimum 8 characters" : "Enter your password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-xs font-medium text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending}
            aria-disabled={!canSubmit || mutation.isPending}
            className={`w-full bg-gradient-to-br from-primary to-[#0061ff] text-white rounded-xl py-3 font-bold shadow-lg shadow-primary/20 ${!canSubmit && !mutation.isPending ? "opacity-50" : ""}`}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "sign_in" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === "sign_in" ? "Need an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-bold text-primary hover:underline underline-offset-2"
              onClick={() => {
                setError(null);
                setMode(mode === "sign_in" ? "sign_up" : "sign_in");
              }}
            >
              {mode === "sign_in" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
