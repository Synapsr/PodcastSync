# PodcastSync

A modern, cross-platform desktop application for automatically downloading and managing podcast episodes from RSS feeds. Built with **Tauri (Rust)** + **React** + **TypeScript**.

<div align="center">

![Tauri](https://img.shields.io/badge/Tauri-1.5-24C8DB?style=flat&logo=tauri)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript)
![Rust](https://img.shields.io/badge/Rust-1.70+-CE422B?style=flat&logo=rust)

</div>

## ✨ Features

### 📡 Subscription Management
- Add, edit, and delete RSS feed subscriptions
- Configurable check frequency (5 minutes to 24 hours)
- Enable/disable subscriptions on-demand
- Automatic pause of pending downloads when disabling a subscription
- Custom output directory per subscription
- Multiple audio quality preferences (Original, FLAC, MP3, or best available)

### 🎵 Audio Downloads
- Concurrent downloads with progress tracking
- Automatic retry on failure
- Support for multiple audio formats
- Smart quality fallback system
- Real-time progress updates via WebSocket-like events

### 📚 Episode Management
- View all episodes across subscriptions
- Filter by status: pending, downloading, completed, failed, paused
- Episode details modal with:
  - Full description and metadata
  - Available alternative versions (Original/FLAC/MP3)
  - Download history and technical information
- Retry failed downloads
- Open downloaded files in system file manager

### 🎧 Built-in Audio Player
- Play downloaded episodes directly in the app
- Play/pause controls
- Progress bar with seek functionality
- Audio visualization waveform
- Keyboard shortcuts support

### 🌍 Internationalization
- Full support for French and English
- Locale-aware date formatting
- Persistent language preference

### 🎨 Modern UI
- Dark theme optimized interface
- Real-time statistics dashboard
- Responsive design
- Smooth animations and transitions
- Lucide icons throughout

## 🚀 Perfect For

- 📻 Community radio stations
- 📦 Podcast archival
- 🤖 Broadcast automation systems
- 🎙️ Content creators
- 💾 Personal podcast backup

## 🛠️ Tech Stack

### Backend (Rust)
| Technology | Purpose |
|------------|---------|
| **Tauri 1.5** | Desktop application framework |
| **Tokio** | Async runtime |
| **SQLx** | Database ORM with compile-time verified queries |
| **Reqwest** | HTTP client for downloads |
| **RSS** | RSS/Atom feed parsing |
| **Chrono** | Date/time handling |

### Frontend (React)
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript 5.3** | Type safety |
| **Zustand** | State management |
| **Tailwind CSS** | Utility-first styling |
| **date-fns** | Date formatting and localization |
| **Lucide React** | Icon library |
| **Recharts** | Audio visualization |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and **npm** (or pnpm/yarn)
- **Rust** 1.70+ ([Install Rust](https://rustup.rs/))
- **System dependencies** for Tauri:
  - **macOS**: Xcode Command Line Tools
    ```bash
    xcode-select --install
    ```
  - **Windows**: [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - **Linux**: See [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)
    ```bash
    # Debian/Ubuntu
    sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
    ```

## 🏃 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Synapsr/PodcastSync.git
cd PodcastSync
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run in Development Mode

```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server (React frontend on port 1420)
- Build and launch the Tauri application
- Enable hot-reload for frontend changes
- Display Rust logs in the terminal

### 4. Build for Production

```bash
npm run tauri:build
```

The bundled application will be available in:
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `appimage/`

## ⚠️ Security Warnings

**Important**: The application is currently **not code-signed**. This means you will see security warnings when first launching:

### macOS
You'll see: *"PodcastSync can't be opened because it is from an unidentified developer"*

**To open:**
1. Right-click (or Control+click) the app
2. Select "Open"
3. Click "Open" in the dialog that appears
4. The app will now open and remember your choice

### Windows
You'll see: *"Windows protected your PC"*

**To open:**
1. Click "More info"
2. Click "Run anyway"
3. The app will install normally

### Why not signed?
Code signing requires expensive certificates ($99-300/year). As an open-source project, we currently distribute unsigned builds. The source code is fully auditable on GitHub. If this project grows, we'll invest in proper code signing certificates.

**Your security is important**: Always download from the official [GitHub Releases](https://github.com/Synapsr/PodcastSync/releases) page only.

## 📁 Project Structure

```
PodcastSync/
├── src/                          # React Frontend
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI components
│   │   ├── AudioPlayer.tsx       # Audio player component
│   │   ├── EpisodeDetailsModal.tsx
│   │   ├── Footer.tsx
│   │   └── LanguageSelector.tsx
│   ├── i18n/                     # Internationalization
│   │   ├── en.ts                 # English translations
│   │   ├── fr.ts                 # French translations
│   │   └── LanguageContext.tsx   # i18n provider
│   ├── stores/                   # Zustand state management
│   │   ├── useSubscriptionsStore.ts
│   │   ├── useEpisodesStore.ts
│   │   └── useAudioPlayerStore.ts
│   ├── types/                    # TypeScript type definitions
│   │   ├── subscription.ts
│   │   ├── episode.ts
│   │   ├── download.ts
│   │   └── events.ts
│   ├── lib/                      # Utilities and helpers
│   │   ├── api.ts                # Tauri command wrappers
│   │   └── utils.ts              # Helper functions
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Entry point
│
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── commands/             # Tauri IPC commands
│   │   │   ├── subscriptions.rs  # Subscription operations
│   │   │   ├── episodes.rs       # Episode operations
│   │   │   ├── downloads.rs      # Download operations
│   │   │   └── settings.rs       # App settings
│   │   ├── db/                   # Database layer
│   │   │   ├── models.rs         # Data models
│   │   │   ├── subscriptions.rs  # Subscription queries
│   │   │   ├── episodes.rs       # Episode queries
│   │   │   ├── queue.rs          # Download queue
│   │   │   └── settings.rs       # Settings storage
│   │   ├── rss/                  # RSS feed handling
│   │   │   ├── fetcher.rs        # HTTP fetching
│   │   │   └── parser.rs         # RSS/Atom parsing
│   │   ├── download/             # Download manager
│   │   │   └── manager.rs        # Concurrent download orchestration
│   │   ├── scheduler/            # Background tasks
│   │   │   └── feed_checker.rs   # Periodic RSS checks
│   │   ├── utils/                # Utilities
│   │   │   ├── error.rs          # Error types
│   │   │   └── file_naming.rs    # File path sanitization
│   │   ├── state.rs              # App state management
│   │   └── main.rs               # Entry point
│   ├── migrations/               # SQLx database migrations
│   │   └── 001_initial_schema.sql
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── README.md                     # This file
```

## 💾 Database

PodcastSync uses SQLite for data persistence with the following schema:

### Tables
- `subscriptions` - RSS feed subscriptions
- `episodes` - Episode metadata and download status
- `download_queue` - Active download queue
- `settings` - Application settings

### Database Location
- **macOS**: `~/Library/Application Support/com.podcastsync.app/app.db`
- **Windows**: `%APPDATA%\com.podcastsync.app\app.db`
- **Linux**: `~/.local/share/com.podcastsync.app/app.db`

## 📖 Usage Guide

### Adding a Subscription

1. Click the **"Add Subscription"** button
2. Fill in the form:
   - **Name**: A friendly name for the podcast
   - **RSS URL**: The RSS/Atom feed URL
   - **Output Directory**: Where to save downloaded files
   - **Check Frequency**: How often to check for new episodes (5min - 24h)
   - **Max Items**: Limit episodes to check per refresh (default: 10)
   - **Audio Quality**: Preferred quality (Default/Original/FLAC/MP3)
3. Click **"Create"**

The app will immediately check the feed and discover episodes.

### Managing Subscriptions

- **Edit**: Click the pencil icon to modify settings
- **Refresh**: Click the refresh icon to manually check for new episodes
- **Toggle**: Use the switch to enable/disable automatic checking
  - ⚠️ Disabling pauses all pending/downloading episodes
- **Delete**: Click the trash icon to remove the subscription

### Episode Statuses

| Status | Icon | Description |
|--------|------|-------------|
| **Pending** | 🕐 Yellow | Episode discovered, waiting to download |
| **Downloading** | 📥 Blue | Currently downloading |
| **Completed** | ✅ Green | Successfully downloaded |
| **Failed** | ❌ Red | Download failed (retry available) |
| **Paused** | ⏸️ Orange | Download paused (subscription disabled) |

### Viewing Episode Details

Click on any episode card to open the details modal with:
- Full episode description
- Publication date and duration
- Download progress and status
- File path and size
- Available alternative versions (if available)
- Technical metadata (GUID, audio URL)

### Playing Episodes

1. Click the **play button** on any completed episode
2. Use the audio player controls at the bottom:
   - Play/Pause
   - Seek through the waveform
   - View current time and duration

## 🔧 Development

### Available Scripts

```bash
# Frontend development
npm run dev              # Start Vite dev server only
npm run build            # Build frontend for production
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Tauri development
npm run tauri:dev        # Run app in development mode
npm run tauri:build      # Build production app

# Rust (in src-tauri/)
cargo test               # Run Rust tests
cargo check              # Check for compilation errors
cargo fmt                # Format Rust code
cargo clippy             # Lint Rust code
```

### Logging

Set the `RUST_LOG` environment variable for detailed logging:

```bash
# macOS/Linux
RUST_LOG=debug npm run tauri:dev

# Windows (PowerShell)
$env:RUST_LOG="debug"; npm run tauri:dev

# Windows (CMD)
set RUST_LOG=debug && npm run tauri:dev
```

Available log levels: `error`, `warn`, `info`, `debug`, `trace`

### Database Migrations

Migrations are handled by SQLx and run automatically on app startup.

To create a new migration:
```bash
cd src-tauri
sqlx migrate add migration_name
```

## 🐛 Troubleshooting

### "Failed to fetch RSS feed"
- ✅ Verify your internet connection
- ✅ Check that the RSS URL is valid and accessible
- ✅ Some feeds may require specific User-Agent headers
- ✅ Check the console logs for detailed error messages

### "Permission denied" when downloading
- ✅ Ensure the output directory exists and is writable
- ✅ On macOS/Linux, check folder permissions: `chmod +w /path/to/folder`
- ✅ Try selecting a different output directory

### Downloads stuck in "Downloading" state
- ✅ Check your internet connection
- ✅ Restart the application to reset the download manager
- ✅ Check disk space availability

### Database errors on startup
- ✅ Delete the database file to reset (⚠️ you'll lose all data)
- ✅ Ensure the app has write permissions to the data directory
- ✅ Check for file system errors

### UI not updating
- ✅ Refresh the page (Ctrl+R / Cmd+R in dev mode)
- ✅ Check browser console for errors (Ctrl+Shift+I)
- ✅ Verify WebSocket connection for real-time updates

## 🔄 Updates

PodcastSync includes an automatic update notification system:

### Automatic Update Checks

- ✅ **On startup**: The app checks for updates when it launches
- ✅ **Every 6 hours**: Automatic background checks while the app is running
- ✅ **Silent**: Checks happen in the background without interrupting your workflow
- ✅ **Non-intrusive**: Only notifies you if an update is available

### Update Notification

When a new version is available, you'll see:
- A notification banner in the top-right corner
- Current version vs. latest version
- Direct download button to GitHub Releases

You can also manually check for updates:
- Click the **"Check for Updates"** button in the footer
- View release notes and changelog

### Installing Updates

1. Click **"Download"** in the notification or modal
2. Download the latest release for your platform from [GitHub Releases](https://github.com/Synapsr/PodcastSync/releases)
3. Install the new version (it will replace the old one)
4. Your data (subscriptions, episodes) is preserved automatically

**Note**: PodcastSync notifies you of updates but does not download or install them automatically. This keeps the app simple, secure, and gives you full control over when to update.

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation
4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Code Style

- **TypeScript/React**: ESLint + Prettier configuration provided
- **Rust**: Follow `rustfmt` and `clippy` recommendations
- **Commits**: Use clear, descriptive commit messages

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with amazing open-source tools:
- [Tauri](https://tauri.app/) - The secure desktop framework
- [React](https://react.dev/) - UI library
- [Rust](https://www.rust-lang.org/) - Systems programming language
- [SQLx](https://github.com/launchbadge/sqlx) - Async SQL toolkit
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful icon library
- [date-fns](https://date-fns.org/) - Modern date utility library
- [Zustand](https://github.com/pmndrs/zustand) - State management

## 📬 Support

If you encounter any issues or have questions:
- 🐛 [Open an issue](https://github.com/Synapsr/PodcastSync/issues)
- 💬 [Start a discussion](https://github.com/Synapsr/PodcastSync/discussions)

---

<div align="center">

Made with ❤️ using Tauri + React

[⬆ Back to Top](#podcastsync)

</div>
