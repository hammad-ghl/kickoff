# DesignSync Backend

Express + TypeScript + MongoDB backend for DesignSync

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure MongoDB**

Edit `.env` file and add your MongoDB connection string:

```bash
MONGODB_URI=your_mongodb_connection_string_here
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
npm start
```

## API Endpoints

### Reports

- `POST /api/reports` - Create a new report
  ```json
  {
    "name": "My Report",
    "config": {
      "figmaUrl": "...",
      "figmaToken": "...",
      "libRepo": "...",
      "codeRepo": "..."
    }
  }
  ```

- `GET /api/reports` - Get all reports (recent 50)
- `GET /api/reports/:id` - Get single report with results
- `DELETE /api/reports/:id` - Delete a report

### Health Check

- `GET /health` - Server health status

## Environment Variables

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)

## Architecture

```
backend/
├── src/
│   ├── models/
│   │   └── Report.ts         # MongoDB schema
│   ├── controllers/
│   │   └── reportController.ts  # Request handlers
│   ├── services/
│   │   └── analyzer.ts       # Analysis logic
│   ├── routes/
│   │   └── reportRoutes.ts   # API routes
│   └── server.ts             # App entry point
├── .env                      # Environment config
└── tsconfig.json             # TypeScript config
```

## Features

- ✅ TypeScript for type safety
- ✅ MongoDB for data persistence
- ✅ Background job processing for analysis
- ✅ CORS enabled for frontend integration
- ✅ RESTful API design

## Notes

- Analysis runs asynchronously after report creation
- Tokens are stored encrypted (not exposed in GET requests)
- Reports are limited to recent 50 for performance
