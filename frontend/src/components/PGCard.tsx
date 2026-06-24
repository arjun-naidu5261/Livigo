import { Star, MapPin, Users, Bed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface PGCardProps {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  bedsAvailable: number;
  gender: string;
  verified: boolean;
  amenities: string[];
}

const PGCard = ({ id, name, location, price, rating, reviews, image, bedsAvailable, gender, verified, amenities }: PGCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="group cursor-pointer" onClick={() => navigate(`/pg/${id}`)}>
      <div className="relative rounded-2xl overflow-hidden mb-3 aspect-[4/3] bg-secondary">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Bed className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        {verified && (
          <Badge className="absolute top-3 left-3 bg-success text-success-foreground text-xs">✓ Verified</Badge>
        )}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold text-foreground flex items-center gap-1">
          <Bed className="w-3 h-3 text-success" />
          {bedsAvailable} beds
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate mr-2">{name}</h3>
          <div className="flex items-center gap-1 text-sm shrink-0">
            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
            <span className="font-semibold text-foreground">{Number(rating).toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {gender}
          </div>
          <p className="text-foreground">
            <span className="font-bold text-lg">₹{price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">/mo</span>
          </p>
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {amenities.slice(0, 4).map((a) => (
              <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{a}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PGCard;
