# 🚀 AI Team Task Manager - Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- **Git**

## 🛠️ Quick Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb ai_task_manager

# Run database schema
psql -d ai_task_manager -f ../database/schema.sql
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
```

**Required .env variables:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_task_manager
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### 4. Start Development Servers

```bash
# From root directory - starts both frontend and backend
npm run dev

# Or start individually:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 5173
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔐 Default Admin Account

After first run, you can:
1. Sign up with Admin role
2. Or use sample data (if included in schema)

## 📁 Project Structure

```
ai-team-task-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── database/         # Database connection
│   └── package.json
├── database/             # SQL schemas
│   └── schema.sql
├── .env.example
├── package.json
└── README.md
```

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start both servers
npm run server        # Backend only
npm run client        # Frontend only

# Production
npm run build         # Build frontend
npm start            # Start production server

# Testing
npm test              # Run tests
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_ctl status

# Test connection
psql -h localhost -U postgres -d ai_task_manager
```

### Port Conflicts
```bash
# Check what's running on ports
netstat -tulpn | grep :5000
netstat -tulpn | grep :5173

# Kill processes if needed
kill -9 <PID>
```

### Common Issues

1. **"Database connection failed"**
   - Verify PostgreSQL is running
   - Check .env credentials
   - Ensure database exists

2. **"Module not found"**
   - Run `npm install` in both client and server directories
   - Clear node_modules and reinstall if needed

3. **"Port already in use"**
   - Change ports in .env or vite.config.js
   - Kill existing processes

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway)
```bash
cd server
# Set environment variables
# Deploy with build command: npm start
```

### Database (Supabase/PlanetScale)
- Export schema from PostgreSQL
- Import to cloud provider
- Update connection strings

## 🤖 AI Extension Ready

The system is designed for AI integration:

1. **Task descriptions** stored as questions
2. **Performance tracking** architecture in place
3. **Evaluation endpoints** can be added to:
   - `/api/ai/evaluate` - Answer evaluation
   - `/api/ai/score` - Performance scoring

## 📊 Features Included

- ✅ User authentication (JWT)
- ✅ Role-based access control
- ✅ Project management
- ✅ Task tracking with status/priority
- ✅ Real-time dashboard
- ✅ Activity logging
- ✅ Responsive design
- ✅ Search and filtering
- ✅ Modern UI with Tailwind CSS

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based permissions
- Input validation
- CORS protection
- Rate limiting
- SQL injection prevention

## 📈 Performance Features

- Database indexing
- Connection pooling
- Optimized queries
- Lazy loading
- Component memoization
- API response caching

## 🎨 UI/UX Features

- Modern, clean design
- Responsive layout
- Dark mode ready
- Loading states
- Error handling
- Toast notifications
- Smooth animations

## 📞 Support

For issues or questions:
1. Check this setup guide
2. Review error logs
3. Verify environment configuration
4. Check database connection

---

**Happy coding! 🎉**
