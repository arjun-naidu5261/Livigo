import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Home, Ticket, CalendarDays, Bell, IndianRupee,
  Plus, CheckCircle, Clock, Megaphone,
  FileText, CheckCircle2, FileUp, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PGSearchSection from "@/components/PGSearchSection";
import { useAuth } from "@/contexts/AuthContext";
import { resolveMediaUrl } from "@/lib/api";
import {
  useTenantBookings, useTenantPaymentDues, useMarkPaymentPaid,
  useTenantTickets, useCreateTenantTicket,
  useTenantAnnouncements, useRealtimeAnnouncements,
  useTenantDocuments, useUploadTenantDocument
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
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "home";
  const { data: bookings, isLoading: loadingBookings } = useTenantBookings();
  const { data: paymentDues } = useTenantPaymentDues();
  const { data: tickets } = useTenantTickets();
  const { data: announcements } = useTenantAnnouncements();
  const { data: documents, isLoading: loadingDocs } = useTenantDocuments();
  const markPaid = useMarkPaymentPaid();
  const createTicket = useCreateTenantTicket();
  const uploadDoc = useUploadTenantDocument();
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

  // Document form
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("kyc");
  const [docFile, setDocFile] = useState<File | null>(null);

  const sectionTitle: Record<string, string> = {
    home: "Home",
    bookings: "Bookings",
    payments: "Payments",
    tickets: "Tickets",
    docs: "Documents",
    notices: "Notices",
  };

  const sectionSubtitle: Record<string, string> = {
    home: `Welcome back, ${profile?.full_name || "Tenant"}`,
    bookings: "View and manage your PG bookings",
    payments: "Track dues and payment history",
    tickets: "Raise and track support tickets",
    docs: "Upload and manage your documents",
    notices: "Announcements from your PG",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-12 container space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const activePGs = [...new Set(bookings?.filter((b: any) => b.status === "confirmed" || b.status === "pending").map((b: any) => ({ id: b.pg_id, name: b.pgs?.name })) || [])];
  const uniquePGs = activePGs.reduce((acc: any[], pg: any) => {
    if (!acc.find((p: any) => p.id === pg.id)) acc.push(pg);
    return acc;
  }, []);

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

  const handleUploadDoc = async () => {
    if (!docFile || !docTitle) {
      toast.error("Please provide a title and select a file.");
      return;
    }
    const formData = new FormData();
    formData.append("title", docTitle);
    formData.append("docType", docType);
    formData.append("document", docFile);

    try {
      await uploadDoc.mutateAsync(formData);
      toast.success("Document uploaded successfully!");
      setDocTitle("");
      setDocFile(null);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-foreground">{sectionTitle[section] || "Home"}</h1>
            <p className="text-sm text-muted-foreground">{sectionSubtitle[section] || sectionSubtitle.home}</p>
          </div>

          {section === "home" && announcements && announcements.length > 0 && (
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

          {section === "home" && <PGSearchSection />}

          {section === "bookings" && (
            loadingBookings ? (
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
                  <Button onClick={() => navigate("/my-dashboard")}>Find a PG</Button>
                </div>
              )
          )}

          {section === "payments" && (
            paymentDues && paymentDues.length > 0 ? (
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
              )
          )}

          {section === "tickets" && (
            <>
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
            </>
          )}

          {section === "notices" && (
            announcements && announcements.length > 0 ? (
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
              )
          )}

          {section === "docs" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">My Documents</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-xl"><FileUp className="w-4 h-4 mr-1" /> Upload KYC</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Document Type</Label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                        >
                          <option value="kyc">KYC (Aadhar/PAN)</option>
                          <option value="agreement">Lease Agreement</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Aadhar Card" />
                      </div>
                      <div className="space-y-2">
                        <Label>File *</Label>
                        <Input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <DialogClose asChild>
                        <Button onClick={handleUploadDoc} disabled={uploadDoc.isPending}>Upload</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingDocs ? (
                <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{doc.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] uppercase">{doc.doc_type}</Badge>
                            <span className="text-[10px] text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {doc.status === "verified" && <Badge className="bg-success/10 text-success border-success/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Verified</Badge>}
                        {doc.status === "pending" && <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                        {doc.status === "rejected" && <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>}
                        <Button variant="outline" size="sm" onClick={() => window.open(resolveMediaUrl(doc.file_url), '_blank')}>View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Documents Found</h3>
                  <p className="text-sm text-muted-foreground">Upload your KYC documents or lease agreements here.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {section === "home" && <Footer />}
    </div>
  );
};

export default TenantDashboard;
