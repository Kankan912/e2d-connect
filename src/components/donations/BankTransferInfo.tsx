import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function BankTransferInfo() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Copié !",
      description: `${label} copié dans le presse-papiers`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const bankInfo = {
    titulaire: "Association E2D Connect",
    banque: "Banque Exemple",
    iban: "FR76 1234 5678 9012 3456 7890 123",
    bic: "EXAMPLEXXX",
  };

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Coordonnées bancaires</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Titulaire</p>
              <p className="font-medium">{bankInfo.titulaire}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Banque</p>
              <p className="font-medium">{bankInfo.banque}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">IBAN</p>
              <p className="font-mono text-sm">{bankInfo.iban}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(bankInfo.iban, "IBAN")}
            >
              {copied === "IBAN" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">BIC</p>
              <p className="font-mono text-sm">{bankInfo.bic}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(bankInfo.bic, "BIC")}
            >
              {copied === "BIC" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p className="font-medium mb-2">Instructions :</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Effectuez le virement avec les coordonnées ci-dessus</li>
            <li>Indiquez "Don E2D Connect" comme référence</li>
            <li>Vous recevrez un reçu fiscal par email</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
