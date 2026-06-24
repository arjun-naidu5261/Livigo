import { Star, MapPin, Users, Bed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePGList } from "@/hooks/use-pgs";
import { Skeleton } from "@/components/ui/skeleton";

const genderLabel: Record<string, string> = { boys: "Boys", girls: "Girls", coliving: "Co-living" };

const FeaturedPGsSection = () => {
  const navigate = useNavigate();
  const { data: pgs, isLoading } = usePGList();

  const featured = (pgs || []).slice(0, 6);

  if (isLoading) {
    return (
      <section className="py-24">
        <div className="container">
          <Skeleton className="h-8 w-64 mb-12" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featured.length === 0) {
    return (
      <section className="py-24">
        <div className="container text-center">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Featured</span>
          <h2 className="text-3xl font-extrabold text-foreground mt-2 mb-4">Popular PGs Near You</h2>
          <p className="text-muted-foreground">No PGs listed yet. Be the first to list your property!</p>
          <Button className="mt-4" onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24">
      <div className="container">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Featured</span>
            <h2 className="text-3xl font-extrabold text-foreground mt-2">Popular PGs Near You</h2>
          </div>
          <Button variant="outline" onClick={() => navigate("/search")} className="hidden sm:flex">
            View All
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((pg, i) => (
            <motion.div
              key={pg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
              onClick={() => navigate(`/pg/${pg.id}`)}
            >
              <div className="relative rounded-2xl overflow-hidden mb-3 aspect-[4/3] bg-secondary">
                <div className="w-full h-full flex items-center justify-center">
                  <Bed className="w-12 h-12 text-muted-foreground/30" />
                </div>
                {pg.verified && (
                  <Badge className="absolute top-3 left-3 bg-success text-success-foreground text-xs">
                    ✓ Verified
                  </Badge>
                )}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold text-foreground flex items-center gap-1">
                  <Bed className="w-3 h-3 text-success" />
                  {pg.available_beds} beds left
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{pg.name}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                    <span className="font-semibold text-foreground">{pg.avg_rating}</span>
                    <span className="text-muted-foreground">({pg.review_count})</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {pg.area ? `${pg.area}, ` : ""}{pg.city}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {genderLabel[pg.gender] || pg.gender}
                  </div>
                  <p className="text-foreground">
                    <span className="font-bold text-lg">₹{pg.min_price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">/month</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="sm:hidden mt-8 text-center">
          <Button variant="outline" onClick={() => navigate("/search")}>
            View All PGs
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPGsSection;
