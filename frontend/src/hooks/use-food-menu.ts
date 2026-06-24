import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type DayMenu = { breakfast: string; lunch: string; dinner: string };
export type WeekMenu = Record<string, DayMenu>;

export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function emptyWeekMenu(): WeekMenu {
  return Object.fromEntries(
    WEEK_DAYS.map((day) => [day, { breakfast: "", lunch: "", dinner: "" }])
  );
}

export function useFoodMenu(pgId: string) {
  return useQuery({
    queryKey: ["food-menu", pgId],
    enabled: !!pgId,
    queryFn: () => api.owner.getFoodMenu(pgId) as Promise<WeekMenu & { pg_id: string }>,
  });
}

export function useSaveFoodMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pgId, weekMenu }: { pgId: string; weekMenu: WeekMenu }) =>
      api.owner.saveFoodMenu(pgId, { weekMenu }),
    onSuccess: (_, { pgId }) => {
      queryClient.invalidateQueries({ queryKey: ["food-menu", pgId] });
    },
  });
}
