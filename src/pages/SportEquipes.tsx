import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoHeader from '@/components/LogoHeader';
import GestionEquipes from '@/components/GestionEquipes';

export default function SportEquipes() {
  const navigate = useNavigate();

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
            title="Gestion des Équipes"
            subtitle="Attribution et gestion des équipes E2D"
          />
        </div>
      </div>

      {/* Composant de gestion des équipes */}
      <GestionEquipes />
    </div>
  );
}