const API_BASE = import.meta.env.VITE_API_URL || "/api";

const TOKEN_KEY = "livigo_token";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || "Request failed", response.status);
  }

  return data as T;
}

export const api = {
  auth: {
    signUp: (body: { email: string; password: string; full_name: string; role: string }) =>
      request<{ token: string; user: import("@/types").AuthUser }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    signIn: (body: { email: string; password: string }) =>
      request<{ token: string; user: import("@/types").AuthUser }>("/auth/signin", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    me: () => request<{ user: import("@/types").AuthUser }>("/auth/me"),
    updateProfile: (body: { fullName?: string; phone?: string }) =>
      request<{ user: import("@/types").AuthUser }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>("/auth/password", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  },

  pgs: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return request<import("@/types").PGAvailability[]>(`/pgs${query}`);
    },
    get: (id: string) => request(`/pgs/${id}`),
    images: (id: string) => request(`/pgs/${id}/images`),
    getFoodMenu: (id: string) => request(`/pgs/${id}/food-menu`),
  },

  bookings: {
    mine: () => request("/bookings/me"),
    create: (body: {
      bedId: string;
      pgId: string;
      roomId: string;
      moveInDate: string;
      monthlyRent: number;
    }) =>
      request("/bookings", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  amenities: {
    list: () => request("/amenities"),
  },

  owner: {
    pgs: () => request("/owner/pgs"),
    createPG: (formData: FormData) =>
      request("/owner/pgs", { method: "POST", body: formData }),
    updatePG: (id: string, body: Record<string, unknown>) =>
      request(`/owner/pgs/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    addRoom: (body: Record<string, unknown>) =>
      request("/owner/rooms", { method: "POST", body: JSON.stringify(body) }),
    updateRoom: (id: string, body: Record<string, unknown>) =>
      request(`/owner/rooms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    updateBed: (id: string, body: { newStatus: string }) =>
      request(`/owner/beds/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    checkInGuest: (bedId: string, body: {
      guestName: string;
      guestPhone: string;
      advancePaid: number;
      checkInDate?: string;
    }) =>
      request(`/owner/beds/${bedId}/check-in`, { method: "POST", body: JSON.stringify(body) }),
    checkOutGuest: (bedId: string) =>
      request(`/owner/beds/${bedId}/check-out`, { method: "POST" }),
    deleteBedGuest: (bedId: string) =>
      request(`/owner/beds/${bedId}/guest`, { method: "DELETE" }),
    deleteRoom: (id: string) =>
      request(`/owner/rooms/${id}`, { method: "DELETE" }),
    bookings: () => request("/owner/bookings"),
    tickets: () => request("/owner/tickets"),
    createTicket: (body: Record<string, unknown>) =>
      request("/owner/tickets", { method: "POST", body: JSON.stringify(body) }),
    updateTicket: (id: string, body: { status: string }) =>
      request(`/owner/tickets/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    paymentDues: () => request("/owner/payment-dues"),
    createPaymentDue: (body: Record<string, unknown>) =>
      request("/owner/payment-dues", { method: "POST", body: JSON.stringify(body) }),
    updatePaymentDue: (id: string, body: Record<string, unknown>) =>
      request(`/owner/payment-dues/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    announcements: () => request("/owner/announcements"),
    createAnnouncement: (body: Record<string, unknown>) =>
      request("/owner/announcements", { method: "POST", body: JSON.stringify(body) }),
    deleteAnnouncement: (id: string) =>
      request(`/owner/announcements/${id}`, { method: "DELETE" }),
    getFoodMenu: (pgId: string) => request(`/owner/pgs/${pgId}/food-menu`),
    saveFoodMenu: (pgId: string, body: { weekMenu: Record<string, { breakfast: string; lunch: string; dinner: string }> }) =>
      request(`/owner/pgs/${pgId}/food-menu`, { method: "PUT", body: JSON.stringify(body) }),
  },

  admin: {
    pgs: () => request("/admin/pgs"),
    approvePG: (id: string, body: { verified: boolean; isActive: boolean }) =>
      request(`/admin/pgs/${id}/approve`, { method: "PATCH", body: JSON.stringify(body) }),
    stats: () => request("/admin/stats"),
    createUser: (body: { email: string; password: string; role: string }) =>
      request("/admin/users", { method: "POST", body: JSON.stringify(body) }),
  },

  tenant: {
    bookings: () => request("/tenant/bookings"),
    paymentDues: () => request("/tenant/payment-dues"),
    markPaymentPaid: (id: string, body: { paymentMethod?: string; transactionRef?: string }) =>
      request(`/tenant/payment-dues/${id}/pay`, { method: "PATCH", body: JSON.stringify(body) }),
    tickets: () => request("/tenant/tickets"),
    createTicket: (body: Record<string, unknown>) =>
      request("/tenant/tickets", { method: "POST", body: JSON.stringify(body) }),
    announcements: () => request("/tenant/announcements"),
    updateProfile: (body: { fullName?: string; phone?: string }) =>
      request("/tenant/profile", { method: "PATCH", body: JSON.stringify(body) }),
    documents: () => request("/tenant/documents"),
    uploadDocument: (data: FormData) =>
      request("/tenant/documents/upload", { method: "POST", body: data }),
  },
};

export function resolveMediaUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  const base = import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5001";
  return `${base}${url}`;
}
