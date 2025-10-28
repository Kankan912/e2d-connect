import CotisationsConfigManager from '@/components/CotisationsConfigManager';
import BackButton from '@/components/BackButton';

export default function ConfigurationCotisations() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/configuration" />
        <h1 className="text-3xl font-bold">Configuration Cotisations</h1>
      </div>
      <CotisationsConfigManager />
    </div>
  );
}
