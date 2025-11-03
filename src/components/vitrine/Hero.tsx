import { useNavigate } from "react-router-dom";
import { Users, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=80"
          alt="Équipe sportive E2D"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in">
            Ensemble pour la Passion du Sport
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl animate-fade-in-delay">
            Excellence • Solidarité • Dépassement • Fair-play
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8 max-w-2xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-cyan-400" />
                <div className="text-3xl md:text-4xl font-bold text-white">40+</div>
              </div>
              <div className="text-sm text-white/80">Membres</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-cyan-400" />
                <div className="text-3xl md:text-4xl font-bold text-white">3+</div>
              </div>
              <div className="text-sm text-white/80">Tournois</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-6 h-6 text-cyan-400" />
                <div className="text-3xl md:text-4xl font-bold text-white">6+</div>
              </div>
              <div className="text-sm text-white/80">Années</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg px-8 py-6"
              onClick={() => navigate("/site/adhesion")}
            >
              Nous Rejoindre
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-6"
              onClick={() => scrollToSection("#about")}
            >
              En Savoir Plus
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
