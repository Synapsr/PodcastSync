# 🚀 Guide de Release

Guide rapide pour créer une nouvelle release de PodcastSync.

## 📝 Pré-requis

- Node.js et Rust installés
- Accès push au repository GitHub
- Être sur la branche `main`

## 🔄 Processus de Release

### 1. Préparer la Version

```bash
# Mettre à jour la version dans Cargo.toml
# version = "0.2.0"  (exemple)

# S'assurer que tout est à jour
git pull origin main
git status  # Doit être clean
```

### 2. Build l'Application

```bash
# Installer les dépendances
npm install

# Build pour production
npm run tauri:build
```

Les binaires seront générés dans :
- **macOS** : `src-tauri/target/release/bundle/dmg/PodcastSync_X.X.X_x64.dmg`
- **Windows** : `src-tauri/target/release/bundle/msi/PodcastSync_X.X.X_x64.msi`
- **Linux** : `src-tauri/target/release/bundle/deb/PodcastSync_X.X.X_amd64.deb`

**Note** : Tu peux seulement compiler pour ta plateforme actuelle.

### 3. Commit et Tag

```bash
# Commit les changements de version
git add .
git commit -m "Release v0.2.0"

# Créer le tag
git tag -a v0.2.0 -m "Release v0.2.0"

# Push tout
git push origin main
git push origin v0.2.0
```

### 4. Créer la Release GitHub

#### Via Web UI (recommandé)

1. Va sur https://github.com/Synapsr/PodcastSync/releases
2. Clique **"Draft a new release"**
3. **Choose a tag** : Sélectionner `v0.2.0`
4. **Release title** : `PodcastSync v0.2.0`
5. **Description** : Copier le template ci-dessous
6. **Attach binaries** : Drag & drop le `.dmg` / `.msi` / `.deb`
7. Cocher **"Set as the latest release"**
8. Cliquer **"Publish release"**

#### Template de Release Notes

```markdown
# 🎉 PodcastSync v0.2.0

[Une ligne décrivant la release]

## ✨ New Features

- Feature 1
- Feature 2

## 🐛 Bug Fixes

- Fix 1
- Fix 2

## 🔄 Improvements

- Improvement 1
- Improvement 2

## 📥 Installation

### macOS
Download `PodcastSync_0.2.0_x64.dmg`

**⚠️ Security Warning**: App not code-signed. Right-click → Open → Open

### Windows
Download `PodcastSync_0.2.0_x64.msi`

**⚠️ Security Warning**: Click "More info" → "Run anyway"

### Linux
```bash
sudo dpkg -i PodcastSync_0.2.0_amd64.deb
```

## 📝 Full Changelog

See [CHANGELOG.md](https://github.com/Synapsr/PodcastSync/blob/main/CHANGELOG.md) for complete details.
```

### 5. Vérification

Après la publication :

1. ✅ La release apparaît dans https://github.com/Synapsr/PodcastSync/releases
2. ✅ Les binaires sont téléchargeables
3. ✅ L'updater dans l'app détecte la nouvelle version
4. ✅ Le lien de téléchargement fonctionne

## 🌐 Build Multi-Platform (Avancé)

Pour créer des binaires pour toutes les plateformes, tu as plusieurs options :

### Option 1 : GitHub Actions (Automatique)

Créer `.github/workflows/release.yml` :

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run tauri:build

      - name: Upload Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/dmg/*.dmg
            src-tauri/target/release/bundle/msi/*.msi
            src-tauri/target/release/bundle/deb/*.deb
```

Avec ça, quand tu push un tag, GitHub build automatiquement pour toutes les plateformes !

### Option 2 : Build Manuellement

Tu devras builder sur chaque plateforme (macOS, Windows, Linux) séparément.

## 🎯 Checklist Post-Release

- [ ] Tester le téléchargement depuis GitHub Releases
- [ ] Vérifier que l'updater détecte la nouvelle version
- [ ] Annoncer la release (réseaux sociaux, etc.)
- [ ] Mettre à jour la doc si nécessaire

## 🆘 Problèmes Courants

### Build échoue
```bash
# Nettoyer et rebuild
rm -rf node_modules src-tauri/target
npm install
npm run tauri:build
```

### Tag déjà existant
```bash
# Supprimer le tag local et distant
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0
# Recréer
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

### Binaire trop gros
C'est normal pour une app Tauri :
- macOS : ~20-30 MB
- Windows : ~15-25 MB
- Linux : ~20-30 MB

Ils incluent le runtime Chromium.
