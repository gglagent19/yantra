import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memoriesApi } from "../api/memories";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { MEMORY_CATEGORIES, type Memory, type MemoryCategory } from "@yantra/shared";

const CATEGORY_COLORS: Record<MemoryCategory, string> = {
  general: "bg-gray-100 text-gray-700",
  workflow: "bg-blue-100 text-blue-700",
  architecture: "bg-purple-100 text-purple-700",
  process: "bg-green-100 text-green-700",
  decision: "bg-amber-100 text-amber-700",
  preference: "bg-pink-100 text-pink-700",
  context: "bg-cyan-100 text-cyan-700",
};

export function Memories() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general" as string, tags: "" });

  useEffect(() => {
    setBreadcrumbs([{ label: "Memories" }]);
  }, [setBreadcrumbs]);

  const { data: memories, isLoading, error } = useQuery({
    queryKey: queryKeys.memories.list(selectedCompanyId!),
    queryFn: () => memoriesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      memoriesApi.create(selectedCompanyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.list(selectedCompanyId!) });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      memoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.list(selectedCompanyId!) });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memories.list(selectedCompanyId!) });
    },
  });

  function openCreate() {
    setEditingMemory(null);
    setForm({ title: "", content: "", category: "general", tags: "" });
    setDialogOpen(true);
  }

  function openEdit(memory: Memory) {
    setEditingMemory(memory);
    setForm({
      title: memory.title,
      content: memory.content,
      category: memory.category,
      tags: memory.tags ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingMemory(null);
    setForm({ title: "", content: "", category: "general", tags: "" });
  }

  function handleSubmit() {
    const data = {
      title: form.title,
      content: form.content,
      category: form.category,
      tags: form.tags || null,
    };
    if (editingMemory) {
      updateMutation.mutate({ id: editingMemory.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  if (!selectedCompanyId) {
    return <EmptyState icon={Brain} message="Select a company to view memories." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="list" />;
  }

  const filtered = memories?.filter((m) => {
    if (filterCategory !== "all" && m.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        (m.tags?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {memories && memories.length === 0 && (
        <EmptyState
          icon={Brain}
          message="No memories yet. Add organizational knowledge that agents can reuse."
          action="Add Memory"
          onAction={openCreate}
        />
      )}

      {memories && memories.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px] h-9 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {MEMORY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Memory
            </Button>
          </div>

          <div className="space-y-2">
            {filtered?.map((memory) => (
              <div
                key={memory.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium truncate">{memory.title}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs shrink-0 ${CATEGORY_COLORS[memory.category as MemoryCategory] ?? ""}`}
                      >
                        {memory.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {memory.content}
                    </p>
                    {memory.tags && (
                      <div className="flex gap-1 mt-2">
                        {memory.tags.split(",").map((tag: string) => (
                          <Badge key={tag.trim()} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => openEdit(memory)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(memory.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filtered?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No memories match your filters.
              </p>
            )}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMemory ? "Edit Memory" : "New Memory"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                placeholder="e.g. Deployment workflow for production"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Content</label>
              <Textarea
                placeholder="Describe the knowledge, workflow, or context..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMORY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tags</label>
              <Input
                placeholder="Comma-separated tags, e.g. deploy, ci, production"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.content || createMutation.isPending || updateMutation.isPending}
            >
              {editingMemory ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
