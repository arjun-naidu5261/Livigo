import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Building2, Users, BarChart3, CheckCircle, XCircle, Clock, Eye, Bed, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAllPGs, useApprovePG, useAdminStats } from "@/hooks/use-admin";
import { toast } from "sonner";

const genderLabel: Record<string, string> = { boys: "Boys", girls: "Girls", coliving: "Co-living" };

const AdminDashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const { data: pgs, isLoading: pgsLoading } = useAllPGs();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const approvePG = useApprovePG();
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "inactive">("all");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container py-20 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user || !roles.includes("admin")) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container text-center py-32">
          <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredPGs = (pgs || []).filter((pg: any) => {
    if (filter === "pending") return !pg.verified;
    if (filter === "verified") return pg.verified;
    if (filter === "inactive") return !pg.is_active;
    return true;
  });

  const handleApprove = async (pgId: string) => {
    try {
      await approvePG.mutateAsync({ pgId, verified: true, isActive: true });
      toast.success("PG approved and verified! ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    }
  };

  const handleReject = async (pgId: string) => {
    try {
      await approvePG.mutateAsync({ pgId, verified: false, isActive: false });
      toast.success("PG listing rejected");
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    }
  };

  const handleToggleVerify = async (pgId: string, currentVerified: boolean) => {
    try {
      await approvePG.mutateAsync({ pgId, verified: !currentVerified, isActive: true });
      toast.success(currentVerified ? "Verification removed" : "PG verified! ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Review and manage PG listings</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
            ) : (
              [
                { label: "Total PGs", value: stats?.totalPGs || 0, icon: Building2, color: "text-primary" },
                { label: "Pending Review", value: stats?.pendingPGs || 0, icon: Clock, color: "text-warning" },
                { label: "Verified", value: stats?.verifiedPGs || 0, icon: CheckCircle, color: "text-success" },
                { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-primary" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-2xl border border-border bg-card">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {([
              { key: "all", label: "All Listings", count: pgs?.length || 0 },
              { key: "pending", label: "Pending Review", count: (pgs || []).filter((p: any) => !p.verified).length },
              { key: "verified", label: "Verified", count: (pgs || []).filter((p: any) => p.verified).length },
              { key: "inactive", label: "Inactive", count: (pgs || []).filter((p: any) => !p.is_active).length },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* PG Listings */}
          {pgsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
          ) : filteredPGs.length > 0 ? (
            <div className="space-y-4">
              {filteredPGs.map((pg: any) => {
                const totalBeds = pg.rooms?.reduce((s: number, r: any) => s + (r.beds?.length || 0), 0) || 0;
                const availBeds = pg.rooms?.reduce((s: number, r: any) => s + (r.beds?.filter((b: any) => b.status === "available").length || 0), 0) || 0;
                const amenityNames = pg.pg_amenities?.map((pa: any) => pa.amenities?.name).filter(Boolean) || [];

                return (
                  <div key={pg.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-bold text-lg text-foreground">{pg.name}</h3>
                            {pg.verified ? (
                              <Badge className="bg-success/10 text-success border border-success/20">✓ Verified</Badge>
                            ) : (
                              <Badge className="bg-warning/10 text-warning border border-warning/20">⏳ Pending</Badge>
                            )}
                            {!pg.is_active && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                            <Badge variant="secondary">{genderLabel[pg.gender]}</Badge>
                          </div>

                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4" />
                            {pg.area ? `${pg.area}, ` : ""}{pg.address}, {pg.city}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                            <span className="flex items-center gap-1">
                              <Bed className="w-4 h-4 text-success" />
                              <span className="font-medium">{availBeds}/{totalBeds} beds available</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4 text-primary" />
                              {pg.rooms?.length || 0} rooms
                            </span>
                          </div>

                          {pg.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pg.description}</p>
                          )}

                          {amenityNames.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {amenityNames.slice(0, 6).map((name: string) => (
                                <span key={name} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{name}</span>
                              ))}
                              {amenityNames.length > 6 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">+{amenityNames.length - 6} more</span>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Owner: {pg.profiles?.full_name || "Unknown"} {pg.profiles?.phone ? `• ${pg.profiles.phone}` : ""}
                            {" • "}Listed {new Date(pg.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => navigate(`/pg/${pg.id}`)}
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>

                          {!pg.verified ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/90 text-success-foreground text-xs"
                                onClick={() => handleApprove(pg.id)}
                                disabled={approvePG.isPending}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                                onClick={() => handleReject(pg.id)}
                                disabled={approvePG.isPending}
                              >
                                <XCircle className="w-3 h-3 mr-1" /> Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-warning/30 text-warning hover:bg-warning/10"
                              onClick={() => handleToggleVerify(pg.id, true)}
                              disabled={approvePG.isPending}
                            >
                              Remove Verify
                            </Button>
                          )}

                          {!pg.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => approvePG.mutate({ pgId: pg.id, verified: pg.verified, isActive: true }, { onSuccess: () => toast.success("PG reactivated") })}
                              disabled={approvePG.isPending}
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <CheckCircle className="w-16 h-16 text-success/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {filter === "pending" ? "No Pending Reviews" : "No Listings Found"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === "pending" ? "All PG listings have been reviewed!" : "No listings match this filter."}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
