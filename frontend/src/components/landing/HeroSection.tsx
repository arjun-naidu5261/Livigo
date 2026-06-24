import { Search, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-coliving.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImg} alt="Co-living space" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-foreground/20" />
      </div>

      <div className="container relative z-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-xs font-medium mb-6 backdrop-blur-sm border border-primary-foreground/10">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Real-time availability
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary-foreground leading-[1.1] mb-5">
              Find Your Perfect
              <br />
              <span className="text-gradient">PG & Co-Living</span>
              <br />
              Space
            </h1>

            <p className="text-lg text-primary-foreground/70 mb-8 max-w-lg leading-relaxed">
              Real-time bed availability. Instant booking. No broker fees.
              Join 10,000+ residents living better with Livigo.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-background rounded-2xl p-2 shadow-elevated flex flex-col sm:flex-row gap-2 max-w-xl"
          >
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Enter city or area..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                onKeyDown={(e) => e.key === "Enter" && navigate("/search")}
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary sm:max-w-[140px]">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <select className="bg-transparent text-sm text-foreground outline-none w-full appearance-none cursor-pointer">
                <option>Any</option>
                <option>Boys</option>
                <option>Girls</option>
                <option>Co-living</option>
              </select>
            </div>
            <Button size="lg" className="rounded-xl px-6" onClick={() => navigate("/search")}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-8 mt-10"
          >
            {[
              { value: "500+", label: "Verified PGs" },
              { value: "10K+", label: "Happy Residents" },
              { value: "50+", label: "Cities" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-primary-foreground">{stat.value}</div>
                <div className="text-xs text-primary-foreground/50">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
