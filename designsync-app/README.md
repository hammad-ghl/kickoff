# DesignSync v2.0

> Design ↔ Code Gap Analyzer with Multi-Step Flow & MongoDB Persistence

A full-stack TypeScript application that finds gaps between Figma designs, your component library, and production code.

## 🎉 What's New in v2.0

- ✅ **Multi-step workflow** - Landing → Form → Analysis → Report → Reports List
- ✅ **MongoDB persistence** - No more re-entering configurations!
- ✅ **Backend analysis** - More reliable than browser-only
- ✅ **Reports management** - View, reopen, and delete past reports
- ✅ **Real-time polling** - Live updates during analysis
- ✅ **Beautiful UI** - Landing page + reports listing

## Architecture

```
┌─────────────────────┐
│   Vue 3 Frontend    │
│   TypeScript + Vite │
│   Port 5173         │
└──────────┬──────────┘
           │ HTTP
           ▼
┌─────────────────────┐
│  Express Backend    │
│  TypeScript + Node  │
│  Port 3000          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      MongoDB        │
│   Reports Storage   │
└─────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud like MongoDB Atlas)

### 1. Setup Backend

```bash
cd ../designsync-server

# Install dependencies
npm install

# Configure MongoDB
cp .env.example .env
# Edit .env and add your MongoDB connection string:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/designsync

# Start backend
npm run dev
```

Backend runs on `http://localhost:3000`

### 2. Setup Frontend

```bash
# From designsync-app folder
npm install

# Start frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Use the App

1. Open `http://localhost:5173`
2. Click "Create New Report"
3. Fill in the configuration form (saved to MongoDB!)
4. Watch the real-time analysis
5. View results and export reports
6. Access all reports from the reports list

## Project Structure

```
design-code-analyzer/
├── designsync-app/               # Vue 3 Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.vue       # Home screen
│   │   │   ├── ReportsList.vue       # Reports management
│   │   │   ├── ConfigForm.vue        # Configuration form
│   │   │   ├── ProgressTracker.vue   # Real-time progress
│   │   │   ├── ReportView.vue        # Results display
│   │   │   └── IssueGroup.vue        # Issue cards
│   │   ├── composables/
│   │   │   ├── useApi.ts             # Backend API client
│   │   │   ├── useFigma.ts           # Figma API
│   │   │   ├── useGitHub.ts          # GitHub API
│   │   │   ├── useVueParser.ts       # Vue SFC parser
│   │   │   └── useAnalyzer.ts        # Gap analysis
│   │   ├── types.ts                  # TypeScript types
│   │   ├── App.vue                   # Main app with routing
│   │   └── main.ts                   # Entry point
│   └── package.json
│
└── designsync-server/            # Express Backend
    ├── src/
    │   ├── models/
    │   │   └── Report.ts         # MongoDB schema
    │   ├── controllers/
    │   │   └── reportController.ts  # API handlers
    │   ├── services/
    │   │   └── analyzer.ts       # Analysis engine
    │   ├── routes/
    │   │   └── reportRoutes.ts   # API routes
    │   └── server.ts             # App entry
    ├── tsconfig.json
    └── package.json
```

## API Documentation

### Endpoints

**POST /api/reports**
Create a new report and start analysis

```json
{
  "name": "Dashboard Q1 2026",
  "config": {
    "figmaUrl": "https://figma.com/file/...",
    "figmaToken": "figd_...",
    "libRepo": "https://github.com/org/ui-lib",
    "codeRepo": "https://github.com/org/app"
  }
}
```

**GET /api/reports**
Get all reports (recent 50)

**GET /api/reports/:id**
Get single report with full results

**DELETE /api/reports/:id**
Delete a report

**GET /health**
Health check

## Environment Variables

### Frontend `.env`

```bash
VITE_API_URL=http://localhost:3000
```

### Backend `.env`

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/designsync
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/designsync
CORS_ORIGIN=http://localhost:5173
```

## MongoDB Setup

### Option 1: Local MongoDB

```bash
# Install MongoDB locally
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Use connection string:
MONGODB_URI=mongodb://localhost:27017/designsync
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/designsync
   ```

## Features

### What It Analyzes

1. **Missing from Library**
   - Components used in Figma but not in your component lib
   - Severity: HIGH

2. **Incompatible Usage**
   - Components using slots/props that don't exist in the lib
   - Severity: MEDIUM

3. **Missing from Design**
   - Components in code but not in Figma (design drift)
   - Severity: LOW

### Export Options

- JSON export (machine-readable)
- HTML report (standalone file)
- Copy to clipboard

## Development

### Frontend

```bash
cd designsync-app
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

### Backend

```bash
cd designsync-server
npm run dev        # Development with hot reload
npm run build      # Compile TypeScript
npm start          # Run production build
```

## Production Deployment

### Frontend (Vercel/Netlify)

1. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.com
   ```
2. Deploy with `npm run build`

### Backend (Heroku/Railway/Fly.io)

1. Set environment variables
2. Deploy with Node.js buildpack
3. Ensure MongoDB is accessible

## Troubleshooting

**Backend won't start**
- Check MongoDB connection string
- Ensure MongoDB is running
- Verify port 3000 is available

**Frontend can't connect to backend**
- Check `VITE_API_URL` in `.env`
- Verify backend is running on correct port
- Check browser console for CORS errors

**Analysis fails**
- Verify Figma token is valid
- Check GitHub token has correct permissions
- Ensure repos are accessible

## Security Notes

⚠️ **Current Implementation**
- Tokens stored in MongoDB without encryption
- No authentication required
- CORS open to localhost only

🔒 **For Production**
- Add token encryption (bcrypt/crypto)
- Implement user authentication (JWT)
- Add rate limiting
- Use HTTPS everywhere
- Restrict CORS to specific domains

## Contributing

This is a working prototype. Contributions welcome for:
- Token encryption
- User authentication
- Better error handling
- AST-based Vue parsing
- Caching layer for GitHub data
- CLI mode for CI/CD

## License

MIT

---

**Built with:** Vue 3.5 + TypeScript + Vite + Express + MongoDB

**Need help?** Check `SETUP.md` for detailed setup instructions.
