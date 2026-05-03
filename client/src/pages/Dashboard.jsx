import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import PropTypes from 'prop-types'
import {
  CheckCircle, Clock, AlertCircle, FolderOpen,
  Plus, Calendar, Activity, TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const STAT_CONFIG = [
  { key: 'total',       label: 'Total Tasks',  icon: Activity,     from: 'from-violet-500', to: 'to-purple-600',  bg: 'bg-violet-50',  text: 'text-violet-600' },
  { key: 'completed',   label: 'Completed',    icon: CheckCircle,  from: 'from-emerald-500',to: 'to-teal-600',    bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { key: 'in_progress', label: 'In Progress',  icon: Clock,        from: 'from-amber-500',  to: 'to-orange-600',  bg: 'bg-amber-50',   text: 'text-amber-600' },
  { key: 'overdue',     label: 'Overdue',      icon: AlertCircle,  from: 'from-red-500',    to: 'to-rose-600',    bg: 'bg-red-50',     text: 'text-red-600' },
]

const StatCard = ({ label, value, icon: Icon, from, to, bg, text, change }) => (
  <div className="card p-6 relative overflow-hidden group">
    <div className={`absolute inset-0 bg-gradient-to-br ${from} ${to} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? 0}</p>
        {change !== undefined && (
          <div className={`flex items-center mt-2 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(change)}% vs last month
          </div>
        )}
      </div>
      <div className={`p-3 ${bg} rounded-2xl`}>
        <Icon className={`h-6 w-6 ${text}`} />
      </div>
    </div>
  </div>
)

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.elementType.isRequired,
  from: PropTypes.string, to: PropTypes.string, bg: PropTypes.string, text: PropTypes.string,
  change: PropTypes.number,
}

const CHANGES = { total: 12, completed: 8, in_progress: -3, overdue: -15 }

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/projects'),
        ])
        setStats(statsRes.data.stats)
        setProjects(projectsRes.data.projects)
        setRecentActivity(statsRes.data.recent_activity)
        setUpcomingDeadlines(statsRes.data.upcoming_deadlines)
      } catch {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Here&apos;s what&apos;s happening with your projects today.</p>
        </div>
        {isAdmin && (
          <Link to="/projects" className="btn-primary btn-md">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STAT_CONFIG.map(cfg => (
          <StatCard key={cfg.key} label={cfg.label} value={stats?.tasks?.[cfg.key]} change={CHANGES[cfg.key]} {...cfg} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
          <div className="p-6">
            {projects.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No projects yet</p>
                {isAdmin && <Link to="/projects" className="btn-primary btn-sm mt-4">Create first project</Link>}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link key={project.id} to={`/project/${project.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm group-hover:text-primary-700">{project.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{project.task_count} tasks · {project.member_count} members</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Deadlines */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
            </div>
            <div className="p-6">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No upcoming deadlines 🎉</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((d) => (
                    <div key={d.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{d.project_title} · {d.days_until_due}d left</p>
                      </div>
                      <span className={`badge priority-${d.priority.toLowerCase()} flex-shrink-0`}>{d.priority}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{a.details}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.user_name} · {new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
