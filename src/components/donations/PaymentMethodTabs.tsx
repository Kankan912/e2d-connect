import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankTransferInfo } from "./BankTransferInfo";
import { CreditCard, Smartphone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentMethodTabsProps {
  onSubmit: (paymentMethod: string) => void;
  loading: boolean;
}

export function PaymentMethodTabs({ onSubmit, loading }: PaymentMethodTabsProps) {
  return (
    <Tabs defaultValue="bank_transfer" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="bank_transfer" className="gap-2">
          <Building2 className="h-4 w-4" />
          Virement
        </TabsTrigger>
        <TabsTrigger value="wave" disabled className="gap-2">
          <Smartphone className="h-4 w-4" />
          Wave
        </TabsTrigger>
        <TabsTrigger value="orange_money" disabled className="gap-2">
          <Smartphone className="h-4 w-4" />
          Orange Money
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bank_transfer" className="space-y-4">
        <BankTransferInfo />
        <Button
          type="button"
          onClick={() => onSubmit("bank_transfer")}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? "Traitement..." : "Confirmer le Don"}
        </Button>
      </TabsContent>

      <TabsContent value="wave" className="space-y-4">
        <p className="text-muted-foreground text-center py-8">
          Le paiement Wave sera bientôt disponible.
        </p>
      </TabsContent>

      <TabsContent value="orange_money" className="space-y-4">
        <p className="text-muted-foreground text-center py-8">
          Le paiement Orange Money sera bientôt disponible.
        </p>
      </TabsContent>
    </Tabs>
  );
}
