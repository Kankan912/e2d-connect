
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Membres from "./pages/Membres";
import MembresWrapped from "./pages/MembresWrapped";
import Cotisations from "./pages/Cotisations";
import CotisationsGrid from "./pages/CotisationsGrid";
import Prets from "./pages/Prets";
import Sanctions from "./pages/Sanctions";
import Epargnes from "./pages/Epargnes";
import Aides from "./pages/Aides";
import AidesReunion from "./pages/AidesReunion";
import AidesSport from "./pages/AidesSport";
import SanctionsReunionPage from "./pages/SanctionsReunionPage";
import SanctionsSportPage from "./pages/SanctionsSportPage";
import Reunions from "./pages/Reunions";
import Configuration from "./pages/Configuration";
import SportE2D from "./pages/SportE2D";
import SportEquipes from "./pages/SportEquipes";
import Rapports from "./pages/Rapports";
import CalendrierSportif from "./pages/CalendrierSportif";
import EligibiliteGala from "./pages/EligibiliteGala";
import MatchResults from "./pages/MatchResults";
import GestionPresences from "./pages/GestionPresences";
import HistoriqueConnexion from "./pages/HistoriqueConnexion";
import SportConfig from "./pages/SportConfig";
import MembreCotisationConfig from "./pages/MembreCotisationConfig";
import MembreFiche from "./pages/MembreFiche";
import ConfigurationGenerale from "./pages/ConfigurationGenerale";
import StatistiquesMatchs from "./pages/StatistiquesMatchs";
import PresenceReunions from "./pages/PresenceReunions";
import Sport from "./pages/Sport";
import SportE2DFinances from "./pages/SportE2DFinances";
import PhoenixAdherents from "./pages/PhoenixAdherents";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import FondCaissePage from "./pages/FondCaisse";
import GestionPhotosPage from "./pages/GestionPhotosPage";
import NotificationsAvanceesPage from "./pages/NotificationsAvanceesPage";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Ne pas retry sur les erreurs d'autorisation
        if (error?.code === '42501' || error?.message?.includes('403')) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Router>
            {!session ? (
              <Auth />
            ) : (
              <Layout user={session?.user}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/membres" element={<Membres />} />
                  <Route path="/membres-wrapped" element={<MembresWrapped />} />
                  <Route path="/membre/:id" element={<MembreFiche />} />
                  <Route path="/gestion-photos" element={<GestionPhotosPage />} />
                  <Route path="/cotisations" element={<Cotisations />} />
                  <Route path="/cotisations-grid" element={<CotisationsGrid />} />
                  <Route path="/membre-cotisation-config" element={<MembreCotisationConfig />} />
                  <Route path="/prets" element={<Prets />} />
                  <Route path="/sanctions" element={<Sanctions />} />
                  <Route path="/sanctions-sport" element={<Navigate to="/sport" />} />
                  <Route path="/sanctions-reunion" element={<Navigate to="/reunions" />} />
                  <Route path="/epargnes" element={<Epargnes />} />
                  <Route path="/aides" element={<Aides />} />
                  <Route path="/aides-reunion" element={<AidesReunion />} />
                  <Route path="/aides-sport" element={<AidesSport />} />
                  <Route path="/sanctions-reunion" element={<Navigate to="/sanctions-reunion-page" />} />
                  <Route path="/sanctions-reunion-page" element={<SanctionsReunionPage />} />
                  <Route path="/sanctions-sport-page" element={<SanctionsSportPage />} />
                  <Route path="/reunions" element={<Reunions />} />
                  <Route path="/presence-reunions" element={<PresenceReunions />} />
                  <Route path="/fond-caisse" element={<FondCaissePage />} />
                  <Route path="/notifications-avancees" element={<NotificationsAvanceesPage />} />
                  <Route path="/sport" element={<Sport />} />
                  <Route path="/sport-e2d-finances" element={<SportE2DFinances />} />
                  <Route path="/sport/statistiques" element={<Navigate to="/sport" />} />
                  <Route path="/sport-e2d" element={<Navigate to="/sport" />} />
                  <Route path="/sport-equipes" element={<SportEquipes />} />
                  <Route path="/phoenix-adherents" element={<PhoenixAdherents />} />
                  <Route path="/calendrier-sportif" element={<Navigate to="/sport" />} />
                  <Route path="/calendrier" element={<Navigate to="/sport" />} />
                  <Route path="/match-results" element={<Navigate to="/sport" />} />
                  <Route path="/resultats-matchs" element={<Navigate to="/sport" />} />
                  <Route path="/eligibilite-gala" element={<EligibiliteGala />} />
                  <Route path="/gestion-presences" element={<Navigate to="/sport" />} />
                  <Route path="/presences" element={<Navigate to="/sport" />} />
                  <Route path="/sport-config" element={<SportConfig />} />
                  <Route path="/historique-connexion" element={<HistoriqueConnexion />} />
                  <Route path="/rapports" element={<Rapports />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/configuration" element={<Configuration />} />
                  <Route path="/configuration-generale" element={<ConfigurationGenerale />} />
                  <Route path="/statistiques-matchs" element={<StatistiquesMatchs />} />
                  <Route path="/auth" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            )}
          </Router>
          <Toaster />
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
