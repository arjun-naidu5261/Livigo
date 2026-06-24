import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useOwnerPGs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-pgs", user?.id],
    enabled: !!user,
    queryFn: () => api.owner.pgs(),
  });
}

export function useCreatePG() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      address: string;
      city: string;
      area: string;
      gender: "boys" | "girls" | "coliving";
      amenityIds: string[];
      rules: string[];
      rooms: { name: string; sharingType: number; pricePerMonth: number; totalBeds: number; hasAc: boolean; images: File[] }[];
      buildingImages: File[];
    }) => {
      if (!user) throw new Error("Must be logged in");

      const formData = new FormData();
      formData.append("name", params.name);
      formData.append("description", params.description);
      formData.append("address", params.address);
      formData.append("city", params.city);
      formData.append("area", params.area);
      formData.append("gender", params.gender);
      formData.append("amenityIds", JSON.stringify(params.amenityIds));
      formData.append("rules", JSON.stringify(params.rules));
      formData.append(
        "rooms",
        JSON.stringify(
          params.rooms.map((room, index) => ({
            tempId: String(index),
            name: room.name,
            sharingType: room.sharingType,
            pricePerMonth: room.pricePerMonth,
            totalBeds: room.totalBeds,
            hasAc: room.hasAc,
          }))
        )
      );

      params.buildingImages.forEach((file) => {
        formData.append("buildingImages", file);
      });

      params.rooms.forEach((room, index) => {
        room.images.forEach((file) => {
          formData.append(`roomImages_${index}`, file);
        });
      });

      return api.owner.createPG(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pgs"] });
      queryClient.invalidateQueries({ queryKey: ["pgs"] });
    },
  });
}

export function useUpdatePG() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pgId, updates }: {
      pgId: string;
      updates: { name?: string; description?: string; address?: string; city?: string; area?: string; gender?: "boys" | "girls" | "coliving" };
    }) => api.owner.updatePG(pgId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pgs"] });
      queryClient.invalidateQueries({ queryKey: ["pgs"] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, updates }: {
      roomId: string;
      updates: { name?: string; price_per_month?: number; has_ac?: boolean; has_attached_bathroom?: boolean };
    }) => api.owner.updateRoom(roomId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pgs"] });
      queryClient.invalidateQueries({ queryKey: ["pgs"] });
    },
  });
}

export function useAddRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      pgId: string;
      name: string;
      sharingType: number;
      pricePerMonth: number;
      totalBeds: number;
      hasAc: boolean;
    }) => api.owner.addRoom(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pgs"] });
      queryClient.invalidateQueries({ queryKey: ["pgs"] });
    },
  });
}

export function useToggleBedStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bedId, newStatus }: { bedId: string; newStatus: "available" | "maintenance" }) =>
      api.owner.updateBed(bedId, { newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pgs"] });
      queryClient.invalidateQueries({ queryKey: ["pgs"] });
    },
  });
}

export function useAmenities() {
  return useQuery({
    queryKey: ["amenities"],
    queryFn: () => api.amenities.list(),
  });
}

export function useOwnerBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-bookings", user?.id],
    enabled: !!user,
    queryFn: () => api.owner.bookings(),
  });
}

export function useOwnerTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-tickets", user?.id],
    enabled: !!user,
    queryFn: () => api.owner.tickets(),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { pgId: string; subject: string; description: string; priority: "low" | "medium" | "high" | "urgent" }) => {
      if (!user) throw new Error("Must be logged in");
      return api.owner.createTicket(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tickets"] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: "open" | "in_progress" | "resolved" | "closed" }) =>
      api.owner.updateTicket(ticketId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tickets"] });
    },
  });
}

export function useOwnerPaymentDues() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-payment-dues", user?.id],
    enabled: !!user,
    queryFn: () => api.owner.paymentDues(),
  });
}

export function useCreatePaymentDue() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      bookingId: string;
      pgId: string;
      tenantId: string;
      amount: number;
      dueDate: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      return api.owner.createPaymentDue(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-payment-dues"] });
    },
  });
}

export function useUpdatePaymentDue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dueId, updates }: {
      dueId: string;
      updates: { status?: "pending" | "paid" | "overdue" | "partial"; paid_date?: string; payment_method?: string; transaction_ref?: string };
    }) => api.owner.updatePaymentDue(dueId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-payment-dues"] });
    },
  });
}

export function useOwnerAnnouncements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-announcements", user?.id],
    enabled: !!user,
    queryFn: () => api.owner.announcements(),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { pgId: string; title: string; message: string }) =>
      api.owner.createAnnouncement(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-announcements"] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.owner.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-announcements"] });
    },
  });
}
