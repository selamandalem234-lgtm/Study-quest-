# Study Quest — Multiplayer Bean World & Grade 10 Companion 🌍

A premium, cozy 3D multiplayer study game and Grade 10 academic companion built with React 19, TypeScript, Vite, Tailwind CSS, Three.js, and Google Firebase.

---

## 🌐 Live Deployed Application

* **Production URL**: [https://ais-pre-62cafkscyh7jfxl3nzzqxw-643154515879.europe-west1.run.app](https://ais-pre-62cafkscyh7jfxl3nzzqxw-643154515879.europe-west1.run.app)
* **PWA Mobile App**: Open in Google Chrome on Android and tap **"Install App"** to add to your phone's home screen.

---

## 📱 Android PWA Installation & Multi-Device Sync

### Installing on Android:
1. Open the Live Production URL in Google Chrome on your Android device.
2. Tap the in-app **"Install App"** button (or tap Chrome menu **⋮** -> **Install app** / **Add to Home screen**).
3. Confirm by tapping **Install**. Study Quest launches in full-screen standalone mode.

### Syncing Across Devices:
1. Tap **Sign In** in the top navigation bar to authenticate with Google.
2. Open the URL or install the PWA on any second phone, tablet, or PC.
3. Sign in with the same Google account. Your Bean companion, sky island, farm crops, friend codes, study stats, and socks sync automatically in real-time.

---

## 🚀 Running the Project Outside Google AI Studio

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended, e.g. Node 20 LTS or Node 22)
* **npm** (comes with Node.js)

### 1. Installation
Clone or extract the project directory on your computer, then install dependencies:
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The application will start on `http://localhost:3000` (or the next available port). Open that URL in Chrome, Safari, Edge, or Firefox.

### 3. Build for Production
To create an optimized, minified production bundle:
```bash
npm run build
```
The compiled production assets will be generated in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## ☁️ Firebase Configuration & Database Setup

The project is pre-configured with Google Cloud Firestore and Firebase Authentication:
* **Configuration File**: `firebase-applet-config.json` (located in the project root)
* **Firebase Project ID**: `poised-physics-1hl8x`
* **Firestore Database ID**: `ai-studio-studyquestgrade1-ef4b5bf9-c51e-4313-a626-15b2ad82747e`
* **Security Rules**: `firestore.rules` (enforces strict ownership rules so players cannot alter each other's crops or progress during spectator visits)
* **Schema Blueprint**: `firebase-blueprint.json`

### Offline Guest Mode Fallback
If you run the app without internet access or without signing in, the application automatically uses browser `localStorage` and `IndexedDB`. No progress or data is lost.

---

## 🗂️ Project Structure

```
├── firebase-applet-config.json  # Firebase credentials & Firestore database ID
├── firebase-blueprint.json       # Database schema blueprint
├── firestore.rules               # Production security rules (ABAC)
├── index.html                    # Single-page app HTML entry point
├── package.json                  # Dependencies (React, Three.js, Firebase, Lucide)
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration (Port 3000)
├── StudyQuest-Grade10.html       # Standalone single-file offline HTML
├── public/                       # Static public assets
│   └── StudyQuest-Grade10.html
└── src/
    ├── main.tsx                  # React 19 root bootstrap
    ├── App.tsx                   # Main game orchestrator & tab controller
    ├── types.ts                  # Type definitions (Subjects, Quizzes, Badges, Crops)
    ├── constants.ts              # 12 Grade 10 subjects, page ranges, XP, ranks
    ├── firebase.ts               # Firebase Auth & Firestore client SDK
    ├── textbookQuizParser.ts     # Authentic textbook question extractor (non-AI)
    ├── quizEngine.ts             # PDF.js textbook reader & IndexedDB caching
    ├── exportStandaloneHtml.ts   # Direct in-memory Blob exporter for offline HTML
    └── components/
        ├── ThreeIslandGame.tsx   # Stylized 3D WebGL floating island with Three.js
        ├── FloatingIslandView.tsx# 2D cozy vector island fallback
        ├── TextbookQuizModal.tsx # Verbatim textbook examination practice modal
        ├── WorldSkyMap.tsx       # Celestial constellation sky map of friend islands
        ├── FriendsDrawer.tsx     # Friend Code sharing & multiplayer visiting
        ├── BeanWardrobeModal.tsx # Customizable 3D Bean hats and colors
        ├── FarmShopModal.tsx     # Seed shop, cabin expansion & meadow decor
        ├── FocusSheet.tsx        # Pomodoro 25+5 & 10m study timer sheet
        ├── ActivityRings.tsx     # Concentric daily progress activity rings
        └── BeanSvg.tsx           # Bean emotional expression vectors
```

---

## 📱 Running on Android Mobile & Tablets

1. **Option A (Web Server / Dev)**: Run `npm run dev` on your computer on the same Wi-Fi network and open `http://<your-computer-ip>:3000` on your Android device.
2. **Option B (Standalone Offline HTML)**: Tap the **"HTML"** download button in the top navigation bar. It downloads `StudyQuest-Grade10.html` directly to your Android device from browser memory. You can tap and open it in Chrome with zero internet or server required.
