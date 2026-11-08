-- ==============================================================================
-- SCHEMA SUPABASE POUR MEMORA (installation neuve)
-- Exécute ce script dans le "SQL Editor" de ton dashboard Supabase
-- ==============================================================================

-- 1. Table des notions / commandes / définitions
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,                         -- Ex: "Lister tous les conteneurs Docker (actifs et inactifs)"
  target_text TEXT NOT NULL,                   -- Ex: "docker ps -a" ou la définition exacte
  type TEXT NOT NULL DEFAULT 'command' CHECK (type IN ('command', 'definition')),
  category TEXT NOT NULL DEFAULT 'Général',    -- Ex: "Docker", "Git", "Linux", "SQL"
  target_days INT NOT NULL DEFAULT 7,          -- Nombre de jours consécutifs à valider
  explanation TEXT,                            -- Explication ou astuce optionnelle
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Suivi de la progression par notion (Jours consécutifs / Streak)
CREATE TABLE IF NOT EXISTS item_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  current_streak INT NOT NULL DEFAULT 0,
  last_completed_date DATE,
  total_repetitions INT NOT NULL DEFAULT 0,
  is_mastered BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Historique détaillé des sessions d'entraînement (Drill 21)
CREATE TABLE IF NOT EXISTS repetition_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  repetitions_count INT NOT NULL DEFAULT 21,
  mode TEXT NOT NULL DEFAULT 'typing' CHECK (mode IN ('typing', 'verbal')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_item ON item_progress(item_id);
CREATE INDEX IF NOT EXISTS idx_sessions_item ON repetition_sessions(item_id);

-- Activation de Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE repetition_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : chaque utilisateur connecté (Google) ne gère que ses propres données
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
