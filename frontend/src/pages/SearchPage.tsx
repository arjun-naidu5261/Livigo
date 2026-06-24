import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PGSearchSection from "@/components/PGSearchSection";

const SearchPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="container">
          <PGSearchSection />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
