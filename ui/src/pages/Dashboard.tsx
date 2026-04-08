import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "@/lib/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";
import { activityApi } from "../api/activity";
import { issuesApi } from "../api/issues";
import { agentsApi } from "../api/agents";
import { projectsApi } from "../api/projects";
import { heartbeatsApi } from "../api/heartbeats";
import { secretsApi } from "../api/secrets";
import { useCompany } from "../context/CompanyContext";
import { useDialog } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { StatusIcon } from "../components/StatusIcon";

import { ActivityRow } from "../components/ActivityRow";
import { Identity } from "../components/Identity";
import { timeAgo } from "../lib/timeAgo";
import { cn, formatCents, formatTokens } from "../lib/utils";
import { Bot, Cable, Chrome, CircleDot, Cpu, Plus, Plug, Server, ShieldCheck, LayoutDashboard, PauseCircle, Key, Eye, EyeOff, Check, Loader2, Trash2, Zap } from "lucide-react";
import { instanceSettingsApi } from "../api/instanceSettings";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { McpServerConfig } from "@yantra/shared";
import { ActiveAgentsPanel } from "../components/ActiveAgentsPanel";
import { ChartCard, RunActivityChart, PriorityChart, IssueStatusChart, SuccessRateChart } from "../components/ActivityCharts";
import { PageSkeleton } from "../components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Agent, Issue } from "@yantra/shared";
import { PluginSlotOutlet } from "@/plugins/slots";

function getRecentIssues(issues: Issue[]): Issue[] {
  return [...issues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

const ANTHROPIC_SECRET_NAME = "ANTHROPIC_API_KEY";

function AnthropicApiKeyCard({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [keyValue, setKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: secrets } = useQuery({
    queryKey: queryKeys.secrets.list(companyId),
    queryFn: () => secretsApi.list(companyId),
  });

  const existingSecret = secrets?.find((s) => s.name === ANTHROPIC_SECRET_NAME);

  const createMutation = useMutation({
    mutationFn: (value: string) =>
      secretsApi.create(companyId, {
        name: ANTHROPIC_SECRET_NAME,
        value,
        description: "Anthropic API key for Claude agents",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(companyId) });
      setKeyValue("");
      setIsEditing(false);
      pushToast({ title: "API key saved", tone: "success" });
    },
    onError: (err: Error) => {
      pushToast({ title: "Failed to save API key", body: err.message, tone: "error" });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: (value: string) => secretsApi.rotate(existingSecret!.id, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(companyId) });
      setKeyValue("");
      setIsEditing(false);
      pushToast({ title: "API key updated", tone: "success" });
    },
    onError: (err: Error) => {
      pushToast({ title: "Failed to update API key", body: err.message, tone: "error" });
    },
  });

  const isSaving = createMutation.isPending || rotateMutation.isPending;

  const handleSave = useCallback(() => {
    const trimmed = keyValue.trim();
    if (!trimmed) return;
    if (existingSecret) {
      rotateMutation.mutate(trimmed);
    } else {
      createMutation.mutate(trimmed);
    }
  }, [keyValue, existingSecret, createMutation, rotateMutation]);

  return (
    <div className="bg-card rounded-xl border border-border/10 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-headline text-foreground">Anthropic API Key</h3>
            <p className="text-xs text-muted-foreground">
              {existingSecret
                ? `Configured · Last updated ${timeAgo(existingSecret.updatedAt)}`
                : "Required for Claude agents to run"}
            </p>
          </div>
        </div>
        {existingSecret && !isEditing && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
            <Check className="h-3 w-3" />
            Active
          </span>
        )}
      </div>

      {(!existingSecret || isEditing) ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-ant-api03-..."
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              className="pr-10 font-mono text-xs"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <Button
            onClick={handleSave}
            disabled={!keyValue.trim() || isSaving}
            className="shrink-0"
            size="sm"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Key"}
          </Button>
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIsEditing(false); setKeyValue(""); }}
              className="shrink-0"
            >
              Cancel
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-xs text-muted-foreground">
            sk-ant-••••••••••••••••
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Update Key
          </Button>
        </div>
      )}
    </div>
  );
}

