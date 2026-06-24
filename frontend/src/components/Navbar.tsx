import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Menu, X, LogOut, Shield, Home, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";

const navLinkClass = (active: boolean) =>
  `px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
    active
      ? "text-foreground bg-secondary"
      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
  }`;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { user, roles, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const isTenant = roles.includes("tenant");
  const isOwner = roles.includes("owner");
  const isAdmin = roles.includes("admin");

  const ownerSection = searchParams.get("section") || "dashboard";

  const ownerNavItems = [
    { label: "Dashboard", to: "/dashboard", active: location.pathname === "/dashboard" && ownerSection === "dashboard" },
    { label: "Hostels", to: "/dashboard?section=hostels", active: location.pathname === "/dashboard" && ownerSection === "hostels" },
    { label: "Rooms", to: "/dashboard?section=rooms", active: location.pathname === "/dashboard" && ownerSection === "rooms" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHome && !isOwner ? "bg-background/80 backdrop-blur-xl border-b border-border/50" : "bg-background border-b border-border"
    }`}>
      <div className="container flex items-center justify-between h-16">
        <Link to={isOwner ? "/dashboard" : "/"} className="flex items-center gap-2">
          <img src={logo} alt="Livigo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-heading font-bold text-xl text-foreground">Livigo</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {isOwner ? (
            ownerNavItems.map((item) => (
              <Link key={item.label} to={item.to} className={navLinkClass(item.active)}>
                {item.label}
              </Link>
            ))
          ) : (
            <>
              <Link to="/search" className={navLinkClass(location.pathname === "/search")}>
                Explore PGs
              </Link>
              {isTenant && (
                <Link to="/my-dashboard" className={navLinkClass(location.pathname === "/my-dashboard")}>
                  My Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className={navLinkClass(location.pathname === "/admin")}>
                  Admin Panel
                </Link>
              )}
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {!isOwner && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/search")}>
              Search
            </Button>
          )}
          {user ? (
            <>
              {!isOwner && isTenant && (
                <Button variant="outline" size="sm" onClick={() => navigate("/my-dashboard")}>
                  <Home className="w-4 h-4 mr-2" /> My Dashboard
                </Button>
              )}
              {!isOwner && isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="border-primary/30">
                  <Shield className="w-4 h-4 mr-2" /> Admin
                </Button>
              )}
              {isOwner && (
                <Button variant="outline" size="sm" onClick={() => navigate("/list-property")}>
                  <Building2 className="w-4 h-4 mr-2" /> Add Hostel
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
              <Button size="sm" onClick={() => navigate("/auth")}>Get Started</Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-background border-b border-border overflow-hidden">
            <div className="container py-4 flex flex-col gap-2">
              {isOwner ? (
                ownerNavItems.map((item) => (
                  <Link key={item.label} to={item.to} className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-secondary" onClick={() => setIsOpen(false)}>
                    {item.label}
                  </Link>
                ))
              ) : (
                <>
                  <Link to="/search" className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-secondary" onClick={() => setIsOpen(false)}>Explore PGs</Link>
                  {isTenant && (
                    <Link to="/my-dashboard" className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-secondary" onClick={() => setIsOpen(false)}>My Dashboard</Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-secondary" onClick={() => setIsOpen(false)}>Admin Panel</Link>
                  )}
                </>
              )}
              <div className="border-t border-border my-2" />
              {user ? (
                <>
                  {isOwner && (
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => { navigate("/list-property"); setIsOpen(false); }}>
                      <Building2 className="w-4 h-4 mr-2" /> Add Hostel
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => { handleSignOut(); setIsOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => { navigate("/auth"); setIsOpen(false); }}>Sign In</Button>
                  <Button size="sm" className="justify-start" onClick={() => { navigate("/auth"); setIsOpen(false); }}>Get Started</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
