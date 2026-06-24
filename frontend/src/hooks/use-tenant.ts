import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useTenantBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tenant-bookings", user?.id],
    enabled: !!user,
    queryFn: () => api.tenant.bookings(),
  });
}

export function useTenantPaymentDues() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tenant-payment-dues", user?.id],
    enabled: !!user,
    queryFn: () => api.tenant.paymentDues(),
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dueId, paymentMethod, transactionRef }: { dueId: string; paymentMethod?: string; transactionRef?: string }) =>
      api.tenant.markPaymentPaid(dueId, { paymentMethod, transactionRef }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-dues"] });
    },
  });
}

export function useTenantTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tenant-tickets", user?.id],
    enabled: !!user,
    queryFn: () => api.tenant.tickets(),
  });
}

export function useCreateTenantTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: { pgId: string; subject: string; description: string; priority: "low" | "medium" | "high" | "urgent" }) => {
      if (!user) throw new Error("Must be logged in");
      return api.tenant.createTicket(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-tickets"] });
    },
  });
}

export function useTenantAnnouncements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tenant-announcements", user?.id],
    enabled: !!user,
    queryFn: () => api.tenant.announcements(),
  });
}

/** Announcements refresh via react-query invalidation (replaces Supabase realtime) */
export function useRealtimeAnnouncements() {
  useTenantAnnouncements();
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: { fullName?: string; phone?: string }) => {
      if (!user) throw new Error("Must be logged in");
      return api.tenant.updateProfile(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
    },
  });
}

export function useTenantDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tenant-documents", user?.id],
    enabled: !!user,
    queryFn: () => api.tenant.documents(),
  });
}

export function useUploadTenantDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error("Must be logged in");
      return api.tenant.uploadDocument(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-documents"] });
    },
  });
}
