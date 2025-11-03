import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { membre_id, card_type, match_id, match_type = 'e2d' } = await req.json();

    if (!membre_id || !card_type) {
      throw new Error('membre_id et card_type sont requis');
    }

    console.log('[CREATE_SANCTION] Données reçues:', { membre_id, card_type, match_id, match_type });

    // 1. Récupérer le type de sanction selon le carton
    const sanctionTypeNom = card_type === 'jaune' ? 'Carton Jaune' : 'Carton Rouge';
    
    const { data: sanctionType, error: typeError } = await supabaseClient
      .from('sanctions_types')
      .select('id, montant')
      .eq('nom', sanctionTypeNom)
      .eq('contexte', 'sport')
      .maybeSingle();

    if (typeError) {
      console.error('[CREATE_SANCTION] Erreur recherche type sanction:', typeError);
      throw typeError;
    }

    if (!sanctionType) {
      console.warn(`[CREATE_SANCTION] Type de sanction "${sanctionTypeNom}" non trouvé, création automatique`);
      
      // Créer le type de sanction s'il n'existe pas
      const defaultMontant = card_type === 'jaune' ? 1000 : 3000;
      const { data: newType, error: createError } = await supabaseClient
        .from('sanctions_types')
        .insert([{
          nom: sanctionTypeNom,
          montant: defaultMontant,
          contexte: 'sport',
          categorie: 'cartons'
        }])
        .select()
        .single();

      if (createError) {
        console.error('[CREATE_SANCTION] Erreur création type sanction:', createError);
        throw createError;
      }

      console.log('[CREATE_SANCTION] Type de sanction créé:', newType);
    }

    // Utiliser le type trouvé ou créé
    const finalSanctionType = sanctionType || (await supabaseClient
      .from('sanctions_types')
      .select('id, montant')
      .eq('nom', sanctionTypeNom)
      .single()).data;

    // 2. Créer la sanction
    const { data: sanction, error: sanctionError } = await supabaseClient
      .from('sanctions')
      .insert([{
        membre_id,
        type_sanction_id: finalSanctionType.id,
        montant: finalSanctionType.montant,
        date_sanction: new Date().toISOString().split('T')[0],
        statut: 'impaye',
        motif: `${sanctionTypeNom} reçu lors du match${match_id ? ` (ID: ${match_id})` : ''}`,
        contexte_sanction: 'sport'
      }])
      .select()
      .single();

    if (sanctionError) {
      console.error('[CREATE_SANCTION] Erreur création sanction:', sanctionError);
      throw sanctionError;
    }

    console.log('[CREATE_SANCTION] Sanction créée avec succès:', sanction);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sanction,
        message: `Sanction de ${finalSanctionType.montant} FCFA créée pour ${sanctionTypeNom}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[CREATE_SANCTION] Erreur:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erreur lors de la création automatique de la sanction'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    );
  }
});