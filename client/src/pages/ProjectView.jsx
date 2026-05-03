import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Plus, Search, Calendar, User,
  Edit, Users, CheckCircle2, Clock, Circle, Flame
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import TaskModal from '../components/TaskModal'
import ProjectModal from '../components/ProjectModal'
import ManageMembersModal from '../components/ManageMembersModal'

const statusConfig = {
  'Todo':        { icon: Circle,        cls: 'status-todo',        label: 'Todo' },
  'In Progress': { icon: Clock,         cls: 'status-in-progress', label: 'In Progress' },
  'Done':        { icon: CheckCircle2,  cls: 'status-done',        label: 'Done' },
}

const priorityConfig = {
  'High':   { cls: 'priority-high',   dot: 'bg-red-500' },
  'Medium': { cls: 'priority-medium', dot: 'bg-amber-500' },
  'Low':    { cls: 'priority-low',    dot: 'bg-emerald-500' },
}

const ProjectView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const fetchProjectData = useCallback(async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/${id}`),
      ])
      setProject(projectRes.data.project)
      setTasks(tasksRes.data.tasks)
      setMembers(projectRes.data.members || [])
    } catch {
      toast.error('Failed to load project')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { if (id) fetchProjectData() }, [id, fetchProjectData])

  const handleTaskCreate = async (data) => {
    try {
      const res = await api.post('/tasks', { ...data, project_id: parseInt(id) })
      setTasks(prev => [res.data.task, ...prev])
      setShowTaskModal(false)
      toast.success('Task created!')
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to create task') }
  }

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, updates)
      setTasks(prev => prev.map(t => t.id === taskId ? res.data.task : t))
      if (editingTask) { setEditingTask(null); toast.success('Task updated!') }
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update task') }
  }

  const handleTaskDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setEditingTask(null)
      toast.success('Task deleted')
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete task') }
  }

  const handleProjectUpdate = async (data) => {
    try {
      const res = await api.patch(`/projects/${id}`, data)
      setProject(res.data.project)
      setShowProjectModal(false)
      toast.success('Project updated!')
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update project') }
  }

  const filtered = tasks.filter(t => {
    const s = t.title.toLowerCase().includes(searchTerm.toLowerCase())
    const st = filterStatus === 'all' || t.status === filterStatus
    const pr = filterPriority === 'all' || t.priority === filterPriority
    return s && st && pr
  })

  const completedCount = tasks.filter(t => t.status === 'Done').length
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  if (!project) return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
      <button onClick={() => navigate('/dashboard')} className="btn-secondary btn-md mt-4">Back to Dashboard</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-4">
          <button onClick={() => navigate('/projects')}
            className="mt-1 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            {project.description && <p className="text-gray-500 mt-1 text-sm">{project.description}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {isAdmin && (
            <button onClick={() => setShowMembersModal(true)} className="btn-secondary btn-sm">
              <Users className="h-3.5 w-3.5 mr-1.5" />Members
            </button>
          )}
          {(isAdmin || project.created_by === user?.id) && (
            <button onClick={() => setShowProjectModal(true)} className="btn-secondary btn-sm">
              <Edit className="h-3.5 w-3.5 mr-1.5" />Edit
            </button>
          )}
          <button onClick={() => setShowTaskModal(true)} className="btn-primary btn-md">
            <Plus className="h-4 w-4 mr-2" />Add Task
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Members', value: members.length, bg: 'bg-violet-50', text: 'text-violet-600' },
          { icon: Flame, label: 'Total Tasks', value: tasks.length, bg: 'bg-amber-50', text: 'text-amber-600' },
          { icon: CheckCircle2, label: 'Completed', value: completedCount, bg: 'bg-emerald-50', text: 'text-emerald-600' },
        ].map(({ icon: Icon, label, value, bg, text }) => (
          <div key={label} className="card p-4 flex items-center space-x-3">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${text}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-primary-600">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search tasks..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select w-full sm:w-40">
          <option value="all">All Status</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="select w-full sm:w-40">
          <option value="all">All Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Tasks */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 text-sm mb-6">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters' : 'Create your first task to get started'}
          </p>
          {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
            <button onClick={() => setShowTaskModal(true)} className="btn-primary btn-md">
              <Plus className="h-4 w-4 mr-2" />Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => {
            const isOverdue = task.is_overdue
            const canEdit = isAdmin || task.assigned_to === user?.id
            const pCfg = priorityConfig[task.priority] || priorityConfig['Medium']
            const sCfg = statusConfig[task.status] || statusConfig['Todo']
            const StatusIcon = sCfg.icon

            return (
              <div key={task.id}
                className={`card p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform duration-200 ${isOverdue ? 'overdue' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm leading-snug ${task.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  {canEdit && (
                    <button onClick={() => setEditingTask(task)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${pCfg.cls} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                    {task.priority || 'Medium'}
                  </span>
                  <span className={`badge ${sCfg.cls} flex items-center gap-1`}>
                    <StatusIcon className="h-3 w-3" />
                    {task.status || 'Todo'}
                  </span>
                  {isOverdue && (
                    <span className="badge bg-red-100 text-red-700 border-red-200">⚠ Overdue</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {task.assigned_to_name && (
                      <span className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold" style={{ fontSize: '9px' }}>
                            {task.assigned_to_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {task.assigned_to_name.split(' ')[0]}
                      </span>
                    )}
                    {task.due_date && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <select value={task.status}
                      onChange={e => handleTaskUpdate(task.id, { status: e.target.value })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400">
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showTaskModal && <TaskModal onClose={() => setShowTaskModal(false)} onSubmit={handleTaskCreate} members={members} />}
      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)}
          onSubmit={data => handleTaskUpdate(editingTask.id, data)}
          onDelete={() => handleTaskDelete(editingTask.id)}
          members={members} isEdit />
      )}
      {showProjectModal && (
        <ProjectModal project={project} onClose={() => setShowProjectModal(false)} onSubmit={handleProjectUpdate} isEdit />
      )}
      {showMembersModal && (
        <ManageMembersModal
          projectId={id}
          currentMembers={members}
          onClose={() => setShowMembersModal(false)}
          onMembersChange={setMembers}
        />
      )}
    </div>
  )
}

export default ProjectView
