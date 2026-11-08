-- ==============================================================================
-- MIGRATION 002 — Connexion Google : chaque utilisateur ne voit que ses données
-- À exécuter dans le "SQL Editor" de Supabase, APRÈS avoir activé le provider Google
-- et APRÈS t'être connecté une première fois avec ton compte Google.
-- ==============================================================================

-- 1. Remplir automatiquement user_id avec l'utilisateur connecté à chaque insertion
ALTER TABLE items               ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE item_progress       ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE repetition_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Rattacher les données existantes (créées sans compte) à TON compte.
--    Remplace l'adresse ci-dessous par l'e-mail de ton compte Google, puis exécute.
DO $$
DECLARE
  owner_id UUID := (SELECT id FROM auth.users WHERE email = 'REMPLACE_PAR_TON_EMAIL@gmail.com');
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable : connecte-toi une fois avec Google et vérifie l''e-mail.';
  END IF;

  UPDATE items               SET user_id = owner_id WHERE user_id IS NULL;
  UPDATE item_progress       SET user_id = owner_id WHERE user_id IS NULL;
  UPDATE repetition_sessions SET user_id = owner_id WHERE user_id IS NULL;
END $$;

-- 3. Politiques RLS strictes : plus d'accès aux lignes sans propriétaire
DROP POLICY IF EXISTS "Users can manage their own items"    ON items;
DROP POLICY IF EXISTS "Users can manage their own progress" ON item_progress;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON repetition_sessions;

CREATE POLICY "Users can manage their own items"
  ON items FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON item_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM items WHERE items.id = item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "Users can manage their own sessions"
  ON repetition_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM items WHERE items.id = item_id AND items.user_id = auth.uid())
  );
