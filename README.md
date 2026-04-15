# AI Search Score (AISearchScore)

AI-powered brand visibility tracker that measures how your brand appears across ChatGPT, Gemini, Perplexity, and Google AI Overviews.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend    | Node.js + Express                   |
| Database   | PostgreSQL                          |
| AI Providers | OpenAI, Gemini, Perplexity, Google Search |

---

## Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** v18+ → [Download](https://nodejs.org/)
- **PostgreSQL** v14+ → [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)
- **Git**

---

## 1. Clone the Repository

```bash
git clone https://github.com/mubi64/ai-search-score
cd ai-search-score
```

---

## 2. Set Up PostgreSQL Database

Open your terminal or a PostgreSQL client (pgAdmin, TablePlus, etc.) and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE ai_search_score;

# Exit
\q
```

---

## 3. Configure Environment Variables

### Backend (`server/.env`)

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```dotenv
# Server
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_search_score
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Secret (change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# AI Provider API Keys (add at least one)
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key
PERPLEXITY_API_KEY=your-perplexity-key          # optional
ANTHROPIC_API_KEY=your-anthropic-key              # optional

# Google Search (optional - for Google search results)
GOOGLE_SEARCH_API_KEY=your-google-search-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Admin Password
ADMIN_PASSWORD=admin123

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env`)

```bash
cp .env.example .env
```

Open `.env` and set:

```dotenv
VITE_API_URL=http://localhost:3001/api
```

> **Note:** You need at least one AI provider key (OpenAI, Gemini, or Perplexity) for the analysis to work.

---

## 4. Install Dependencies

```bash
# Install frontend dependencies (from project root)
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

---

## 5. Run Database Migrations

This creates all required tables (`users`, `companies`, `competitors`, `reports`, `prompt_results`, `topic_analyses`, `email_submissions`):

```bash
cd server
node scripts/migrate.js
cd ..
```

You should see: `✅ Database tables created successfully`

---

## 6. Start the Application

You need **two terminal windows** — one for the backend and one for the frontend.

### Terminal 1 — Backend Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 AI Search Score API running on port 3001
📊 Environment: development
✅ Database connected
```

### Terminal 2 — Frontend Dev Server

```bash
# From project root
npm run dev
```

You should see:
```
VITE v6.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

---

## 7. Open the App

Open your browser and go to:

```
http://localhost:5173
```

---

## App Flow

1. **Start Page** → Enter your business email to discover your company
2. **Competitor Review** → AI suggests competitors; add/remove as needed
3. **Topic Selection** → Choose products/topics to track
4. **Prompt Review** → Review AI-generated customer questions (up to 20)
5. **Run Analysis** → AI queries ChatGPT, Gemini, Perplexity with your prompts
6. **Dashboard** → View visibility scores, trends, and reports
7. **Report Detail** → Drill into per-prompt results, sources, and export PDF

---

## Admin Dashboard

Access the admin panel to view user activity and system stats:

1. Go to the Start page
2. Click the tiny **"Admin"** link at the bottom
3. Enter password: `admin123` (or your `ADMIN_PASSWORD` env value)

---

## Available Scripts

### Frontend (project root)

| Command         | Description                    |
|-----------------|--------------------------------|
| `npm run dev`   | Start Vite dev server          |
| `npm run build` | Build for production           |
| `npm run preview` | Preview production build     |
| `npm run lint`  | Run ESLint                     |

### Backend (`server/` directory)

| Command            | Description                     |
|--------------------|---------------------------------|
| `npm run dev`      | Start with nodemon (auto-reload)|
| `npm start`        | Start without auto-reload       |
| `npm run migrate`  | Run database migrations         |

---

## API Endpoints

### Auth
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/auth/email-login` | Login/register with email |
| GET    | `/api/auth/me`         | Get current user          |
| PATCH  | `/api/auth/me`         | Update user profile       |

### Companies
| Method | Endpoint                 | Description              |
|--------|--------------------------|--------------------------|
| POST   | `/api/companies/discover`| AI-discover company info |
| GET    | `/api/companies`         | List companies           |
| GET    | `/api/companies/:id`     | Get single company       |
| POST   | `/api/companies`         | Create company           |
| PATCH  | `/api/companies/:id`     | Update company           |
| DELETE | `/api/companies/:id`     | Delete company           |

### Competitors
| Method | Endpoint                    | Description                |
|--------|-----------------------------|----------------------------|
| POST   | `/api/competitors/discover` | AI-discover competitors    |
| GET    | `/api/competitors`          | List competitors (by company) |
| POST   | `/api/competitors`          | Add competitor             |
| DELETE | `/api/competitors/:id`      | Remove competitor          |

### Reports
| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| GET    | `/api/reports`                 | List reports             |
| GET    | `/api/reports/:id`             | Get single report        |
| POST   | `/api/reports`                 | Create report            |
| PATCH  | `/api/reports/:id`             | Update report            |
| GET    | `/api/reports/:id/prompts`     | Get prompt results       |
| POST   | `/api/reports/:id/export-pdf`  | Export report as PDF     |

### Analysis
| Method | Endpoint                        | Description               |
|--------|---------------------------------|---------------------------|
| POST   | `/api/analysis/run`             | Start analysis            |
| GET    | `/api/analysis/progress/:id`    | Get analysis progress     |
| POST   | `/api/analysis/generate-prompts`| Generate AI prompts       |
| GET    | `/api/analysis/max-prompts`     | Get max prompt limit      |
| POST   | `/api/analysis/invoke-llm`      | Direct LLM call (testing) |

### Admin
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| POST   | `/api/admin/verify-password`  | Verify admin password    |
| GET    | `/api/admin/data`             | Get admin dashboard data |

---

## Project Structure

```
brand-pulse-ai-7ef92110/
├── server/                    # Backend (Express + PostgreSQL)
│   ├── config/
│   │   └── database.js        # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── errorHandler.js    # Error handling
│   ├── routes/
│   │   ├── admin.js           # Admin endpoints
│   │   ├── analysis.js        # Analysis & LLM integration
│   │   ├── auth.js            # Authentication
│   │   ├── companies.js       # Company CRUD
│   │   ├── competitors.js     # Competitor CRUD
│   │   ├── email_submissions.js
│   │   ├── reports.js         # Report CRUD + PDF export
│   │   └── topic_analyses.js  # Topic analysis CRUD
│   ├── scripts/
│   │   └── migrate.js         # Database migration
│   ├── services/
│   │   └── llm.service.js     # AI provider integrations
│   ├── utils/
│   │   └── sourceExtractor.js # URL/source extraction
│   ├── server.js              # Express app entry point
│   └── package.json
├── src/                       # Frontend (React + Vite)
│   ├── api/
│   │   └── apiClient.js       # API client (all backend calls)
│   ├── components/            # UI components
│   ├── pages/                 # Page components
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities
│   ├── App.jsx                # Root component
│   └── main.jsx               # Entry point
├── package.json               # Frontend dependencies
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS config
└── README.md                  # This file
```

---

## Troubleshooting

### Database connection fails
- Make sure PostgreSQL is running: `brew services start postgresql` (macOS)
- Verify credentials in `server/.env`
- Ensure the `ai_search_score` database exists

### "No AI providers configured"
- Add at least one API key (`OPENAI_API_KEY`, `GEMINI_API_KEY`, or `PERPLEXITY_API_KEY`) in `server/.env`

### CORS errors
- Make sure `FRONTEND_URL` in `server/.env` matches your frontend URL (default: `http://localhost:5173`)
- If Vite picks a different port (e.g., 5174), update `FRONTEND_URL` accordingly

### Port already in use
- Frontend: Vite will auto-select the next available port
- Backend: Change `PORT` in `server/.env` or kill the process using port 3001:
  ```bash
  lsof -ti:3001 | xargs kill -9
  ```

### Analysis stuck or timing out
- Check the backend terminal for error logs
- Ensure your AI API keys are valid and have available quota
- Analysis can take 3–5 minutes depending on the number of prompts and providers

---

## License

Private — All rights reserved.
