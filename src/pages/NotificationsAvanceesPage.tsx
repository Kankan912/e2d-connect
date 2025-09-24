import React from 'react';
import { NotificationsAvancees } from '@/components/NotificationsAvancees';
import LogoHeader from '@/components/LogoHeader';
import BackButton from '@/components/BackButton';

export const NotificationsAvanceesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <LogoHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <BackButton />
          <NotificationsAvancees />
        </div>
      </main>
    </div>
  );
};

export default NotificationsAvanceesPage;