import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Vérifier le rôle admin
    const { data: hasAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { role_name: 'administrateur' });
    
    if (roleError || !hasAdmin) {
      console.error('[PERMISSIONS] Erreur vérification rôle:', roleError);
      return new Response(JSON.stringify({ error: 'Droits insuffisants' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { toDelete, toUpdate, toInsert } = await req.json();

    let deletedCount = 0;
    let updatedCount = 0;
    let insertedCount = 0;

    console.log(`[PERMISSIONS] Opérations à effectuer: ${toDelete?.length || 0} suppressions, ${toUpdate?.length || 0} modifications, ${toInsert?.length || 0} insertions`);

    // 1. Suppressions
    if (toDelete && toDelete.length > 0) {
      const { error: deleteError } = await supabaseClient
        .from('role_permissions')
        .delete()
        .in('id', toDelete);
      
      if (deleteError) {
        console.error('[PERMISSIONS] Erreur suppression:', deleteError);
        throw new Error(`Erreur suppression: ${deleteError.message}`);
      }
      deletedCount = toDelete.length;
      console.log(`[PERMISSIONS] ✓ ${deletedCount} permissions supprimées`);
    }

    // 2. Modifications
    if (toUpdate && toUpdate.length > 0) {
      for (const update of toUpdate) {
        const { error: updateError } = await supabaseClient
          .from('role_permissions')
          .update({ granted: update.granted, updated_at: new Date().toISOString() })
          .eq('id', update.id);
        
        if (updateError) {
          console.error('[PERMISSIONS] Erreur mise à jour:', updateError);
          throw new Error(`Erreur mise à jour: ${updateError.message}`);
        }
        updatedCount++;
      }
      console.log(`[PERMISSIONS] ✓ ${updatedCount} permissions modifiées`);
    }

    // 3. Insertions
    if (toInsert && toInsert.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('role_permissions')
        .insert(toInsert);
      
      if (insertError) {
        console.error('[PERMISSIONS] Erreur insertion:', insertError);
        throw new Error(`Erreur insertion: ${insertError.message}`);
      }
      insertedCount = toInsert.length;
      console.log(`[PERMISSIONS] ✓ ${insertedCount} permissions créées`);
    }

    console.log(`[PERMISSIONS] ✅ Sauvegarde terminée avec succès`);

    return new Response(
      JSON.stringify({ 
        success: true,
        inserted: insertedCount,
        updated: updatedCount,
        deleted: deletedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[PERMISSIONS] Erreur globale:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
