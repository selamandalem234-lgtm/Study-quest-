# Revised Implementation Plan: Warm, Handcrafted Study Journal & Smart Decluttering

## User Vision & Objectives
1. **Visual Metamorphosis**: Transform Study Quest into a **warm, cozy, handcrafted personal study journal** inspired by paper journals, warm cream surfaces, espresso typography, muted sage progress indicators, soft terracotta highlights, and fine pen-and-ink styling.
2. **Smart Decluttering**: Simplify and declutter the interface by removing redundant displays, duplicate progress counters, and excessive header noise, allowing genuine study workflows to breathe with comfortable margins and clarity.
3. **Strict Feature & Data Protection**:
   - Strictly preserve all essential functionality:
     - Grade selection (Grade 6, 9, 10, 11, 12).
     - Strict 3-exam separation (**FQT**, **Test 2**, **FE**).
     - Manual subject creation, editing, deleting, page ranges, and validation.
     - Study targets, countdowns, and daily page pace calculations.
     - Study timers (10-min Sprint & 25+5 Pomodoro focus sessions).
     - Study progress calculations and history.
     - XP, levels, streak records, badges, and socks.
     - 3D Bean world & crop farming mechanics.
     - Firebase cloud synchronization and offline HTML single-file export.
   - Do NOT rename application, logo, or existing data structures.
   - Maintain light and dark mode functionality with rich contrast.

---

## 1. Smart Decluttering Audit (What Stays vs. What Gets Cleaned)

### What We Are Decluttering (Removing Redundancy & Clutter):
1. **Header Congestion**:
   - The header currently packs 8+ buttons, badges, and dropdowns side-by-side (`SQ logo`, `Grade Selector`, `Exam Switcher`, `+ Add Subject`, `Friend Code pill`, `Sky Map balloon`, `Streak flame`, `Socks pill`, `Google Sign In`, `PWA install`, `Dark toggle`, `HTML downloader`).
   - *Decluttering Action*:
     - Keep the core navigation essentials: Brand (`Study Quest`), `Grade Selector`, `Exam Switcher`, and primary user controls (Theme Toggle, Sign In/Profile, Offline HTML).
     - Clean up duplicate shortcuts in the header (e.g. the duplicate `+ Add Subject` button in the header when it already exists in the exam dropdown and prominently on the Subjects page; the friend code and balloon pill which are already on the 3D Island toolbar).
2. **Today Tab Progress Duplication**:
   - Currently, the Today tab has the large `ExamCountdownWidget` showing Portion Coverage %, immediately followed by a large concentric `ActivityRings` card showing the exact same Portion Coverage % and target numbers again, followed by another progress bar.
   - *Decluttering Action*: Consolidate the daily goal and exam progress cleanly: let `ExamCountdownWidget` handle the exam countdown and pace, and let the Daily Progress Card focus purely on today's target (daily pages studied, today's streak, and active timer), removing redundant stacked text banners.
3. **Subjects Tab Redundant Banner**:
   - The Subjects tab has an "Add Subject" button in the top header, an "Add Subject" button in the tab title bar, an "Add Subject" in the exam cards, and an "Add Subject" link in the list header.
   - *Decluttering Action*: Unify into one clear, beautifully crafted journal button at the top of the subjects notebook list.

---

## 2. Color Palette & Aesthetic System

| Element | Journal Light Mode (Warm Linen) | Journal Dark Mode (Cozy Midnight Study) |
|---|---|---|
| **Base Canvas** | `#FBF8F2` (Warm linen cream) | `#1A1715` (Deep warm espresso) |
| **Cards & Panels** | `#FFFFFF` with warm cream tint (`#FFFDF9`) | `#24201D` (Warm dark parchment) |
| **Hairline Rules / Borders**| `#EAE4D9` (Delicate warm ruled line) | `#38312B` (Subtle ink rule) |
| **Primary Ink (Headings/Body)**| `#2B2118` (Deep espresso ink) | `#F4EFE6` (Warm parchment cream) |
| **Secondary Ink (Captions/Meta)**| `#6E6256` (Warm walnut taupe) | `#ACA195` (Soft warm taupe) |
| **Muted Sage Green** | `#4F6F52` (Backgrounds: `#E8EFE8`) | `#739E77` (Backgrounds: `#233325`) |
| **Soft Terracotta Accent** | `#C15C3D` (Backgrounds: `#F9EBE6`) | `#E07A5F` (Backgrounds: `#38231C`) |
| **Warm Gold / Honey** | `#B8860B` / `#D4A373` (Parchment accents) | `#E9C46A` (Midnight candle glow) |

