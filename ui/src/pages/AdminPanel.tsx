import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminUser, type AdminStats } from "../api/admin";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useToast } from "../context/ToastContext";
import { Button } from "@/components/ui/button";
import {
  Users, ShieldCheck, ShieldOff, Building2, Bot, CircleDot,
  Activity, TrendingUp, Loader2, UserPlus, Zap,
} from "lucide-react";
import { timeAgo } from "../lib/timeAgo";

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function AdminPanel() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  useEffect(() => {
    setBreadcrumbs([{ label: "Admin Panel" }]);
  }, [setBreadcrumbs]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30_000,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.listUsers(),
  });

  const promoteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.promoteAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      pushToast({ title: "User promoted to admin", tone: "success" });
    },
    onError: (err: Error) => pushToast({ title: "Failed", body: err.message, tone: "error" }),
  });

  const demoteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.demoteAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      pushToast({ title: "Admin role removed", tone: "success" });
    },
    onError: (err: Error) => pushToast({ title: "Failed", body: err.message, tone: "error" }),
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary to-[#0061ff] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">SaaS Admin</p>
          <h2 className="text-3xl font-extrabold font-headline leading-tight">Platform Overview</h2>
          <p className="text-blue-100 mt-2 max-w-lg">
            Monitor user growth, active sessions, and platform usage across all organizations.
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.users.total} accent="blue" description={`+${stats.users.thisWeek} this week`} />
            <StatCard icon={UserPlus} label="New Today" value={stats.users.today} accent="green" description={`${stats.users.thisMonth} this month`} />
            <StatCard icon={Activity} label="Active Sessions" value={stats.activeSessions} accent="purple" description="Currently online" />
            <StatCard icon={ShieldCheck} label="Admins" value={stats.users.admins} accent="orange" description={`of ${stats.users.total} users`} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Building2} label="Organizations" value={stats.companies} accent="blue" />
            <StatCard icon={Bot} label="Agents" value={stats.agents} accent="green" />
            <StatCard icon={CircleDot} label="Tasks" value={stats.issues} accent="orange" />
            <StatCard icon={Zap} label="Total Runs" value={stats.runs} accent="purple" />
          </div>

          {/* Signups Chart */}
          {stats.recentSignups.length > 0 && (
            <div className="bg-card rounded-xl border border-border/10 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold font-headline text-foreground">User Signups</h3>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{stats.users.thisMonth} new</span>
                </div>
              </div>
              <SignupChart data={stats.recentSignups} />
            </div>
          )}
        </>
      ) : null}

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border/10 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-headline text-foreground">All Users</h3>
            <p className="text-xs text-muted-foreground">{users?.length ?? 0} registered accounts</p>
          </div>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : !users || users.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">No users found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onPromote={() => promoteMutation.mutate(user.id)}
                onDemote={() => demoteMutation.mutate(user.id)}
                isLoading={promoteMutation.isPending || demoteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

const ACCENT_STYLES = {
  blue:   { bg: "bg-primary/10", text: "text-primary" },
  green:  { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600" },
  purple: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600" },
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "blue",
  description,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent?: keyof typeof ACCENT_STYLES;
  description?: string;
}) {
  const style = ACCENT_STYLES[accent];
  return (
    <div className="bg-card rounded-xl border border-border/10 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg} ${style.text}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-extrabold font-headline text-foreground tabular-nums">{value.toLocaleString()}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function SignupChart({ data }: { data: { day: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <div className="flex items-end gap-[3px] h-28">
        {data.map((entry) => {
          const heightPct = (entry.count / maxCount) * 100;
          return (
            <div
              key={entry.day}
              className="flex-1 h-full flex flex-col justify-end group"
              title={`${entry.day}: ${entry.count} signups`}
            >
              <div
                className="bg-primary/20 group-hover:bg-primary/40 rounded-t-sm transition-colors relative"
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-foreground text-card px-1.5 py-0.5 rounded transition-opacity whitespace-nowrap">
                  {entry.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px] mt-1.5">
        {data.map((entry, i) => (
          <div key={entry.day} className="flex-1 text-center">
            {(i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) ? (
              <span className="text-[9px] text-muted-foreground tabular-nums">{formatDay(entry.day)}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function UserRow({
  user,
  onPromote,
  onDemote,
  isLoading,
}: {
  user: AdminUser;
  onPromote: () => void;
  onDemote: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
        {user.name?.charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          {user.isAdmin && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <ShieldCheck className="h-2.5 w-2.5" /> Admin
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
        Joined {timeAgo(user.createdAt)}
      </span>
      <div className="shrink-0">
        {user.isAdmin ? (
          <Button variant="outline" size="xs" onClick={onDemote} disabled={isLoading} className="text-destructive hover:bg-destructive/10">
            <ShieldOff className="h-3 w-3 mr-1" /> Remove
          </Button>
        ) : (
          <Button variant="outline" size="xs" onClick={onPromote} disabled={isLoading}>
            <ShieldCheck className="h-3 w-3 mr-1" /> Make Admin
          </Button>
        )}
      </div>
    </div>
  );
}
