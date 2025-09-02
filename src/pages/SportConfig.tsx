import LogoHeader from '@/components/LogoHeader';
import SportConfigForm from '@/components/forms/SportConfigForm';

export default function SportConfig() {
  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Configuration Sport"
        subtitle="Paramètres des équipes E2D et Phoenix"
      />
      <SportConfigForm />
    </div>
  );
}