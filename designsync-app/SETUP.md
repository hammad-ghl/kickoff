# DesignSync - Multi-Step Flow with Backend

## 🎉 What's New

The app now has a proper multi-step workflow with MongoDB persistence!

### New Features

1. **Landing Page** - Clean entry point with "Create Report" CTA
2. **Reports List** - View all your past analyses
3. **Persistent Storage** - Configurations saved to MongoDB (no more re-entering!)
4. **Backend Analysis** - Analysis runs on Express backend (more reliable)
5. **Real-time Updates** - Poll backend for progress updates

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Vue Frontend  │ ◄─HTTP─► │  Express Backend │ ◄─────► │   MongoDB   │
│  (Port 5173)    │         │   (Port 3000)    │         │             │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

## Quick Start

### 1. Start MongoDB

You need MongoDB running. Update the connection string in `../designsync-server/.env`:

```bash
cd ../designsync-server
# Edit .env file with your MongoDB URI
MONGODB_URI=your_mongodb_connection_string_here
```

### 2. Start Backend

```bash
cd ../designsync-server
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Start Frontend

```bash
cd ../designsync-app
npm run dev
```

Frontend will run on `http://localhost:5173`

## User Flow

```
┌────────────┐
│  Landing   │  User clicks "Create New Report"
│    Page    │
└──────┬─────┘
       │
       ▼
┌────────────┐
│    Form    │  User fills config (saved to MongoDB)
│    Page    │
└──────┬─────┘
       │
       ▼
┌────────────┐
│ Analyzing  │  Backend runs analysis (Figma + GitHub)
│    Page    │  Frontend polls for updates
└──────┬─────┘
       │
       ▼
┌────────────┐
│   Report   │  Results displayed with export options
│    Page    │
└──────┬─────┘
       │
       ▼
┌────────────┐
│  Reports   │  View/manage all past reports
│    List    │
└────────────┘
```

## API Endpoints

- `POST /api/reports` - Create new report (saves config, starts analysis)
- `GET /api/reports` - List all reports
- `GET /api/reports/:id` - Get single report with results
- `DELETE /api/reports/:id` - Delete a report

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

### Backend (.env)
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173
```

## Project Structure

```
designsync-app/
├── src/                    # Vue frontend
│   ├── components/
│   │   ├── LandingPage.vue      # NEW: Home page
│   │   ├── ReportsList.vue      # NEW: Reports listing
│   │   ├── ConfigForm.vue       # Updated with save
│   │   ├── ProgressTracker.vue
│   │   ├── ReportView.vue
│   │   └── IssueGroup.vue
│   ├── composables/
│   │   ├── useApi.ts            # NEW: Backend API client
│   │   ├── useFigma.ts
│   │   ├── useGitHub.ts
│   │   ├── useVueParser.ts
│   │   └── useAnalyzer.ts
│   └── App.vue                   # NEW: Multi-step navigation
│
└── backend/                # Express backend
    ├── src/
    │   ├── models/
    │   │   └── Report.ts        # MongoDB schema
    │   ├── controllers/
    │   │   └── reportController.ts
    │   ├── services/
    │   │   └── analyzer.ts      # Analysis engine
    │   ├── routes/
    │   │   └── reportRoutes.ts
    │   └── server.ts
    └── .env                     # MongoDB config
```

## MongoDB Schema

```typescript
{
  name: string,                  // Report name
  config: {
    figmaUrl: string,
    figmaToken: string,          // Encrypted in DB
    libRepo: string,
    // ... other config fields
  },
  status: 'pending' | 'analyzing' | 'completed' | 'failed',
  result: {
    issues: { ... },
    metadata: { ... }
  },
  error: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Notes

- Tokens are stored in MongoDB (use encryption in production!)
- CORS is configured for localhost only
- No authentication yet (add in production)

## Next Steps

Once you add MongoDB credentials:

1. Test backend health: `curl http://localhost:3000/health`
2. Open frontend: `http://localhost:5173`
3. Click "Create New Report"
4. Fill the form (gets saved!)
5. View progress in real-time
6. See results

## Production Deployment

### Backend
- Add MongoDB connection pooling
- Enable token encryption
- Add authentication (JWT)
- Use environment-based configs
- Add rate limiting

### Frontend
- Update `VITE_API_URL` to production API
- Enable HTTPS
- Add error boundaries
- Optimize bundle size

---

**Ready to go!** Just add your MongoDB connection string to `backend/.env` and start both servers.
