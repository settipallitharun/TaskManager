import { useState, useEffect } from 'react'
import { X, UserPlus, UserMinus, Shield } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

const ManageMembersModal = ({ 
  projectId, 
  currentMembers, 
  onClose, 
  onMembersChange 
}) => {
  const [availableUsers, setAvailableUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingUsers, setIsFetchingUsers] = useState(true)

  useEffect(() => {
    fetchAvailableUsers()
  }, [projectId])

  const fetchAvailableUsers = async () => {
    setIsFetchingUsers(true)
    try {
      const response = await api.get(`/projects/${projectId}/available-users`)
      setAvailableUsers(response.data.users)
      if (response.data.users.length > 0) {
        setSelectedUserId(response.data.users[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch available users:', error)
      toast.error('Failed to load available users')
    } finally {
      setIsFetchingUsers(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!selectedUserId) return

    setIsLoading(true)
    try {
      const response = await api.post(`/projects/${projectId}/members`, { 
        userId: parseInt(selectedUserId) 
      })
      
      const newMember = response.data.member
      const updatedMembers = [...currentMembers, newMember]
      onMembersChange(updatedMembers)
      
      // Remove from available users
      const newAvailable = availableUsers.filter(u => u.id !== parseInt(selectedUserId))
      setAvailableUsers(newAvailable)
      if (newAvailable.length > 0) {
        setSelectedUserId(newAvailable[0].id)
      } else {
        setSelectedUserId('')
      }
      
      toast.success('Member added successfully')
    } catch (error) {
      console.error('Failed to add member:', error)
      toast.error(error.response?.data?.error || 'Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    setIsLoading(true)
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`)
      
      const updatedMembers = currentMembers.filter(m => m.id !== memberId)
      onMembersChange(updatedMembers)
      
      // Refresh available users so they can be added back if needed
      fetchAvailableUsers()
      
      toast.success('Member removed successfully')
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error(error.response?.data?.error || 'Failed to remove member')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Manage Team Members
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Add Member Form */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Member</h3>
              {isFetchingUsers ? (
                <div className="flex justify-center py-2">
                  <LoadingSpinner size="sm" />
                </div>
              ) : availableUsers.length > 0 ? (
                <form onSubmit={handleAddMember} className="flex space-x-3">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="select flex-1"
                    disabled={isLoading}
                  >
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isLoading || !selectedUserId}
                    className="btn-primary btn-sm flex-shrink-0"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-500 italic">No available users to add.</p>
              )}
            </div>

            {/* Current Members List */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Current Members ({currentMembers.length})</h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {currentMembers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No members have been added to this project yet.
                  </div>
                ) : (
                  currentMembers.map((member) => (
                    <div key={member.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isLoading}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="btn-secondary btn-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageMembersModal
