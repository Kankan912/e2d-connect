import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DonationSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export function DonationSuccessModal({
  open,
  onOpenChange,
  amount,
  currency,
  paymentMethod,
}: DonationSuccessModalProps) {
  const navigate = useNavigate();

  const handleReturnHome = () => {
    onOpenChange(false);
    navigate("/site");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl">Don Enregistré !</DialogTitle>
          <DialogDescription className="text-center">
            Merci pour votre générosité. Votre don contribue à nos actions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant :</span>
              <span className="font-semibold text-lg">
                {amount} {currency === "EUR" ? "€" : "FCFA"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Méthode :</span>
              <span className="font-medium">
                {paymentMethod === "bank_transfer" && "Virement Bancaire"}
                {paymentMethod === "wave" && "Wave"}
                {paymentMethod === "orange_money" && "Orange Money"}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Un reçu fiscal vous sera envoyé par email dans les prochains jours.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReturnHome} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          <Button variant="default" className="w-full" disabled>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le reçu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
