# 📋 Plan de Tests QA - Phases 1-3

## Phase 1 : CRITIQUES ⚠️

### Test #1 : Correction Radix UI
- [x] ✅ Vérifier absence erreur `<SelectItem value="">`
- [x] ✅ Console sans erreurs React
- **Résultat attendu** : Aucune erreur dans la console navigateur

### Test #2-5 : Système de permissions
- [ ] Créer utilisateur "tresorier" (non-admin) via AdminCreateAccount
- [ ] Se connecter avec ce compte → Vérifier accès refusé sur `/configuration`
- [ ] Tester création cotisation protégée par `PermissionGuard`
- [ ] Vérifier edge function `save-permissions` dans Supabase Edge Functions logs
- **Résultat attendu** : Permissions fonctionnelles avec messages d'erreur clairs

---

## Phase 2 : MOYENS 🔶

### Test #6-7 : Badges de statut avec dates passées
**Fichier** : `src/pages/CotisationsGrid.tsx` (lignes 251-272)

- [ ] Créer cotisation "en_retard" avec `date_paiement` < aujourd'hui
- [ ] Vérifier badge affiche `📅 Passé` avec opacité 60%
- [ ] Vérifier légende complète sur `/cotisations-grid` (ligne 405-434)
- **Résultat attendu** : Badge avec icône calendrier et style transparent

### Test #8 : Système d'alertes automatiques
**Composant** : `AlertesCotisations`

- [ ] Créer 3 cotisations en retard (statut `en_retard`)
- [ ] Ouvrir `/cotisations-grid` → Vérifier composant d'alerte affiché
- [ ] Cliquer sur alerte → Vérifier filtrage automatique des cotisations concernées
- **Résultat attendu** : Alerte cliquable avec redirection filtrée

### Test #9-10 : Audit et middleware
**Tables Supabase** : `permissions_audit`, `role_permissions`

**Test audit triggers** :
```sql
-- Vérifier que les triggers sont bien attachés
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name
FROM pg_trigger 
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'public.role_permissions'::regclass;
```
- [ ] Résultat attendu : 3 triggers (`trg_permission_insert_audit`, `trg_permission_update_audit`, `trg_permission_delete_audit`)

**Test fonctionnel** :
- [ ] Ouvrir `RolePermissionsManager` → Modifier une permission (granted: true → false)
- [ ] Aller sur `/configuration` → Voir `PermissionsAuditViewer`
- [ ] Vérifier log avec colonnes "Avant" et "Après"
- [ ] Exécuter requête SQL : `SELECT * FROM permissions_audit ORDER BY created_at DESC LIMIT 10;`
- **Résultat attendu** : Historique complet des modifications

---

## Phase 3 : MINEURS 🔹

### Test #11 : Export filtré Excel/PDF
**Fichiers** : `src/pages/Cotisations.tsx`, `src/pages/CotisationsGrid.tsx`

**Préparation** :
- [ ] Créer 10 cotisations pour exercice "2024"
- [ ] Créer 5 cotisations pour exercice "2025"

**Test sur `/cotisations`** :
- [ ] Sélectionner exercice "2024" dans les filtres
- [ ] Cliquer bouton "📊 Excel" → Télécharger fichier
- [ ] Ouvrir Excel → Vérifier que seules les 10 cotisations 2024 sont exportées
- [ ] Répéter avec bouton "📄 PDF" → Vérifier logo E2D + données correctes
- **Résultat attendu** : Exports respectent les filtres actifs

**Test sur `/cotisations-grid`** :
- [ ] Même test avec filtres exercice + dates personnalisées
- [ ] Vérifier export ne contient que les lignes visibles dans la grille filtrée

### Test #12 : Mode responsive mobile
**Fichiers** : `src/pages/Cotisations.tsx`, `src/pages/CotisationsGrid.tsx`

**Test sur `/cotisations`** :
- [ ] Ouvrir DevTools → Responsive mode → 375px (iPhone SE)
- [ ] Vérifier que la table est remplacée par des cartes (Card)
- [ ] Tester scroll vertical des cartes
- [ ] Vérifier que les boutons restent accessibles
- **Résultat attendu** : Vue adaptée mobile avec cartes empilées

**Test sur `/cotisations-grid`** :
- [ ] Ouvrir en mode mobile 375px
- [ ] Vérifier `ScrollArea` horizontal pour la grille
- [ ] Tester scroll horizontal avec doigt (ou trackpad)
- **Résultat attendu** : Grille scrollable sans overflow caché

### Test #13 : Amélioration UX Permissions
**Fichier** : `src/pages/Cotisations.tsx`

