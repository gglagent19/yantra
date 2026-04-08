import { api } from "./client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface AdminStats {
  users: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    admins: number;
  };
  activeSessions: number;
  companies: number;
  agents: number;
  issues: number;
  runs: number;
  recentSignups: { day: string; count: number }[];
}

export const adminApi = {
  getStats: () => api.get<AdminStats>("/admin/stats"),
  listUsers: () => api.get<AdminUser[]>("/admin/users"),
  promoteAdmin: (userId: string) => api.post<unknown>(`/admin/users/${userId}/promote-instance-admin`, {}),
  demoteAdmin: (userId: string) => api.post<unknown>(`/admin/users/${userId}/demote-instance-admin`, {}),
};
