import { Button } from "@/components/ui/button";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import SportPhoenixFinancesManager from "@/components/SportPhoenixFinancesManager";

export default function SportPhoenixFinances() {
  const { goBack, BackIcon } = useBackNavigation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goBack}>
            <BackIcon className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <LogoHeader 
            title="Finances Sport Phoenix"
            subtitle="Gestion financière indépendante du club Phoenix"
          />
        </div>
      </div>

      <SportPhoenixFinancesManager />
    </div>
  );
}