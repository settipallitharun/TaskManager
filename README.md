# AI Team Task Manager

A production-grade full-stack SaaS web application for team task management with AI-ready architecture.

## 🚀 Features

- **Role-based access control** (Admin/Member permissions)
- **Global Team Management** with the ability to invite and remove team members, and assign Admin/Member roles.
- **Project management** with member assignment and collaboration
- **Task tracking** with status, priority, and due dates
- **Real-time dashboard** with analytics and overall progress
- **Activity logging** for audit trails
- **AI-ready design** for future extensions
- **Modern UI** with Tailwind CSS and interactive React components
- **Responsive design** for all devices

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Axios
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (raw SQL)
- **State Management**: React Context API
- **Authentication**: JWT tokens

## 📋 Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

## 🚀 Quick Start

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd "Task Manger"
   ```

2. **Database setup**
   ```bash
   # Create database
   createdb taskdb
   ```

3. **Environment configuration**
   Update `.env` files in both the `server` and `client` folders with your credentials:
   - `server/.env`: Add `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET`, and `PORT=5050`.

4. **Start development servers**
   Open two terminals:
   
   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:5050

## 📁 Project Structure

```
Task Manger/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components (Modals, Spinners)
│   │   ├── pages/         # Page components (Dashboard, Projects, Team)
│   │   ├── context/       # React context for Auth
│   │   ├── services/      # API services
│   │   └── index.css      # Tailwind configuration
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware (Auth, Joi Validation)
│   ├── routes/           # API routes
│   ├── database/         # Database connection logic
│   └── package.json
└── README.md
```

## 🔐 Default Admin

After the first run, create an account through the signup page. The first user created in the system will automatically be granted Admin privileges. 

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get logged-in user profile

### Global Team Management (Admin Only)
- `GET /api/team` - Get all global team members
- `POST /api/team` - Add a registered user to the team via email
- `PUT /api/team/:id` - Update a team member's role (Admin/Member)
- `DELETE /api/team/:id` - Remove a team member

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create project (Admin)
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project details
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add members to a specific project (Admin)
- `GET /api/projects/:id/available-users` - List users not in the project (Admin)

### Tasks
- `GET /api/tasks/:projectId` - Get project tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics and recent activities

## 🎨 UI Features

- **Color-coded priorities**: High (Red), Medium (Yellow), Low (Green)
- **Status badges**: Todo, In Progress, Done
- **Overdue detection**: Automatic highlighting of overdue tasks
- **Task filtering**: Filter by status and priority
- **Interactive Modals**: Seamlessly add members, projects, and tasks
- **Search functionality**: Find tasks by title instantly
- **Responsive design**: Works beautifully on all devices

## 📄 License

MIT License
