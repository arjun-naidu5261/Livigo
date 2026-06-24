import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30 py-16">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-sm">L</span>
              </div>
              <span className="font-heading font-bold text-xl text-foreground">Livigo</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              India's first real-time PG booking platform. Find, book, and live — all in one place.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">For Tenants</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-foreground transition-colors">Search PGs</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Safety</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">For Owners</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/list-property" className="hover:text-foreground transition-colors">List Property</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Owner Dashboard</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Livigo Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
