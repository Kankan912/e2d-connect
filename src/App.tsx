import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Membres from "./pages/Membres";
import Cotisations from "./pages/Cotisations";
import SportPhoenix from "./pages/SportPhoenix";
import Rapports from "./pages/Rapports";
import Prets from "./pages/Prets";
import Epargnes from "./pages/Epargnes";
import Aides from "./pages/Aides";
import Sanctions from "./pages/Sanctions";
import Reunions from "./pages/Reunions";
import SportE2D from "./pages/SportE2D";
import Configuration from "./pages/Configuration";
import CotisationsGrid from "./pages/CotisationsGrid";
import NotFound from "./pages/NotFound";
import Layout from "@/components/Layout";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<Index user={user} />} />
                <Route path="/membres" element={
                  <Layout user={user}>
                    <Membres />
                  </Layout>
                } />
                <Route path="/cotisations" element={
                  <Layout user={user}>
                    <Cotisations />
                  </Layout>
                } />
                <Route path="/cotisations-grid" element={
                  <Layout user={user}>
                    <CotisationsGrid />
                  </Layout>
                } />
                <Route path="/sport-phoenix" element={
                  <Layout user={user}>
                    <SportPhoenix />
                  </Layout>
                } />
                <Route path="/rapports" element={
                  <Layout user={user}>
                    <Rapports />
                  </Layout>
                } />
                <Route path="/prets" element={
                  <Layout user={user}>
                    <Prets />
                  </Layout>
                } />
                <Route path="/epargnes" element={
                  <Layout user={user}>
                    <Epargnes />
                  </Layout>
                } />
                <Route path="/aides" element={
                  <Layout user={user}>
                    <Aides />
                  </Layout>
                } />
                <Route path="/sanctions" element={
                  <Layout user={user}>
                    <Sanctions />
                  </Layout>
                } />
                <Route path="/reunions" element={
                  <Layout user={user}>
                    <Reunions />
                  </Layout>
                } />
                <Route path="/sport-e2d" element={
                  <Layout user={user}>
                    <SportE2D />
                  </Layout>
                } />
                <Route path="/configuration" element={
                  <Layout user={user}>
                    <Configuration />
                  </Layout>
                } />
              </>
            ) : (
              <Route path="*" element={<Auth />} />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
