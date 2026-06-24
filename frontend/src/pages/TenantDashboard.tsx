import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Ticket, IndianRupee, Bell, User, CalendarDays,
  Plus, CheckCircle, Clock, AlertCircle, Megaphone, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  useTenantBookings, useTenantPaymentDues, useMarkPaymentPaid,
  useTenantTickets, useCreateTenantTicket,
  useTenantAnnouncements, useRealtimeAnnouncements,
  useUpdateProfile
} from "@/hooks/use-tenant";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  partial: "bg-primary/10 text-primary",
  confirmed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  urgent: "bg-destructive text-destructive-foreground",
};

const TenantDashboard = () => {
  const { user, roles, profile } = useAuth();
  const navigate = useNavigate();
  const { data: bookings, isLoading: loadingBookings } = useTenantBookings();
  const { data: paymentDues } = useTenantPaymentDues();
  const { data: tickets } = useTenantTickets();
  const { data: announcements } = useTenantAnnouncements();
  const markPaid = useMarkPaymentPaid();
  const createTicket = useCreateTenantTicket();
  const updateProfile = useUpdateProfile();
  useRealtimeAnnouncements();

  // Ticket form
  const [ticketPgId, setTicketPgId] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  // Payment form
  const [payDueId, setPayDueId] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payRef, setPayRef] = useState("");

  // Profile form
  const [editName, setEditName] = useState(profile?.full_name || "");
  const [editPhone, setEditPhone] = useState(profile?.phone || "");

  if (!user) { navigate("/auth"); return null; }

  const activePGs = [...new Set(bookings?.filter((b: any) => b.status === "confirmed" || b.status === "pending").map((b: any) => ({ id: b.pg_id, name: b.pgs?.name })) || [])];
  const uniquePGs = activePGs.reduce((acc: any[], pg: any) => {
    if (!acc.find((p: any) => p.id === pg.id)) acc.push(pg);
    return acc;
  }, []);

  const pendingDues = paymentDues?.filter((d: any) => d.status === "pending" || d.status === "overdue") || [];
  const totalDue = pendingDues.reduce((sum: number, d: any) => sum + d.amount, 0);

  const handleCreateTicket = async () => {
    if (!ticketPgId || !ticketSubject) { toast.error("Select a PG and enter subject"); return; }
    try {
      await createTicket.mutateAsync({ pgId: ticketPgId, subject: ticketSubject, description: ticketDesc, priority: ticketPriority });
      toast.success("Ticket raised successfully!");
      setTicketSubject(""); setTicketDesc(""); setTicketPriority("medium");
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePayDue = async () => {
    if (!payDueId) return;
    try {
      await markPaid.mutateAsync({ dueId: payDueId, paymentMethod: payMethod, transactionRef: payRef });
      toast.success("Payment recorded!");
      setPayDueId(""); setPayMethod(""); setPayRef("");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile.mutateAsync({ fullName: editName, phone: editPhone });
      toast.success("Profile updated!");
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground">My Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || "Tenant"}</p>
          </div>

          {/* Announcements Banner */}
          {announcements && announcements.length > 0 && (
            <div className="mb-6 space-y-2">
              {announcements.slice(0, 3).map((ann: any) => (
                <div key={ann.id} className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                  <Megaphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground text-sm">{ann.title}</h4>
                      <span className="text-[10px] text-muted-foreground">{ann.pgs?.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{ann.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(ann.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Active Bookings", value: bookings?.filter((b: any) => b.status === "confirmed").length || 0, icon: Home },
              { label: "Open Tickets", value: tickets?.filter((t: any) => t.status === "open" || t.status === "in_progress").length || 0, icon: Ticket },
              { label: "Pending Dues", value: pendingDues.length, icon: IndianRupee },
              { label: "Total Due", value: `₹${totalDue.toLocaleString()}`, icon: CreditCard },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-2xl border border-border bg-card">
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="bookings" className="text-xs sm:text-sm">Bookings</TabsTrigger>
              <TabsTrigger value="payments" className="text-xs sm:text-sm">Payments</TabsTrigger>
              <TabsTrigger value="tickets" className="text-xs sm:text-sm">Tickets</TabsTrigger>
              <TabsTrigger value="notices" className="text-xs sm:text-sm">Notices</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              {loadingBookings ? (
                <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
              ) : bookings && bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.map((booking: any) => (
                    <div key={booking.id} className="p-5 rounded-2xl border border-border bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-foreground">{booking.pgs?.name}</h4>
                          <p className="text-sm text-muted-foreground">{booking.pgs?.area ? `${booking.pgs.area}, ` : ""}{booking.pgs?.city}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{booking.rooms?.name}</span>
                            <span>•</span>
                            <span>Bed {booking.beds?.bed_number}</span>
                            <span>•</span>
                            <span>{booking.rooms?.has_ac ? "AC" : "Non-AC"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                            <CalendarDays className="w-3 h-3" /> Move-in: {new Date(booking.move_in_date).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={statusColors[booking.status] || ""}>{booking.status}</Badge>
                          <p className="text-lg font-bold text-foreground mt-1">₹{booking.monthly_rent.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">per month</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Home className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Bookings Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Browse PGs and book a bed to get started</p>
                  <Button onClick={() => navigate("/search")}>Find a PG</Button>
                </div>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              {paymentDues && paymentDues.length > 0 ? (
                <div className="space-y-3">
                  {paymentDues.map((due: any) => (
                    <div key={due.id} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{due.pgs?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {due.bookings?.rooms?.name} • Bed {due.bookings?.beds?.bed_number}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <CalendarDays className="w-3 h-3" /> Due: {new Date(due.due_date).toLocaleDateString("en-IN")}
                          </p>
                          {due.notes && <p className="text-xs text-muted-foreground mt-1">{due.notes}</p>}
                          {due.paid_date && (
                            <p className="text-xs text-success flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3" /> Paid on {new Date(due.paid_date).toLocaleDateString("en-IN")}
                              {due.payment_method && ` via ${due.payment_method}`}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-lg font-bold text-foreground">₹{due.amount.toLocaleString()}</p>
                          <Badge className={statusColors[due.status] || ""}>{due.status}</Badge>
                          {(due.status === "pending" || due.status === "overdue") && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button
                                  onClick={() => setPayDueId(due.id)}
                                  className="text-xs px-3 py-1 rounded-lg bg-success text-success-foreground hover:bg-success/90 font-medium"
                                >
                                  Pay Now
                                </button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground">Amount: <strong className="text-foreground">₹{due.amount.toLocaleString()}</strong></p>
                                  <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <select
                                      value={payMethod}
                                      onChange={(e) => setPayMethod(e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                                    >
                                      <option value="">Select method</option>
                                      <option value="UPI">UPI</option>
                                      <option value="Bank Transfer">Bank Transfer</option>
                                      <option value="Cash">Cash</option>
                                      <option value="Card">Card</option>
                                      <option value="Wallet">Wallet</option>
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Transaction Reference (optional)</Label>
                                    <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="UPI ref / transaction ID" />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={handlePayDue} disabled={markPaid.isPending}>Confirm Payment</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <IndianRupee className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Payment Dues</h3>
                  <p className="text-sm text-muted-foreground">Your payment history and dues will appear here</p>
                </div>
              )}
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">My Tickets</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-xl"><Plus className="w-4 h-4 mr-1" /> Raise Ticket</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Raise a Support Ticket</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>PG *</Label>
                        <select
                          value={ticketPgId}
                          onChange={(e) => setTicketPgId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                        >
                          <option value="">Select PG</option>
                          {uniquePGs.map((pg: any) => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Issue Subject *</Label>
                        <Input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="e.g. AC not working" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} placeholder="Describe the issue in detail..." rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <div className="flex gap-2">
                          {(["low", "medium", "high", "urgent"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setTicketPriority(p)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                                ticketPriority === p ? priorityColors[p] : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <DialogClose asChild>
                        <Button onClick={handleCreateTicket} disabled={createTicket.isPending}>Submit</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {tickets && tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((ticket: any) => (
                    <div key={ticket.id} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground text-sm">{ticket.subject}</h4>
                            <Badge className={priorityColors[ticket.priority] || ""}>{ticket.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{ticket.pgs?.name}</p>
                          {ticket.description && <p className="text-xs text-muted-foreground mt-1">{ticket.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Raised {new Date(ticket.created_at).toLocaleDateString("en-IN")}
                            {ticket.resolved_at && ` • Resolved ${new Date(ticket.resolved_at).toLocaleDateString("en-IN")}`}
                          </p>
                        </div>
                        <Badge className={statusColors[ticket.status] || ""}>{ticket.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Ticket className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Tickets</h3>
                  <p className="text-sm text-muted-foreground">Raise a ticket for maintenance or complaints</p>
                </div>
              )}
            </TabsContent>

            {/* Notices Tab */}
            <TabsContent value="notices">
              {announcements && announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((ann: any) => (
                    <div key={ann.id} className="p-5 rounded-2xl border border-border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">{ann.title}</h4>
                            <Badge variant="secondary" className="text-[10px]">{ann.pgs?.name}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{ann.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-2">{new Date(ann.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Notices</h3>
                  <p className="text-sm text-muted-foreground">Announcements from your PG will appear here</p>
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="max-w-md space-y-6">
                <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{profile?.full_name || "Tenant"}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 9876543210" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email || ""} disabled className="opacity-60" />
                    </div>
                    <Button onClick={handleUpdateProfile} disabled={updateProfile.isPending} className="w-full rounded-xl">
                      {updateProfile.isPending ? "Saving..." : "Update Profile"}
                    </Button>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
                  <h4 className="font-bold text-foreground">Account Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-secondary">
                      <p className="text-muted-foreground text-xs">Total Bookings</p>
                      <p className="font-bold text-foreground">{bookings?.length || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary">
                      <p className="text-muted-foreground text-xs">Active</p>
                      <p className="font-bold text-foreground">{bookings?.filter((b: any) => b.status === "confirmed").length || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary">
                      <p className="text-muted-foreground text-xs">Tickets Raised</p>
                      <p className="font-bold text-foreground">{tickets?.length || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary">
                      <p className="text-muted-foreground text-xs">Payments Made</p>
                      <p className="font-bold text-foreground">{paymentDues?.filter((d: any) => d.status === "paid").length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TenantDashboard;
