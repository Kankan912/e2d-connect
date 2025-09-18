import React from 'react';
import { FondDeCaisse } from '@/components/FondDeCaisse';
import LogoHeader from '@/components/LogoHeader';

const FondCaissePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <LogoHeader />
      <main className="container mx-auto px-4 py-8">
        <FondDeCaisse />
      </main>
    </div>
  );
};

export default FondCaissePage;