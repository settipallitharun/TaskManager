/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import api from '../services/api'

function formatApiError(error, fallback) {
  const msg = String(error.message || '')
  if (
    error.code === 'ERR_NETWORK' ||
    msg === 'Network Error' ||
    msg.includes('ECONNREFUSED')
  ) {
    return 'Backend not running on port 5050. Open folder "Task Manger" (not client) in the terminal and run: npm run dev'
  }
  const status = error.response?.status
  const data = error.response?.data
  if (data?.error) return data.error
  if (data?.message) return data.message
  if (typeof data?.details === 'string') return data.details
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return 'Backend not reachable (port 5050). From project root run: npm run dev — both API and website must start.'
  }
  return fallback
}

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      getCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/profile')
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to get current user:', error)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      return { success: true }
    } catch (error) {
      const message = formatApiError(error, 'Login failed')
      return { success: false, error: message }
    }
  }

  const signup = async (name, email, password, role = 'Member') => {
    try {
      const response = await api.post('/auth/signup', { name, email, password, role })
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      return { success: true }
    } catch (error) {
      const message = formatApiError(error, 'Signup failed')
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isAdmin: user?.role === 'Admin',
    isMember: user?.role === 'Member'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}
