import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, ArrowLeft, Calendar, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoHeader from '@/components/LogoHeader';
import TeamDashboard from '@/components/TeamDashboard';
import CalendrierBeneficiaires from '@/components/CalendrierBeneficiaires';
import CardsToSanctionsSync from '@/components/CardsToSanctionsSync';

export default function SportEquipes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("equipes");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/sport")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour Sport
          </Button>
          <LogoHeader 
            title="Gestion Avancée Sport"
            subtitle="Équipes, calendrier et synchronisation"
          />
        </div>
      </div>

      {/* Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipes" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Équipes E2D
          </TabsTrigger>
          <TabsTrigger value="calendrier" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendrier Tontine
          </TabsTrigger>
          <TabsTrigger value="sanctions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Cartons → Sanctions
          </TabsTrigger>
          <TabsTrigger value="statistiques" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Équipes E2D */}
        <TabsContent value="equipes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Équipe Jaune */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  Équipe Jaune
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeamDashboard team="jaune" />
              </CardContent>
            </Card>

            {/* Équipe Rouge */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  Équipe Rouge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeamDashboard team="rouge" />
              </CardContent>
            </Card>
          </div>

          {/* Vue d'ensemble */}
          <Card>
            <CardHeader>
              <CardTitle>Matchs Jaune vs Rouge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Les matchs internes entre équipes Jaune et Rouge apparaîtront ici
                </p>
                <Button onClick={() => navigate("/sport-e2d")}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Programmer un match interne
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendrier Bénéficiaires */}
        <TabsContent value="calendrier">
          <CalendrierBeneficiaires />
        </TabsContent>

        {/* Synchronisation Cartons → Sanctions */}
        <TabsContent value="sanctions">
          <CardsToSanctionsSync />
        </TabsContent>

        {/* Statistiques avancées */}
        <TabsContent value="statistiques" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques Globales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Statistiques détaillées et rapports de performance
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate("/statistiques-matchs")}>
                    <Target className="h-4 w-4 mr-2" />
                    Voir Statistiques Matchs
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/match-results")}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Résultats Matchs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}