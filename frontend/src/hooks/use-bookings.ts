import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useMyBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: () => api.bookings.mine(),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { bedId: string; pgId: string; roomId: string; moveInDate: string; monthlyRent: number }) => {
      if (!user) throw new Error("Must be logged in");
      return api.bookings.create(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["pgs"] });
    },
  });
}
