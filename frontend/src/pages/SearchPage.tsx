import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, X, Bed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PGCard from "@/components/PGCard";
import { motion } from "framer-motion";
import { usePGList } from "@/hooks/use-pgs";
import { Skeleton } from "@/components/ui/skeleton";

const genderFilters = ["All", "Boys", "Girls", "Co-living"];
const amenityFilters = ["AC", "WiFi", "Food (3 meals)", "Gym", "Laundry", "CCTV", "Parking"];
const genderLabel: Record<string, string> = { boys: "Boys", girls: "Girls", coliving: "Co-living" };

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: pgs, isLoading } = usePGList({
    search: searchQuery || undefined,
    gender: selectedGender,
    amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="container">
          {/* Search Header */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, city, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {(selectedGender !== "All" || selectedAmenities.length > 0) && (
                <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                  {(selectedGender !== "All" ? 1 : 0) + selectedAmenities.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters */}
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

          {/* Results */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Searching..." : <><span className="font-semibold text-foreground">{pgs?.length || 0}</span> PGs found</>}
            </p>
          </div>

          {/* Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="grid sm:grid-cols-2 gap-6 order-2 lg:order-1">
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
                <div className="col-span-2 py-20 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No PGs found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>

            {/* Map Placeholder */}
            <div className="order-1 lg:order-2 sticky top-20 h-[calc(100vh-6rem)] rounded-2xl bg-secondary border border-border overflow-hidden hidden lg:flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Map View</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Interactive map coming soon with real PG locations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
