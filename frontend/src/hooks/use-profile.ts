import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useUpdateProfile() {
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: (body: { fullName?: string; phone?: string }) => api.auth.updateProfile(body),
    onSuccess: () => refreshUser(),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.auth.changePassword(body),
  });
}
