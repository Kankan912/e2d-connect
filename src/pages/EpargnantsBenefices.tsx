import EpargnantsBenefices from '@/components/EpargnantsBenefices';
import BackButton from '@/components/BackButton';

export default function EpargnantsBeneficesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/epargnes" />
      </div>
      <EpargnantsBenefices />
    </div>
  );
}