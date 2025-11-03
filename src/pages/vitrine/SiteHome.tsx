import Navbar from "@/components/vitrine/Navbar";
import Hero from "@/components/vitrine/Hero";
import About from "@/components/vitrine/About";
import Activities from "@/components/vitrine/Activities";
import Events from "@/components/vitrine/Events";
import Gallery from "@/components/vitrine/Gallery";
import Partners from "@/components/vitrine/Partners";
import Contact from "@/components/vitrine/Contact";
import Footer from "@/components/vitrine/Footer";

export default function SiteHome() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <About />
      <Activities />
      <Events />
      <Gallery />
      <Partners />
      <Contact />
      <Footer />
    </div>
  );
}
