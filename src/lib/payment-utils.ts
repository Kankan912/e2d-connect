export const ADHESION_TARIFS = {
  e2d: 30,
  phoenix: 50,
  both: 70,
} as const;

export type AdhesionType = keyof typeof ADHESION_TARIFS;

export const ADHESION_LABELS = {
  e2d: "E2D Connect",
  phoenix: "Phoenix Football Club",
  both: "E2D + Phoenix",
} as const;

export const DONATION_AMOUNTS = [25, 50, 100, 250, 500] as const;

export const RECURRING_FREQUENCIES = {
  once: "Don unique",
  monthly: "Don mensuel",
  yearly: "Don annuel",
} as const;

export type RecurringFrequency = keyof typeof RECURRING_FREQUENCIES;

export const CURRENCIES = {
  EUR: { symbol: "€", label: "Euro" },
  XOF: { symbol: "FCFA", label: "Franc CFA" },
} as const;

export type Currency = keyof typeof CURRENCIES;
