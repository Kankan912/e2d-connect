import React from 'react';
import { GestionPhotos } from '@/components/GestionPhotos';
import LogoHeader from '@/components/LogoHeader';

const GestionPhotosPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <LogoHeader />
      <main className="container mx-auto px-4 py-8">
        <GestionPhotos />
      </main>
    </div>
  );
};

export default GestionPhotosPage;