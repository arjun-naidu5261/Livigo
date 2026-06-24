import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Bed, Building2, ChevronRight, Pencil, DoorOpen, TrendingUp, Trash2, UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOwnerPGs, useToggleBedStatus, useUpdatePG, useUpdateRoom, useAddRoom,
  useCheckInGuest, useCheckOutGuest, useDeleteRoom,
} from "@/hooks/use-owner";
import {
  useFoodMenu, useSaveFoodMenu, WEEK_DAYS, DAY_LABELS, emptyWeekMenu, type WeekMenu,
} from "@/hooks/use-food-menu";
import { resolveMediaUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const genderLabel: Record<string, string> = { boys: "Boys", girls: "Girls", coliving: "Co-living" };

const OwnerDashboard = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "dashboard";
  const { data: pgs, isLoading } = useOwnerPGs();
  const toggleBed = useToggleBedStatus();
  const checkInGuest = useCheckInGuest();
  const checkOutGuest = useCheckOutGuest();
  const deleteRoom = useDeleteRoom();
  const updatePG = useUpdatePG();
  const updateRoom = useUpdateRoom();
  const addRoom = useAddRoom();
  const [expandedPG, setExpandedPG] = useState<string | null>(null);

  const [editPG, setEditPG] = useState<any>(null);
  const [editPGOpen, setEditPGOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [addRoomPgId, setAddRoomPgId] = useState("");
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSharing, setNewRoomSharing] = useState(1);
  const [newRoomPrice, setNewRoomPrice] = useState(0);
  const [newRoomBeds, setNewRoomBeds] = useState(1);
  const [newRoomAc, setNewRoomAc] = useState(false);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{
    bed: any;
    room: any;
    pg: any;
  } | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<{ room: any; pg: any } | null>(null);
  const [deleteGuestConfirm, setDeleteGuestConfirm] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [weekMenu, setWeekMenu] = useState<WeekMenu>(emptyWeekMenu());
  const saveFoodMenu = useSaveFoodMenu();
  const { data: foodMenuData, isLoading: foodMenuLoading } = useFoodMenu(
    section === "food-menu" ? selectedHostelId : ""
  );

  useEffect(() => {
    if (pgs?.length && !selectedHostelId) {
      setSelectedHostelId(pgs[0].id);
    }
    if (pgs?.length && selectedHostelId && !pgs.some((pg: any) => pg.id === selectedHostelId)) {
      setSelectedHostelId(pgs[0].id);
    }
  }, [pgs, selectedHostelId]);

  useEffect(() => {
    if (!foodMenuData) return;
    const next = emptyWeekMenu();
    WEEK_DAYS.forEach((day) => {
      if (foodMenuData[day]) next[day] = { ...foodMenuData[day] };
    });
    setWeekMenu(next);
  }, [foodMenuData]);

  if (!user) { navigate("/auth"); return null; }
  if (!roles.includes("owner")) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container text-center py-32">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Owner Access Required</h1>
          <p className="text-muted-foreground mb-4">Sign up as a PG Owner to access the dashboard.</p>
          <Button onClick={() => navigate("/auth")}>Sign Up as Owner</Button>
        </div>
      </div>
    );
  }

  const openBedDialog = (bed: any, room: any, pg: any) => {
    setSelectedBed({ bed, room, pg });
    if (bed.status === "occupied" && bed.guest) {
      setGuestName(bed.guest.guest_name || "");
      setGuestPhone(bed.guest.guest_phone || "");
      setAdvancePaid(String(bed.guest.advance_paid ?? ""));
    } else {
      setGuestName("");
      setGuestPhone("");
      setAdvancePaid("");
    }
    setCheckInOpen(true);
  };

  const closeBedDialog = () => {
    setCheckInOpen(false);
    setSelectedBed(null);
    setGuestName("");
    setGuestPhone("");
    setAdvancePaid("");
  };

  const handleBedClick = (bed: any, room: any, pg: any) => {
    if (bed.status === "locked") return;
    if (bed.status === "maintenance") {
      toggleBed.mutate(
        { bedId: bed.id, newStatus: "available" },
        { onSuccess: () => toast.success(`Bed ${bed.bed_number} is now available`) }
      );
      return;
    }
    openBedDialog(bed, room, pg);
  };

  const handleCheckInSubmit = () => {
    if (!selectedBed) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      toast.error("Please enter guest name and phone number");
      return;
    }
    checkInGuest.mutate(
      {
        bedId: selectedBed.bed.id,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        advancePaid: parseFloat(advancePaid) || 0,
      },
      {
        onSuccess: () => {
          toast.success(`Guest checked in to Bed ${selectedBed.bed.bed_number}`);
          closeBedDialog();
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleDeleteGuest = () => {
    if (!selectedBed) return;
    checkOutGuest.mutate(selectedBed.bed.id, {
      onSuccess: () => {
        toast.success(`Guest removed — Bed ${selectedBed.bed.bed_number} is now available`);
        closeBedDialog();
        setDeleteGuestConfirm(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleDeleteRoom = () => {
    if (!deleteRoomTarget) return;
    deleteRoom.mutate(deleteRoomTarget.room.id, {
      onSuccess: () => {
        toast.success(`Room "${deleteRoomTarget.room.name}" deleted`);
        setDeleteRoomTarget(null);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const selectedPg = pgs?.find((pg: any) => pg.id === selectedHostelId) || pgs?.[0];
  const filteredRooms = selectedPg?.rooms || [];

  const totalRooms = pgs?.reduce((sum, pg: any) => sum + (pg.rooms?.length || 0), 0) || 0;
  const totalBeds = pgs?.reduce((sum, pg: any) => sum + pg.rooms?.reduce((s: number, r: any) => s + (r.beds?.length || 0), 0), 0) || 0;
  const availableBeds = pgs?.reduce((sum, pg: any) => sum + pg.rooms?.reduce((s: number, r: any) => s + (r.beds?.filter((b: any) => b.status === "available").length || 0), 0), 0) || 0;
  const occupiedBeds = totalBeds - availableBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const handleUpdatePG = async () => {
    if (!editPG) return;
    try {
      await updatePG.mutateAsync({
        pgId: editPG.id,
        updates: {
          name: editPG.name,
          description: editPG.description,
          address: editPG.address,
          city: editPG.city,
          area: editPG.area,
          gender: editPG.gender,
        },
      });
      toast.success("Hostel updated!");
      setEditPGOpen(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateRoom = async () => {
    if (!editRoom) return;
    try {
      await updateRoom.mutateAsync({
        roomId: editRoom.id,
        updates: {
          name: editRoom.name,
          price_per_month: editRoom.price_per_month,
          has_ac: editRoom.has_ac,
          has_attached_bathroom: editRoom.has_attached_bathroom,
        },
      });
      toast.success("Room updated!");
      setEditRoomOpen(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAddRoom = async () => {
    if (!addRoomPgId || !newRoomName || !newRoomPrice) { toast.error("Fill all required fields"); return; }
    try {
      await addRoom.mutateAsync({
        pgId: addRoomPgId,
        name: newRoomName,
        sharingType: newRoomSharing,
        pricePerMonth: newRoomPrice,
        totalBeds: newRoomBeds,
        hasAc: newRoomAc,
      });
      toast.success("Room added!");
      setAddRoomOpen(false);
      setNewRoomName(""); setNewRoomSharing(1); setNewRoomPrice(0); setNewRoomBeds(1); setNewRoomAc(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveFoodMenu = async () => {
    if (!selectedHostelId) return;
    try {
      await saveFoodMenu.mutateAsync({ pgId: selectedHostelId, weekMenu });
      toast.success("Weekly food menu saved");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateMeal = (day: string, meal: "breakfast" | "lunch" | "dinner", value: string) => {
    setWeekMenu((prev) => ({
      ...prev,
      [day]: { ...prev[day], [meal]: value },
    }));
  };

  const sectionTitle = section === "hostels"
    ? "Hostels"
    : section === "rooms"
      ? "Rooms"
      : section === "food-menu"
        ? "Food Menu"
        : "Dashboard";

  const sectionSubtitle = section === "hostels"
    ? "Manage your hostel properties"
    : section === "rooms"
      ? "Manage rooms and bed availability"
      : section === "food-menu"
        ? "Set the weekly food menu for your hostel"
        : `Welcome back, ${user.full_name || "Owner"}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">{sectionTitle}</h1>
              <p className="text-sm text-muted-foreground">{sectionSubtitle}</p>
            </div>
            {(section === "hostels") && (
              <Button onClick={() => navigate("/list-property")} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Add Hostel
              </Button>
            )}
          </div>

          {section === "dashboard" && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Hostels", value: pgs?.length || 0, icon: Building2, color: "text-primary" },
                  { label: "Rooms", value: totalRooms, icon: DoorOpen, color: "text-primary" },
                  { label: "Available Beds", value: availableBeds, icon: Bed, color: "text-success" },
                  { label: "Occupancy", value: `${occupancyRate}%`, icon: TrendingUp, color: "text-primary" },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 rounded-2xl border border-border bg-card">
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  to="/dashboard?section=hostels"
                  className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Building2 className="w-6 h-6 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Manage Hostels</h3>
                  <p className="text-xs text-muted-foreground mt-1">View and edit your properties</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/dashboard?section=rooms"
                  className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Bed className="w-6 h-6 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Manage Rooms</h3>
                  <p className="text-xs text-muted-foreground mt-1">Update rooms and bed status</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Bed overview */}
              <div className="p-6 rounded-2xl border border-border bg-card">
                <h2 className="text-lg font-bold text-foreground mb-4">Bed Overview</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-xl bg-secondary/50">
                    <p className="text-2xl font-bold text-foreground">{totalBeds}</p>
                    <p className="text-sm text-muted-foreground">Total Beds</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-success/10">
                    <p className="text-2xl font-bold text-success">{availableBeds}</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-primary/10">
                    <p className="text-2xl font-bold text-primary">{occupiedBeds}</p>
                    <p className="text-sm text-muted-foreground">Occupied</p>
                  </div>
                </div>
              </div>

              {/* Hostels snapshot */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">Your Hostels</h2>
                  {(pgs?.length || 0) > 0 && (
                    <Link to="/dashboard?section=hostels" className="text-sm text-primary font-medium hover:underline">
                      View all
                    </Link>
                  )}
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                  </div>
                ) : pgs && pgs.length > 0 ? (
                  <div className="space-y-3">
                    {pgs.slice(0, 4).map((pg: any) => {
                      const pgAvail = pg.rooms?.reduce((s: number, r: any) => s + (r.beds?.filter((b: any) => b.status === "available").length || 0), 0) || 0;
                      const pgTotal = pg.rooms?.reduce((s: number, r: any) => s + (r.beds?.length || 0), 0) || 0;
                      return (
                        <div key={pg.id} className="p-4 rounded-2xl border border-border bg-card flex items-center gap-4">
                          {pg.pg_images?.[0] ? (
                            <img src={resolveMediaUrl(pg.pg_images[0].url)} alt={pg.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground truncate">{pg.name}</h3>
                              {pg.verified ? (
                                <Badge className="bg-success text-success-foreground text-xs">Verified</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Pending</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {pg.area ? `${pg.area}, ` : ""}{pg.city} • {pg.rooms?.length || 0} rooms
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-success">{pgAvail}/{pgTotal}</p>
                            <p className="text-xs text-muted-foreground">beds free</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 rounded-2xl border border-dashed border-border">
                    <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground mb-1">No hostels yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Go to Hostels to add your first property</p>
                    <Button onClick={() => navigate("/dashboard?section=hostels")} className="rounded-xl">
                      Go to Hostels
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {section === "hostels" && (
            isLoading ? (
              <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
            ) : pgs && pgs.length > 0 ? (
              <div className="space-y-4">
                {pgs.map((pg: any) => {
                  const isExpanded = expandedPG === pg.id;
                  const pgAvailBeds = pg.rooms?.reduce((s: number, r: any) => s + (r.beds?.filter((b: any) => b.status === "available").length || 0), 0) || 0;
                  const pgTotalBeds = pg.rooms?.reduce((s: number, r: any) => s + (r.beds?.length || 0), 0) || 0;

                  return (
                    <div key={pg.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                      <div
                        className="p-4 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => setExpandedPG(isExpanded ? null : pg.id)}
                      >
                        <div className="flex items-center gap-4">
                          {pg.pg_images?.[0] ? (
                            <img src={resolveMediaUrl(pg.pg_images[0].url)} alt={pg.name} className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-foreground">{pg.name}</h3>
                              {pg.verified && <Badge className="bg-success text-success-foreground text-xs">Verified</Badge>}
                              {!pg.verified && <Badge variant="secondary" className="text-xs">Pending Review</Badge>}
                              <Badge variant="secondary" className="text-xs">{genderLabel[pg.gender]}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{pg.area ? `${pg.area}, ` : ""}{pg.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditPG({ ...pg }); setEditPGOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Hostel"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-success">{pgAvailBeds}/{pgTotalBeds} beds available</p>
                            <p className="text-xs text-muted-foreground">{pg.rooms?.length || 0} rooms • {pg.pg_images?.length || 0} photos</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border p-4 sm:p-6 space-y-4">
                          {pg.description && (
                            <p className="text-sm text-muted-foreground">{pg.description}</p>
                          )}
                          {pg.pg_images && pg.pg_images.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">Photos</h4>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {pg.pg_images.map((img: any) => (
                                  <img key={img.id} src={resolveMediaUrl(img.url)} alt="" className="w-24 h-16 rounded-lg object-cover flex-shrink-0" />
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard?section=rooms`)}
                            >
                              View Rooms
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Hostels Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add your first hostel to get started</p>
                <Button onClick={() => navigate("/list-property")}>
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Hostel
                </Button>
              </div>
            )
          )}

          {section === "rooms" && (
            isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : pgs && pgs.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-xs">
                    <Label className="mb-2 block text-right">Select Hostel</Label>
                    <select
                      value={selectedHostelId}
                      onChange={(e) => setSelectedHostelId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
                    >
                      {pgs.map((pg: any) => (
                        <option key={pg.id} value={pg.id}>{pg.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredRooms.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRooms.map((room: any) => (
                      <div key={room.id} className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{selectedPg?.name}</p>
                            <h4 className="font-semibold text-foreground">{room.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ₹{room.price_per_month.toLocaleString()}/mo • {room.has_ac ? "AC" : "Non-AC"} • {room.has_attached_bathroom ? "Attached Bath" : "Shared Bath"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditRoom({ ...room }); setEditRoomOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                              title="Edit Room"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteRoomTarget({ room, pg: selectedPg })}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete Room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Badge variant="secondary">
                              {room.beds?.filter((b: any) => b.status === "available").length || 0}/{room.beds?.length || 0} available
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {room.beds?.map((bed: any) => (
                            <button
                              key={bed.id}
                              onClick={() => handleBedClick(bed, room, selectedPg)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                bed.status === "available" ? "bg-success/10 text-success border border-success/20 hover:bg-success/20 cursor-pointer" :
                                bed.status === "occupied" ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer" :
                                bed.status === "locked" ? "bg-warning/10 text-warning border border-warning/20 cursor-not-allowed" :
                                "bg-muted text-muted-foreground border border-border hover:bg-secondary cursor-pointer"
                              }`}
                            >
                              Bed {bed.bed_number}: {bed.status}
                              {bed.guest?.guest_name ? ` (${bed.guest.guest_name})` : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Bed className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Rooms in This Hostel</h3>
                    <p className="text-sm text-muted-foreground mb-4">Add a room to {selectedPg?.name}</p>
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <Button
                    className="rounded-xl"
                    onClick={() => {
                      if (selectedPg?.id) {
                        setAddRoomPgId(selectedPg.id);
                        setAddRoomOpen(true);
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Room
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <Bed className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Hostels Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add a hostel first, then create rooms for it</p>
                <Button onClick={() => navigate("/list-property")}>
                  <Plus className="w-4 h-4 mr-2" /> Add Hostel
                </Button>
              </div>
            )
          )}

          {section === "food-menu" && (
            isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : pgs && pgs.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-xs">
                    <Label className="mb-2 block text-right">Select Hostel</Label>
                    <select
                      value={selectedHostelId}
                      onChange={(e) => setSelectedHostelId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
                    >
                      {pgs.map((pg: any) => (
                        <option key={pg.id} value={pg.id}>{pg.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {foodMenuLoading ? (
                  <div className="space-y-3">{WEEK_DAYS.map((day) => <Skeleton key={day} className="h-20 rounded-xl" />)}</div>
                ) : (
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="hidden sm:grid sm:grid-cols-4 gap-4 p-4 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <span>Day</span>
                      <span>Breakfast</span>
                      <span>Lunch</span>
                      <span>Dinner</span>
                    </div>
                    <div className="divide-y divide-border">
                      {WEEK_DAYS.map((day) => (
                        <div key={day} className="p-4 sm:grid sm:grid-cols-4 gap-4 sm:items-start">
                          <div className="flex items-center gap-2 mb-3 sm:mb-0">
                            <UtensilsCrossed className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-semibold text-foreground">{DAY_LABELS[day]}</span>
                          </div>
                          {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                            <div key={meal} className="space-y-1 mb-3 sm:mb-0 last:mb-0">
                              <Label className="text-xs text-muted-foreground capitalize sm:sr-only">{meal}</Label>
                              <Textarea
                                value={weekMenu[day]?.[meal] || ""}
                                onChange={(e) => updateMeal(day, meal, e.target.value)}
                                placeholder={`${meal} menu`}
                                rows={2}
                                className="resize-none text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <Button
                    className="rounded-xl"
                    onClick={handleSaveFoodMenu}
                    disabled={saveFoodMenu.isPending || !selectedHostelId}
                  >
                    {saveFoodMenu.isPending ? "Saving..." : "Save Weekly Menu"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <UtensilsCrossed className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Hostels Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add a hostel first to set up the food menu</p>
                <Button onClick={() => navigate("/list-property")}>
                  <Plus className="w-4 h-4 mr-2" /> Add Hostel
                </Button>
              </div>
            )
          )}
        </div>
      </div>

      <Dialog open={editPGOpen} onOpenChange={setEditPGOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Hostel</DialogTitle></DialogHeader>
          {editPG && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editPG.name} onChange={(e) => setEditPG({ ...editPG, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editPG.description || ""} onChange={(e) => setEditPG({ ...editPG, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={editPG.address} onChange={(e) => setEditPG({ ...editPG, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={editPG.city} onChange={(e) => setEditPG({ ...editPG, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Input value={editPG.area || ""} onChange={(e) => setEditPG({ ...editPG, area: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gender Type</Label>
                <select
                  value={editPG.gender}
                  onChange={(e) => setEditPG({ ...editPG, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                >
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="coliving">Co-living</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPGOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePG} disabled={updatePG.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editRoomOpen} onOpenChange={setEditRoomOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Room</DialogTitle></DialogHeader>
          {editRoom && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Room Name</Label>
                <Input value={editRoom.name} onChange={(e) => setEditRoom({ ...editRoom, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price per Month (₹)</Label>
                <Input type="number" value={editRoom.price_per_month} onChange={(e) => setEditRoom({ ...editRoom, price_per_month: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editRoom.has_ac} onChange={(e) => setEditRoom({ ...editRoom, has_ac: e.target.checked })} className="rounded" />
                  AC Room
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editRoom.has_attached_bathroom} onChange={(e) => setEditRoom({ ...editRoom, has_attached_bathroom: e.target.checked })} className="rounded" />
                  Attached Bathroom
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoomOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRoom} disabled={updateRoom.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Room</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Room Name *</Label>
              <Input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="e.g. Room 101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sharing Type</Label>
                <select
                  value={newRoomSharing}
                  onChange={(e) => setNewRoomSharing(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}-sharing</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Total Beds</Label>
                <Input type="number" min={1} value={newRoomBeds} onChange={(e) => setNewRoomBeds(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price per Month (₹) *</Label>
              <Input type="number" value={newRoomPrice || ""} onChange={(e) => setNewRoomPrice(parseInt(e.target.value) || 0)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newRoomAc} onChange={(e) => setNewRoomAc(e.target.checked)} className="rounded" />
              AC Room
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoomOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRoom} disabled={addRoom.isPending}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={checkInOpen} onOpenChange={(open) => { if (!open) closeBedDialog(); else setCheckInOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBed?.bed.status === "occupied" ? "Guest Details" : "Check In Guest"}
            </DialogTitle>
          </DialogHeader>
          {selectedBed && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hostel</Label>
                <Input value={selectedBed.pg.name} readOnly className="bg-secondary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Input value={selectedBed.room.name} readOnly className="bg-secondary" />
                </div>
                <div className="space-y-2">
                  <Label>Bed</Label>
                  <Input value={`Bed ${selectedBed.bed.bed_number}`} readOnly className="bg-secondary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Guest Name *</Label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Full name"
                  readOnly={selectedBed.bed.status === "occupied"}
                  className={selectedBed.bed.status === "occupied" ? "bg-secondary" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  readOnly={selectedBed.bed.status === "occupied"}
                  className={selectedBed.bed.status === "occupied" ? "bg-secondary" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Advance Amount Paid (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  placeholder="0"
                  readOnly={selectedBed.bed.status === "occupied"}
                  className={selectedBed.bed.status === "occupied" ? "bg-secondary" : ""}
                />
              </div>
              {selectedBed.bed.guest?.check_in_date && (
                <p className="text-xs text-muted-foreground">
                  Checked in on {selectedBed.bed.guest.check_in_date}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeBedDialog}>Cancel</Button>
            {selectedBed?.bed.status === "occupied" ? (
              <Button variant="destructive" onClick={() => setDeleteGuestConfirm(true)} disabled={checkOutGuest.isPending}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Guest
              </Button>
            ) : (
              <Button onClick={handleCheckInSubmit} disabled={checkInGuest.isPending}>
                Check In
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteGuestConfirm} onOpenChange={setDeleteGuestConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove guest from Bed {selectedBed?.bed.bed_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {selectedBed?.bed.guest?.guest_name || "the guest"}&apos;s details and mark the bed as available again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRoomTarget} onOpenChange={(open) => { if (!open) setDeleteRoomTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteRoomTarget?.room.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the room, all its beds, and any guest records.
              {deleteRoomTarget?.room.beds?.some((b: any) => b.status === "occupied") && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This room has occupied beds. All guest data will be removed.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerDashboard;
