import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Plus, FolderOpen, Users, Calendar, Edit, Trash2, Search, ArrowRight } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ProjectModal from '../components/ProjectModal'

const FOLDER_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
]

const Projects = () => {
  const { user, isAdmin } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => {
    fetchProjects()
    const close = () => setOpenMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects')
      setProjects(res.data.projects)
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data) => {
    try {
      const res = await api.post('/projects', data)
      setProjects(prev => [res.data.project, ...prev])
      setShowProjectModal(false)
      toast.success('Project created!')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to create project')
    }
  }

  const handleUpdate = async (data) => {
    try {
      const res = await api.patch(`/projects/${editingProject.id}`, data)
      setProjects(prev => prev.map(p => p.id === editingProject.id ? res.data.project : p))
      setEditingProject(null)
      toast.success('Project updated!')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update project')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return
    try {
      await api.delete(`/projects/${id}`)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete project')
    }
  }

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage and collaborate on your team projects</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowProjectModal(true)} className="btn-primary btn-md">
            <Plus className="h-4 w-4 mr-2" />New Project
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text" placeholder="Search projects..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {searchTerm ? 'Try different search terms' : isAdmin ? 'Create your first project to get started' : 'Wait for an admin to create projects'}
          </p>
          {isAdmin && !searchTerm && (
            <button onClick={() => setShowProjectModal(true)} className="btn-primary btn-md">
              <Plus className="h-4 w-4 mr-2" />Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project, idx) => {
            const canEdit = isAdmin || project.created_by === user?.id
            const gradient = FOLDER_COLORS[idx % FOLDER_COLORS.length]
            return (
              <div key={project.id} className="card p-6 flex flex-col group hover:-translate-y-1 transition-transform duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <FolderOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-tight">{project.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">by {project.creator_name}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {openMenuId === project.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-card-hover border border-gray-100 py-1 z-20 animate-scale-in">
                          <button onClick={() => { setEditingProject(project); setOpenMenuId(null) }}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                            <Edit className="h-3.5 w-3.5 mr-2 text-gray-400" />Edit
                          </button>
                          <button onClick={() => { handleDelete(project.id); setOpenMenuId(null) }}
                            className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">
                  {project.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                    <span className="flex items-center"><Users className="h-3.5 w-3.5 mr-1" />{project.member_count}</span>
                    <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" />{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/project/${project.id}`}
                    className="flex items-center text-xs font-semibold text-primary-600 hover:text-primary-700">
                    Open <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showProjectModal && <ProjectModal onClose={() => setShowProjectModal(false)} onSubmit={handleCreate} />}
      {editingProject && <ProjectModal project={editingProject} onClose={() => setEditingProject(null)} onSubmit={handleUpdate} isEdit />}
    </div>
  )
}

export default Projects
