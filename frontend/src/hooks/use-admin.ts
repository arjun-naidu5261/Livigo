import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAllPGs() {
  return useQuery({
    queryKey: ["admin-all-pgs"],
    queryFn: () => api.admin.pgs(),
  });
}

export function useApprovePG() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pgId, verified, isActive }: { pgId: string; verified: boolean; isActive: boolean }) =>
      api.admin.approvePG(pgId, { verified, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-pgs"] });
      queryClient.invalidateQueries({ queryKey: ["pgs"] });
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.admin.stats(),
  });
}
