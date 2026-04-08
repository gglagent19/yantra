import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatchInstanceGeneralSettings } from "@yantra/shared";
import { Chrome, Globe, Key, LogOut, Monitor, Plus, Plug, Server, SlidersHorizontal, Trash2, Zap } from "lucide-react";
import type { McpServerConfig } from "@yantra/shared";
import { authApi } from "@/api/auth";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { Button } from "../components/ui/button";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn } from "../lib/utils";

const FEEDBACK_TERMS_URL = import.meta.env.VITE_FEEDBACK_TERMS_URL?.trim() || "https://yantra.ing/tos";

export function InstanceGeneralSettings() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const signOutMutation = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to sign out.");
    },
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Instance Settings" },
      { label: "General" },
    ]);
  }, [setBreadcrumbs]);

  const generalQuery = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  });

  const updateGeneralMutation = useMutation({
    mutationFn: instanceSettingsApi.updateGeneral,
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to update general settings.");
    },
  });

  if (generalQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading general settings...</div>;
  }

  if (generalQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {generalQuery.error instanceof Error
          ? generalQuery.error.message
          : "Failed to load general settings."}
      </div>
    );
  }

  const censorUsernameInLogs = generalQuery.data?.censorUsernameInLogs === true;
  const keyboardShortcuts = generalQuery.data?.keyboardShortcuts === true;
  const feedbackDataSharingPreference = generalQuery.data?.feedbackDataSharingPreference ?? "prompt";
  const currentApiKey = generalQuery.data?.anthropicApiKey ?? "";
  const isApiKeyConfigured = currentApiKey.length > 0 && currentApiKey !== "";
  const [apiKeyInput, setApiKeyInput] = useState("");
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const integrations = generalQuery.data?.integrations ?? { mcpServers: [], chromeEnabled: false, apiConnected: false };
  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpCommand, setNewMcpCommand] = useState("");
  const [newMcpArgs, setNewMcpArgs] = useState("");

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">General</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure instance-wide defaults that affect how operator-visible logs are displayed.
        </p>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">Censor username in logs</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Hide the username segment in home-directory paths and similar operator-visible log output. Standalone
              username mentions outside of paths are not yet masked in the live transcript view. This is off by
              default.
            </p>
          </div>
          <ToggleSwitch
            checked={censorUsernameInLogs}
            onCheckedChange={() => updateGeneralMutation.mutate({ censorUsernameInLogs: !censorUsernameInLogs })}
            disabled={updateGeneralMutation.isPending}
            aria-label="Toggle username log censoring"
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Enable app keyboard shortcuts, including inbox navigation and global shortcuts like creating issues or
              toggling panels. This is off by default.
            </p>
          </div>
          <ToggleSwitch
            checked={keyboardShortcuts}
            onCheckedChange={() => updateGeneralMutation.mutate({ keyboardShortcuts: !keyboardShortcuts })}
            disabled={updateGeneralMutation.isPending}
            aria-label="Toggle keyboard shortcuts"
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Anthropic API Key</h2>
            {isApiKeyConfigured && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            )}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Set a global Anthropic API key so all Claude agents use the API instead of Claude Code
            subscription limits. Agents with their own key configured will use theirs instead.
          </p>
          <div className="flex items-center gap-2">
            <input
              ref={apiKeyInputRef}
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={isApiKeyConfigured ? "sk-***configured*** (enter new key to replace)" : "sk-ant-..."}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={updateGeneralMutation.isPending || !apiKeyInput.trim()}
              onClick={() => {
                updateGeneralMutation.mutate(
                  { anthropicApiKey: apiKeyInput.trim() },
                  { onSuccess: () => setApiKeyInput("") },
                );
              }}
            >
              {updateGeneralMutation.isPending ? "Saving..." : "Save"}
            </Button>
            {isApiKeyConfigured && (
              <Button
                variant="outline"
                size="sm"
                disabled={updateGeneralMutation.isPending}
                onClick={() => {
                  updateGeneralMutation.mutate({ anthropicApiKey: "" });
                  setApiKeyInput("");
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">AI feedback sharing</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Control whether thumbs up and thumbs down votes can send the voted AI output to
              Yantra Labs. Votes are always saved locally.
            </p>
            {FEEDBACK_TERMS_URL ? (
              <a
                href={FEEDBACK_TERMS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Read our terms of service
              </a>
            ) : null}
          </div>
          {feedbackDataSharingPreference === "prompt" ? (
            <div className="rounded-lg border border-border/70 bg-accent/20 px-3 py-2 text-sm text-muted-foreground">
              No default is saved yet. The next thumbs up or thumbs down choice will ask once and
              then save the answer here.
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {[
              {
                value: "allowed",
                label: "Always allow",
                description: "Share voted AI outputs automatically.",
              },
              {
                value: "not_allowed",
                label: "Don't allow",
                description: "Keep voted AI outputs local only.",
              },
            ].map((option) => {
              const active = feedbackDataSharingPreference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={updateGeneralMutation.isPending}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    active
                      ? "border-foreground bg-accent text-foreground"
                      : "border-border bg-background hover:bg-accent/50",
                  )}
                  onClick={() =>
                    updateGeneralMutation.mutate({
                      feedbackDataSharingPreference: option.value as
                        | "allowed"
                        | "not_allowed",
                    })
                  }
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            To retest the first-use prompt in local dev, remove the{" "}
            <code>feedbackDataSharingPreference</code> key from the{" "}
            <code>instance_settings.general</code> JSON row for this instance, or set it back to{" "}
            <code>"prompt"</code>. Unset and <code>"prompt"</code> both mean no default has been
            chosen yet.
          </p>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Integrations</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect external tools and services. Enabled integrations are automatically available to all agents.
          </p>

          {/* Anthropic API */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  isApiKeyConfigured && integrations.apiConnected ? "bg-emerald-500/15" : "bg-muted",
                )}>
                  <Zap className={cn("h-5 w-5", isApiKeyConfigured && integrations.apiConnected ? "text-emerald-500" : "text-muted-foreground")} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Anthropic API</h3>
                  <p className="text-xs text-muted-foreground">Direct API access — bypasses Claude Code session limits</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  isApiKeyConfigured
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}>
                  {isApiKeyConfigured ? "Connected" : "Not configured"}
                </span>
                {isApiKeyConfigured && (
                  <ToggleSwitch
                    checked={integrations.apiConnected}
                    onCheckedChange={() => updateGeneralMutation.mutate({
                      integrations: { ...integrations, apiConnected: !integrations.apiConnected },
                    })}
                    disabled={updateGeneralMutation.isPending}
                    aria-label="Toggle API connection"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Chrome Browser */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  integrations.chromeEnabled ? "bg-sky-500/15" : "bg-muted",
                )}>
                  <Chrome className={cn("h-5 w-5", integrations.chromeEnabled ? "text-sky-500" : "text-muted-foreground")} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Chrome Browser</h3>
                  <p className="text-xs text-muted-foreground">Enable browser automation via Claude's Chrome integration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  integrations.chromeEnabled
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}>
                  {integrations.chromeEnabled ? "Enabled" : "Disabled"}
                </span>
                <ToggleSwitch
                  checked={integrations.chromeEnabled}
                  onCheckedChange={() => updateGeneralMutation.mutate({
                    integrations: { ...integrations, chromeEnabled: !integrations.chromeEnabled },
                  })}
                  disabled={updateGeneralMutation.isPending}
                  aria-label="Toggle Chrome integration"
                />
              </div>
            </div>
          </div>

          {/* MCP Servers */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  integrations.mcpServers.some((s) => s.enabled) ? "bg-violet-500/15" : "bg-muted",
                )}>
                  <Server className={cn("h-5 w-5", integrations.mcpServers.some((s) => s.enabled) ? "text-violet-500" : "text-muted-foreground")} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">MCP Servers</h3>
                  <p className="text-xs text-muted-foreground">Connect Model Context Protocol servers for external tools</p>
                </div>
              </div>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                integrations.mcpServers.length > 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground",
              )}>
                {integrations.mcpServers.filter((s) => s.enabled).length} / {integrations.mcpServers.length} active
              </span>
            </div>

            {/* Existing MCP servers */}
            {integrations.mcpServers.length > 0 && (
              <div className="space-y-2 mb-4">
                {integrations.mcpServers.map((server, index) => (
                  <div key={index} className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                    server.enabled ? "border-violet-500/20 bg-violet-500/[0.04]" : "border-border bg-muted/30",
                  )}>
                    <div className="min-w-0 flex-1">
                      <span className={cn("text-sm font-medium", server.enabled ? "text-foreground" : "text-muted-foreground")}>
                        {server.name}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono truncate">
                        {server.command} {server.args.join(" ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ToggleSwitch
                        checked={server.enabled}
                        onCheckedChange={() => {
                          const updated = [...integrations.mcpServers];
                          updated[index] = { ...server, enabled: !server.enabled };
                          updateGeneralMutation.mutate({
                            integrations: { ...integrations, mcpServers: updated },
                          });
                        }}
                        disabled={updateGeneralMutation.isPending}
                        aria-label={`Toggle ${server.name}`}
                      />
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => {
                          const updated = integrations.mcpServers.filter((_, i) => i !== index);
                          updateGeneralMutation.mutate({
                            integrations: { ...integrations, mcpServers: updated },
                          });
                        }}
                        disabled={updateGeneralMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new MCP server */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-[11px] text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={newMcpName}
                  onChange={(e) => setNewMcpName(e.target.value)}
                  placeholder="e.g. filesystem"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[11px] text-muted-foreground">Command</label>
                <input
                  type="text"
                  value={newMcpCommand}
                  onChange={(e) => setNewMcpCommand(e.target.value)}
                  placeholder="e.g. npx -y @anthropic/mcp-fs"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[11px] text-muted-foreground">Args (comma-separated)</label>
                <input
                  type="text"
                  value={newMcpArgs}
                  onChange={(e) => setNewMcpArgs(e.target.value)}
                  placeholder="e.g. /home/user/docs"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={updateGeneralMutation.isPending || !newMcpName.trim() || !newMcpCommand.trim()}
                onClick={() => {
                  const newServer: McpServerConfig = {
                    name: newMcpName.trim(),
                    command: newMcpCommand.trim(),
                    args: newMcpArgs.trim() ? newMcpArgs.split(",").map((a) => a.trim()).filter(Boolean) : [],
                    enabled: true,
                  };
                  updateGeneralMutation.mutate(
                    { integrations: { ...integrations, mcpServers: [...integrations.mcpServers, newServer] } },
                    { onSuccess: () => { setNewMcpName(""); setNewMcpCommand(""); setNewMcpArgs(""); } },
                  );
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold">Sign out</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Sign out of this Yantra instance. You will be redirected to the login page.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={signOutMutation.isPending}
            onClick={() => signOutMutation.mutate()}
          >
            <LogOut className="size-4" />
            {signOutMutation.isPending ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </section>
    </div>
  );
}
