import type { Memory } from "@yantra/shared";
import { api } from "./client";

export const memoriesApi = {
  list: (companyId: string, params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<Memory[]>(`/companies/${companyId}/memories${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => api.get<Memory>(`/memories/${id}`),
  create: (companyId: string, data: Record<string, unknown>) =>
    api.post<Memory>(`/companies/${companyId}/memories`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch<Memory>(`/memories/${id}`, data),
  remove: (id: string) => api.delete<Memory>(`/memories/${id}`),
};
