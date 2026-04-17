# Full-Stack Web Dashboard Application

A responsive, highly polished full-stack dashboard built with React (Vite) and Node.js + Express.
This project uses SQLite for the database, making it 100% locally runnable with zero configurations or external database requirements.

## Folder Structure

```
dashboard-app/
├── backend/                  # Node.js + Express API
│   ├── src/                 
│   │   ├── routes/           # Express routes (auth, records)
│   │   ├── database.ts       # SQLite setup & queries
│   │   └── index.ts          # Express Server entrypoint
│   ├── database.sqlite       # Local SQLite Database file
│   └── package.json
└── frontend/                 # React (Vite) Frontend
    ├── src/
    │   ├── api/              # Axios API client
    │   ├── components/       # Reusable Tailwind UI components
    │   ├── pages/            # Dashboard, AdminPanel, Login Views
    │   ├── App.tsx           # React Router setup
    │   └── index.css         # Tailwind v4 configuration & styles
    ├── vite.config.ts
    └── package.json
```

## Features

- **Public Dashboard**: View all records, see total metrics, filter by Category or Date Range, search by Name, and pagination.
- **Admin Panel**: Protected route simulating a CMS.
- **CRUD Operations**: Add, Edit, and Delete records effortlessly with modal forms.
- **Authentication**: JWT-based login for Admin mode.
- **Modern UI**: Tailored Tailwind CSS dark mode/glassmorphism design out of the box with `lucide-react` icons.

---

## Instructions to Run Locally

### 1. Start the Backend

Open a terminal and navigate to the backend folder:
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5000` and automatically seed the SQLite database with an admin user and some test records.

### 2. Start the Frontend

Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
npm install
npm run dev
```
The Vite app will stream on `http://localhost:5173` (or any available port). Open that URL in your browser.

---

## Admin Credentials

To use the Admin Panel to perform CRUD operations, click "Admin Login" in the navbar and use the following seeded credentials:
- **Username:** `admin`
- **Password:** `admin123`

## Architecture Highlights
- **Vite + React**: Rapid frontend development environment.
- **Tailwind CSS v4**: Ultra-fast utility-first CSS framework mapped with custom glass effects.
- **React Router v6**: Clean client-side routing.
- **SQLite3**: In-file RDBMS requiring zero installations, excellent for quick portfolio apps/challenges.
