# A.R Grand — Luxury Marriage & Banquet Hall Web Application

A modern, high-performance web platform built for **A.R Grand Marriage Hall & Banquet Hall** in Kodungaiyur, North Chennai. Designed with premium luxury aesthetics, hardware-accelerated animations, real-time date availability, and an interactive virtual concierge.

---

## 🏛️ Project Overview

- **Client**: A.R Grand Marriage & Party Hall
- **Location**: Kodungaiyur (East), Vivekananda Nagar, Chennai, Tamil Nadu
- **Website**: Production Showcase & Booking Platform
- **Key Features**:
  - **Dynamic Cinematic Preloader**: GPU-accelerated WebGL green/white-screen keying shader with synchronized progress metering.
  - **Interactive 3D Virtual Concierge**: Interactive avatar delivering page-context audio tours and guidance across wedding halls, facilities, and booking policies.
  - **Live Availability & Booking Calendar**: Real-time month-by-month date palette with dedicated smooth scrolling and instant booking management.
  - **High-Definition Media Gallery**: Responsive visual showcase of banquet halls, stages, private suites, lifts, and commercial kitchen facilities.
  - **Administrative Management Suite**: Secure authenticated booking administration portal.
  - **Search Engine Optimization**: Full schema.org `LocalBusiness` / `EventVenue` JSON-LD structured data and OpenGraph metadata.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, TypeScript |
| **Build & Tooling** | Vite 5, PostCSS, Tailwind CSS |
| **Graphics & Animation** | WebGL 2.0 (real-time chroma keying & transparency shader) |
| **State & Data Fetching** | TanStack React Query |
| **Routing** | React Router v6 |
| **UI Component Library** | Radix UI primitives, Lucide React icons |
| **Testing** | Vitest, React Testing Library |
| **Deployment** | Vercel / Static Hosting |

---

## 📁 Repository Structure

```text
AR-GRANDS/
├── public/                     # Static production assets
│   ├── audio/                  # Neural voice guide audio files (.mp3)
│   ├── avatar-*.mp4            # Virtual concierge video motion clips
│   ├── favicon.ico             # Multi-size browser favicon
│   ├── favicon.png             # High-resolution PNG favicon
│   ├── favicon-32x32.png       # 32x32 tab icon
│   ├── apple-touch-icon.png    # Mobile app home screen icon
│   ├── logo.png                # Official Metallic AR Serif Monogram
│   ├── robots.txt              # Production crawler directives
│   └── sitemap.xml             # Search engine sitemap
├── scripts/                    # Automation and generation tooling
│   ├── download_voices.py      # Edge-TTS neural voice synthesizer
│   └── generate_avatar_clips.py# Concierge video processing utility
├── src/                        # Application source code
│   ├── assets/                 # Venue photography & branding assets
│   │   ├── branding/           # High-resolution source monograms & logos
│   │   └── *.jpg               # Authentic hall, exterior & gallery imagery
│   ├── components/             # Reusable UI & feature components
│   │   ├── ui/                 # Accessible Radix-based UI primitives
│   │   ├── Footer.tsx          # Global luxury footer
│   │   ├── HeroSlider.tsx      # Main homepage carousel slider
│   │   ├── InteractiveAvatar.tsx# Concierge avatar with WebGL shader
│   │   ├── Navbar.tsx          # Responsive navigation bar
│   │   ├── Preloader.tsx       # GPU WebGL cinematic loading screen
│   │   ├── ScrollToTop.tsx     # Window scroll coordinator
│   │   └── SEO.tsx             # Dynamic metadata & JSON-LD component
│   ├── hooks/                  # Custom React hooks
│   ├── integrations/           # Backend API & Supabase connectors
│   ├── lib/                    # Shared utility functions
│   ├── pages/                  # Routed application views
│   │   ├── Index.tsx           # Home page
│   │   ├── Gallery.tsx         # Hall & stage image gallery
│   │   ├── Events.tsx          # Booking calendar & date availability
│   │   ├── Facilities.tsx      # Venue amenities & features
│   │   ├── Contact.tsx         # Contact & location inquiries
│   │   ├── Terms.tsx           # Booking policy & regulations
│   │   └── AdminLogin.tsx      # Venue management portal
│   ├── test/                   # Unit and integration test suites
│   ├── App.tsx                 # Route declarations & providers
│   ├── index.css               # Design system tokens & utility classes
│   └── main.tsx                # Application bootstrap & scroll restoration
├── .gitignore                  # Git exclusion rules
├── components.json             # Shadcn component configuration
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or Bun / pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/reddotorg123/AR_GRANDS.git
cd AR_GRANDS

# Install dependencies
npm install
```

### Development Server

```bash
# Start Vite development server at http://localhost:8080
npm run dev
```

### Running Tests

```bash
# Execute test suite via Vitest
npm test
```

### Production Build

```bash
# Type-check and build production bundle into /dist
npm run build

# Preview production build locally
npm run preview
```

---

## ⚙️ Maintenance & Asset Scripts

### Neural Concierge Audio Generation
To regenerate or update concierge speech audio clips:
```bash
python scripts/download_voices.py
```

### Concierge Video Clip Processing
To process motion clips for the concierge avatar:
```bash
python scripts/generate_avatar_clips.py
```

---

## 📜 Quality Standards & Conventions

1. **Brand Continuity**: All visual styling uses curated color tokens defined in `index.css` (`--gold`, `--noir`, `--cream`).
2. **Scroll Restoration**: Route changes automatically reset window viewport to coordinate `(0, 0)` via `ScrollToTop.tsx`.
3. **Responsive Design**: Mobile-first architecture supporting mobile (360px+), tablet, and desktop (up to 4K displays).
4. **Code Quality**: Strict TypeScript types enabled throughout the codebase with ESLint verification.
