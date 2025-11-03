import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { DONATION_AMOUNTS, RECURRING_FREQUENCIES, CURRENCIES, type RecurringFrequency, type Currency } from "@/lib/payment-utils";
import { cn } from "@/lib/utils";

interface DonationAmountSelectorProps {
  amount: number;
  setAmount: (amount: number) => void;
  frequency: RecurringFrequency;
  setFrequency: (frequency: RecurringFrequency) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export function DonationAmountSelector({
  amount,
  setAmount,
  frequency,
  setFrequency,
  currency,
  setCurrency,
}: DonationAmountSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Montants prédéfinis */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Montant du don</Label>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {DONATION_AMOUNTS.map((presetAmount) => (
            <Button
              key={presetAmount}
              type="button"
              variant={amount === presetAmount ? "default" : "outline"}
              className={cn(
                "h-16 text-lg font-semibold",
                amount === presetAmount && "ring-2 ring-primary"
              )}
              onClick={() => setAmount(presetAmount)}
            >
              {presetAmount} {CURRENCIES[currency].symbol}
            </Button>
          ))}
        </div>

        {/* Montant personnalisé */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Autre montant"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="text-lg h-12"
          />
          <span className="text-lg font-medium text-muted-foreground">{CURRENCIES[currency].symbol}</span>
        </div>
      </div>

      {/* Fréquence */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Fréquence</Label>
        <RadioGroup value={frequency} onValueChange={(value) => setFrequency(value as RecurringFrequency)}>
          {Object.entries(RECURRING_FREQUENCIES).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <RadioGroupItem value={key} id={key} />
              <Label htmlFor={key} className="cursor-pointer font-normal">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Devise */}
      <div className="flex items-center justify-between">
        <Label htmlFor="currency" className="text-base font-semibold">Devise</Label>
        <div className="flex items-center gap-3">
          <span className={cn("font-medium", currency === "EUR" && "text-primary")}>EUR (€)</span>
          <Switch
            id="currency"
            checked={currency === "XOF"}
            onCheckedChange={(checked) => setCurrency(checked ? "XOF" : "EUR")}
          />
          <span className={cn("font-medium", currency === "XOF" && "text-primary")}>XOF (FCFA)</span>
        </div>
      </div>
    </div>
  );
}
