import {
  Inbox,
  Bot,
  CircleDot,
  Target,
  LayoutDashboard,
  DollarSign,
  History,
  Search,
  SquarePen,
  Network,
  Boxes,
  Plug,
  Repeat,
  Settings,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SidebarSection } from "./SidebarSection";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarProjects } from "./SidebarProjects";
import { SidebarAgents } from "./SidebarAgents";
import { useDialog } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { heartbeatsApi } from "../api/heartbeats";
import { queryKeys } from "../lib/queryKeys";
import { useInboxBadge } from "../hooks/useInboxBadge";
import { Button } from "@/components/ui/button";
import { PluginSlotOutlet } from "@/plugins/slots";

export function Sidebar() {
  const { openNewIssue } = useDialog();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { isAdmin } = useCurrentUser();
  const inboxBadge = useInboxBadge(selectedCompanyId);
  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 10_000,
  });
  const liveRunCount = liveRuns?.length ?? 0;

  function openSearch() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  }

  const pluginContext = {
    companyId: selectedCompanyId,
    companyPrefix: selectedCompany?.issuePrefix ?? null,
  };

  return (
    <aside className="w-60 h-full min-h-0 border-r border-border/10 bg-sidebar flex flex-col">
      {/* Top bar: Company name + Search */}
      <div className="flex items-center gap-2 px-4 h-14 shrink-0 border-b border-border/10">
        {selectedCompany?.brandColor && (
          <div
            className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: selectedCompany.brandColor }}
          >
            <span className="text-[10px] font-bold text-white">
              {selectedCompany.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-extrabold font-headline text-foreground truncate block tracking-tight">
            {selectedCompany?.name ?? "Select company"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Active
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground shrink-0"
          onClick={openSearch}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* New Issue Button */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => openNewIssue()}
          className="w-full py-2.5 px-4 bg-gradient-to-br from-primary to-[#0061ff] text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          <SquarePen className="h-3.5 w-3.5" />
          New Issue
        </button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-auto-hide flex flex-col gap-1 px-2 py-3">
        <div className="flex flex-col gap-0.5">
          <SidebarNavItem to="/dashboard" label="Dashboard" icon={LayoutDashboard} liveCount={liveRunCount} />
          <SidebarNavItem
            to="/inbox"
            label="Inbox"
            icon={Inbox}
            badge={inboxBadge.inbox}
            badgeTone={inboxBadge.failedRuns > 0 ? "danger" : "default"}
            alert={inboxBadge.failedRuns > 0}
          />
          <SidebarNavItem to="/issues" label="Issues" icon={CircleDot} />
          <SidebarNavItem to="/routines" label="Routines" icon={Repeat} textBadge="Beta" textBadgeTone="amber" />
          <PluginSlotOutlet
            slotTypes={["sidebar"]}
            context={pluginContext}
            className="flex flex-col gap-0.5"
            itemClassName="text-[13px] font-medium"
            missingBehavior="placeholder"
          />
        </div>

        <SidebarSection label="Organization">
          <SidebarNavItem to="/goals" label="Goals" icon={Target} />
          <SidebarNavItem to="/agents" label="Agents" icon={Bot} />
          <SidebarNavItem to="/org" label="Org" icon={Network} />
          <SidebarNavItem to="/memories" label="Memory" icon={Brain} />
        </SidebarSection>

        <SidebarProjects />

        <SidebarAgents />

        <SidebarSection label="System">
          <SidebarNavItem to="/integrations" label="Integrations" icon={Plug} />
          <SidebarNavItem to="/skills" label="Skills" icon={Boxes} />
          <SidebarNavItem to="/costs" label="Costs" icon={DollarSign} />
          <SidebarNavItem to="/activity" label="Activity" icon={History} />
          <SidebarNavItem to="/company/settings" label="Settings" icon={Settings} />
          {isAdmin && <SidebarNavItem to="/admin" label="Admin Panel" icon={ShieldCheck} />}
        </SidebarSection>

        <PluginSlotOutlet
          slotTypes={["sidebarPanel"]}
          context={pluginContext}
          className="flex flex-col gap-3"
          itemClassName="rounded-lg border border-border p-3"
          missingBehavior="placeholder"
        />
      </nav>
    </aside>
  );
}
