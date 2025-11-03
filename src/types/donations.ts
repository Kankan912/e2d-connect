export interface Donation {
  id: string;
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  donor_message?: string;
  receipt_sent: boolean;
  created_at: string;
}

export interface PaymentConfig {
  id: string;
  provider: string;
  config?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface Adhesion {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_adhesion: "e2d" | "phoenix" | "both";
  montant_paye: number;
  payment_method: string;
  payment_status: string;
  message?: string;
  created_at: string;
  updated_at: string;
}
