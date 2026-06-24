import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MapPin, X, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PGCard from "@/components/PGCard";
import { motion } from "framer-motion";
import { usePGList } from "@/hooks/use-pgs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const genderFilters = ["All", "Boys", "Girls", "Co-living"];
const amenityFilters = ["AC", "WiFi", "Food (3 meals)", "Gym", "Laundry", "CCTV", "Parking"];
const sharingFilters = ["Any", "1", "2", "3", "4+"];
const genderLabel: Record<string, string> = { boys: "Boys", girls: "Girls", coliving: "Co-living" };

interface PGSearchSectionProps {
  showLocationPrompt?: boolean;
}

const PGSearchSection = ({ showLocationPrompt = true }: PGSearchSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedSharing, setSelectedSharing] = useState("Any");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2 && showSuggestions) {
      const delayFn = setTimeout(async () => {
        try {
          const userCity = localStorage.getItem("user_location");
          const queryStr = userCity && !searchQuery.toLowerCase().includes(userCity.toLowerCase())
            ? `${searchQuery} ${userCity}`
            : searchQuery;

          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&countrycodes=in&limit=5&addressdetails=1`);
          const data = await res.json();

          const formatted = data.map((s: any) => {
            const area = s.address?.neighbourhood || s.address?.suburb || s.address?.residential || s.name;
            const city = s.address?.city || s.address?.town || s.address?.state_district || "";
            return {
              ...s,
              custom_display: city ? `${area}, ${city}` : area,
            };
          });

          const unique = formatted.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.custom_display === v.custom_display) === i);
          setSuggestions(unique);
        } catch {
          console.error("Failed to fetch suggestions");
        }
      }, 500);
      return () => clearTimeout(delayFn);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, showSuggestions]);

  useEffect(() => {
    if (!showLocationPrompt) return;
    const savedLocation = localStorage.getItem("user_location");
    if (savedLocation) {
      setSearchQuery(savedLocation);
    } else {
      setShowLocationModal(true);
    }
  }, [showLocationPrompt]);

  const handleSuggestionClick = (suggestion: any) => {
    setSearchQuery(suggestion.custom_display);
    setShowSuggestions(false);
  };

  const handleAllowLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.state_district;
          if (city) {
            setSearchQuery(city);
            localStorage.setItem("user_location", city);
            toast.success(`Location set to ${city}`);
          } else {
            toast.error("Could not determine city from location");
          }
          setShowLocationModal(false);
        } catch {
          toast.error("Failed to get location name");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        toast.error("Location permission denied. You can enter it manually.");
        setShowLocationModal(false);
      }
    );
  };

  const { data: pgs, isLoading } = usePGList({
    search: searchQuery || undefined,
    gender: selectedGender,
    sharing: selectedSharing !== "Any" ? selectedSharing.replace("+", "") : undefined,
    amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, city, area..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSuggestions([]); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-secondary transition-colors border-b border-border last:border-0 flex items-start gap-2"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="truncate text-foreground">{s.custom_display}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {(selectedGender !== "All" || selectedSharing !== "Any" || selectedAmenities.length > 0) && (
            <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
              {(selectedGender !== "All" ? 1 : 0) + (selectedSharing !== "Any" ? 1 : 0) + selectedAmenities.length}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 p-4 rounded-2xl bg-card border border-border">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Gender</h4>
            <div className="flex flex-wrap gap-2">
              {genderFilters.map((g) => (
                <button key={g} onClick={() => setSelectedGender(g)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedGender === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Sharing Type</h4>
            <div className="flex flex-wrap gap-2">
              {sharingFilters.map((s) => (
                <button key={s} onClick={() => setSelectedSharing(s)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedSharing === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {s === "Any" ? "Any" : `${s} Sharing`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {amenityFilters.map((a) => (
                <button key={a} onClick={() => toggleAmenity(a)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedAmenities.includes(a) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Searching..." : <><span className="font-semibold text-foreground">{pgs?.length || 0}</span> PGs found</>}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : pgs && pgs.length > 0 ? (
            pgs.map((pg, i) => (
              <motion.div key={pg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <PGCard
                  id={pg.id}
                  name={pg.name}
                  location={`${pg.area ? pg.area + ", " : ""}${pg.city}`}
                  price={pg.min_price}
                  rating={pg.avg_rating}
                  reviews={pg.review_count}
                  image=""
                  bedsAvailable={pg.available_beds}
                  gender={genderLabel[pg.gender] || pg.gender}
                  verified={pg.verified}
                  amenities={[]}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No PGs found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
      </div>

      {showLocationPrompt && (
        <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
          <DialogContent className="sm:max-w-md text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Map className="w-8 h-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl text-center">Allow Location Access</DialogTitle>
              <DialogDescription className="text-center pt-2">
                To show the best PGs and Hostels near you, we need your current location. Or you can enter it manually in the search bar.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button onClick={handleAllowLocation} disabled={locationLoading} className="w-full rounded-xl py-6 text-md">
                {locationLoading ? "Fetching..." : "Allow Location"}
              </Button>
              <Button variant="outline" onClick={() => setShowLocationModal(false)} className="w-full rounded-xl py-6 text-md">
                Enter Manually
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PGSearchSection;
