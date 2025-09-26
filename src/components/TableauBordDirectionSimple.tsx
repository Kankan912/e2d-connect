import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  PiggyBank, 
  Banknote, 
  AlertTriangle, 
  FileText,
  Settings,
  Trophy
} from "lucide-react";
import { Link } from "react-router-dom";
import LogoHeader from '@/components/LogoHeader';

export function TableauBordDirectionSimple() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <LogoHeader 
        title="E2D Association - Tableau de Bord"
        subtitle="Gestion complète de votre association"
      />

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membres
            </CardTitle>
            <CardDescription>
              Gérez les membres et leurs profils
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/membres">
              <Button className="w-full">
                Voir les membres
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Réunions
            </CardTitle>
            <CardDescription>
              Planifiez et gérez les réunions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/reunions">
              <Button className="w-full">
                Gérer les réunions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Finances
            </CardTitle>
            <CardDescription>
              Cotisations, épargnes et prêts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link to="/cotisations">
                <Button variant="outline" className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Cotisations
                </Button>
              </Link>
              <Link to="/epargnes">
                <Button variant="outline" className="w-full">
                  <PiggyBank className="w-4 h-4 mr-2" />
                  Épargnes
                </Button>
              </Link>
              <Link to="/prets">
                <Button variant="outline" className="w-full">
                  <Banknote className="w-4 h-4 mr-2" />
                  Prêts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Sport
            </CardTitle>
            <CardDescription>
              Gestion des activités sportives E2D et Phoenix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/sport">
              <Button className="w-full">
                Accéder au module Sport
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Paramètres et administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/configuration">
              <Button className="w-full">
                Paramètres
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Raccourcis utiles */}
      <Card>
        <CardHeader>
          <CardTitle>Raccourcis rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/sanctions">
              <Button variant="outline" className="w-full">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Sanctions
              </Button>
            </Link>
            <Link to="/aides">
              <Button variant="outline" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Aides
              </Button>
            </Link>
            <Link to="/rapports">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Rapports
              </Button>
            </Link>
            <Link to="/fond-caisse">
              <Button variant="outline" className="w-full">
                <DollarSign className="w-4 h-4 mr-2" />
                Fond de Caisse
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}