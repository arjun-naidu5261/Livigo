import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PGAvailability } from "@/types";

export type { PGAvailability };

export function usePGList(filters?: {
  city?: string;
  gender?: string;
  search?: string;
  amenities?: string[];
}) {
  return useQuery({
    queryKey: ["pgs", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.city) params.city = filters.city;
      if (filters?.gender) params.gender = filters.gender;
      if (filters?.search) params.search = filters.search;
      if (filters?.amenities?.length) params.amenities = filters.amenities.join(",");

      return api.pgs.list(params) as Promise<PGAvailability[]>;
    },
  });
}

export function usePGDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["pg", id],
    enabled: !!id,
    queryFn: () => api.pgs.get(id!),
  });
}

export function usePGImages(pgId: string | undefined) {
  return useQuery({
    queryKey: ["pg-images", pgId],
    enabled: !!pgId,
    queryFn: () => api.pgs.images(pgId!),
  });
}

/** Poll bed availability periodically (replaces Supabase realtime) */
export function useRealtimeBeds(pgId: string | undefined) {
  usePGDetail(pgId);
}
