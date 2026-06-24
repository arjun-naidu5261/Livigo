import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePG } from "@/hooks/use-owner";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

const DEFAULT_PRICES: Record<number, number> = { 2: 9000, 3: 7500, 4: 6500 };

type RoomCounts = { ac: number; nonAc: number };

const emptyCounts = (): Record<2 | 3 | 4, RoomCounts> => ({
  2: { ac: 0, nonAc: 0 },
  3: { ac: 0, nonAc: 0 },
  4: { ac: 0, nonAc: 0 },
});

function buildRooms(counts: Record<2 | 3 | 4, RoomCounts>) {
  const rooms: {
    name: string;
    sharingType: number;
    pricePerMonth: number;
    totalBeds: number;
    hasAc: boolean;
    images: File[];
  }[] = [];

  ([2, 3, 4] as const).forEach((sharing) => {
    const { ac, nonAc } = counts[sharing];
    for (let i = 0; i < ac; i++) {
      rooms.push({
        name: `${sharing}-Share AC Room ${i + 1}`,
        sharingType: sharing,
        pricePerMonth: DEFAULT_PRICES[sharing] + 2000,
        totalBeds: sharing,
        hasAc: true,
        images: [],
      });
    }
    for (let i = 0; i < nonAc; i++) {
      rooms.push({
        name: `${sharing}-Share Non-AC Room ${i + 1}`,
        sharingType: sharing,
        pricePerMonth: DEFAULT_PRICES[sharing],
        totalBeds: sharing,
        hasAc: false,
        images: [],
      });
    }
  });

  return rooms;
}

const ListProperty = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const createPG = useCreatePG();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState<"boys" | "girls" | "coliving">("coliving");
  const [roomCounts, setRoomCounts] = useState(emptyCounts);
  const [buildingImages, setBuildingImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const updateCount = (sharing: 2 | 3 | 4, type: "ac" | "nonAc", value: number) => {
    setRoomCounts((prev) => ({
      ...prev,
      [sharing]: { ...prev[sharing], [type]: Math.max(0, value) },
    }));
  };

  const totals = useMemo(() => {
    let ac = 0;
    let nonAc = 0;
    let totalBeds = 0;
    ([2, 3, 4] as const).forEach((s) => {
      ac += roomCounts[s].ac;
      nonAc += roomCounts[s].nonAc;
      totalBeds += (roomCounts[s].ac + roomCounts[s].nonAc) * s;
    });
    return { ac, nonAc, rooms: ac + nonAc, beds: totalBeds };
  }, [roomCounts]);

  if (!user) { navigate("/auth"); return null; }
  if (!roles.includes("owner")) { navigate("/auth"); return null; }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBuildingImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setBuildingImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !location.trim()) {
      toast.error("Hostel name and location are required");
      return;
    }
    if (totals.rooms === 0) {
      toast.error("Add at least one room (AC or Non-AC)");
      return;
    }

    const rooms = buildRooms(roomCounts);

    try {
      await createPG.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        address: location.trim(),
        city: location.trim(),
        area: "",
        gender,
        amenityIds: [],
        rules: [],
        rooms,
        buildingImages,
      });
      toast.success("Hostel added successfully!");
      navigate("/dashboard?section=hostels");
    } catch (err: any) {
      toast.error(err.message || "Failed to add hostel");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container max-w-2xl">
          <h1 className="text-2xl font-extrabold text-foreground mb-2">Add Hostel</h1>
          <p className="text-sm text-muted-foreground mb-8">Enter basic details and room breakdown</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
              <h2 className="text-lg font-bold text-foreground">Basic Details</h2>

              <div className="space-y-2">
                <Label htmlFor="hostel-name">Hostel Name *</Label>
                <Input
                  id="hostel-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunrise Boys Hostel"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Koramangala, Bangalore"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description about your hostel..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Type of Hostel *</Label>
                <div className="flex flex-wrap gap-3">
                  {(["boys", "girls", "coliving"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        gender === g
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g === "boys" ? "Boys" : g === "girls" ? "Girls" : "Co-living"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
              <div>
                <h2 className="text-lg font-bold text-foreground">Rooms by Type & Sharing</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter how many AC and Non-AC rooms you have for each sharing type
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="text-left p-3 font-semibold text-foreground">Sharing Type</th>
                      <th className="text-center p-3 font-semibold text-foreground">AC Rooms</th>
                      <th className="text-center p-3 font-semibold text-foreground">Non-AC Rooms</th>
                      <th className="text-center p-3 font-semibold text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([2, 3, 4] as const).map((sharing) => {
                      const row = roomCounts[sharing];
                      const rowTotal = row.ac + row.nonAc;
                      return (
                        <tr key={sharing} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium text-foreground">{sharing} Share</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min={0}
                              value={row.ac || ""}
                              onChange={(e) => updateCount(sharing, "ac", parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="text-center h-9"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min={0}
                              value={row.nonAc || ""}
                              onChange={(e) => updateCount(sharing, "nonAc", parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="text-center h-9"
                            />
                          </td>
                          <td className="p-3 text-center font-semibold text-muted-foreground">{rowTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-secondary/30">
                      <td className="p-3 font-bold text-foreground">Total</td>
                      <td className="p-3 text-center font-bold text-primary">{totals.ac}</td>
                      <td className="p-3 text-center font-bold text-primary">{totals.nonAc}</td>
                      <td className="p-3 text-center font-bold text-foreground">{totals.rooms}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-primary/10 text-center">
                  <p className="text-xl font-bold text-primary">{totals.ac}</p>
                  <p className="text-xs text-muted-foreground">AC Rooms</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary text-center">
                  <p className="text-xl font-bold text-foreground">{totals.nonAc}</p>
                  <p className="text-xs text-muted-foreground">Non-AC Rooms</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10 text-center">
                  <p className="text-xl font-bold text-success">{totals.beds}</p>
                  <p className="text-xs text-muted-foreground">Total Beds</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
              <div>
                <h2 className="text-lg font-bold text-foreground">Hostel Images</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload photos of your hostel (exterior, rooms, common areas)
                </p>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
                className="hidden"
              />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={src} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                    <img src={src} alt={`Hostel ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Add Photos</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => navigate("/dashboard?section=hostels")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={createPG.isPending}>
                {createPG.isPending ? "Saving..." : "Add Hostel"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListProperty;
