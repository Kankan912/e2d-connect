import TableauBordPrets from '@/components/TableauBordPrets';
import BackButton from '@/components/BackButton';
import LogoHeader from '@/components/LogoHeader';

export default function PretsTableauBordPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/prets" />
        <LogoHeader 
          title="Tableau de Bord des Prêts"
          subtitle="Indicateurs financiers et statistiques détaillées"
        />
      </div>
      <TableauBordPrets />
    </div>
  );
}