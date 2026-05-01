# Team Task Management Web Application

Full-stack collaborative task manager built with React, Node.js, Express, and MongoDB.

## Features

- JWT authentication (signup/login)
- Project creation (creator becomes Admin)
- Admin can add/remove project members
- Role-based access:
  - Admin: manage members and tasks
  - Member: view/update assigned tasks
- Task management:
  - create task with title, description, due date, priority
  - assign task to project members
  - update status (To Do, In Progress, Done)
- Dashboard metrics:
  - total tasks
  - tasks by status
  - tasks per user
  - overdue tasks

## Tech Stack

- Frontend: React + Vite + Axios + Recharts
- Backend: Express + Mongoose + JWT + bcrypt
- Database: MongoDB

## Project Structure

- `backend` - REST API server
- `frontend` - React client app

## Backend Setup

1. Go to backend:
   - `cd backend`
2. Copy env file:
   - create `.env` from `.env.example`
3. Install dependencies:
   - `npm install`
4. Run development server:
   - `npm run dev`

Required backend env vars:

- `PORT` (default `5000`)
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL` (default `http://localhost:5173`)

## Frontend Setup

1. Go to frontend:
   - `cd frontend`
2. Copy env file:
   - create `.env` from `.env.example`
3. Install dependencies:
   - `npm install`
4. Run development server:
   - `npm run dev`

Required frontend env vars:

- `VITE_API_URL` (example: `http://localhost:5000/api`)

## API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Projects
- `POST /api/projects`
- `GET /api/projects`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:memberId`

### Tasks
- `GET /api/tasks/project/:projectId`
- `POST /api/tasks/project/:projectId`
- `PATCH /api/tasks/:taskId/status`

### Dashboard
- `GET /api/dashboard`

## Railway Deployment

Deploy as two services:

1. **Backend service**
   - Source: `backend`
   - Start command: `npm start`
   - Add env vars:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `CLIENT_URL` (your frontend Railway URL)
2. **Frontend service**
   - Source: `frontend`
   - Build command: `npm run build`
   - Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - Add env var:
     - `VITE_API_URL` = `<your-backend-railway-url>/api`

After deployment:

- update backend `CLIENT_URL` to frontend URL
- verify signup, project creation, member invite, task flow, dashboard metrics

## Submission Checklist

- [ ] Public live URL (Railway)
- [ ] GitHub repository link
- [ ] README with setup/deployment steps
- [ ] 2-5 minute demo video

## Local Verification

- Frontend production build completes successfully.
- Backend app boots successfully when env vars are configured.
