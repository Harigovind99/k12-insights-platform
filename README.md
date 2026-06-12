# K-12 Insights Platform Prototype

A fully interactive, clickable prototype of a K-12 district analytics platform built with HTML, CSS (Tailwind), and Chart.js.

## 🚀 Live Demo

Open `index.html` in any modern browser — no server required.

## 📊 Features

### Attendance Dashboards
- **Overview** — KPI cards, stacked horizontal school bars, absence-type donut chart, day-of-week bar chart (Friday spike highlighted), multi-line monthly trend chart
- **Quarterly Trending & Risk** — Risk summary cards (On Track / At Risk / High Risk / Critical), risk criteria spectrum, quarterly grouped bar chart, stacked area trend, sortable student risk table
- **Chronic Absenteeism** — Rate vs. target KPIs, school comparison bars with 10% target line, student group disparity bars, multi-year trend, intervention tracking table

### Assessments Section
- Report selector with 15+ assessment types (NWEA MAP, Acadience/DIBELS, CAASPP, ACT, SAT, AP, aimsweb, iReady, FastBridge, and more)
- Fully designed dashboards for NWEA MAP Growth, Acadience Reading, and CAASPP

### Platform Shell
- Left navigation sidebar (17 items, collapsible)
- 24 Insights domain tabs (Attendance, Assessments, Early Warning, Academics, Behavior, Graduation, and more)
- Role switcher: District Admin / School Admin / Teacher / Community Partner
- All filters default to "All" and dynamically update charts
- CSV download generates a real file from filtered data

## 🗂️ Repository Structure

```
index.html    # Full prototype (self-contained, single file)
README.md     # This file
```

## 🛠️ Tech Stack

- **HTML5 / CSS3** — single-file, zero build step
- **Tailwind CSS** (CDN) — utility-first styling
- **Chart.js 4.4** (CDN) — all chart types (bar, line, donut, scatter, stacked area)
- **Lucide Icons** (CDN) — nav iconography
- **Vanilla JavaScript** — filters, role switching, CSV export, tooltips

## 📋 Dashboards Included

| Domain | Status |
|--------|--------|
| Attendance Overview | ✅ Complete |
| Quarterly Trending & Risk | ✅ Complete |
| Chronic Absenteeism | ✅ Complete |
| NWEA MAP Growth | ✅ Complete |
| Acadience Reading | ✅ Complete |
| CAASPP | ✅ Complete |
| Early Warning | 🚧 Phase 2 |
| Behavior & Discipline | 🚧 Phase 2 |
| Graduation Readiness | 🚧 Phase 2 |
| Portrait of a Graduate | 🚧 Phase 3 |
| Community Engagement | 🚧 Phase 3 |

## 🗓️ Implementation Roadmap

| Phase | Weeks | Focus |
|-------|-------|-------|
| 1 | 1-2 | Design system, nav shell, filter library, API contracts |
| 2 | 3-4 | Attendance dashboards, CSV export, hover tooltips |
| 3 | 5-6 | Assessments, RBAC, QA & accessibility |

**Total estimated effort:** ~500 hours (Design + Frontend + Backend + Data Engineering + QA)

## 🔑 Role-Based Access

| Role | Data Scope |
|------|------------|
| District Admin | All schools, all data |
| School Admin | Single school |
| Teacher | Single grade/classroom |
| Community Partner | Aggregate only (no student-level detail) |

## 📐 Data Schema (Core Tables)

- `students` — enrollment, demographics, EL/SPED/FosterYouth flags
- `attendance_records` — daily attendance codes, excused/unexcused, minutes absent
- `schools` — school metadata, grades served
- `assessment_scores` — RIT scores, proficiency levels, growth points
- `interventions` — assigned staff, type, status, contact log

## 🤝 Contact & Handoff

Built for Unified School District - Miami, OH
For review sessions and handoff coordination, open an issue in this repository.

---

*Prototype built with Copilot Tasks - June 2026*
