import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePG, useAmenities } from "@/hooks/use-owner";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Image, X } from "lucide-react";

interface RoomInput {
  name: string;
  sharingType: number;
  pricePerMonth: number;
  totalBeds: number;
  hasAc: boolean;
  images: File[];
  imagePreviews: string[];
}

const ListProperty = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const createPG = useCreatePG();
  const { data: amenitiesList } = useAmenities();
  const buildingImgRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [gender, setGender] = useState<"boys" | "girls" | "coliving">("coliving");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([""]);
  const [buildingImages, setBuildingImages] = useState<File[]>([]);
  const [buildingPreviews, setBuildingPreviews] = useState<string[]>([]);
  const [rooms, setRooms] = useState<RoomInput[]>([
    { name: "Single Room", sharingType: 1, pricePerMonth: 10000, totalBeds: 1, hasAc: false, images: [], imagePreviews: [] },
  ]);

  if (!user) { navigate("/auth"); return null; }
  if (!roles.includes("owner")) { navigate("/auth"); return null; }

  const handleBuildingImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBuildingImages((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setBuildingPreviews((prev) => [...prev, ...previews]);
  };

  const removeBuildingImage = (index: number) => {
    setBuildingImages((prev) => prev.filter((_, i) => i !== index));
    setBuildingPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRoomImages = (roomIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => URL.createObjectURL(f));
    const updated = [...rooms];
    updated[roomIndex].images = [...updated[roomIndex].images, ...files];
    updated[roomIndex].imagePreviews = [...updated[roomIndex].imagePreviews, ...previews];
    setRooms(updated);
  };

  const removeRoomImage = (roomIndex: number, imgIndex: number) => {
    const updated = [...rooms];
    updated[roomIndex].images = updated[roomIndex].images.filter((_, i) => i !== imgIndex);
    URL.revokeObjectURL(updated[roomIndex].imagePreviews[imgIndex]);
    updated[roomIndex].imagePreviews = updated[roomIndex].imagePreviews.filter((_, i) => i !== imgIndex);
    setRooms(updated);
  };

  const addRoom = () => {
    setRooms([...rooms, { name: "", sharingType: 2, pricePerMonth: 8000, totalBeds: 2, hasAc: false, images: [], imagePreviews: [] }]);
  };

  const updateRoom = (index: number, field: keyof RoomInput, value: any) => {
    const updated = [...rooms];
    (updated[index] as any)[field] = value;
    setRooms(updated);
  };

  const removeRoom = (index: number) => {
    if (rooms.length === 1) return;
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !city || rooms.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createPG.mutateAsync({
        name,
        description,
        address,
        city,
        area,
        gender,
        amenityIds: selectedAmenities,
        rules: rules.filter((r) => r.trim()),
        rooms: rooms.filter((r) => r.name && r.pricePerMonth > 0),
        buildingImages,
      });
      toast.success("PG listed successfully! 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to list PG");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container max-w-2xl">
          <h1 className="text-2xl font-extrabold text-foreground mb-2">List Your PG</h1>
          <p className="text-sm text-muted-foreground mb-8">Fill in the details to list your property on Livigo</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
              <h2 className="text-lg font-bold text-foreground">Basic Information</h2>
              <div className="space-y-2">
                <Label htmlFor="pg-name">PG Name *</Label>
                <Input id="pg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunrise Co-Living" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell tenants about your property..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bangalore" required />
                </div>
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Koramangala" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" required />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="flex gap-3">
                  {(["boys", "girls", "coliving"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        gender === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g === "boys" ? "Boys" : g === "girls" ? "Girls" : "Co-living"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Building Images */}
            <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
              <h2 className="text-lg font-bold text-foreground">Building / Property Images</h2>
              <p className="text-sm text-muted-foreground">Upload exterior, lobby, common areas, etc.</p>
              <input
                ref={buildingImgRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleBuildingImages}
                className="hidden"
              />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {buildingPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                    <img src={src} alt={`Building ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeBuildingImage(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => buildingImgRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Add</span>
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
              <h2 className="text-lg font-bold text-foreground">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenitiesList?.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedAmenities.includes(a.id)}
                      onCheckedChange={(checked) =>
                        setSelectedAmenities((prev) =>
                          checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                        )
                      }
                    />
                    <span className="text-sm text-foreground">{a.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rooms */}
            <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Rooms</h2>
                <Button type="button" variant="outline" size="sm" onClick={addRoom}>
                  <Plus className="w-4 h-4 mr-1" /> Add Room
                </Button>
              </div>
              {rooms.map((room, i) => (
                <div key={i} className="p-4 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Room {i + 1}</h4>
                    {rooms.length > 1 && (
                      <button type="button" onClick={() => removeRoom(i)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Room Name</Label>
                      <Input value={room.name} onChange={(e) => updateRoom(i, "name", e.target.value)} placeholder="Single Room" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sharing Type</Label>
                      <select
                        value={room.sharingType}
                        onChange={(e) => updateRoom(i, "sharingType", parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                      >
                        <option value={1}>Single</option>
                        <option value={2}>Double</option>
                        <option value={3}>Triple</option>
                        <option value={4}>4-Sharing</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price/Month (₹)</Label>
                      <Input type="number" value={room.pricePerMonth} onChange={(e) => updateRoom(i, "pricePerMonth", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total Beds</Label>
                      <Input type="number" value={room.totalBeds} onChange={(e) => updateRoom(i, "totalBeds", parseInt(e.target.value) || 1)} min={1} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={room.hasAc} onCheckedChange={(checked) => updateRoom(i, "hasAc", !!checked)} />
                    <span className="text-sm text-foreground">Has AC</span>
                  </label>

                  {/* Room Images */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1"><Image className="w-3 h-3" /> Room / Bed Photos</Label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      id={`room-img-${i}`}
                      onChange={(e) => handleRoomImages(i, e)}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      {room.imagePreviews.map((src, j) => (
                        <div key={j} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                          <img src={src} alt={`Room ${i + 1} - ${j + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeRoomImage(i, j)}
                            className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => document.getElementById(`room-img-${i}`)?.click()}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span className="text-[10px]">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div className="space-y-4 p-6 rounded-2xl border border-border bg-card">
              <h2 className="text-lg font-bold text-foreground">House Rules</h2>
              {rules.map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={rule}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[i] = e.target.value;
                      setRules(updated);
                    }}
                    placeholder={`Rule ${i + 1}`}
                  />
                  {rules.length > 1 && (
                    <button type="button" onClick={() => setRules(rules.filter((_, j) => j !== i))} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setRules([...rules, ""])}>
                <Plus className="w-4 h-4 mr-1" /> Add Rule
              </Button>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-xl text-base" disabled={createPG.isPending}>
              {createPG.isPending ? "Creating..." : "List My PG"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListProperty;
