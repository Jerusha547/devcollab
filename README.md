# DevCollab

A GitHub-integrated async code review platform for developer teams.

## Live Demo

🚀 [devcollab-lwuj.vercel.app](https://devcollab-lwuj.vercel.app)

## What it does

DevCollab replaces the chaos of managing code reviews over WhatsApp or Slack. Developers submit a PR link, assign a teammate as reviewer, and track the entire review lifecycle in one place.

- Submit any GitHub PR for review
- Assign reviewers by GitHub username
- Real-time notifications via WebSockets when status changes
- Status tracking: Pending → In Review → Approved / Changes Requested
- Team metrics dashboard showing reviewer load and turnaround time

## Tech Stack

**Frontend:** React, TypeScript, WebSockets  
**Backend:** Node.js, Express, Passport.js, JWT  
**Database:** PostgreSQL  
**APIs:** GitHub OAuth, GitHub REST API  
**DevOps:** Docker, Vercel (frontend), Render (backend)

## Architecture

┌─────────────────┐ ┌──────────────────┐ ┌─────────────┐
│ React Client │────▶│ Express Server │────▶│ PostgreSQL │
│ (Vercel) │◀────│ (Render) │ │ (Render) │
│ │ WS │ │ │ │
└─────────────────┘ └──────────────────┘ └─────────────┘
│
▼
┌──────────────┐
│ GitHub API │
│ OAuth + PRs │
└──────────────┘

## Getting Started Locally

### Prerequisites

- Node.js 18+
- PostgreSQL
- GitHub OAuth App

### 1. Clone the repo

```bash
git clone https://github.com/Jerusha547/devcollab.git
cd devcollab
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### 3. Set up the client

```bash
cd client
npm install
npm start
```

### 4. Set up the database

```bash
psql -U postgres -d devcollab -f schema.sql
```

## Environment Variables

### Server (.env)
```bash
PORT=5000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=devcollab
```

### Client (.env)
```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

## Features in Detail

### Real-time Notifications

WebSocket connection is established on login. When a PR status changes, the submitter receives an instant notification without refreshing the page.

### GitHub Integration

- Login with GitHub OAuth
- PR titles are automatically fetched from GitHub API
- Links directly to the original PR on GitHub

### Team Metrics

- Total PRs per reviewer
- Completion rate with visual progress bars
- Average review turnaround time
- Status breakdown across the team

## Author

Martha Jerusha Marumudi  
[GitHub](https://github.com/Jerusha547) · [LinkedIn](https://www.linkedin.com/in/marumudi-martha-jerusha-2610aa301/)
