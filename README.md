# NEWSAXIS — Ultimate Production-Ready News + Blog Platform

> **NewsAxis — Discover What Matters.**

NewsAxis is a digital media platform combining real-time global news aggregation with an ephemeral, 72-hour community publishing ecosystem. Built with React (JSX) + Vite + Tailwind CSS + Appwrite, it provides balanced, attributed news alongside user-generated stories.

---

## 🚀 Key Highlights & Architecture

1. **Normalized Provider Abstraction Layer**:
   - Integrates 10+ real-world content sources (Google News, The Hindu, BBC, TechCrunch, Wired, DEV.to, Hashnode, Medium RSS, GNews).
   - In-memory & Appwrite caching with deduplication algorithms based on Canonical URL, Provider IDs, and Title similarity hashes.
   - Fault-tolerant graceful degradation: if one feed encounters rate limits or latency, remaining providers and cached articles continue seamlessly.

2. **Mandatory 72-Hour Community Retention**:
   - Hard business rule enforced server-side and client-side.
   - User-generated stories, comments, reactions, and uploaded media automatically expire and are purged after 72 hours via scheduled tasks (`cleanup-expired-content`).
   - Countdown timer badges displayed prominently on community cards.

3. **Editorial Transparency & Source Attribution**:
   - Differentiates between *External News*, *Editorial Original*, and *Community Report*.
   - Direct backlinks to original publishers with copyright disclaimers.

4. **Modern UI & Accessibility (WCAG 2.1)**:
   - Dynamic dark / light theme switcher with preference persistence.
   - Animated Breaking News Ticker with accessible Pause/Play controls.
   - Web Speech API integration for text-to-speech reading mode.
   - Full keyboard accessibility and responsive design from 320px mobile to ultra-wide displays.

5. **Editorial Admin CMS**:
   - Route: `/admin` (Protected for `admin` role).
   - Real-time provider health status inspection (latency, state, type).
   - Manual & automated trigger for 72-hour community cleanup lifecycle.
   - Role simulation switcher in the user dropdown for testing.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, JavaScript (JSX), Tailwind CSS v4, Lucide React, React Router v7, DOMPurify.
- **Backend / Platform**: Appwrite (Auth, Databases, Storage, Scheduled Functions).
- **Deployment**: Vercel.
- **CI/CD**: GitHub Actions.

---

## 📂 Project Structure

```text
newsaxis/
├── .github/workflows/ci.yml       # Automated CI build pipeline
├── appwrite/                      # Appwrite Functions
│   └── functions/
│       └── cleanup-expired-content/ # 72-Hour retention scheduler
├── src/
│   ├── components/                # Modular UI components
│   │   ├── common/                # Button, Badge, Design tokens
│   │   ├── layout/                # Footer, containers
│   │   ├── navigation/            # Header, search, categories strip
│   │   ├── news/                  # HeroStory, BreakingTicker
│   │   └── article/               # ArticleCard with countdowns
│   ├── config/                    # Central app & Appwrite config
│   ├── constants/                 # Categories, taxonomy, seed data
│   ├── context/                   # AuthContext, ThemeContext
│   ├── providers/                 # 10+ Real-world content adapters
│   ├── services/                  # ArticleService, Appwrite Client
│   ├── utils/                     # Normalization, deduplication, decay
│   ├── pages/                     # Full page routes
│   │   ├── HomePage.jsx
│   │   ├── ArticlePage.jsx
│   │   ├── CategoryPage.jsx
│   │   ├── LatestPage.jsx
│   │   ├── TrendingPage.jsx
│   │   ├── BlogsPage.jsx
│   │   ├── WriteStoryPage.jsx
│   │   ├── BookmarksPage.jsx
│   │   ├── SearchPage.jsx
│   │   └── admin/AdminDashboardPage.jsx
│   ├── App.jsx                    # Routing configuration
│   └── main.jsx
├── .env.example
├── README.md
└── package.json
```

---

## ⚡ Local Setup

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-username/newsaxis.git
   cd newsaxis
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Add your Appwrite Project ID and optional third-party news API keys.

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```
