import { z } from 'zod';

// Schémas de validation communs
export const phoneSchema = z.string()
  .regex(/^[\d\s\-\+\(\)]*$/, "Format de téléphone invalide")
  .optional()
  .or(z.literal(''));

export const emailSchema = z.string()
  .email("Format d'email invalide")
  .optional()
  .or(z.literal(''));

export const montantSchema = z.number()
  .positive("Le montant doit être positif")
  .min(1, "Le montant minimum est de 1 FCFA");

export const dateSchema = z.string()
  .refine((date) => {
    if (!date) return true;
    return !isNaN(Date.parse(date));
  }, "Format de date invalide");

// Schéma pour les membres
export const membreSchema = z.object({
  nom: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"),
  
  prenom: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes"),
  
  email: emailSchema,
  telephone: phoneSchema,
  
  statut: z.enum(['actif', 'inactif', 'suspendu'], {
    errorMap: () => ({ message: "Le statut doit être actif, inactif ou suspendu" })
  }),
  
  date_inscription: dateSchema,
  est_membre_e2d: z.boolean().default(true),
  est_adherent_phoenix: z.boolean().default(false)
});

// Schéma pour les cotisations
export const cotisationSchema = z.object({
  membre_id: z.string().uuid("ID membre invalide"),
  type_cotisation_id: z.string().uuid("ID type cotisation invalide"),
  montant: montantSchema,
  date_paiement: dateSchema,
  statut: z.enum(['paye', 'impaye', 'partiel'], {
    errorMap: () => ({ message: "Le statut doit être payé, impayé ou partiel" })
  }),
  notes: z.string().max(500, "Les notes ne peuvent pas dépasser 500 caractères").optional()
});

// Schéma pour les prêts
export const pretSchema = z.object({
  membre_id: z.string().uuid("ID membre invalide"),
  montant: montantSchema,
  taux_interet: z.number()
    .min(0, "Le taux d'intérêt ne peut pas être négatif")
    .max(50, "Le taux d'intérêt ne peut pas dépasser 50%")
    .default(5),
  date_pret: dateSchema,
  echeance: dateSchema,
  statut: z.enum(['en_cours', 'rembourse', 'en_retard', 'annule'], {
    errorMap: () => ({ message: "Statut de prêt invalide" })
  }),
  notes: z.string().max(1000, "Les notes ne peuvent pas dépasser 1000 caractères").optional()
});

// Schéma pour les aides
export const aideSchema = z.object({
  beneficiaire_id: z.string().uuid("ID bénéficiaire invalide"),
  type_aide_id: z.string().uuid("ID type aide invalide"),
  montant: montantSchema,
  date_allocation: dateSchema,
  statut: z.enum(['alloue', 'verse', 'annule'], {
    errorMap: () => ({ message: "Le statut doit être alloué, versé ou annulé" })
  }),
  notes: z.string().max(500, "Les notes ne peuvent pas dépasser 500 caractères").optional()
});

// Schéma pour les sanctions
export const sanctionSchema = z.object({
  membre_id: z.string().uuid("ID membre invalide"),
  type_sanction_id: z.string().uuid("ID type sanction invalide"),
  montant: montantSchema,
  date_sanction: dateSchema,
  motif: z.string()
    .min(10, "Le motif doit contenir au moins 10 caractères")
    .max(1000, "Le motif ne peut pas dépasser 1000 caractères"),
  statut: z.enum(['impaye', 'paye', 'annule'], {
    errorMap: () => ({ message: "Le statut doit être impayé, payé ou annulé" })
  })
});

// Schéma pour les épargnes
export const epargneSchema = z.object({
  membre_id: z.string().uuid("ID membre invalide"),
  montant: montantSchema,
  date_depot: dateSchema,
  statut: z.enum(['actif', 'retire', 'bloque'], {
    errorMap: () => ({ message: "Le statut doit être actif, retiré ou bloqué" })
  }),
  notes: z.string().max(500, "Les notes ne peuvent pas dépasser 500 caractères").optional()
});

// Schéma pour les réunions
export const reunionSchema = z.object({
  date_reunion: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return selectedDate >= now;
  }, "La date de réunion ne peut pas être dans le passé"),
  
  lieu_membre_id: z.string().uuid("ID membre hôte invalide").optional().or(z.literal('')),
  lieu_description: z.string().max(200, "La description du lieu ne peut pas dépasser 200 caractères").optional(),
  
  ordre_du_jour: z.string().max(2000, "L'ordre du jour ne peut pas dépasser 2000 caractères").optional(),
  
  statut: z.enum(['planifie', 'en_cours', 'terminee', 'annulee'], {
    errorMap: () => ({ message: "Statut de réunion invalide" })
  })
});

// Fonctions utilitaires de validation
export const validateMembre = (data: any) => {
  try {
    return { success: true, data: membreSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, data: null, errors: ['Erreur de validation inconnue'] };
  }
};

export const validateCotisation = (data: any) => {
  try {
    return { success: true, data: cotisationSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, data: null, errors: ['Erreur de validation inconnue'] };
  }
};

export const validatePret = (data: any) => {
  try {
    return { success: true, data: pretSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, data: null, errors: ['Erreur de validation inconnue'] };
  }
};

export const validateAide = (data: any) => {
  try {
    return { success: true, data: aideSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, data: null, errors: ['Erreur de validation inconnue'] };
  }
};

export const validateSanction = (data: any) => {
  try {
    return { success: true, data: sanctionSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, data: null, errors: ['Erreur de validation inconnue'] };
  }
};

export const validateEpargne = (data: any) => {
  try {
    return { success: true, data: epargneSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, data: null, errors: ['Erreur de validation inconnue'] };
  }
};

export const validateReunion = (data: any) => {
  try {
    return { success: true, data: reunionSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        data: null, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, data: null, errors: ['Erreur de validation inconnue'] };
  }
};