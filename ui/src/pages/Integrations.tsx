import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Chrome, ExternalLink, Globe, Key, Monitor, Plus, Plug, Server, Trash2, Zap, Cable } from "lucide-react";
import { secretsApi } from "@/api/secrets";
import { useCompany } from "../context/CompanyContext";
import { useToast } from "../context/ToastContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn } from "../lib/utils";

// localStorage keys for integration toggles (works without backend)
const LS_CHROME_ENABLED = "yantra:integrations:chromeEnabled";
const LS_API_MODE = "yantra:integrations:apiMode";
const LS_MCP_SERVERS = "yantra:integrations:mcpServers";

type McpServer = { name: string; command: string; args: string[]; enabled: boolean };

function readLsBool(key: string, fallback = false): boolean {
  try { return localStorage.getItem(key) === "true"; } catch { return fallback; }
}
function writeLsBool(key: string, value: boolean) {
  try { localStorage.setItem(key, String(value)); } catch {}
}
function readLsMcpServers(): McpServer[] {
  try {
    const raw = localStorage.getItem(LS_MCP_SERVERS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function writeLsMcpServers(servers: McpServer[]) {
  try { localStorage.setItem(LS_MCP_SERVERS, JSON.stringify(servers)); } catch {}
}

// Well-known API integrations
const API_CATALOG = [
  { name: "Instantly", envKey: "INSTANTLY_API_KEY", icon: Zap, color: "orange", description: "Email outreach automation" },
  { name: "Apollo.io", envKey: "APOLLO_API_KEY", icon: Globe, color: "blue", description: "Sales intelligence and engagement" },
  { name: "OpenAI", envKey: "OPENAI_API_KEY", icon: Zap, color: "emerald", description: "GPT models and embeddings" },
  { name: "Serper", envKey: "SERPER_API_KEY", icon: Globe, color: "violet", description: "Google search API for agents" },
  { name: "Tavily", envKey: "TAVILY_API_KEY", icon: Globe, color: "sky", description: "AI-optimized search API" },
] as const;

export function Integrations() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setBreadcrumbs([{ label: "Integrations" }]);
  }, [setBreadcrumbs]);

  // --- Local toggles (instant, no backend needed) ---
  const [chromeEnabled, setChromeEnabled] = useState(() => readLsBool(LS_CHROME_ENABLED));
  const [apiMode, setApiMode] = useState(() => readLsBool(LS_API_MODE));
  const [mcpServers, setMcpServers] = useState<McpServer[]>(() => readLsMcpServers());
  const [browserOpen, setBrowserOpen] = useState(false);

  const toggleChrome = useCallback(() => {
    const next = !chromeEnabled;
    setChromeEnabled(next);
    writeLsBool(LS_CHROME_ENABLED, next);
    pushToast({ title: next ? "Chrome browser enabled" : "Chrome browser disabled", tone: "success" });
  }, [chromeEnabled, pushToast]);

  const toggleApiMode = useCallback(() => {
    const next = !apiMode;
    setApiMode(next);
    writeLsBool(LS_API_MODE, next);
    pushToast({ title: next ? "Switched to API mode" : "Switched to Subscription mode", tone: "success" });
  }, [apiMode, pushToast]);

  const updateMcpServers = useCallback((next: McpServer[]) => {
    setMcpServers(next);
    writeLsMcpServers(next);
  }, []);

  // --- Company secrets for API keys ---
  const { data: secrets } = useQuery({
    queryKey: queryKeys.secrets.list(selectedCompanyId!),
    queryFn: () => secretsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const createSecretMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      secretsApi.create(selectedCompanyId!, { name, value, description: `API key for ${name}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(selectedCompanyId!) });
      pushToast({ title: "API key saved", tone: "success" });
    },
    onError: (err: Error) => pushToast({ title: "Failed", body: err.message, tone: "error" }),
  });

  const deleteSecretMutation = useMutation({
    mutationFn: (id: string) => secretsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(selectedCompanyId!) });
      pushToast({ title: "API key removed", tone: "success" });
    },
    onError: (err: Error) => pushToast({ title: "Failed", body: err.message, tone: "error" }),
  });

  const hasAnthropicKey = !!secrets?.find((s) => s.name === "ANTHROPIC_API_KEY");

  // --- UI state ---
  const [editingApi, setEditingApi] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEnvKey, setCustomEnvKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpCommand, setNewMcpCommand] = useState("");
  const [newMcpArgs, setNewMcpArgs] = useState("");

  const handleLaunchBrowser = useCallback(async () => {
    try {
      const base = localStorage.getItem("yantra.serverUrl") || "";
      const res = await fetch(`${base}/api/browser/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: "https://www.google.com" }),
      });
      if (!res.ok) throw new Error("Server failed to launch browser");
      setBrowserOpen(true);
      pushToast({ title: "Chrome launched", body: "Agents will control Chrome via the Claude-in-Chrome extension.", tone: "success" });
    } catch {
      // Fallback: try opening in current browser
      window.open("https://www.google.com", "_blank");
      setBrowserOpen(true);
      pushToast({ title: "Browser opened", body: "For agent control, ensure Chrome has the Claude-in-Chrome extension.", tone: "success" });
    }
  }, [pushToast]);

  const colorMap: Record<string, string> = {
    orange: "bg-orange-500/15 text-orange-500",
    blue: "bg-blue-500/15 text-blue-500",
    emerald: "bg-emerald-500/15 text-emerald-500",
    violet: "bg-violet-500/15 text-violet-500",
    sky: "bg-sky-500/15 text-sky-500",
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Integrations</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect APIs, tools, and services. Enabled integrations are automatically available to all agents.
        </p>
      </div>

      {/* Top Toggle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Mode */}
        <div className={cn("rounded-xl border p-4 transition-colors", apiMode && hasAnthropicKey ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-border")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", apiMode && hasAnthropicKey ? "bg-emerald-500/15" : "bg-muted")}>
                {apiMode && hasAnthropicKey ? <Zap className="h-5 w-5 text-emerald-500" /> : <Cable className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <div className="text-sm font-semibold">{apiMode && hasAnthropicKey ? "API Mode" : "Subscription"}</div>
                <div className="text-[11px] text-muted-foreground">{hasAnthropicKey ? "No session limits" : "Add API key first"}</div>
              </div>
            </div>
            <ToggleSwitch checked={apiMode} onCheckedChange={toggleApiMode} disabled={!hasAnthropicKey} />
          </div>
        </div>

        {/* Chrome Browser */}
        <div className={cn("rounded-xl border p-4 transition-colors", chromeEnabled ? "border-sky-500/30 bg-sky-500/[0.04]" : "border-border")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", chromeEnabled ? "bg-sky-500/15" : "bg-muted")}>
                <Chrome className={cn("h-5 w-5", chromeEnabled ? "text-sky-500" : "text-muted-foreground")} />
              </div>
              <div>
                <div className="text-sm font-semibold">Chrome Browser</div>
                <div className="text-[11px] text-muted-foreground">
                  {chromeEnabled ? "Enabled for all agents" : "Browser automation"}
                </div>
              </div>
            </div>
            <ToggleSwitch checked={chromeEnabled} onCheckedChange={toggleChrome} />
          </div>
          {chromeEnabled && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleLaunchBrowser}
              >
                <Monitor className="h-3.5 w-3.5" />
                {browserOpen ? "Browser Running" : "Launch Browser"}
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Opens a Chrome window that agents control via the Claude-in-Chrome extension
              </p>
            </div>
          )}
        </div>

        {/* MCP Summary */}
        <div className={cn("rounded-xl border p-4 transition-colors", mcpServers.some((s) => s.enabled) ? "border-violet-500/30 bg-violet-500/[0.04]" : "border-border")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", mcpServers.some((s) => s.enabled) ? "bg-violet-500/15" : "bg-muted")}>
                <Server className={cn("h-5 w-5", mcpServers.some((s) => s.enabled) ? "text-violet-500" : "text-muted-foreground")} />
              </div>
              <div>
                <div className="text-sm font-semibold">MCP Servers</div>
                <div className="text-[11px] text-muted-foreground">{mcpServers.filter((s) => s.enabled).length} active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Connections */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">API Connections</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {API_CATALOG.map((api) => {
            const secret = secrets?.find((s) => s.name === api.envKey);
            const configured = !!secret;
            const isEditing = editingApi === api.envKey;
            const Icon = api.icon;
            return (
              <div key={api.envKey} className={cn("rounded-lg border p-3 transition-colors", configured ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-border")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", configured ? colorMap[api.color] : "bg-muted text-muted-foreground")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{api.name}</div>
                      <div className="text-[10px] text-muted-foreground">{api.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {configured ? (
                      <>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Connected</span>
                        <button type="button" className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => secret && deleteSecretMutation.mutate(secret.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => { setEditingApi(api.envKey); setEditingValue(""); }}>Connect</Button>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-3 flex gap-2">
                    <input type="password" value={editingValue} onChange={(e) => setEditingValue(e.target.value)}
                      placeholder={`Enter ${api.name} API key...`} autoFocus
                      className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
                    <Button size="sm" disabled={!editingValue.trim() || createSecretMutation.isPending}
                      onClick={() => createSecretMutation.mutate({ name: api.envKey, value: editingValue.trim() }, { onSuccess: () => { setEditingApi(null); setEditingValue(""); } })}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingApi(null)}>Cancel</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom API */}
        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Custom API</h3>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] text-muted-foreground">Name</label>
              <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Stripe"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[11px] text-muted-foreground">Env Variable</label>
              <input type="text" value={customEnvKey} onChange={(e) => setCustomEnvKey(e.target.value.toUpperCase())} placeholder="e.g. STRIPE_API_KEY"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[11px] text-muted-foreground">API Key</label>
              <input type="password" value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="sk-..."
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
            </div>
            <Button variant="outline" size="sm" disabled={!customName.trim() || !customEnvKey.trim() || !customValue.trim() || createSecretMutation.isPending}
              onClick={() => createSecretMutation.mutate({ name: customEnvKey.trim(), value: customValue.trim() }, { onSuccess: () => { setCustomName(""); setCustomEnvKey(""); setCustomValue(""); } })}>
              <Plus className="h-3 w-3 mr-1" />Add
            </Button>
          </div>
        </div>

        {/* Custom secrets not in catalog */}
        {secrets && secrets.filter((s) => !API_CATALOG.some((a) => a.envKey === s.name) && s.name !== "ANTHROPIC_API_KEY").length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Connections</h3>
            {secrets.filter((s) => !API_CATALOG.some((a) => a.envKey === s.name) && s.name !== "ANTHROPIC_API_KEY").map((secret) => (
              <div key={secret.id} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{secret.name}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground font-mono">configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Connected</span>
                  <button type="button" className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => deleteSecretMutation.mutate(secret.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MCP Servers */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">MCP Servers</h2>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium ml-auto",
            mcpServers.length > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
            {mcpServers.filter((s) => s.enabled).length} / {mcpServers.length} active
          </span>
        </div>

        {mcpServers.map((server, index) => (
          <div key={index} className={cn("flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
            server.enabled ? "border-violet-500/20 bg-violet-500/[0.04]" : "border-border bg-muted/30")}>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{server.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{server.command} {server.args.join(" ")}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ToggleSwitch checked={server.enabled} onCheckedChange={() => {
                const updated = [...mcpServers];
                updated[index] = { ...server, enabled: !server.enabled };
                updateMcpServers(updated);
              }} />
              <button type="button" className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => updateMcpServers(mcpServers.filter((_, i) => i !== index))}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-end gap-2 pt-2 border-t border-border">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] text-muted-foreground">Name</label>
            <input type="text" value={newMcpName} onChange={(e) => setNewMcpName(e.target.value)} placeholder="e.g. filesystem"
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
          </div>
          <div className="flex-[2] space-y-1">
            <label className="text-[11px] text-muted-foreground">Command</label>
            <input type="text" value={newMcpCommand} onChange={(e) => setNewMcpCommand(e.target.value)} placeholder="e.g. npx -y @anthropic/mcp-fs"
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[11px] text-muted-foreground">Args (comma-separated)</label>
            <input type="text" value={newMcpArgs} onChange={(e) => setNewMcpArgs(e.target.value)} placeholder="/home/user/docs"
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
          </div>
          <Button variant="outline" size="sm" disabled={!newMcpName.trim() || !newMcpCommand.trim()}
            onClick={() => {
              updateMcpServers([...mcpServers, { name: newMcpName.trim(), command: newMcpCommand.trim(),
                args: newMcpArgs.trim() ? newMcpArgs.split(",").map((a) => a.trim()).filter(Boolean) : [], enabled: true }]);
              setNewMcpName(""); setNewMcpCommand(""); setNewMcpArgs("");
            }}>
            <Plus className="h-3 w-3 mr-1" />Add
          </Button>
        </div>
      </section>
    </div>
  );
}
