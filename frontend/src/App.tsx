import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import PGDetailPage from "./pages/PGDetailPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import OwnerDashboard from "./pages/OwnerDashboard.tsx";
import ListProperty from "./pages/ListProperty.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import TenantDashboard from "./pages/TenantDashboard.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/pg/:id" element={<PGDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/list-property" element={<ListProperty />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/my-dashboard" element={<TenantDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
