export const fr = {
  // Navigation
  backToDashboard: 'Retour au tableau de bord',

  // App title
  appTitle: 'PodcastSync',
  appDescription: 'Votre gestionnaire de téléchargement de podcasts personnel',

  // Buttons
  add: 'Ajouter',
  create: 'Créer',
  edit: 'Modifier',
  delete: 'Supprimer',
  cancel: 'Annuler',
  save: 'Enregistrer',
  saveChanges: 'Enregistrer les modifications',
  close: 'Fermer',
  retry: 'Réessayer',
  refresh: 'Actualiser',
  rerun: 'RERUN',
  running: 'En cours...',
  checkForUpdates: 'Vérifier les mises à jour',

  // Subscription
  subscriptions: 'Abonnements',
  subscription: 'Abonnement',
  yourPodcasts: 'Vos Podcasts',
  managePodcastsDescription: 'Gérez vos abonnements aux flux RSS',
  addSubscription: 'Ajouter un abonnement',
  addSubscriptionDescription: 'Créer un nouvel abonnement à un flux RSS',
  editSubscription: 'Modifier l\'abonnement',
  editSubscriptionDescription: 'Mettre à jour les paramètres de l\'abonnement',
  subscriptionName: 'Nom',
  subscriptionNamePlaceholder: 'Mon Podcast',
  rssUrl: 'URL RSS',
  rssUrlPlaceholder: 'https://exemple.com/feed.xml',
  checkFrequency: 'Fréquence de vérification',
  checkFrequencyDescription: 'Vérifier les nouveaux épisodes toutes les X minutes',
  outputDirectory: 'Répertoire de sortie',
  outputDirectoryButton: 'Sélectionner le dossier',
  outputDirectoryPlaceholder: 'Sélectionnez un dossier...',
  maxItems: 'Nombre maximum d\'éléments à vérifier',
  maxItemsDescription: 'Limite le nombre d\'épisodes à vérifier lors de chaque actualisation',
  audioQuality: 'Qualité audio',
  audioQualityEnclosure: 'Qualité par défaut (meilleure qualité disponible)',
  audioQualityOriginal: 'Format Original',
  audioQualityFlac: 'Format FLAC normalisé',
  audioQualityMp3: 'Format MP3 optimisé',
  audioQualityDescription: 'La qualité choisie sera utilisée si disponible, sinon un format de fallback sera automatiquement sélectionné.',
  maxEpisodes: 'Nombre maximum d\'épisodes (optionnel)',
  maxEpisodesPlaceholder: 'Laisser vide pour aucune limite',
  maxEpisodesDescription: 'Nombre maximum d\'épisodes à conserver. Les épisodes les plus anciens seront automatiquement supprimés.',
  filenameFormat: 'Format du nom de fichier',
  filenameFormatShowEpisode: 'Émission - Épisode',
  filenameFormatEpisodeOnly: 'Épisode uniquement',
  filenameFormatEpisodeShow: 'Épisode - Émission',
  filenameFormatDateEpisode: 'Date_Épisode',
  filenameFormatCustomPlaceholder: 'Personnalisé : {show}, {episode}, {date}',
  filenameFormatDescription: 'Variables disponibles : {show}, {episode}, {date}',

  // Episodes
  episodes: 'Épisodes',
  episode: 'Épisode',
  noEpisodesFound: 'Aucun épisode trouvé pour le moment',
  noEpisodesFoundDescription: 'Cliquez sur RERUN pour vérifier les nouveaux épisodes.',
  loadingEpisodes: 'Chargement des épisodes...',

  // Episode status
  downloaded: 'Téléchargé',
  downloading: 'En cours de téléchargement...',
  queued: 'En file d\'attente',
  failed: 'Échec',
  pending: 'En attente',
  paused: 'En pause',

  // Episode details
  details: 'Détails',
  description: 'Description',
  generalInfo: 'Informations générales',
  status: 'Statut',
  publicationDate: 'Date de publication',
  duration: 'Durée',
  size: 'Taille',
  audioType: 'Type audio',
  attempts: 'Tentatives',
  downloadInfo: 'Téléchargement',
  progress: 'Progression',
  started: 'Début',
  completed: 'Terminé',
  path: 'Chemin',
  error: 'Erreur',
  technicalInfo: 'Informations techniques',
  discoveredOn: 'Découvert le',

  // Available media
  availableVersions: 'Versions disponibles',
  loading: 'Chargement...',
  formatOriginal: 'Format Original',
  formatFlac: 'Format FLAC normalisé',
  formatMp3: 'Format MP3 optimisé',
  formatStandard: 'Qualité standard',
  qualityMaximum: 'Qualité maximale',
  qualityHighNormalized: 'Haute qualité, normalisé',
  qualityStandardReduced: 'Qualité standard, taille réduite',
  qualityDefault: 'Version par défaut',
  noAlternativeVersions: 'Aucune version alternative disponible',
  failedToLoadVersions: 'Échec du chargement des versions disponibles',
  openUrl: 'Ouvrir l\'URL',

  // Actions
  openLocation: 'Ouvrir l\'emplacement',

  // Stats
  activeDownloads: 'Téléchargements actifs',
  lastChecked: 'Dernière vérification',
  totalEpisodes: 'épisodes',
  totalDownloads: 'téléchargements',

  // Check Frequency Options
  frequency5min: 'Toutes les 5 minutes',
  frequency15min: 'Toutes les 15 minutes',
  frequency30min: 'Toutes les 30 minutes',
  frequency1hour: 'Toutes les heures',
  frequency2hours: 'Toutes les 2 heures',
  frequency6hours: 'Toutes les 6 heures',
  frequency12hours: 'Toutes les 12 heures',
  frequency24hours: 'Toutes les 24 heures',

  // Tooltips
  tooltipEdit: 'Modifier l\'abonnement',
  tooltipCheckNewEpisodes: 'Vérifier les nouveaux épisodes',
  tooltipEnabled: 'Activé',
  tooltipDisabled: 'Désactivé',
  tooltipDelete: 'Supprimer l\'abonnement',

  // Messages
  noSubscriptions: 'Aucun abonnement pour le moment.',
  noSubscriptionsDescription: 'Ajoutez-en un pour commencer !',
  episodesCount: 'épisode(s) trouvé(s)',
  errorLoadingEpisodes: 'Erreur lors du chargement des épisodes',
  errorSelectingDirectory: 'Erreur lors de la sélection du répertoire',
  errorCreatingSubscription: 'Erreur',
  errorDuringRerun: 'Erreur lors du RERUN',
  errorRetryingEpisode: 'Erreur lors de la nouvelle tentative',
  errorOpeningLocation: 'Erreur lors de l\'ouverture de l\'emplacement',

  // Placeholders
  na: 'N/A',
  never: 'Jamais',
  unknown: 'Inconnu',

  // Time units
  minutes: 'minutes',

  // Language
  language: 'Langue',

  // Updates
  updateAvailable: 'Mise à jour disponible',
  updateAvailableMessage: 'Une nouvelle version ({version}) est disponible !',
  currentVersion: 'Version actuelle',
  latestVersion: 'Dernière version',
  releaseNotes: 'Notes de version',
  downloadUpdate: 'Télécharger',
  noUpdateAvailable: 'Aucune mise à jour disponible',
  upToDate: 'Vous utilisez la dernière version',
  checkingForUpdates: 'Vérification des mises à jour...',
  errorCheckingUpdates: 'Erreur lors de la vérification des mises à jour',
}

export type TranslationKey = keyof typeof fr
