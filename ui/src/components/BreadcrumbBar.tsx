import { Link } from "@/lib/router";
import { Menu, Zap, Cable } from "lucide-react";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useSidebar } from "../context/SidebarContext";
import { useCompany } from "../context/CompanyContext";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { PluginSlotOutlet, usePluginSlots } from "@/plugins/slots";
import { PluginLauncherOutlet, usePluginLaunchers } from "@/plugins/launchers";

function ApiModeToggle() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  });

  const toggleMutation = useMutation({
    mutationFn: (useApi: boolean) => instanceSettingsApi.updateGeneral({ useAnthropicApi: useApi }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings });
    },
  });

  const useApi = settings?.useAnthropicApi === true;
  const hasKey = Boolean(settings?.anthropicApiKey && settings.anthropicApiKey.length > 0);

  if (!hasKey) return null;

  return (
    <button
      type="button"
      disabled={toggleMutation.isPending}
      onClick={() => toggleMutation.mutate(!useApi)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        useApi
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
          : "border-border/70 bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
      title={useApi ? "Using Anthropic API — click to switch to Claude Code subscription" : "Using Claude Code subscription — click to switch to Anthropic API"}
    >
      {useApi ? (
        <>
          <Zap className="h-3 w-3" />
          <span>API</span>
        </>
      ) : (
        <>
          <Cable className="h-3 w-3" />
          <span>Subscription</span>
        </>
      )}
    </button>
  );
}

type GlobalToolbarContext = { companyId: string | null; companyPrefix: string | null };

function GlobalToolbarPlugins({ context }: { context: GlobalToolbarContext }) {
  const { slots } = usePluginSlots({ slotTypes: ["globalToolbarButton"], companyId: context.companyId });
  const { launchers } = usePluginLaunchers({ placementZones: ["globalToolbarButton"], companyId: context.companyId, enabled: !!context.companyId });
  if (slots.length === 0 && launchers.length === 0) return null;
  return (
    <div className="flex items-center gap-1 ml-auto shrink-0 pl-2">
      <PluginSlotOutlet slotTypes={["globalToolbarButton"]} context={context} className="flex items-center gap-1" />
      <PluginLauncherOutlet placementZones={["globalToolbarButton"]} context={context} className="flex items-center gap-1" />
    </div>
  );
}

export function BreadcrumbBar() {
  const { breadcrumbs } = useBreadcrumbs();
  const { toggleSidebar, isMobile } = useSidebar();
  const { selectedCompanyId, selectedCompany } = useCompany();

  const globalToolbarSlotContext = useMemo(
    () => ({
      companyId: selectedCompanyId ?? null,
      companyPrefix: selectedCompany?.issuePrefix ?? null,
    }),
    [selectedCompanyId, selectedCompany?.issuePrefix],
  );

  const globalToolbarSlots = <GlobalToolbarPlugins context={globalToolbarSlotContext} />;

  const apiModeToggle = <ApiModeToggle />;

  if (breadcrumbs.length === 0) {
    return (
      <div className="border-b border-border/10 px-4 md:px-8 h-14 shrink-0 flex items-center justify-end gap-2 bg-background/80 backdrop-blur-xl">
        {apiModeToggle}
        {globalToolbarSlots}
      </div>
    );
  }

  const menuButton = isMobile && (
    <Button
      variant="ghost"
      size="icon-sm"
      className="mr-2 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={toggleSidebar}
      aria-label="Open sidebar"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );

  // Single breadcrumb = page title (uppercase)
  if (breadcrumbs.length === 1) {
    return (
      <div className="border-b border-border/10 px-4 md:px-8 h-14 shrink-0 flex items-center bg-background/80 backdrop-blur-xl">
        {menuButton}
        <div className="min-w-0 overflow-hidden flex-1">
          <h1 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground truncate">
            {breadcrumbs[0].label}
          </h1>
        </div>
        {apiModeToggle}
        {globalToolbarSlots}
      </div>
    );
  }

  // Multiple breadcrumbs = breadcrumb trail
  return (
    <div className="border-b border-border/10 px-4 md:px-8 h-14 shrink-0 flex items-center bg-background/80 backdrop-blur-xl">
      {menuButton}
      <div className="min-w-0 overflow-hidden flex-1">
        <Breadcrumb className="min-w-0 overflow-hidden">
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <Fragment key={i}>
                  {i > 0 && <BreadcrumbSeparator className="text-muted-foreground" />}
                  <BreadcrumbItem className={isLast ? "min-w-0" : "shrink-0"}>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage className="truncate text-foreground font-medium text-sm">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild className="text-muted-foreground hover:text-primary text-sm transition-colors">
                        <Link to={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {apiModeToggle}
      {globalToolbarSlots}
    </div>
  );
}
