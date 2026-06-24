import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Bed, Wifi, Wind, UtensilsCrossed, Shield, ChevronLeft, Heart, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { usePGDetail, useRealtimeBeds } from "@/hooks/use-pgs";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useAuth } from "@/contexts/AuthContext";
import { resolveMediaUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const amenityIcons: Record<string, any> = { AC: Wind, WiFi: Wifi, "Food (3 meals)": UtensilsCrossed };

const PGDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = usePGDetail(id);
  const createBooking = useCreateBooking();
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [moveInDate, setMoveInDate] = useState("");

  // Real-time bed updates
  useRealtimeBeds(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-12 container">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="aspect-[16/9] rounded-2xl mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-12 container text-center py-32">
          <h1 className="text-2xl font-bold text-foreground mb-2">PG Not Found</h1>
          <p className="text-muted-foreground mb-4">This listing doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/search")}>Browse PGs</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const { pg, images, rooms, amenities, rules, reviews } = data;
  const totalAvailableBeds = rooms.reduce((sum: number, r: any) => sum + r.available_beds, 0);
  const totalBeds = rooms.reduce((sum: number, r: any) => sum + (r.beds?.length || 0), 0);
  const minPrice = rooms.length > 0 ? Math.min(...rooms.map((r: any) => r.price_per_month)) : 0;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  const genderLabel: Record<string, string> = { boys: "Boys", girls: "Girls", coliving: "Co-living" };

  const handleBook = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selectedRoom) { toast.error("Please select a room type"); return; }
    if (!moveInDate) { toast.error("Please select a move-in date"); return; }

    const room = rooms.find((r: any) => r.id === selectedRoom);
    if (!room || room.available_beds === 0) { toast.error("No beds available in this room"); return; }

    const availableBed = room.beds.find((b: any) => b.status === "available");
    if (!availableBed) { toast.error("No beds available"); return; }

    try {
      await createBooking.mutateAsync({
        bedId: availableBed.id,
        pgId: pg.id,
        roomId: room.id,
        moveInDate,
        monthlyRent: room.price_per_month,
      });
      toast.success("Booking confirmed! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Booking failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to search
          </button>

          {/* Image Gallery */}
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-8 rounded-2xl overflow-hidden">
              <div className="sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto">
                <img src={resolveMediaUrl(images[0].url)} alt={pg.name} className="w-full h-full object-cover" />
              </div>
              {images.slice(1, 4).map((img: any) => (
                <div key={img.id} className="hidden sm:block aspect-[4/3]">
                  <img src={resolveMediaUrl(img.url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[16/9] sm:aspect-[3/1] bg-secondary rounded-2xl mb-8 flex items-center justify-center">
              <Bed className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {pg.verified && <Badge className="bg-success text-success-foreground text-xs">✓ Verified</Badge>}
                      <Badge variant="secondary" className="text-xs">{genderLabel[pg.gender]}</Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{pg.name}</h1>
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{pg.area ? `${pg.area}, ` : ""}{pg.address}, {pg.city}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full"><Heart className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full"><Share2 className="w-5 h-5" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-bold text-foreground">{avgRating}</span>
                    <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Bed className="w-4 h-4 text-success" />
                    <span className="font-semibold text-success">{totalAvailableBeds} beds available</span>
                    <span className="text-muted-foreground">of {totalBeds}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {pg.description && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3">About this PG</h2>
                  <p className="text-muted-foreground leading-relaxed">{pg.description}</p>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {amenities.map((a: any) => {
                      const Icon = amenityIcons[a.name] || Check;
                      return (
                        <div key={a.id} className="flex items-center gap-2 p-3 rounded-xl bg-secondary text-sm text-foreground">
                          <Icon className="w-4 h-4 text-primary" /> {a.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Room Types */}
              {rooms.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3">Available Rooms</h2>
                  <div className="space-y-3">
                    {rooms.map((room: any) => (
                      <div
                        key={room.id}
                        onClick={() => room.available_beds > 0 && setSelectedRoom(room.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedRoom === room.id ? "border-primary bg-primary/5 ring-1 ring-primary" : room.available_beds > 0 ? "border-border bg-card hover:border-primary/50" : "border-border/50 bg-muted/50 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div>
                          <h4 className="font-semibold text-foreground">{room.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Bed className="w-3 h-3" />
                            {room.available_beds > 0 ? (
                              <span className="text-success font-medium">{room.available_beds} of {room.beds.length} beds available</span>
                            ) : (
                              "No beds available"
                            )}
                            {room.has_ac && <Badge variant="secondary" className="text-xs">AC</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-foreground">₹{room.price_per_month.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">/month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {rules.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3">House Rules</h2>
                  <ul className="space-y-2">
                    {rules.map((rule: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="w-4 h-4 text-primary shrink-0" /> {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-3">Reviews ({reviews.length})</h2>
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review: any) => (
                      <div key={review.id} className="p-4 rounded-xl bg-secondary">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {(review.profiles?.full_name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{review.profiles?.full_name || "Anonymous"}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-24 p-6 rounded-2xl border border-border bg-card shadow-card"
              >
                <div className="mb-4">
                  <p className="text-muted-foreground text-sm">Starting from</p>
                  <p className="text-3xl font-extrabold text-foreground">
                    ₹{minPrice.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-success/10 border border-success/20 mb-4 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">{totalAvailableBeds} beds available right now</span>
                </div>

                <div className="space-y-3 mb-6">
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select Room Type</option>
                    {rooms.filter((r: any) => r.available_beds > 0).map((room: any) => (
                      <option key={room.id} value={room.id}>
                        {room.name} — ₹{room.price_per_month.toLocaleString()}/mo ({room.available_beds} beds)
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground outline-none"
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-xl text-base font-semibold"
                  onClick={handleBook}
                  disabled={createBooking.isPending}
                >
                  {createBooking.isPending ? "Booking..." : "Book Now"}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  Free cancellation within 24 hours
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PGDetailPage;
