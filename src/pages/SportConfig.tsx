import LogoHeader from '@/components/LogoHeader';
import SportConfigForm from '@/components/forms/SportConfigForm';
import BackButton from '@/components/BackButton';

export default function SportConfig() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <LogoHeader 
          title="Configuration Sport"
          subtitle="Paramètres des équipes E2D et Phoenix"
        />
      </div>
      <SportConfigForm />
    </div>
  );
}