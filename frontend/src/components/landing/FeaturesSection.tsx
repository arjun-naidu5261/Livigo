import { Bed, Shield, Zap, MapPin, CreditCard, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Bed,
    title: "Real-Time Availability",
    description: "See exactly how many beds are free right now. No more calling around.",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Book your bed in seconds with secure payment. Move in same day.",
  },
  {
    icon: Shield,
    title: "Verified Properties",
    description: "Every PG is physically verified. Safety-first, especially for women.",
  },
  {
    icon: MapPin,
    title: "Map-Based Search",
    description: "Find PGs near your office, college, or anywhere you need to be.",
  },
  {
    icon: CreditCard,
    title: "Digital Payments",
    description: "Pay rent online, track expenses, get automated reminders.",
  },
  {
    icon: MessageSquare,
    title: "Community & Chat",
    description: "Connect with roommates, join PG events, find local services.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Why Livigo</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mt-3">
            Not Just a PG Finder.
            <br />
            A Living Ecosystem.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            From searching to settling in, Livigo handles everything so you can focus on living.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:shadow-card-hover hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
