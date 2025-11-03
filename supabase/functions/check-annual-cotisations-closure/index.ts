// CORRECTION 9: Edge function pour détecter cotisations annuelles non soldées en fin d'exercice
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExerciceProche {
  id: string;
  nom: string;
  date_fin: string;
}

interface CotisationImpayee {
  id: string;
  montant: number;
  membres: {
    nom: string;
    prenom: string;
    email: string;
  };
  cotisations_types: {
    nom: string;
    obligatoire: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [CHECK-ANNUAL-COT] Début vérification cotisations annuelles');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Calculer la date 7 jours dans le futur
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysIso = sevenDaysFromNow.toISOString().split('T')[0];

    console.log(`📅 [CHECK-ANNUAL-COT] Recherche exercices se terminant avant: ${sevenDaysIso}`);

    // 2. Trouver exercices actifs se terminant dans moins de 7 jours
    const { data: exercicesProches, error: exercicesError } = await supabase
      .from('exercices')
      .select('id, nom, date_fin')
      .lte('date_fin', sevenDaysIso)
      .eq('statut', 'actif');

    if (exercicesError) {
      console.error('❌ [CHECK-ANNUAL-COT] Erreur chargement exercices:', exercicesError);
      throw exercicesError;
    }

    if (!exercicesProches || exercicesProches.length === 0) {
      console.log('✅ [CHECK-ANNUAL-COT] Aucun exercice proche de la clôture');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Aucun exercice proche de la clôture',
          exercices_traites: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`🎯 [CHECK-ANNUAL-COT] ${exercicesProches.length} exercice(s) proche(s) de la clôture`);

    let totalCotisationsUpdated = 0;
    const notifications = [];

    // 3. Pour chaque exercice proche
    for (const exercice of exercicesProches as ExerciceProche[]) {
      console.log(`\n📊 [CHECK-ANNUAL-COT] Traitement exercice: ${exercice.nom}`);

      // 4. Trouver cotisations impayées OBLIGATOIRES pour cet exercice
      const { data: cotisationsImpayees, error: cotisationsError } = await supabase
        .from('cotisations')
        .select(`
          id,
          montant,
          statut,
          membres:membre_id(nom, prenom, email),
          cotisations_types:type_cotisation_id(nom, obligatoire)
        `)
        .eq('exercice_id', exercice.id)
        .neq('statut', 'paye');

      if (cotisationsError) {
        console.error(`❌ [CHECK-ANNUAL-COT] Erreur cotisations exercice ${exercice.nom}:`, cotisationsError);
        continue;
      }

      // Filtrer uniquement les cotisations obligatoires
      const cotisationsObligatoiresImpayees = (cotisationsImpayees || []).filter(
        (cot: any) => cot.cotisations_types?.obligatoire === true
      ) as unknown as CotisationImpayee[];

      if (cotisationsObligatoiresImpayees.length === 0) {
        console.log(`✅ [CHECK-ANNUAL-COT] Aucune cotisation obligatoire impayée pour ${exercice.nom}`);
        continue;
      }

      console.log(`⚠️ [CHECK-ANNUAL-COT] ${cotisationsObligatoiresImpayees.length} cotisation(s) obligatoire(s) impayée(s)`);

      // 5. Mettre à jour statut → 'en_retard_annuel'
      const cotisationIds = cotisationsObligatoiresImpayees.map(c => c.id);
      const { error: updateError } = await supabase
        .from('cotisations')
        .update({ statut: 'en_retard_annuel' })
        .in('id', cotisationIds);

      if (updateError) {
        console.error(`❌ [CHECK-ANNUAL-COT] Erreur mise à jour statuts:`, updateError);
        continue;
      }

      totalCotisationsUpdated += cotisationsObligatoiresImpayees.length;
      console.log(`✅ [CHECK-ANNUAL-COT] ${cotisationsObligatoiresImpayees.length} cotisation(s) marquée(s) 'en_retard_annuel'`);

      // 6. Préparer liste membres pour notification
      const listeMembres = cotisationsObligatoiresImpayees
        .map(c => `- ${c.membres.prenom} ${c.membres.nom}: ${c.cotisations_types.nom} (${c.montant} FCFA)`)
        .join('\n');

      notifications.push({
        exercice_nom: exercice.nom,
        date_fin: exercice.date_fin,
        nombre_impayees: cotisationsObligatoiresImpayees.length,
        liste_membres: listeMembres
      });

      // 7. Envoyer notification au trésorier
      try {
        console.log(`📧 [CHECK-ANNUAL-COT] Envoi notification trésorier pour ${exercice.nom}`);
        
        // Récupérer email du trésorier (on prend le premier trouvé)
        const { data: tresoriers } = await supabase
          .from('membres')
          .select(`
            email,
            membres_roles!inner(
              roles!inner(name)
            )
          `)
          .eq('membres_roles.roles.name', 'tresorier')
          .limit(1);

        const tresorierEmail = tresoriers?.[0]?.email || 'admin@e2d.com';

        const { error: notifError } = await supabase.functions.invoke('send-notification', {
          body: {
            type_notification: 'alerte_cloture_exercice',
            destinataire_email: tresorierEmail,
            variables: {
              exercice_nom: exercice.nom,
              date_fin: new Date(exercice.date_fin).toLocaleDateString('fr-FR'),
              nombre_impayees: cotisationsObligatoiresImpayees.length.toString(),
              liste_membres: listeMembres
            }
          }
        });

        if (notifError) {
          console.error(`⚠️ [CHECK-ANNUAL-COT] Erreur envoi notification:`, notifError);
        } else {
          console.log(`✅ [CHECK-ANNUAL-COT] Notification envoyée à ${tresorierEmail}`);
        }
      } catch (notifError) {
        console.error(`⚠️ [CHECK-ANNUAL-COT] Exception envoi notification:`, notifError);
      }
    }

    console.log(`\n✅ [CHECK-ANNUAL-COT] Traitement terminé: ${totalCotisationsUpdated} cotisation(s) mise(s) à jour`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${totalCotisationsUpdated} cotisation(s) marquée(s) en retard annuel`,
        exercices_traites: exercicesProches.length,
        cotisations_updated: totalCotisationsUpdated,
        notifications_envoyees: notifications.length,
        details: notifications
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ [CHECK-ANNUAL-COT] Erreur globale:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

serve(handler);
