import type { AppRole } from "@/types";

export function getPostAuthPath(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("owner")) return "/dashboard";
  if (roles.includes("tenant")) return "/my-dashboard";
  return "/";
}
