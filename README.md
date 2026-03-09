# DesignSync

**AI-Powered Design-to-Code Verification Platform**

> Catch design implementation gaps before they reach development. DesignSync uses AI vision to verify that designs match your component library and cover all expected use cases.

[![Theme: Quality Enhancement](https://img.shields.io/badge/Theme-Quality%20Enhancement-blue)](#)
[![AI: Gemini 2.5 Flash](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange)](#)
[![Stack: Vue + Express + MongoDB](https://img.shields.io/badge/Stack-Vue%20%2B%20Express%20%2B%20MongoDB-green)](#)

---

## 🎯 The Problem

### Design-to-Development Handoff is Broken

Every sprint, we face the same issues:

| Pain Point | Impact | Frequency |
|------------|--------|-----------|
| **Missing edge cases in designs** | Developers discover gaps mid-sprint, causing delays | Every feature |
| **Component mismatches** | Designs use components that don't exist or miss required props/slots | 40%+ of reviews |
| **No systematic validation** | Manual reviews are inconsistent and time-consuming | 2-4 hours per feature |
| **Late-stage rework** | Issues found in code review or QA instead of design review | 30% of PRs |

**Business Impact:**
- ⏱️ **8-12 hours wasted per feature** on back-and-forth between design and dev
- 🔄 **30% of design iterations** happen after development starts
- 🐛 **Design debt accumulates** because systematic reviews are too slow

---

## 💡 The Solution

DesignSync automates design verification using AI vision analysis:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DesignSync Flow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐  │
│   │   PRD    │────▶│  AI Extracts │────▶│   Expected   │────▶│  Design  │  │
│   │ Document │     │  Test Cases  │     │    Cases     │     │  Review  │  │
│   └──────────┘     └──────────────┘     └──────────────┘     └──────────┘  │
│                                                                     │       │
│   ┌──────────┐                                                     ▼       │
│   │  GitHub  │────▶ Index Components ────▶┌──────────────────────────────┐ │
│   │   Repo   │     (props, slots,         │     AI Vision Analysis       │ │
│   └──────────┘      variants)             │  ┌────────────────────────┐  │ │
│                                           │  │ • Case Coverage Check  │  │ │
│   ┌──────────┐                            │  │ • Component Mapping    │  │ │
│   │  Design  │────▶ Upload Screenshots ──▶│  │ • Gap Detection        │  │ │
│   │  Images  │                            │  └────────────────────────┘  │ │
│   └──────────┘                            └──────────────────────────────┘ │
│                                                          │                  │
│                                                          ▼                  │
│                                           ┌──────────────────────────────┐  │
│                                           │      Actionable Report       │  │
│                                           │  • Missing cases (red)       │  │
│                                           │  • Partial coverage (yellow) │  │
│                                           │  • Component gaps (warnings) │  │
│                                           └──────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. 📋 PRD → Test Case Generation
Upload your PRD and AI extracts all expected user flows, edge cases, and states:

- **Critical flows** (must-have for MVP)
- **Important cases** (significantly impacts UX)
- **Nice-to-have** (can be deprioritized)

### 2. 📦 Component Library Indexing
Connect your GitHub repo and automatically index your component library:

- Extracts **props**, **slots**, **variants**
- Supports **Vue**, **React**, **Svelte**, **Angular**
- OAuth integration for private repos
- One-click re-sync when library updates

### 3. 🔍 AI-Powered Design Analysis
Upload design screenshots and get instant verification:

| Check | What It Does |
|-------|--------------|
| **Case Coverage** | Verifies each expected case is represented in designs |
| **Component Mapping** | Identifies which library components are used |
| **Gap Detection** | Flags missing props, slots, or non-existent components |

### 4. 📊 Actionable Reports
Clear, filterable results with visual indicators:

- ✅ **Covered** - Case/component is fully represented
- ⚠️ **Partial** - Some aspects missing (with specific details)
- ❌ **Missing** - Not found in designs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              System Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Frontend (Vue 3 + TypeScript)                │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │   │
│  │  │ Projects│ │UI Libs  │ │ Reviews │ │ Reports │ │  Auth   │        │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │   │
│  │                          Tailwind CSS + Vue Router                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Backend (Express + TypeScript)                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │   REST API  │  │   Services  │  │   Models    │                  │   │
│  │  │  /projects  │  │  - GitHub   │  │  - Project  │                  │   │
│  │  │  /reviews   │  │  - Gemini   │  │  - Review   │                  │   │
│  │  │  /libraries │  │  - Parser   │  │  - UILib    │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                    │                             │
│                          ▼                    ▼                             │
│  ┌───────────────────────────┐    ┌───────────────────────────┐            │
│  │     Gemini 2.5 Flash      │    │         MongoDB           │            │
│  │  • Vision Analysis        │    │  • Projects & Reviews     │            │
│  │  • Case Generation        │    │  • Component Index        │            │
│  │  • Component Matching     │    │  • Analysis Results       │            │
│  └───────────────────────────┘    └───────────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Vue 3, TypeScript, Tailwind | Modern, type-safe, rapid UI development |
| **Backend** | Express, TypeScript | Lightweight, flexible REST API |
| **Database** | MongoDB | Schema flexibility for evolving data models |
| **AI** | Gemini 2.5 Flash | Best-in-class vision + fast response times |
| **Auth** | GitHub OAuth | Seamless access to private repos |

---

## 📈 Impact & Metrics

### Time Savings

| Activity | Before | After | Savings |
|----------|--------|-------|---------|
| Manual design review | 2-4 hours | 5-10 minutes | **90%+** |
| Finding component mismatches | 30+ minutes | Instant | **100%** |
| Identifying missing cases | Often missed | Automated | **∞** |

### Quality Improvements

- **Earlier detection**: Catch issues in design phase, not code review
- **Systematic coverage**: No more "we forgot the empty state" moments
- **Component alignment**: Ensure designs use what actually exists in code

### ROI Calculation

For a team doing **10 features/month**:
- **Before**: 10 × 4 hours = 40 hours of manual review
- **After**: 10 × 10 minutes = ~2 hours
- **Monthly savings**: 38 engineering hours = **~₹1.5L/month** in productivity

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- GitHub OAuth App (for private repos)
- Gemini API Key

### Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd design-code-analyzer

# Backend setup
cd designsync-server
cp .env.example .env
# Add your MONGODB_URI, GEMINI_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
npm install
npm run dev

# Frontend setup (new terminal)
cd designsync-app
cp .env.example .env
# Add VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

### Environment Variables

**Backend (`designsync-server/.env`):**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/designsync
GEMINI_API_KEY=your_gemini_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FRONTEND_URL=http://localhost:5173
```

**Frontend (`designsync-app/.env`):**
```env
VITE_API_URL=http://localhost:3000
```

---

## 🎮 Usage Demo

### Step 1: Create a Project
```
Project: "Post Scheduler Revamp"
PRD: [Paste your PRD text]
→ AI generates 36 expected cases
```

### Step 2: Link UI Library
```
GitHub: highrise-ui/components (private)
→ OAuth login
→ 184 components indexed with props/slots
```

### Step 3: Create Design Review
```
Upload: Dashboard screenshot (Figma export)
→ AI analyzes in 3 steps:
   1. Generate cases from image
   2. Check coverage against expected cases
   3. Map to component library
```

### Step 4: Review Results
```
Case Coverage: 17/36 covered (47%)
├── ✅ View Post List - COVERED
├── ⚠️ Delete Post - PARTIAL (no confirmation modal)
└── ❌ Empty State - MISSING

Components: 12/17 matched
├── ✅ Button - exists
├── ⚠️ Input - missing slots: edit-actions, suffix
└── ❌ BulkActions - not in library
```

---

## 🔮 Production Roadmap

### Phase 1: MVP (Current)
- [x] PRD → Case generation
- [x] Component library indexing
- [x] AI design analysis
- [x] Coverage reports

### Phase 2: Integration
- [ ] Figma plugin for direct uploads
- [ ] Slack notifications for review results
- [ ] JIRA integration for tracking

### Phase 3: Scale
- [ ] Multi-project dashboards
- [ ] Historical trend analysis
- [ ] Team collaboration features

---

## ⚠️ Risk Assessment

| Risk | Mitigation |
|------|------------|
| AI accuracy varies | Human review for critical decisions; AI as assistant not replacement |
| API rate limits | Caching, batch processing, queuing for large libraries |
| Private repo security | OAuth scopes limited; no credentials stored |
| Design image size | Client-side compression before upload |

---

## 🧪 Testing

```bash
# Backend tests
cd designsync-server
npm test

# Frontend tests
cd designsync-app
npm test
```

---

## 👥 Team

Built for Dev Nitro 2026 by the DesignSync team.

---

## 📄 License

Internal use only. All code becomes company IP per contest rules.

---

<div align="center">

**DesignSync** — *Catch design gaps before they become code bugs*

</div>
# kickoff