---

## 3. Typography & Journal Textures
- **Headings & Titles**: `Playfair Display` (weights 600, 700) for an elegant, literary personal notebook title feel.
- **Body & Tabular Data**: `Plus Jakarta Sans` for clean, modern readability with tabular figures (`tabular-nums`) for page numbers and counters.
- **Journal Flourishes**:
  - Soft paper stipple background in CSS (`background-image` with subtle SVG paper fiber or noise).
  - Delicate notebook-style borders (`border-stone-200/80` and `shadow-[0_4px_20px_-4px_rgba(43,33,24,0.05)]`).
  - Warm ink icons with stroke weight harmonized to the typography.

---

## 4. Step-by-Step Implementation Strategy

### Step 1: Typography & Global CSS Foundation (`index.html`, `src/index.css`)
- Add Google Font import for `Playfair Display:ital,wght@0,600;0,700;1,600` in `index.html`.
- In `src/index.css`:
  - Establish `:root` variables for journal surfaces, ink colors, sage, and terracotta.
  - Define `.journal-card` and `.journal-panel` utility classes replacing tech glassmorphism with warm paper surfaces and natural soft shadows.
  - Apply warm paper background to `body`.

### Step 2: Top Bar Header Decluttering & Restyling (`src/App.tsx`)
- Keep layout responsive and clean:
  - Brand zone: Wordmark in `Playfair Display` (`Study Quest`) with subtle `Journal` subtitle.
  - Center controls: Persistent `Grade Selector` and `Exam Switcher` styled with warm parchment pills and espresso ink typography.
  - Action zone: Clean streak flame, theme toggle, Google account avatar/sign-in, and offline HTML export.
  - Remove duplicate clutter shortcuts that already belong inside the 3D Island or Subjects tabs.

### Step 3: Exam Countdown Widget & Today Tab Refinement (`src/components/ExamCountdownWidget.tsx`, `src/App.tsx`)
- Restyle `ExamCountdownWidget`:
  - Replace vibrant neon glowing orbs with warm parchment cards, terracotta countdown numeral, espresso headers, and sage progress indicators.
  - Ensure FQT, Test 2, and FE theme colorings use muted natural tones (Sage Green for FQT, Warm Terracotta for Test 2, Deep Plum/Walnut for FE).
- In Today Tab:
  - Clean up duplicate progress counters.
  - Style the 10-Minute Sprint and 25-Minute Pomodoro buttons with warm espresso and terracotta journal styles.
  - Retain the Weekly Activity chart with warm sage and espresso bars.

### Step 4: Subjects & Portion Division Tab (`src/App.tsx`, `src/components/SubjectManualEditorModal.tsx`)
- Restyle the 3 Exam Cards (FQT, Test 2, FE) like bound journal volumes with bookmark tags and clear page range summaries.
- Style the Subject Cards with warm cardstock backgrounds, clean ink progress bars, and unobtrusive page badges.
- Restyle `SubjectManualEditorModal` as a tidy index-card modal with warm cream input surfaces and soft terracotta Save button.

### Step 5: 3D Sky Island, Quizzes & Settings Tabs
- Update Sky Island container frame to feel like an antique explorer's celestial map or study desk terrarium.
- Ensure all 3D canvas interactions, crops, watering mechanics, and character animations remain untouched.
- Restyle Quiz and Setup tabs to match the warm paper journal palette.

---

## 5. Verification Checklist & Testing
1. **Compilation & Syntax**: Run `compile_applet` and `lint_applet` concurrently (zero errors).
2. **Functionality Verification**:
   - Test grade switching (Grade 6, 9, 10, 11, 12) -> syllabus resets correctly.
   - Test exam switching (FQT, Test 2, FE) -> data isolation preserved.
   - Test adding, editing, and deleting a subject manual page range.
   - Test starting 10-min Sprint and 25-min Pomodoro timer.
   - Test crop watering and 3D Bean world.
   - Test Light / Dark mode toggle with WCAG AA contrast check.
   - Verify dev server returns HTTP 200 OK.
