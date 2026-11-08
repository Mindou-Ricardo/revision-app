import { Item } from '@/types';

export interface StarterPack {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  items: Array<Omit<Item, 'id' | 'created_at' | 'progress'>>;
}

export const STARTER_PACKS: StarterPack[] = [
  {
    id: 'git-essentials',
    title: 'Git Essentiel & Workflow',
    description: 'Les commandes indispensables pour maîtriser Git en équipe sans paniquer.',
    category: 'Git',
    icon: 'GitBranch',
    items: [
      {
        title: 'Créer et basculer sur une nouvelle branche',
        target_text: 'git switch -c feature/ma-branche',
        type: 'command',
        category: 'Git',
        target_days: 7,
        explanation: 'Plus moderne et sans ambiguïté par rapport à git checkout -b.',
      },
      {
        title: 'Mettre de côté des modifications sans commiter',
        target_text: 'git stash -u',
        type: 'command',
        category: 'Git',
        target_days: 7,
        explanation: 'Le flag -u inclut également les fichiers non suivis (untracked).',
      },
      {
        title: 'Récupérer les modifications mises de côté',
        target_text: 'git stash pop',
        type: 'command',
        category: 'Git',
        target_days: 7,
        explanation: 'Applique le stash le plus récent et le supprime de la pile.',
      },
      {
        title: 'Modifier le message du dernier commit',
        target_text: 'git commit --amend',
        type: 'command',
        category: 'Git',
        target_days: 7,
        explanation: 'Permet aussi d’ajouter des fichiers oubliés au dernier commit.',
      },
      {
        title: 'Afficher un historique compact et graphique',
        target_text: 'git log --oneline --graph --all',
        type: 'command',
        category: 'Git',
        target_days: 7,
        explanation: 'Visualise l’arbre de toutes les branches en une ligne par commit.',
      },
    ],
  },
  {
    id: 'linux-sysadmin',
    title: 'Linux Sysadmin & Terminal',
    description: 'Surveillance des processus, recherche de fichiers et gestion des ports.',
    category: 'Linux',
    icon: 'Terminal',
    items: [
      {
        title: 'Lister les ports en écoute avec processus associés',
        target_text: 'ss -tulpn',
        type: 'command',
        category: 'Linux',
        target_days: 7,
        explanation: 'TCP (-t), UDP (-u), Listening (-l), Process PID (-p), Numeric (-n).',
      },
      {
        title: 'Chercher un mot-clé récursivement dans les fichiers du dossier',
        target_text: 'grep -rnw . -e "mot_cle"',
        type: 'command',
        category: 'Linux',
        target_days: 7,
        explanation: '-r récursif, -n numéro de ligne, -w mot entier.',
      },
      {
        title: 'Afficher l’espace disque restant de manière lisible',
        target_text: 'df -h',
        type: 'command',
        category: 'Linux',
        target_days: 7,
        explanation: '-h affiche en Gigaoctets (Human readable).',
      },
      {
        title: 'Suivre les logs d’un service systemd en temps réel',
        target_text: 'journalctl -u nom_service -f',
        type: 'command',
        category: 'Linux',
        target_days: 7,
        explanation: '-u cible le service et -f suit les nouvelles entrées (follow).',
      },
    ],
  },
  {
    id: 'docker-containers',
    title: 'Docker & Conteneurs',
    description: 'Commandes de base pour créer, inspecter et nettoyer des conteneurs.',
    category: 'Docker',
    icon: 'Box',
    items: [
      {
        title: 'Entrer dans le terminal interactif d’un conteneur en cours',
        target_text: 'docker exec -it nom_conteneur bash',
        type: 'command',
        category: 'Docker',
        target_days: 7,
        explanation: '-i interactif, -t tty (terminal). Utiliser sh si bash n’est pas installé.',
      },
      {
        title: 'Nettoyer tous les conteneurs, réseaux et images orphelines',
        target_text: 'docker system prune -a --volumes',
        type: 'command',
        category: 'Docker',
        target_days: 7,
        explanation: 'Libère de l’espace disque en supprimant tout ce qui est inutilisé.',
      },
      {
        title: 'Lancer un stack docker-compose en arrière-plan avec reconstruction',
        target_text: 'docker compose up -d --build',
        type: 'command',
        category: 'Docker',
        target_days: 7,
        explanation: '-d détache le terminal, --build force la recompilation des images.',
      },
    ],
  },
  {
    id: 'architecture-definitions',
    title: 'Concepts & Définitions Clés',
    description: 'Définitions d’architecture et de programmation à réciter par cœur.',
    category: 'Architecture',
    icon: 'BookOpen',
    items: [
      {
        title: 'Définition : Idempotence',
        target_text: "Propriété d'une opération produisant le même résultat qu'elle soit exécutée une ou plusieurs fois.",
        type: 'definition',
        category: 'Architecture',
        target_days: 14,
        explanation: 'Fondamental pour les APIs REST (GET, PUT, DELETE) et la tolérance aux pannes.',
      },
      {
        title: 'Définition : Principe Ouvert / Fermé (SOLID)',
        target_text: 'Une entité logicielle doit être ouverte à l’extension mais fermée à la modification.',
        type: 'definition',
        category: 'Architecture',
        target_days: 14,
        explanation: 'On doit pouvoir ajouter des comportements sans toucher au code existant testé.',
      },
      {
        title: 'Définition : Théorème CAP',
        target_text: 'Un système distribué ne peut garantir simultanément que 2 des 3 propriétés : Cohérence, Disponibilité, Tolérance au partitionnement.',
        type: 'definition',
        category: 'Architecture',
        target_days: 21,
        explanation: 'Cohérence (Consistency), Disponibilité (Availability), Partition tolerance (Partition).',
      },
    ],
  },
];
