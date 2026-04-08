import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { setServerUrl } from "../api/client";

interface ConnectServerProps {
  onConnected: () => void;
}

export function ConnectServer({ onConnected }: ConnectServerProps) {
  const [url, setUrl] = useState("http://localhost:3100");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleConnect() {
    const trimmed = url.trim().replace(/\/+$/, "");
    if (!trimmed) return;

    setTesting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${trimmed}/api/health`, {
        credentials: "include",
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (!data.status) throw new Error("Invalid server response");

      setServerUrl(trimmed);
      setSuccess(true);
      setTimeout(() => onConnected(), 500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("Failed to fetch") || err.message.includes("timeout")
            ? "Cannot reach server. Make sure Yantra is running on your computer and CORS is enabled."
            : err.message
          : "Connection failed",
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/20 overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-border/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#0061ff] flex items-center justify-center text-white">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-headline tracking-tight text-foreground">
                Connect to Yantra
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Architect AI Platform
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the URL of your local Yantra server. Make sure it's running on your computer.
          </p>
        </div>

        <div className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/70">Server URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
              placeholder="http://localhost:3100"
              className="font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Default: http://localhost:3100 — or use your Tailscale/ngrok URL for remote access.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-xs font-medium text-green-700">Connected! Redirecting...</p>
            </div>
          )}

          <Button
            onClick={handleConnect}
            disabled={testing || !url.trim()}
            className="w-full bg-gradient-to-br from-primary to-[#0061ff] text-white rounded-xl py-3 font-bold shadow-lg shadow-primary/20"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
          </Button>
        </div>

        <div className="px-8 pb-6 space-y-3">
          <div className="rounded-lg bg-muted/50 border border-border/10 p-4 space-y-3">
            <p className="text-xs font-bold text-foreground">First time? Follow these steps:</p>

            <div className="space-y-2.5">
              <div className="flex gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Install Node.js</p>
                  <p className="text-[11px] text-muted-foreground">Download and install from <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">nodejs.org</a> (choose LTS version). Then install pnpm:</p>
                  <code className="block mt-1 bg-muted px-2 py-1 rounded text-[11px] font-mono text-foreground">npm install -g pnpm</code>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Install Claude Code</p>
                  <code className="block mt-1 bg-muted px-2 py-1 rounded text-[11px] font-mono text-foreground">npm install -g @anthropic-ai/claude-code</code>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Download & install the server</p>
                  <div className="mt-1 bg-muted px-2 py-1.5 rounded space-y-0.5">
                    <code className="block text-[11px] font-mono text-foreground">git clone https://github.com/gglagent19/yantra.git</code>
                    <code className="block text-[11px] font-mono text-foreground">cd yantra</code>
                    <code className="block text-[11px] font-mono text-foreground">pnpm install</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shrink-0 mt-0.5">4</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Start the server</p>
                  <code className="block mt-1 bg-muted px-2 py-1 rounded text-[11px] font-mono text-foreground">pnpm dev:server</code>
                  <p className="text-[11px] text-muted-foreground mt-1">Wait until you see: <span className="font-semibold text-green-600">Server listening on 127.0.0.1:3100</span></p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shrink-0 mt-0.5">5</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Connect</p>
                  <p className="text-[11px] text-muted-foreground">Keep the default URL above (<span className="font-mono">http://localhost:3100</span>) and click <span className="font-semibold text-foreground">Connect</span>.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            Need help? <a href="https://docs.architectai.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Read the full setup guide</a>
          </p>
        </div>
      </div>
    </div>
  );
}
