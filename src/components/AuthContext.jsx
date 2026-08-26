import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'signup'

  // Start cleanly in Logged-out / Guest Mode on initial site load & seed default DB if empty
  useEffect(() => {
    try {
      localStorage.removeItem('resonance_current_user')
      setUser(null)

      // Seed initial default user DB if empty
      const existingDb = localStorage.getItem('resonance_users_db')
      if (!existingDb) {
        const defaultUsers = [
          {
            id: 'admin-viru',
            username: 'Viru',
            email: 'viru@admin.com',
            password: '1016',
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Viru',
            createdAt: '2026-08-26T08:00:00.000Z',
            lastLoginAt: new Date().toISOString()
          },
          {
            id: 'user-1001',
            username: 'User',
            email: 'user@resonance.com',
            password: '123',
            role: 'user',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=User',
            createdAt: '2026-08-26T09:30:00.000Z',
            lastLoginAt: new Date().toISOString()
          }
        ]
        localStorage.setItem('resonance_users_db', JSON.stringify(defaultUsers))
      }
    } catch (_) {}
  }, [])

  // Sign Up
  const signup = (username, email, password, role = 'user') => {
    const cleanName = (username || '').trim()
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPass = String(password || '').trim()

    if (!cleanName || !cleanEmail || !cleanPass) {
      throw new Error('Username, Email, and Password are all required!')
    }

    const users = JSON.parse(localStorage.getItem('resonance_users_db') || '[]')
    
    // Check if user exists
    if (users.some((u) => u.email === cleanEmail || u.username.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('Username or Email is already registered!')
    }

    const nowIso = new Date().toISOString()
    const newUser = {
      id: `usr-${Date.now()}`,
      username: cleanName,
      email: cleanEmail,
      password: cleanPass,
      role: role,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanName}`,
      createdAt: nowIso,
      lastLoginAt: nowIso
    }

    users.push(newUser)
    localStorage.setItem('resonance_users_db', JSON.stringify(users))
    
    // Auto login session
    const sessionUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt
    }
    localStorage.setItem('resonance_current_user', JSON.stringify(sessionUser))
    setUser(sessionUser)
    setAuthModalOpen(false)
    return sessionUser
  }

  // Create User by Admin (Without logging out current admin)
  const createUserByAdmin = (username, email, password, role = 'user') => {
    const cleanName = (username || '').trim()
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPass = String(password || '').trim()

    if (!cleanName || !cleanEmail || !cleanPass) {
      throw new Error('Username, Email, and Password are all required!')
    }

    const users = JSON.parse(localStorage.getItem('resonance_users_db') || '[]')
    
    if (users.some((u) => u.email === cleanEmail || u.username.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error('Username or Email is already registered!')
    }

    const nowIso = new Date().toISOString()
    const newUser = {
      id: `usr-${Date.now()}`,
      username: cleanName,
      email: cleanEmail,
      password: cleanPass,
      role: role,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanName}`,
      createdAt: nowIso,
      lastLoginAt: nowIso
    }

    users.push(newUser)
    localStorage.setItem('resonance_users_db', JSON.stringify(users))
    return newUser
  }

  // Remove User by Admin
  const removeUserByAdmin = (userId) => {
    const users = JSON.parse(localStorage.getItem('resonance_users_db') || '[]')
    const updatedUsers = users.filter((u) => String(u.id) !== String(userId) && u.username !== 'Viru')
    localStorage.setItem('resonance_users_db', JSON.stringify(updatedUsers))
    return updatedUsers
  }

  // Login
  const login = (identifier, password, targetRole = 'user') => {
    const inputName = (identifier || '').trim()
    const inputPass = String(password || '').trim()

    const users = JSON.parse(localStorage.getItem('resonance_users_db') || '[]')

    // 1. Admin Login Mode (Viru / 1016 or any created admin user)
    if (targetRole === 'admin' || inputName.toLowerCase() === 'viru') {
      if (inputName.toLowerCase() === 'viru' && inputPass === '1016') {
        const nowIso = new Date().toISOString()
        const adminSession = {
          id: 'admin-viru',
          username: 'Viru',
          role: 'admin',
          email: 'viru@admin.com',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Viru',
          createdAt: '2026-08-26T08:00:00.000Z',
          lastLoginAt: nowIso
        }

        // Update DB lastLoginAt
        const updatedUsers = users.map((u) => (u.username === 'Viru' ? { ...u, lastLoginAt: nowIso } : u))
        localStorage.setItem('resonance_users_db', JSON.stringify(updatedUsers))
        localStorage.setItem('resonance_current_user', JSON.stringify(adminSession))
        setUser(adminSession)
        setAuthModalOpen(false)
        triggerSplash('Welcome, Viru!', 'Administrator Access Granted', 'admin')
        return adminSession
      }
    }

    // 2. Universal Login Check against DB (Admin or Normal User)
    if (!inputName || !inputPass) {
      throw new Error('Username and Password are required!')
    }

    const foundIndex = users.findIndex(
      (u) =>
        (u.email === inputName.toLowerCase() || u.username.toLowerCase() === inputName.toLowerCase()) &&
        String(u.password) === inputPass
    )

    if (foundIndex === -1) {
      throw new Error('Invalid Username/Email or Password! Please check your credentials or Sign Up.')
    }

    const found = users[foundIndex]
    const nowIso = new Date().toISOString()
    found.lastLoginAt = nowIso
    users[foundIndex] = found
    localStorage.setItem('resonance_users_db', JSON.stringify(users))

    const sessionUser = {
      id: found.id,
      username: found.username,
      email: found.email,
      role: found.role || 'user',
      avatar: found.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${found.username}`,
      createdAt: found.createdAt || nowIso,
      lastLoginAt: nowIso
    }

    localStorage.setItem('resonance_current_user', JSON.stringify(sessionUser))
    setUser(sessionUser)
    setAuthModalOpen(false)
    triggerSplash(`Welcome, ${sessionUser.username}!`, `Signed in with ${sessionUser.role.toUpperCase()} access`, sessionUser.role)
    return sessionUser
  }

  const [splashState, setSplashState] = useState(null)

  const triggerSplash = (title, subtitle, role = null) => {
    setSplashState({ title, subtitle, role })
    setTimeout(() => {
      setSplashState(null)
    }, 900)
  }

  // Logout
  const logout = () => {
    triggerSplash('Logging Out', 'Reverting to Guest Mode...', null)
    localStorage.removeItem('resonance_current_user')
    setUser(null)
  }

  const isAdmin = user?.role === 'admin'
  const isUser = user?.role === 'user'

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isUser,
        signup,
        login,
        logout,
        splashState,
        triggerSplash,
        createUserByAdmin,
        removeUserByAdmin,
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