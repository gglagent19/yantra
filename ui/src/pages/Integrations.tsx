import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Chrome, Globe, Key, Plus, Plug, Server, Trash2, Zap, Cable } from "lucide-react";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { secretsApi } from "@/api/secrets";
import { useCompany } from "../context/CompanyContext";
import { useToast } from "../context/ToastContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn } from "../lib/utils";
import type { McpServerConfig } from "@yantra/shared";

// Well-known API integrations that users can enable
const API_CATALOG = [
  { name: "Instantly", envKey: "INSTANTLY_API_KEY", icon: Zap, color: "orange", description: "Email outreach automation" },
  { name: "Apollo.io", envKey: "APOLLO_API_KEY", icon: Globe, color: "blue", description: "Sales intelligence and engagement" },
  { name: "OpenAI", envKey: "OPENAI_API_KEY", icon: Zap, color: "emerald", description: "GPT models and embeddings" },
  { name: "Serper", envKey: "SERPER_API_KEY", icon: Globe, color: "violet", description: "Google search API for agents" },
  { name: "Tavily", envKey: "TAVILY_API_KEY", icon: Globe, color: "sky", description: "AI-optimized search API" },
] as const;

type ApiConnection = {
  name: string;
  envKey: string;
  secretId?: string;
  configured: boolean;
};