**Test accordéon** :
- [ ] Ouvrir `/cotisations`
- [ ] Vérifier présence accordéon "Actions rapides (Cotisations)"
- [ ] Cliquer pour déplier → Voir boutons "Nouvelle cotisation" + "Valider tous les paiements"
- **Résultat attendu** : Interface plus épurée avec actions regroupées

**Test validation massive** :
- [ ] Créer 5 cotisations statut `en_attente`
- [ ] Cliquer "Valider tous les paiements en attente"
- [ ] Confirmer → Vérifier toast "✅ 5 paiements validés"
- [ ] Rafraîchir → Vérifier que les 5 sont passés à `paye`
- **Résultat attendu** : Validation en masse fonctionnelle

**Test message contextuel** :
- [ ] Se connecter comme "tresorier" (sans permissions admin)
- [ ] Tenter d'accéder à une action protégée
- [ ] Vérifier message : "💡 Contactez un administrateur pour obtenir cette permission."
- **Résultat attendu** : Message d'aide clair et actionnable

### Test #14 : Logger structuré
**Fichiers** : `src/hooks/usePermissions.ts`, `src/components/PermissionGuard.tsx`

**Activation du mode debug** :
```bash
# Créer ou éditer .env à la racine
echo "VITE_DEBUG=true" >> .env
```

**Test console logs** :
- [ ] Ouvrir DevTools Console → Filtrer par "PERMISSIONS"
- [ ] Naviguer sur `/cotisations` → Voir logs `[PERMISSIONS] Check permission`
- [ ] Tenter action refusée → Voir `[PERMISSIONS] Access denied`
- [ ] Vérifier affichage PermissionGuard → Voir `[PERMISSION_GUARD] Access blocked`
- **Résultat attendu** : Logs structurés avec émojis et contexte (resource, action, userRole)

**Test audit logs** :
- [ ] Ouvrir `/configuration` → PermissionsAuditViewer
- [ ] Console → Voir logs `[AUDIT_VIEWER] Loading audit logs` puis `[AUDIT_VIEWER] Loaded logs`
- **Résultat attendu** : Debugging facilité avec logs clairs

### Test #15 : Plan de tests (Meta-test)
- [x] ✅ Ce document existe et est complet

---

## Checklist Validation Globale

### Sécurité
- [ ] Tous les tests permissions passent (Phase 1 #2-5)
- [ ] Audit trails complets (Phase 2 #9-10)
- [ ] Pas de données exposées sans RLS

### UX
- [ ] Interface responsive mobile testée (Phase 3 #12)
- [ ] Messages d'erreur clairs (Phase 3 #13)
- [ ] Accordéons et actions rapides fonctionnels (Phase 3 #13)

### Fonctionnel
- [ ] Exports respectent filtres (Phase 3 #11)
- [ ] Badges de statut corrects (Phase 2 #6-7)
- [ ] Alertes automatiques opérationnelles (Phase 2 #8)

### Technique
- [ ] Triggers Supabase actifs (Phase 2 #9)
- [ ] Logger structuré en production (Phase 3 #14)
- [ ] Aucune erreur console (Phase 1 #1)

---

## 📊 Métriques de succès

| Phase | Tests Critiques | Tests Passés | Taux |
|-------|----------------|--------------|------|
| Phase 1 | 5 | ⬜⬜⬜⬜⬜ | 0% |
| Phase 2 | 5 | ⬜⬜⬜⬜⬜ | 0% |
| Phase 3 | 6 | ⬜⬜⬜⬜⬜⬜ | 0% |
| **TOTAL** | **16** | **0** | **0%** |

---

## 🚀 Instructions d'exécution

1. **Préparation environnement** :
   ```bash
   # Activer logs debug
   echo "VITE_DEBUG=true" >> .env
   
   # Restart dev server
   npm run dev
   ```

2. **Créer données de test** :
   - 15 cotisations (5 payées, 5 en_attente, 5 en_retard)
   - 3 membres différents
   - 2 exercices (2024, 2025)
   - 1 utilisateur non-admin (tresorier)

3. **Ordre de test recommandé** :
   - Phase 1 → Phase 2 → Phase 3
   - Tests critiques en premier
   - Logs console ouverts en permanence

4. **Validation finale** :
   - Tous les tests cochés ✅
   - Aucune erreur console
   - Screenshots des tests clés
   - Documentation mise à jour

---

**Document créé le** : 2025-11-03  
**Phases couvertes** : 1, 2, 3  
**Auteur** : Équipe E2D  
**Version** : 1.0
