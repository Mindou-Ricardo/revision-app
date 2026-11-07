# 🚀 21 Reps Drill — Plateforme d'Ancrage Profond

Plateforme Full-Stack d'apprentissage conçue sur-mesure pour la méthode de révision **"21 Répétitions"** étalées sur plusieurs jours (mémoire musculaire, overlearning et répétition espacée).

---

## 🎯 Comment fonctionne la méthode ?

1. **Le Drill 21** :
   - **Mode Frappe (Clavier)** : Pour les commandes (Git, Linux, Docker, etc.), tape la commande exacte 21 fois d'affilée. Dès que la frappe correspond, le champ se vide et le compteur s'incrémente automatiquement.
   - **Mode Oral (Récitation)** : Pour les définitions théoriques, récite à voix haute et valide chaque répétition avec la touche <kbd>Espace</kbd> ou <kbd>Entrée</kbd>.
2. **Suivi sur plusieurs jours** :
   - Chaque notion a un objectif de jours consécutifs (ex: 7 ou 21 jours).
   - Valider la série de 21 répétitions coche la notion pour la journée et augmente le streak (flamme 🔥).

---

## 🛠️ Stack Technique

- **Frontend & Backend** : [Next.js](https://nextjs.org/) (App Router, Node.js Full-Stack, TypeScript)
- **Style** : [Tailwind CSS](https://tailwindcss.com/) (Responsive, mode sombre/clair automatique)
- **Base de données** : [Supabase](https://supabase.com/) (PostgreSQL + RLS) avec fallback automatique sur `localStorage`
- **Icônes & Célébration** : `lucide-react` & `canvas-confetti`
- **Hébergement cible** : [Vercel](https://vercel.com/) (Gratuit, 100% compatible)

---

## 🏃 Démarrer en Local

1. Installe les dépendances (si ce n'est pas déjà fait) :
   ```bash
   npm install
   ```

2. Lance le serveur de développement :
   ```bash
   npm run dev
   ```

3. Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.
   > **Note :** L'application fonctionne immédiatement en mode local (données stockées dans ton navigateur) même sans compte Supabase configuré !

---

## 🗄️ Connecter Supabase (Optionnel mais recommandé)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Ouvre le **SQL Editor** de ton tableau de bord Supabase.
3. Copie-colle le contenu du fichier [`supabase/schema.sql`](./supabase/schema.sql) et clique sur **Run**.
4. Crée un fichier `.env.local` à la racine du projet avec tes clés API Supabase (disponibles dans *Project Settings > API*) :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ton-anon-key-ici
   ```
5. Redémarre le serveur (`npm run dev`). L'indicateur en haut de page passera automatiquement au vert : **Supabase**.

---

## ☁️ Déploiement Gratuit sur Vercel

1. Pousse ce code sur un dépôt **GitHub** :
   ```bash
   git add .
   git commit -m "feat: 21 reps drill platform ready"
   git push origin main
   ```
2. Va sur [vercel.com](https://vercel.com) et clique sur **Add New > Project**.
3. Importe ton dépôt GitHub.
4. Dans la section **Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique sur **Deploy** ! Ton application sera en ligne gratuitement en quelques secondes avec HTTPS automatique.