export function Integrations() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setBreadcrumbs([{ label: "Integrations" }]);
  }, [setBreadcrumbs]);

  // Instance settings for Chrome, MCP, API mode
  const { data: settings } = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  });
  const updateSettingsMutation = useMutation({
    mutationFn: instanceSettingsApi.updateGeneral,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings }),
  });

  // Company secrets for API keys
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

  const integrations = settings?.integrations ?? { mcpServers: [], chromeEnabled: false, apiConnected: false };
  const hasApiKey = Boolean(settings?.anthropicApiKey && settings.anthropicApiKey.length > 0);
  const useApi = settings?.useAnthropicApi === true;

  // Build API connections from catalog + secrets
  const apiConnections: ApiConnection[] = API_CATALOG.map((api) => {
    const secret = secrets?.find((s) => s.name === api.envKey);
    return { name: api.name, envKey: api.envKey, secretId: secret?.id, configured: !!secret };
  });

  // Custom API state
  const [customName, setCustomName] = useState("");
  const [customEnvKey, setCustomEnvKey] = useState("");
  const [customValue, setCustomValue] = useState("");

  // Editing API key state
  const [editingApi, setEditingApi] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // MCP state
  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpCommand, setNewMcpCommand] = useState("");
  const [newMcpArgs, setNewMcpArgs] = useState("");

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

      {/* Mode Toggles Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Mode */}
        <div className={cn(
          "rounded-xl border p-4 transition-colors",
          useApi && hasApiKey ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-border",
        )}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", useApi && hasApiKey ? "bg-emerald-500/15" : "bg-muted")}>
                {useApi && hasApiKey ? <Zap className="h-5 w-5 text-emerald-500" /> : <Cable className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <div className="text-sm font-semibold">{useApi && hasApiKey ? "API Mode" : "Subscription"}</div>
                <div className="text-[11px] text-muted-foreground">{hasApiKey ? "Toggle billing mode" : "Set API key on dashboard"}</div>
              </div>
            </div>
            {hasApiKey && (
              <ToggleSwitch checked={useApi} onCheckedChange={() => updateSettingsMutation.mutate({ useAnthropicApi: !useApi })} disabled={updateSettingsMutation.isPending} />
            )}
          </div>
        </div>

        {/* Chrome */}
        <div className={cn(
          "rounded-xl border p-4 transition-colors",
          integrations.chromeEnabled ? "border-sky-500/30 bg-sky-500/[0.04]" : "border-border",
        )}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", integrations.chromeEnabled ? "bg-sky-500/15" : "bg-muted")}>
                <Chrome className={cn("h-5 w-5", integrations.chromeEnabled ? "text-sky-500" : "text-muted-foreground")} />
              </div>
              <div>
                <div className="text-sm font-semibold">Chrome Browser</div>
                <div className="text-[11px] text-muted-foreground">Browser automation</div>
              </div>
            </div>
            <ToggleSwitch
              checked={integrations.chromeEnabled}
              onCheckedChange={() => updateSettingsMutation.mutate({ integrations: { ...integrations, chromeEnabled: !integrations.chromeEnabled } })}
              disabled={updateSettingsMutation.isPending}
            />
          </div>
        </div>

        {/* MCP Summary */}
        <div className={cn(
          "rounded-xl border p-4 transition-colors",
          integrations.mcpServers.some((s) => s.enabled) ? "border-violet-500/30 bg-violet-500/[0.04]" : "border-border",
        )}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", integrations.mcpServers.some((s) => s.enabled) ? "bg-violet-500/15" : "bg-muted")}>
                <Server className={cn("h-5 w-5", integrations.mcpServers.some((s) => s.enabled) ? "text-violet-500" : "text-muted-foreground")} />
              </div>
              <div>
                <div className="text-sm font-semibold">MCP Servers</div>
                <div className="text-[11px] text-muted-foreground">{integrations.mcpServers.filter((s) => s.enabled).length} active</div>
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
            const connection = apiConnections.find((c) => c.envKey === api.envKey)!;
            const isEditing = editingApi === api.envKey;
            const Icon = api.icon;
            const colorMap: Record<string, string> = {
              orange: "bg-orange-500/15 text-orange-500",
              blue: "bg-blue-500/15 text-blue-500",
              emerald: "bg-emerald-500/15 text-emerald-500",
              violet: "bg-violet-500/15 text-violet-500",
              sky: "bg-sky-500/15 text-sky-500",
            };
            return (
              <div key={api.envKey} className={cn(
                "rounded-lg border p-3 transition-colors",
                connection.configured ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-border",
              )}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", connection.configured ? colorMap[api.color] : "bg-muted text-muted-foreground")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{api.name}</div>
                      <div className="text-[10px] text-muted-foreground">{api.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connection.configured ? (
                      <>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Connected</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => connection.secretId && deleteSecretMutation.mutate(connection.secretId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => { setEditingApi(api.envKey); setEditingValue(""); }}>
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="password"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      placeholder={`Enter ${api.name} API key...`}
                      className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                      autoFocus
                    />
                    <Button size="sm" disabled={!editingValue.trim() || createSecretMutation.isPending}
                      onClick={() => {
                        createSecretMutation.mutate(
                          { name: api.envKey, value: editingValue.trim() },
                          { onSuccess: () => { setEditingApi(null); setEditingValue(""); } },
                        );
                      }}>
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
              onClick={() => {
                createSecretMutation.mutate(
                  { name: customEnvKey.trim(), value: customValue.trim() },
                  { onSuccess: () => { setCustomName(""); setCustomEnvKey(""); setCustomValue(""); } },
                );
              }}>
              <Plus className="h-3 w-3 mr-1" />Add
            </Button>
          </div>
        </div>

        {/* Show custom secrets that aren't in catalog */}
        {secrets && secrets.filter((s) => !API_CATALOG.some((a) => a.envKey === s.name) && s.name !== "ANTHROPIC_API_KEY").length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Connections</h3>
            {secrets.filter((s) => !API_CATALOG.some((a) => a.envKey === s.name) && s.name !== "ANTHROPIC_API_KEY").map((secret) => (
              <div key={secret.id} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{secret.name}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground font-mono">••••••••</span>
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
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium ml-auto",
            integrations.mcpServers.length > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
          )}>
            {integrations.mcpServers.filter((s) => s.enabled).length} / {integrations.mcpServers.length} active
          </span>
        </div>

        {integrations.mcpServers.map((server, index) => (
          <div key={index} className={cn(
            "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
            server.enabled ? "border-violet-500/20 bg-violet-500/[0.04]" : "border-border bg-muted/30",
          )}>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{server.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{server.command} {server.args.join(" ")}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ToggleSwitch
                checked={server.enabled}
                onCheckedChange={() => {
                  const updated = [...integrations.mcpServers];
                  updated[index] = { ...server, enabled: !server.enabled };
                  updateSettingsMutation.mutate({ integrations: { ...integrations, mcpServers: updated } });
                }}
                disabled={updateSettingsMutation.isPending}
              />
              <button type="button" className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => {
                  const updated = integrations.mcpServers.filter((_, i) => i !== index);
                  updateSettingsMutation.mutate({ integrations: { ...integrations, mcpServers: updated } });
                }}>
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
          <Button variant="outline" size="sm" disabled={updateSettingsMutation.isPending || !newMcpName.trim() || !newMcpCommand.trim()}
            onClick={() => {
              const newServer: McpServerConfig = {
                name: newMcpName.trim(), command: newMcpCommand.trim(),
                args: newMcpArgs.trim() ? newMcpArgs.split(",").map((a) => a.trim()).filter(Boolean) : [],
                enabled: true,
              };
              updateSettingsMutation.mutate(
                { integrations: { ...integrations, mcpServers: [...integrations.mcpServers, newServer] } },
                { onSuccess: () => { setNewMcpName(""); setNewMcpCommand(""); setNewMcpArgs(""); } },
              );
            }}>
            <Plus className="h-3 w-3 mr-1" />Add
          </Button>
        </div>
      </section>
    </div>
  );
}
