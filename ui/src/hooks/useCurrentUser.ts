import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

interface CurrentUser {
  userId: string;
  user: { id: string; name: string; email: string } | null;
  isInstanceAdmin: boolean;
  companyIds: string[];
}

export function useCurrentUser() {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<CurrentUser>("/me"),
    retry: false,
    staleTime: 60_000,
  });

  return {
    user: data?.user ?? null,
    isAdmin: data?.isInstanceAdmin ?? false,
    companyIds: data?.companyIds ?? [],
    loading: isLoading,
  };
}
