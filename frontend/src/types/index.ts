export type AppRole = "tenant" | "owner" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  roles: AppRole[];
}

export interface PGAvailability {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  gender: "boys" | "girls" | "coliving";
  verified: boolean;
  owner_id: string;
  created_at: string;
  min_price: number;
  available_beds: number;
  total_beds: number;
  avg_rating: number;
  review_count: number;
}
