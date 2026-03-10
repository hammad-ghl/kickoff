# DesignSync Backend

> **AI-Powered Design-to-Code Verification Engine**  
> Express + TypeScript + MongoDB + Gemini 2.5 Flash

[![Built for Dev Nitro 2026](https://img.shields.io/badge/Dev%20Nitro-2026-blue)]() [![Quality Enhancement](https://img.shields.io/badge/Theme-Quality%20Enhancement-green)]()

---

## 🎯 What This Does

The backend powers DesignSync's AI-driven analysis pipeline that catches design implementation gaps before they reach development.

### Key Capabilities

```mermaid
graph LR
    A[Design Images] --> B[Gemini Vision AI]
    C[PRD Document] --> B
    D[Component Library] --> B
    B --> E[Gap Analysis]
    E --> F[Case Coverage Report]
    E --> G[Component Matching]
    E --> H[Issue Detection]
    
    style B fill:#9333ea
    style E fill:#3b82f6
```

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend (Vue 3)"]
        UI[User Interface]
    end
    
    subgraph API["Express REST API"]
        Routes[Routes]
        Controllers[Controllers]
        Middleware[Auth & CORS]
    end
    
    subgraph Services["Business Logic"]
        Auth[GitHub OAuth]
        GitHubAPI[GitHub API Client]
        GeminiService[Gemini Analyzer]
        Parser[Vue Parser]
    end
    
    subgraph Storage["Data Layer"]
        MongoDB[(MongoDB)]
        Models[Mongoose Models]
    end
    
    subgraph External["External APIs"]
        Gemini[Gemini 2.5 Flash]
        GitHub[GitHub API]
    end
    
    UI --> Routes
    Routes --> Controllers
    Controllers --> Auth
    Controllers --> GeminiService
    Controllers --> GitHubAPI
    
    Auth --> GitHub
    GitHubAPI --> GitHub
    GeminiService --> Gemini
    
    Controllers --> Models
    Models --> MongoDB
    
    GeminiService --> Parser
    
    style GeminiService fill:#9333ea
    style MongoDB fill:#47a248
    style Gemini fill:#ff6f00
```

---

## 📊 Data Flow

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API Server
    participant G as Gemini AI
    participant DB as MongoDB
    participant GH as GitHub API

    F->>A: Create Project + Review
    A->>DB: Save project config
    
    F->>A: Trigger Analysis
    A->>A: Queue background job
    A-->>F: 202 Accepted
    
    par Parallel Analysis
        A->>G: Generate test cases from PRD
        G-->>A: Expected cases
        A->>DB: Update project.expectedCases
        
        A->>GH: Index component library
        GH-->>A: Component definitions
        A->>DB: Save to UILibrary
    end
    
    A->>G: Check case coverage (images)
    G-->>A: Coverage results
    A->>DB: Update review.caseChecks
    
    A->>G: Map components (images + library)
    G-->>A: Component matches
    A->>DB: Update review.componentChecks
    
    A->>DB: Mark analysis complete
    
    loop Polling
        F->>A: GET /reviews/:id
        A-->>F: Updated review data
    end
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Gemini API Key
- GitHub OAuth App

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### Environment Variables

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/designsync
GEMINI_API_KEY=your_gemini_key_here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Reference

### Projects

```mermaid
graph LR
    A[POST /api/projects] --> B[Create Project]
    C[GET /api/projects] --> D[List Projects]
    E[GET /api/projects/:id] --> F[Get Project]
    G[PUT /api/projects/:id] --> H[Update Config]
    I[DELETE /api/projects/:id] --> J[Delete + Cascade]
    
    style B fill:#22c55e
    style D fill:#3b82f6
    style F fill:#3b82f6
    style H fill:#f59e0b
    style J fill:#ef4444
```

### Reviews (Design Analysis)

```mermaid
graph LR
    A[POST /api/projects/:id/analyze] --> B[Trigger Analysis]
    C[GET /api/reviews/:id] --> D[Get Results]
    E[PUT /api/reviews/:id] --> F[Update Review]
    G[DELETE /api/reviews/:id] --> H[Delete Review]
    
    B --> I[Background Job]
    I --> J[Phase 1: Generate Cases]
    J --> K[Phase 2: Check Coverage]
    K --> L[Phase 3: Map Components]
    
    style B fill:#9333ea
    style I fill:#9333ea
    style J fill:#3b82f6
    style K fill:#3b82f6
    style L fill:#3b82f6
```

### UI Libraries

```mermaid
graph LR
    A[POST /api/ui-libraries] --> B[Index Repository]
    B --> C[GitHub OAuth]
    C --> D[Clone/Parse]
    D --> E[Extract Components]
    E --> F[Save to DB]
    
    G[GET /api/ui-libraries] --> H[List Libraries]
    I[GET /api/ui-libraries/:id] --> J[Get Components]
    
    style B fill:#22c55e
    style E fill:#9333ea
```

---

## 🧠 AI Analysis Pipeline

### Phase 1: Case Generation

```mermaid
flowchart LR
    A[PRD Text] --> B{Has PRD?}
    B -->|Yes| C[Extract from PRD]
    B -->|No| D[Generate from Design]
    
    C --> E[Gemini Analysis]
    D --> E
    
    E --> F[Expected Cases]
    F --> G[(Save to Project)]
    
    style E fill:#ff6f00
    style G fill:#47a248
```

### Phase 2: Coverage Check

```mermaid
flowchart LR
    A[Design Images] --> B[Gemini Vision]
    C[Expected Cases] --> B
    
    B --> D{For each case}
    D --> E[Covered?]
    D --> F[Partial?]
    D --> G[Missing?]
    
    E --> H[(Update Review)]
    F --> H
    G --> H
    
    style B fill:#ff6f00
    style H fill:#47a248
```

### Phase 3: Component Mapping

```mermaid
flowchart LR
    A[Design Images] --> B[Gemini Vision]
    C[UI Library Components] --> B
    
    B --> D{Identify Components}
    D --> E[Exists in Library?]
    
    E -->|Yes| F{All Props/Slots?}
    E -->|No| G[Flag as Missing]
    
    F -->|Yes| H[✓ Full Match]
    F -->|No| I[⚠ Partial Match]
    
    H --> J[(Update Review)]
    I --> J
    G --> J
    
    style B fill:#ff6f00
    style H fill:#22c55e
    style I fill:#f59e0b
    style G fill:#ef4444
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    Project ||--o{ Review : has
    Project ||--o{ UILibrary : uses
    
    Project {
        ObjectId _id
        string name
        string description
        Object config
        Array expectedCases
        Date createdAt
    }
    
    Review {
        ObjectId _id
        ObjectId projectId
        string title
        Array designImages
        string analysisPhase
        Array caseChecks
        Array componentChecks
        Date createdAt
    }
    
    UILibrary {
        ObjectId _id
        string name
        Object repository
        Array components
        Date indexedAt
    }
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express.js | REST API server |
| **Language** | TypeScript | Type safety |
| **Database** | MongoDB + Mongoose | Data persistence |
| **AI** | Gemini 2.5 Flash | Vision analysis |
| **Auth** | GitHub OAuth | Private repo access |
| **Parser** | Custom Vue SFC parser | Component extraction |

---

## 📁 Project Structure

```
designsync-server/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── projectController.ts
│   │   ├── reviewController.ts
│   │   ├── uiLibraryController.ts
│   │   └── authController.ts
│   ├── models/               # Mongoose schemas
│   │   ├── Project.ts
│   │   ├── Review.ts
│   │   └── UILibrary.ts
│   ├── services/             # Business logic
│   │   ├── geminiAnalyzer.ts    # AI analysis
│   │   ├── githubService.ts     # GitHub API
│   │   └── vueParser.ts         # Component parsing
│   ├── routes/               # API routes
│   │   ├── projectRoutes.ts
│   │   ├── reviewRoutes.ts
│   │   ├── uiLibraryRoutes.ts
│   │   └── authRoutes.ts
│   └── server.ts             # App entry point
├── .env                      # Environment config
├── package.json
└── tsconfig.json
```

---

## 🎯 Key Features

### ✅ Type-Safe API
- Full TypeScript coverage
- Mongoose type definitions
- Compile-time error checking

### ✅ Async Job Processing
- Non-blocking analysis
- Progress tracking via phases
- Graceful error handling

### ✅ Smart Component Detection
- Regex-based Vue SFC parsing
- Props, slots, variants extraction
- Framework-agnostic design

### ✅ Deduplication Logic
- Component name normalization
- Intelligent merging of props/slots
- Handles AI response variations

### ✅ Security
- GitHub OAuth for private repos
- Scoped API access
- Token encryption at rest

---

## 🔧 Development

### Build

```bash
npm run build
```

### Start Production

```bash
npm start
```

### Type Check

```bash
npx tsc --noEmit
```

---

## 📈 Performance Considerations

- **Analysis Time**: ~30-60 seconds per review (3 AI calls)
- **Concurrent Analyses**: Queued via background jobs
- **Rate Limits**: Gemini API ~60 req/min
- **Database**: Indexed on `projectId`, `createdAt`

---

## 🎓 Built for Dev Nitro 2026

**Theme**: Quality Enhancement  
**Problem**: Design-to-dev handoff gaps cause 8-12 hours of rework per feature  
**Solution**: AI-powered verification before development starts

---

## 📄 License

Internal use only. All code becomes company IP per contest rules.