function IntegrationsPanel() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  });
  const updateMutation = useMutation({
    mutationFn: instanceSettingsApi.updateGeneral,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings }),
  });

  const integrations = settings?.integrations ?? { mcpServers: [], chromeEnabled: false, apiConnected: false };
  const hasApiKey = Boolean(settings?.anthropicApiKey && settings.anthropicApiKey.length > 0);
  const useApi = settings?.useAnthropicApi === true;
  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpCommand, setNewMcpCommand] = useState("");
  const [newMcpArgs, setNewMcpArgs] = useState("");

  return (
    <div className="bg-card rounded-xl border border-border/10 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Plug className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-bold font-headline text-foreground">Integrations</h3>
      </div>

      {/* API Mode Toggle */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", useApi && hasApiKey ? "bg-emerald-500/15" : "bg-muted")}>
            <Zap className={cn("h-4 w-4", useApi && hasApiKey ? "text-emerald-500" : "text-muted-foreground")} />
          </div>
          <div>
            <div className="text-sm font-medium">Anthropic API</div>
            <div className="text-[11px] text-muted-foreground">
              {!hasApiKey ? "Add API key above to enable" : useApi ? "Using API — no session limits" : "Using Claude Code subscription"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            useApi && hasApiKey ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
          )}>
            {useApi && hasApiKey ? "API" : "Subscription"}
          </span>
          {hasApiKey && (
            <ToggleSwitch
              checked={useApi}
              onCheckedChange={() => updateMutation.mutate({ useAnthropicApi: !useApi })}
              disabled={updateMutation.isPending}
              aria-label="Toggle API mode"
            />
          )}
        </div>
      </div>

      {/* Chrome Toggle */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", integrations.chromeEnabled ? "bg-sky-500/15" : "bg-muted")}>
            <Chrome className={cn("h-4 w-4", integrations.chromeEnabled ? "text-sky-500" : "text-muted-foreground")} />
          </div>
          <div>
            <div className="text-sm font-medium">Chrome Browser</div>
            <div className="text-[11px] text-muted-foreground">Browser automation for all agents</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            integrations.chromeEnabled ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
          )}>
            {integrations.chromeEnabled ? "On" : "Off"}
          </span>
          <ToggleSwitch
            checked={integrations.chromeEnabled}
            onCheckedChange={() => updateMutation.mutate({ integrations: { ...integrations, chromeEnabled: !integrations.chromeEnabled } })}
            disabled={updateMutation.isPending}
            aria-label="Toggle Chrome"
          />
        </div>
      </div>

      {/* MCP Servers */}
      <div className="rounded-lg border border-border p-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", integrations.mcpServers.some((s) => s.enabled) ? "bg-violet-500/15" : "bg-muted")}>
              <Server className={cn("h-4 w-4", integrations.mcpServers.some((s) => s.enabled) ? "text-violet-500" : "text-muted-foreground")} />
            </div>
            <div>
              <div className="text-sm font-medium">MCP Servers</div>
              <div className="text-[11px] text-muted-foreground">Connect external tools via MCP</div>
            </div>
          </div>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            integrations.mcpServers.length > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
          )}>
            {integrations.mcpServers.filter((s) => s.enabled).length} active
          </span>
        </div>

        {integrations.mcpServers.map((server, index) => (
          <div key={index} className={cn(
            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
            server.enabled ? "border-violet-500/20 bg-violet-500/[0.04]" : "border-border bg-muted/30",
          )}>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium">{server.name}</span>
              <span className="ml-2 text-[10px] text-muted-foreground font-mono">{server.command}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <ToggleSwitch
                checked={server.enabled}
                onCheckedChange={() => {
                  const updated = [...integrations.mcpServers];
                  updated[index] = { ...server, enabled: !server.enabled };
                  updateMutation.mutate({ integrations: { ...integrations, mcpServers: updated } });
                }}
                disabled={updateMutation.isPending}
                aria-label={`Toggle ${server.name}`}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => {
                  const updated = integrations.mcpServers.filter((_, i) => i !== index);
                  updateMutation.mutate({ integrations: { ...integrations, mcpServers: updated } });
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <input type="text" value={newMcpName} onChange={(e) => setNewMcpName(e.target.value)} placeholder="Name"
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
          </div>
          <div className="flex-[2]">
            <input type="text" value={newMcpCommand} onChange={(e) => setNewMcpCommand(e.target.value)} placeholder="Command (e.g. npx -y @anthropic/mcp-fs)"
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
          </div>
          <div className="flex-1">
            <input type="text" value={newMcpArgs} onChange={(e) => setNewMcpArgs(e.target.value)} placeholder="Args (comma-sep)"
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none" />
          </div>
          <Button variant="outline" size="sm" disabled={updateMutation.isPending || !newMcpName.trim() || !newMcpCommand.trim()}
            onClick={() => {
              const newServer: McpServerConfig = {
                name: newMcpName.trim(), command: newMcpCommand.trim(),
                args: newMcpArgs.trim() ? newMcpArgs.split(",").map((a) => a.trim()).filter(Boolean) : [],
                enabled: true,
              };
              updateMutation.mutate(
                { integrations: { ...integrations, mcpServers: [...integrations.mcpServers, newServer] } },
                { onSuccess: () => { setNewMcpName(""); setNewMcpCommand(""); setNewMcpArgs(""); } },
              );
            }}>
            <Plus className="h-3 w-3 mr-1" />Add
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { selectedCompanyId, companies } = useCompany();
  const { openOnboarding } = useDialog();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [animatedActivityIds, setAnimatedActivityIds] = useState<Set<string>>(new Set());
  const seenActivityIdsRef = useRef<Set<string>>(new Set());
  const hydratedActivityRef = useRef(false);
  const activityAnimationTimersRef = useRef<number[]>([]);

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
  }, [setBreadcrumbs]);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.dashboard(selectedCompanyId!),
    queryFn: () => dashboardApi.summary(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: activity } = useQuery({
    queryKey: queryKeys.activity(selectedCompanyId!),
    queryFn: () => activityApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: issues } = useQuery({
    queryKey: queryKeys.issues.list(selectedCompanyId!),
    queryFn: () => issuesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: runs } = useQuery({
    queryKey: queryKeys.heartbeats(selectedCompanyId!),
    queryFn: () => heartbeatsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const recentIssues = issues ? getRecentIssues(issues) : [];
  const recentActivity = useMemo(() => (activity ?? []).slice(0, 10), [activity]);

  useEffect(() => {
    for (const timer of activityAnimationTimersRef.current) {
      window.clearTimeout(timer);
    }
    activityAnimationTimersRef.current = [];
    seenActivityIdsRef.current = new Set();
    hydratedActivityRef.current = false;
    setAnimatedActivityIds(new Set());
  }, [selectedCompanyId]);

  useEffect(() => {
    if (recentActivity.length === 0) return;

    const seen = seenActivityIdsRef.current;
    const currentIds = recentActivity.map((event) => event.id);

    if (!hydratedActivityRef.current) {
      for (const id of currentIds) seen.add(id);
      hydratedActivityRef.current = true;
      return;
    }

    const newIds = currentIds.filter((id) => !seen.has(id));
    if (newIds.length === 0) {
      for (const id of currentIds) seen.add(id);
      return;
    }

    setAnimatedActivityIds((prev) => {
      const next = new Set(prev);
      for (const id of newIds) next.add(id);
      return next;
    });

    for (const id of newIds) seen.add(id);

    const timer = window.setTimeout(() => {
      setAnimatedActivityIds((prev) => {
        const next = new Set(prev);
        for (const id of newIds) next.delete(id);
        return next;
      });
      activityAnimationTimersRef.current = activityAnimationTimersRef.current.filter((t) => t !== timer);
    }, 980);
    activityAnimationTimersRef.current.push(timer);
  }, [recentActivity]);

  useEffect(() => {
    return () => {
      for (const timer of activityAnimationTimersRef.current) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    for (const a of agents ?? []) map.set(a.id, a);
    return map;
  }, [agents]);

  const entityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of issues ?? []) map.set(`issue:${i.id}`, i.identifier ?? i.id.slice(0, 8));
    for (const a of agents ?? []) map.set(`agent:${a.id}`, a.name);
    for (const p of projects ?? []) map.set(`project:${p.id}`, p.name);
    return map;
  }, [issues, agents, projects]);

  const entityTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of issues ?? []) map.set(`issue:${i.id}`, i.title);
    return map;
  }, [issues]);

  const agentName = (id: string | null) => {
    if (!id || !agents) return null;
    return agents.find((a) => a.id === id)?.name ?? null;
  };

  if (!selectedCompanyId) {
    if (companies.length === 0) {
      return (
        <EmptyState
          icon={LayoutDashboard}
          message="Welcome to Yantra. Set up your first company and agent to get started."
          action="Get Started"
          onAction={openOnboarding}
        />
      );
    }
    return (
      <EmptyState icon={LayoutDashboard} message="Create or select a company to view the dashboard." />
    );
  }

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const hasNoAgents = agents !== undefined && agents.length === 0;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {hasNoAgents && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-950/60">
          <div className="flex items-center gap-2.5">
            <Bot className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              You have no agents.
            </p>
          </div>
          <button
            onClick={() => openOnboarding({ initialStep: 2, companyId: selectedCompanyId! })}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 underline underline-offset-2 shrink-0"
          >
            Create one here
          </button>
        </div>
      )}

      <AnthropicApiKeyCard companyId={selectedCompanyId!} />

      <ActiveAgentsPanel companyId={selectedCompanyId!} />

      {data && (
        <>
          {data.budgets.activeIncidents > 0 ? (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-[linear-gradient(180deg,rgba(255,80,80,0.12),rgba(255,255,255,0.02))] px-4 py-3">
              <div className="flex items-start gap-2.5">
                <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <div>
                  <p className="text-sm font-medium text-red-50">
                    {data.budgets.activeIncidents} active budget incident{data.budgets.activeIncidents === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-red-100/70">
                    {data.budgets.pausedAgents} agents paused · {data.budgets.pausedProjects} projects paused · {data.budgets.pendingApprovals} pending budget approvals
                  </p>
                </div>
              </div>
              <Link to="/costs" className="text-sm underline underline-offset-2 text-red-100">
                Open budgets
              </Link>
            </div>
          ) : null}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              icon={Bot}
              value={data.agents.active + data.agents.running + data.agents.paused + data.agents.error}
              label="Agents Enabled"
              to="/agents"
              accentIndex={0}
              description={
                <span>
                  {data.agents.running} running{", "}
                  {data.agents.paused} paused{", "}
                  {data.agents.error} errors
                </span>
              }
            />
            <MetricCard
              icon={CircleDot}
              value={data.tasks.inProgress}
              label="Tasks In Progress"
              to="/issues"
              accentIndex={1}
              description={
                <span>
                  {data.tasks.open} open{", "}
                  {data.tasks.blocked} blocked
                </span>
              }
            />
            <MetricCard
              icon={Cpu}
              value={formatTokens(data.costs.todayTotalTokens ?? 0)}
              label="Tokens Today"
              to="/costs"
              accentIndex={2}
              description={
                <span>
                  {formatTokens(data.costs.todayInputTokens ?? 0)} in / {formatTokens(data.costs.todayOutputTokens ?? 0)} out
                </span>
              }
            />
            <MetricCard
              icon={ShieldCheck}
              value={data.pendingApprovals + data.budgets.pendingApprovals}
              label="Pending Approvals"
              to="/approvals"
              accentIndex={3}
              description={
                <span>
                  {data.budgets.pendingApprovals > 0
                    ? `${data.budgets.pendingApprovals} budget overrides awaiting board review`
                    : "Awaiting board review"}
                </span>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Run Activity" subtitle="Last 14 days">
              <RunActivityChart runs={runs ?? []} />
            </ChartCard>
            <ChartCard title="Issues by Priority" subtitle="Last 14 days">
              <PriorityChart issues={issues ?? []} />
            </ChartCard>
            <ChartCard title="Issues by Status" subtitle="Last 14 days">
              <IssueStatusChart issues={issues ?? []} />
            </ChartCard>
            <ChartCard title="Success Rate" subtitle="Last 14 days">
              <SuccessRateChart runs={runs ?? []} />
            </ChartCard>
          </div>

          <PluginSlotOutlet
            slotTypes={["dashboardWidget"]}
            context={{ companyId: selectedCompanyId }}
            className="grid gap-4 md:grid-cols-2"
            itemClassName="rounded-lg border bg-card p-4 shadow-sm"
          />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="min-w-0">
                <h3 className="text-sm font-bold font-headline text-foreground mb-4">
                  Recent Activity
                </h3>
                <div className="bg-card border border-border/10 rounded-xl shadow-sm divide-y divide-border/10 overflow-hidden">
                  {recentActivity.map((event) => (
                    <ActivityRow
                      key={event.id}
                      event={event}
                      agentMap={agentMap}
                      entityNameMap={entityNameMap}
                      entityTitleMap={entityTitleMap}
                      className={animatedActivityIds.has(event.id) ? "activity-row-enter" : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            <div className="min-w-0">
              <h3 className="text-sm font-bold font-headline text-foreground mb-4">
                Recent Tasks
              </h3>
              {recentIssues.length === 0 ? (
                <div className="bg-card border border-border/10 rounded-xl shadow-sm p-4">
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                </div>
              ) : (
                <div className="bg-card border border-border/10 rounded-xl shadow-sm divide-y divide-border/10 overflow-hidden">
                  {recentIssues.slice(0, 10).map((issue) => (
                    <Link
                      key={issue.id}
                      to={`/issues/${issue.identifier ?? issue.id}`}
                      className="px-4 py-3 text-sm cursor-pointer hover:bg-accent/50 transition-colors no-underline text-inherit block"
                    >
                      <div className="flex items-start gap-2 sm:items-center sm:gap-3">
                        <span className="shrink-0 sm:hidden">
                          <StatusIcon status={issue.status} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1 sm:contents">
                          <span className="line-clamp-2 text-sm text-foreground sm:order-2 sm:flex-1 sm:min-w-0 sm:line-clamp-none sm:truncate">
                            {issue.title}
                          </span>
                          <span className="flex items-center gap-2 sm:order-1 sm:shrink-0">
                            <span className="hidden sm:inline-flex"><StatusIcon status={issue.status} /></span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {issue.identifier ?? issue.id.slice(0, 8)}
                            </span>
                            {issue.assigneeAgentId && (() => {
                              const name = agentName(issue.assigneeAgentId);
                              return name
                                ? <span className="hidden sm:inline-flex"><Identity name={name} size="sm" /></span>
                                : null;
                            })()}
                            <span className="text-xs text-muted-foreground sm:hidden">&middot;</span>
                            <span className="text-xs text-muted-foreground shrink-0 sm:order-last">
                              {timeAgo(issue.updatedAt)}
                            </span>
                          </span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
