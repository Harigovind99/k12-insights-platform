# K12 Insights Platform

A full-stack student attendance and assessment analytics dashboard, migrated from a vanilla-JS single-file prototype into a production-ready **React + Vite** frontend and **Express + MySQL** backend.

---

## Architecture Overview

```
k12-insights-platform/
├── frontend/          # React 18 + Vite + Tailwind CSS
└── backend/           # Express 5 + MySQL 8 (mysql2 pool)
```

### Frontend
| Layer | Tech |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router v6 (lazy-loaded routes) |
| State | React Context + useReducer |
| Charts | Chart.js 4.4 via react-chartjs-2 |
| Styling | Tailwind CSS 3 with custom design tokens |
| HTTP | Axios with JWT auth interceptor |
| Icons | lucide-react |

### Backend
| Layer | Tech |
|---|---|
| Server | Express 5 |
| Database | MySQL 8 via mysql2 connection pool |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Logging | Winston |
| Security | helmet, cors, compression |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0 (or Docker)

### 1. Clone & install

```bash
git clone <your-repo>
cd k12-insights-platform

# Install frontend deps
cd frontend && npm install && cd ..

# Install backend deps
cd backend  && npm install && cd ..
```

### 2. Configure environment

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example  backend/.env
```

Edit `backend/.env` with your MySQL credentials and a strong `JWT_SECRET`.

### 3. Start with Docker Compose (recommended)

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| MySQL | localhost:3306 |

### 4. Start manually (dev)

```bash
# Terminal 1 — Backend
cd backend
npm run dev       # nodemon server.js

# Terminal 2 — Frontend
cd frontend
npm run dev       # Vite dev server → http://localhost:5173
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |
| `VITE_APP_ENV` | `development` | App environment label |
| `VITE_ENABLE_MOCK_DATA` | `false` | Enable local mock data mode |

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Express port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `k12_insights` | Database / schema name |
| `DB_USER` | `k12user` | MySQL user |
| `DB_PASSWORD` | _(required)_ | MySQL password |
| `JWT_SECRET` | _(required)_ | JWT signing secret |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | `info` | Winston log level |

---

## API Reference

All endpoints are prefixed with `/api`.

### Students
| Method | Path | Description |
|---|---|---|
| GET | `/students` | Paginated, filterable student list |
| GET | `/students/:id` | Single student demographics |
| GET | `/students/:id/attendance` | Student attendance records |
| GET | `/students/:id/assessments` | Student assessment scores |
| GET | `/students/:id/interventions` | Student interventions |
| GET | `/students/:id/contacts` | Student contacts |

### Attendance
| Method | Path | Description |
|---|---|---|
| GET | `/attendance/metrics` | Top-level KPI metrics |
| GET | `/attendance/trend` | Monthly absence rate trend |
| GET | `/attendance/quarterly-risk` | Risk distribution by quarter |
| GET | `/attendance/chronic` | Chronic absenteeism breakdowns |
| GET | `/attendance/by-dow` | Absence counts by day-of-week |
| GET | `/attendance/truancy-list` | Paginated truancy list |

### Assessments
| Method | Path | Description |
|---|---|---|
| GET | `/assessments/summary` | Summary by type and subject |
| GET | `/assessments/growth` | Score growth by term |
| GET | `/assessments/proficiency` | Proficiency rates by school |
| GET | `/assessments/by-group` | Breakdown by student subgroup |

### Schools
| Method | Path | Description |
|---|---|---|
| GET | `/schools` | All schools |
| GET | `/schools/:id` | Single school |
| GET | `/schools/:id/kpis` | School-level KPI metrics |

### School Years
| Method | Path | Description |
|---|---|---|
| GET | `/school-years` | All school years |
| GET | `/school-years/active` | Current active school year |

### Interventions
| Method | Path | Description |
|---|---|---|
| GET | `/interventions` | Paginated intervention list |
| GET | `/interventions/:id` | Single intervention |
| POST | `/interventions` | Create new intervention |
| PUT | `/interventions/:id` | Update intervention |

---

## DASL Multi-Schema Support

The backend supports multi-district deployments via the `X-DASL-Schema` request header. Each district's data lives in its own MySQL schema (database). The header value selects the active schema at the connection level:

```
X-DASL-Schema: district_springfield
```

All SQL queries use dynamic schema backtick quoting:
```sql
SELECT * FROM `district_springfield`.students WHERE ...
```

---

## Role-Based Access Control

Five roles are supported, each scoping data and UI:

| Role | Scope |
|---|---|
| `district_admin` | All schools, all students |
| `principal` | Own school only |
| `counselor` | Own school, student-level access |
| `teacher` | Own school, student-level access |
| `truancy_officer` | All schools — truancy views only |

JWT payload carries `role` and `schoolId`. The `getDataScope()` middleware injects `req.dataScope` for service-level filtering.

---

## Database Schema (5 DASL Tables)

| Table | Description |
|---|---|
| `students` | Demographics, subgroup flags |
| `attendance_records` | Daily attendance with type |
| `schools` | School master list |
| `assessment_scores` | NWEA MAP, Acadience, CAASPP |
| `interventions` | Student intervention tracking |

---

## Project Structure

```
frontend/src/
├── api/           # Axios API modules (one per resource)
├── components/
│   ├── Charts/    # LineChart, DonutChart, StackedBarChart, Heatmap
│   ├── Common/    # Tooltip, LoadingSpinner, LoadingDots, SchemaModal
│   ├── Dashboard/ # AttendanceDashboard, QuarterlyDashboard, ChronicDashboard, TruancyDashboard
│   ├── Filters/   # FilterBar
│   ├── KPI/       # KPICard (animated counter)
│   ├── Layout/    # Sidebar, Header, RoleBanner
│   └── Student/   # StudentTable, StudentProfile, StudentProfilePanel
├── contexts/      # AppContext (useReducer global state)
├── hooks/         # useFilters, useMetrics, useStudents, useAttendance
└── utils/         # constants.js, helpers.js, chartHelpers.js

backend/src/
├── config/        # database.js (mysql2 pool + query helpers)
├── controllers/   # Thin HTTP handlers — delegate to services
├── middleware/    # auth, schema, errorHandler, validator
├── routes/        # Express routers (one per resource)
├── services/      # Business logic + SQL queries
└── utils/         # logger.js, sqlQueries.js (filter builders)
```

---

## Development Notes

- **Vite proxy**: All `/api/*` requests from the Vite dev server proxy to `http://localhost:5000` — no CORS issues during development.
- **AbortController**: All data-fetching hooks cancel in-flight requests on filter change / unmount to prevent stale state.
- **Chart cleanup**: All Chart.js components call `.destroy()` on unmount via `useEffect` return to prevent canvas reuse errors.
- **SQL injection prevention**: All query parameters use `?` placeholders (mysql2 parameterised queries). Sort columns are validated against an allowlist.

---

## License

MIT
