import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, FileText } from 'lucide-react'

const ProjectModal = ({ 
  project, 
  onClose, 
  onSubmit, 
  isEdit = false 
}) => {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description || ''
      })
    }
  }, [project, reset])

  const handleFormSubmit = async (data) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      if (!isEdit) {
        reset()
      }
      onClose()
    } catch (error) {
      console.error('Project operation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Edit Project' : 'Create Project'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  className="input pl-10"
                  placeholder="Enter project title"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                {...register('description')}
                className="textarea"
                rows={4}
                placeholder="Enter project description"
              />
            </div>

            <div className="flex justify-end pt-4 space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-sm"
              >
                {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProjectModal
