# Prompt pour la Création du Site Web PodcastSync

## Contexte et Objectif

Tu dois créer un site web moderne, attractif et professionnel pour **PodcastSync**, une application desktop open source multiplateforme qui automatise le téléchargement et la gestion d'épisodes de podcasts depuis des flux RSS.

**URL du dépôt GitHub** : https://github.com/Synapsr/PodcastSync

## À Propos de PodcastSync

### Description Principale
PodcastSync est une application de bureau construite avec **Tauri (Rust)** + **React** + **TypeScript** qui permet de télécharger et gérer automatiquement des épisodes de podcasts à partir de flux RSS. C'est une solution légère, performante et entièrement open source, alternative aux services cloud pour l'archivage et la gestion de podcasts.

### Valeur Ajoutée et Avantages Uniques

1. **Autonomie Totale** : Pas de dépendance à des services cloud, tout fonctionne localement
2. **Automatisation Complète** : Une fois configuré, le système fonctionne seul sans intervention
3. **Performance Exceptionnelle** : Construit en Rust, consommation mémoire minimale (contrairement à Electron)
4. **Open Source** : Code entièrement auditable, aucune télémétrie, aucun tracking
5. **Gratuit** : Pas d'abonnement, pas de publicité, complètement gratuit
6. **Fiabilité** : Système de retry automatique, vérification d'intégrité des fichiers
7. **Multiplateforme** : Fonctionne sur macOS (Apple Silicon), Windows (x64), et peut être compilé pour Linux
8. **Léger** : Empreinte mémoire réduite grâce à Tauri au lieu d'Electron
9. **Bilingue** : Interface disponible en français et anglais

### Public Cible

- **Stations de radio communautaires** : Pour archiver et rediffuser des émissions
- **Créateurs de contenu** : Pour gérer leur bibliothèque de podcasts
- **Professionnels de l'audiovisuel** : Pour l'automatisation de diffusion
- **Passionnés de podcasts** : Pour l'archivage personnel et la sauvegarde
- **Développeurs** : Pour contribuer au projet open source

## Fonctionnalités Détaillées à Mettre en Avant

### 1. Gestion des Abonnements RSS
- Ajout, modification et suppression d'abonnements de podcasts
- Fréquence de vérification configurable (de 5 minutes à 24 heures)
- Activation/désactivation des flux à la demande
- Pause automatique des téléchargements en cours lors de la désactivation
- Répertoire de sortie personnalisé pour chaque abonnement
- Choix de qualité audio par abonnement (Original, FLAC, MP3, ou meilleure disponible)

### 2. Téléchargements Intelligents
- **Téléchargements concurrents** avec limite configurable pour optimiser la bande passante
- Suivi de progression en temps réel avec pourcentage et barres de progression
- **Retry automatique** en cas d'échec de téléchargement
- Support de multiples formats audio (MP3, FLAC, AAC, OGG, etc.)
- **Système de fallback intelligent** : si la qualité demandée n'est pas disponible, télécharge la meilleure disponible
- Mises à jour en temps réel de l'interface via événements asynchrones

### 3. Gestion Avancée des Épisodes
- Vue d'ensemble de tous les épisodes tous abonnements confondus
- Filtrage par statut : pending (en attente), downloading (en cours), completed (terminé), failed (échoué), paused (en pause)
- **Modal de détails d'épisode** comprenant :
  - Description complète formatée
  - Métadonnées (date de publication, durée, taille)
  - Versions alternatives disponibles (Original/FLAC/MP3) avec possibilité de re-télécharger
  - Historique de téléchargement avec erreurs éventuelles
  - Informations techniques (GUID, URL audio)
- Retry manuel des téléchargements échoués
- Ouverture rapide dans l'explorateur de fichiers du système

### 4. Lecteur Audio Intégré
- Lecture directe des épisodes téléchargés dans l'application
- Contrôles play/pause intuitifs
- Barre de progression avec possibilité de naviguer (seek)
- **Visualisation audio avec waveform** (forme d'onde)
- Support des raccourcis clavier
- Intégration transparente avec l'interface

### 5. Automatisation et Tâches de Fond
- Vérification automatique des flux toutes les minutes (avec filtre intelligent sur la fréquence configurée par abonnement)
- **Vérification périodique de l'intégrité des fichiers** : détecte les fichiers corrompus ou supprimés
- Traitement automatique de la file de téléchargement
- **Système de notification de mise à jour** :
  - Vérification au démarrage de l'application
  - Vérification automatique toutes les 6 heures en arrière-plan
  - Notification non-intrusive avec lien direct vers la dernière version

### 6. Internationalisation
- Support complet du **français** et de l'**anglais**
- Formatage des dates adapté à la locale
- Préférence de langue sauvegardée entre les sessions
- Interface entièrement traduite

### 7. Interface Utilisateur Moderne
- **Thème sombre** optimisé pour un confort visuel prolongé
- Tableau de bord avec statistiques en temps réel :
  - Nombre d'abonnements actifs
  - Nombre total d'épisodes
  - Téléchargements en cours
  - Épisodes complétés
- Design responsive et adaptatif
- Animations et transitions fluides
- Bibliothèque d'icônes Lucide pour une cohérence visuelle
- Gradient de couleurs modernes (violet/rose)

## Stack Technique à Présenter

### Backend (Rust)
| Technologie | Rôle |
|-------------|------|
| **Tauri 1.5** | Framework desktop moderne et sécurisé |
| **Tokio** | Runtime asynchrone pour performances optimales |
| **SQLx** | ORM avec queries vérifiées à la compilation |
| **Reqwest** | Client HTTP robuste pour les téléchargements |
| **RSS** | Parsing de flux RSS/Atom |
| **Chrono** | Gestion des dates et heures |

### Frontend (React)
| Technologie | Rôle |
|-------------|------|
| **React 18** | Framework UI moderne |
| **TypeScript 5.3** | Sûreté des types |
| **Zustand** | Gestion d'état légère et performante |
| **Tailwind CSS** | Styling utility-first |
| **date-fns** | Formatage et localisation des dates |
| **Lucide React** | Bibliothèque d'icônes modernes |
| **Recharts** | Visualisation audio |

### Base de Données
- **SQLite** : Base de données embarquée, aucune configuration nécessaire
- Migrations automatiques avec SQLx
- Stockage local des métadonnées et de l'état de l'application

## Architecture du Site Web

### Pages Principales à Créer

#### 1. **Page d'Accueil (Hero Section)**
- Grand titre accrocheur : "Gérez vos podcasts en toute autonomie"
- Sous-titre expliquant la valeur : "Application desktop open source pour télécharger et archiver automatiquement vos podcasts préférés"
- **Call-to-action principal** :
  - Bouton "Télécharger" (avec détection automatique de l'OS)
  - Bouton "Voir sur GitHub" avec compteur d'étoiles
  - Bouton "⭐ Star sur GitHub" bien visible
- Screenshot ou animation de l'application en action
- Badges :
  - Version actuelle (v0.1.0)
  - Plateformes supportées (macOS, Windows, Linux)
  - Licence (MIT)
  - Build status

#### 2. **Section Fonctionnalités**
Présenter les 7 groupes de fonctionnalités sous forme de cards avec icônes :
- Gestion des Abonnements RSS
- Téléchargements Intelligents
- Gestion Avancée des Épisodes
- Lecteur Audio Intégré
- Automatisation et Tâches de Fond
- Internationalisation
- Interface Moderne

Pour chaque fonctionnalité :
- Icône représentative
- Titre court
- Description en 2-3 phrases
- Liste des points clés

#### 3. **Section "Pourquoi PodcastSync ?"**
Mettre en avant les avantages par rapport aux alternatives :
- **Vs Services Cloud** : Pas d'abonnement, contrôle total de vos données, pas de limite de stockage
- **Vs Electron Apps** : Consommation mémoire réduite de 50-70%, démarrage plus rapide
- **Vs Solutions Payantes** : Gratuit, open source, aucune publicité
- **Cas d'usage** : Radio communautaire, archivage, broadcast automation

#### 4. **Section Technique**
- Architecture technique avec diagramme simple
- Pourquoi Rust ? (Performance, sécurité mémoire, fiabilité)
- Pourquoi Tauri ? (Léger vs Electron, sécurité, performance)
- Schéma de la base de données SQLite
- Workflow : RSS → Parsing → Queue → Download → Storage

#### 5. **Section Installation**
Guides d'installation clairs pour chaque plateforme :

**macOS (Apple Silicon)**
1. Télécharger `PodcastSync_0.1.0_aarch64.dmg`
2. Ouvrir le DMG
3. Glisser dans Applications
4. **Important** : Clic droit → Ouvrir (car non signé)

**Windows**
1. Télécharger `PodcastSync_0.1.0_x64-setup.exe`
2. Exécuter l'installateur
3. **Important** : "Informations complémentaires" → "Exécuter quand même"

**Avertissement de Sécurité**
- Expliquer clairement pourquoi l'app n'est pas signée (coût des certificats)
- Rassurer : code 100% open source et auditable
- Insister : télécharger UNIQUEMENT depuis les releases GitHub officielles

#### 6. **Section Démarrage Rapide**
Guide pas à pas avec screenshots :
1. Lancer PodcastSync
2. Cliquer sur "Ajouter un abonnement"
3. Entrer l'URL d'un flux RSS
4. Configurer le répertoire de sortie
5. Choisir la fréquence et la qualité
6. Les épisodes commencent à se télécharger automatiquement

#### 7. **Section Screenshots/Démo**
- Galerie d'images de l'interface
- Gif animé des téléchargements en cours
- Vidéo démo (si disponible)
- Captures du lecteur audio
- Vue du tableau de bord avec statistiques

#### 8. **Section Open Source & Contribution**
- **Badge "⭐ Star sur GitHub"** très visible
- Lien vers le dépôt : https://github.com/Synapsr/PodcastSync
- Statistiques GitHub :
  - Nombre de stars
  - Nombre de forks
  - Contributeurs
  - Issues ouvertes
- **Comment contribuer** :
  - Fork le projet
  - Créer une branche feature
  - Faire les modifications
  - Soumettre une Pull Request
- Lien vers les issues GitHub pour les bugs et feature requests
- Code de conduite
- Licence MIT

#### 9. **Section Communauté**
- Lien vers GitHub Discussions
- Section FAQ
- Liens vers les réseaux sociaux (si applicable)
- Contact : Lumy Radio (https://lumyradio.fr)
- Mention : "Développé avec ❤️ par Lumy Radio"

#### 10. **Section Roadmap**
Fonctionnalités futures possibles (à adapter) :
- Support Linux officiel
- Plugins et extensions
- Import/export de configurations
- Synchronisation entre machines
- Support de plus de formats
- API REST pour intégrations

#### 11. **Footer**
- Liens rapides : Documentation, GitHub, Releases, Support
- Copyright : © 2025 Lumy Radio
- Licence : MIT License
- Réseaux sociaux
- "Made with ❤️ using Tauri + React"

## Design et Style

### Palette de Couleurs
- **Primaire** : Violet/Rose (gradient moderne comme dans l'app)
- **Secondaire** : Bleu (pour les téléchargements actifs)
- **Accent** : Vert (pour les succès)
- **Erreur** : Rouge
- **Fond** : Thème sombre avec gradients subtils
- **Texte** : Blanc/gris clair sur fond sombre

### Typographie
- **Titres** : Police moderne, bold, grandes tailles
- **Corps** : Police lisible, contraste suffisant
- **Code** : Police monospace pour les exemples techniques

### Composants UI
- Cards avec ombres portées et effets de hover
- Boutons avec états (hover, active, disabled)
- Badges pour les tags et statuts
- Animations subtiles au scroll
- Transitions fluides
- Icônes cohérentes (Lucide ou similaire)

### Responsivité
- Mobile first
- Breakpoints : mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- Navigation adaptative (hamburger sur mobile)
- Images optimisées pour toutes les tailles

## Fonctionnalités Techniques du Site

### SEO et Performance
- Meta tags optimisés :
  - Title : "PodcastSync - Application Open Source de Gestion de Podcasts"
  - Description : "Téléchargez et gérez automatiquement vos podcasts avec PodcastSync, une application desktop open source, légère et performante construite avec Tauri et React."
  - Keywords : podcast, RSS, download manager, open source, Tauri, Rust, automation
- Open Graph tags pour les réseaux sociaux
- Schema.org markup pour SoftwareApplication
- Sitemap XML
- Lazy loading des images
- Minification CSS/JS
- Compression des assets

### Analytics (Optionnel et Respect de la Vie Privée)
- Si analytics : utiliser une solution respectueuse (Plausible, Fathom)
- Ou pas d'analytics du tout (cohérent avec l'esprit open source)

### Intégration GitHub
- Afficher dynamiquement :
  - Nombre de stars
  - Dernière release version
  - Dernière date de release
- Utiliser l'API GitHub : https://api.github.com/repos/Synapsr/PodcastSync

### Call-to-Actions Clés
1. **"⭐ Star sur GitHub"** : Bouton très visible, répété sur plusieurs sections
2. **"Télécharger"** : Détection automatique de l'OS, téléchargement direct
3. **"Contribuer"** : Lien vers CONTRIBUTING.md
4. **"Voir le Code"** : Lien direct vers le repo GitHub
5. **"Signaler un Bug"** : Lien vers GitHub Issues

## Ton et Style de Rédaction

- **Professionnel mais accessible** : Éviter le jargon excessif
- **Enthousiaste** : Montrer la passion pour le projet
- **Transparent** : Être honnête sur les limitations (app non signée, version 0.1.0)
- **Bilingue** : Proposer le site en français ET en anglais
- **Concis** : Phrases courtes, points clés en bullet points
- **Technique quand nécessaire** : Détails pour les développeurs

## Contenus Additionnels à Inclure

### Section "Comparaison"
Tableau comparatif :
| Fonctionnalité | PodcastSync | Services Cloud | Apps Electron |
|----------------|-------------|----------------|---------------|
| Prix | Gratuit | Abonnement | Gratuit/Payant |
| Stockage | Illimité (local) | Limité | Illimité (local) |
| Vie privée | 100% | Tracking | Variable |
| Performance | Excellent (Rust) | N/A (Web) | Moyen (Chrome) |
| Open Source | ✅ | ❌ | Variable |
| Offline | ✅ | ❌ | ✅ |

### Section "Témoignages" (Fictifs ou à Collecter)
- Citations d'utilisateurs
- Logos de radios/organisations utilisant l'outil (si applicable)
- Statistiques d'utilisation (si disponibles)

### Section "FAQ"
Questions fréquentes :
- Pourquoi mon antivirus bloque l'application ?
- L'application envoie-t-elle des données ?
- Comment mettre à jour ?
- Puis-je importer des abonnements existants ?
- Quelle est la roadmap du projet ?
- Comment signaler un bug ?
- Comment contribuer ?

## Technologies Web Recommandées pour le Site

### Options de Framework
1. **Next.js** (recommandé) : SSR, SEO optimal, performance
2. **Astro** : Très léger, parfait pour sites statiques
3. **Vite + React** : Rapide, moderne
4. **HTML/CSS/JS pur** : Pour un site très léger

### Styling
- **Tailwind CSS** (cohérent avec l'app)
- Ou **CSS Modules**
- Animations avec **Framer Motion** ou **GSAP**

### Hébergement Recommandé
- **GitHub Pages** (gratuit, cohérent avec l'esprit open source)
- **Vercel** (gratuit, excellent pour Next.js)
- **Netlify** (gratuit, CI/CD facile)
- **Cloudflare Pages** (gratuit, CDN performant)

## Structure du Projet Site Web
```
podcastsync-website/
├── public/
│   ├── images/
│   │   ├── hero-screenshot.png
│   │   ├── features/
│   │   ├── screenshots/
│   │   └── logo.png
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Hero.tsx/jsx
│   │   ├── Features.tsx/jsx
│   │   ├── Installation.tsx/jsx
│   │   ├── Screenshots.tsx/jsx
│   │   ├── OpenSource.tsx/jsx
│   │   ├── Footer.tsx/jsx
│   │   └── Navbar.tsx/jsx
│   ├── pages/
│   │   ├── index.tsx/jsx (Accueil)
│   │   ├── docs.tsx/jsx (Documentation)
│   │   └── download.tsx/jsx (Téléchargement)
│   ├── styles/
│   │   └── globals.css
│   └── utils/
│       └── github-api.ts/js
├── package.json
├── next.config.js (si Next.js)
└── README.md
```

## Checklist de Livraison

### Contenu
- [ ] Toutes les sections décrites sont présentes
- [ ] Textes en français ET anglais
- [ ] Screenshots de l'application inclus
- [ ] Liens GitHub fonctionnels
- [ ] Badges à jour
- [ ] FAQ complète

### Technique
- [ ] Site responsive (mobile, tablet, desktop)
- [ ] Performance optimisée (Lighthouse > 90)
- [ ] SEO optimisé (meta tags, sitemap)
- [ ] Intégration API GitHub pour stars/releases
- [ ] Détection automatique de l'OS pour téléchargement
- [ ] Analytics configuré (si souhaité)
- [ ] Formulaire de contact ou lien vers GitHub Discussions

### Design
- [ ] Cohérence visuelle avec l'application
- [ ] Thème sombre élégant
- [ ] Animations fluides
- [ ] Icônes cohérentes
- [ ] Boutons CTA bien visibles
- [ ] Bouton "Star GitHub" très proéminent

### Accessibilité
- [ ] Contraste suffisant (WCAG AA)
- [ ] Navigation au clavier
- [ ] Alt text sur toutes les images
- [ ] Structure sémantique HTML
- [ ] ARIA labels où nécessaire

## Exemples de Sites Open Source Inspirants

Pour référence, voici des sites open source bien conçus :
- **Tauri** : https://tauri.app (moderne, clair, tech-forward)
- **Supabase** : https://supabase.com (hero section impactante)
- **Excalidraw** : https://excalidraw.com (minimaliste, efficace)
- **Bitwarden** : https://bitwarden.com (focus sur open source et sécurité)

## Messages Clés à Véhiculer

1. **"Vos podcasts, vos règles"** : Contrôle total, aucune dépendance cloud
2. **"Léger et Performant"** : Construit en Rust, pas un autre Electron
3. **"Open Source et Transparent"** : Code auditable, pas de télémétrie
4. **"Automatisez tout"** : Configurez une fois, oubliez
5. **"Gratuit pour toujours"** : Aucun abonnement, jamais
6. **"Rejoignez la Communauté"** : ⭐ Star sur GitHub et contribuez !

## Appel Final à l'IA

Crée un site web **moderne, professionnel et visuellement attrayant** qui :
- Met en valeur les fonctionnalités uniques de PodcastSync
- Souligne l'aspect **open source** et encourage les contributions
- Incite fortement les visiteurs à **star le projet sur GitHub**
- Est **optimisé pour le SEO** et les performances
- Est **responsive** et accessible
- Reflète la qualité et le soin apportés au développement de l'application
- Donne envie de télécharger et d'essayer l'application immédiatement

Le site doit faire comprendre immédiatement au visiteur :
1. **Ce que fait PodcastSync** (en 5 secondes)
2. **Pourquoi c'est mieux que les alternatives** (en 30 secondes)
3. **Comment l'installer** (lien direct évident)
4. **Comment contribuer** (bouton Star GitHub très visible)

Le ton général doit être : "Nous avons construit un outil formidable, gratuit, et open source. Essayez-le, contribuez, et aidez-nous à le faire grandir !"
