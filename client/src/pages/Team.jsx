import { useState, useEffect, useCallback } from 'react'
import { Users, Shield, Trash2, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import AddTeamMemberModal from '../components/AddTeamMemberModal'

const Team = () => {
  const { user, isAdmin } = useAuth()
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Track loading state for individual actions
  const [actionLoading, setActionLoading] = useState(null)

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await api.get('/team')
      setTeamMembers(response.data.members || [])
    } catch (error) {
      console.error('Failed to fetch team members:', error)
      toast.error('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeamMembers()
  }, [fetchTeamMembers])

  const handleAddMember = async (memberData) => {
    try {
      const response = await api.post('/team', memberData)
      setTeamMembers(prev => [response.data.member, ...prev])
      toast.success(response.data.message || 'Member added successfully')
    } catch (error) {
      console.error('Add member error:', error)
      toast.error(error.response?.data?.error || 'Failed to add member')
      throw error // Let modal handle closing if success
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    if (!isAdmin) return
    
    setActionLoading(memberId)
    try {
      const response = await api.put(`/team/${memberId}`, { role: newRole })
      
      setTeamMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, role: response.data.member.role }
          : member
      ))
      
      toast.success('Role updated successfully')
    } catch (error) {
      console.error('Update role error:', error)
      toast.error(error.response?.data?.error || 'Failed to update role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (!isAdmin) return
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return

    setActionLoading(memberId)
    try {
      await api.delete(`/team/${memberId}`)
      
      setTeamMembers(prev => prev.filter(member => member.id !== memberId))
      toast.success('Team member removed successfully')
    } catch (error) {
      console.error('Remove member error:', error)
      toast.error(error.response?.data?.error || 'Failed to remove member')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1 flex items-center">
            You are logged in as a 
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-md flex-shrink-0"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6 flex items-center space-x-4 border-l-4 border-blue-500">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Members</p>
            <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4 border-l-4 border-indigo-500">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Admins</p>
            <p className="text-2xl font-bold text-gray-900">
              {teamMembers.filter(m => m.role === 'Admin').length}
            </p>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No team members found. {isAdmin && "Add one to get started!"}
                  </td>
                </tr>
              ) : (
                teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                            {member.user_id === user?.id && (
                              <span className="ml-2 text-xs text-gray-500 font-normal">(You)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAdmin && member.user_id !== user?.id ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={actionLoading === member.id}
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 py-1 pl-2 pr-8"
                        >
                          <option value="Member">Member</option>
                          <option value="Admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'Admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAdmin && member.user_id !== user?.id ? (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          disabled={actionLoading === member.id}
                          className={`text-red-600 hover:text-red-900 flex items-center justify-end ml-auto ${
                            actionLoading === member.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddTeamMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddMember}
      />
    </div>
  )
}

export default Team
