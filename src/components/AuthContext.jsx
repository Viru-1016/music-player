import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'

  // Load existing session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('resonance_current_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (_) {}
  }, [])

  // Sign Up
  const signup = (username, email, password) => {
    const users = JSON.parse(localStorage.getItem('resonance_users_db') || '[]')
    
    // Check if user exists
    if (users.find(u => u.email === email || u.username === username)) {
      throw new Error('Username or Email already exists!')
    }

    const newUser = {
      id: Date.now(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      createdAt: new Date().toISOString()
    }

    users.push({ ...newUser, password })
    localStorage.setItem('resonance_users_db', JSON.stringify(users))
    
    // Auto login
    localStorage.setItem('resonance_current_user', JSON.stringify(newUser))
    setUser(newUser)
    setAuthModalOpen(false)
    return newUser
  }

  // Login
  const login = (identifier, password) => {
    const users = JSON.parse(localStorage.getItem('resonance_users_db') || '[]')
    const found = users.find(
      u => (u.email === identifier.toLowerCase() || u.username === identifier) && u.password === password
    )

    if (!found) {
      throw new Error('Invalid username/email or password!')
    }

    const sessionUser = {
      id: found.id,
      username: found.username,
      email: found.email,
      avatar: found.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${found.username}`
    }

    localStorage.setItem('resonance_current_user', JSON.stringify(sessionUser))
    setUser(sessionUser)
    setAuthModalOpen(false)
    return sessionUser
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('resonance_current_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        login,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}