-- Add assists column to match_statistics table
ALTER TABLE public.match_statistics 
ADD COLUMN assists INTEGER NOT NULL DEFAULT 0;

-- Add beneficiaire_id column to reunions table for "celui qui doit recevoir"
ALTER TABLE public.reunions 
ADD COLUMN beneficiaire_id UUID REFERENCES public.membres(id);