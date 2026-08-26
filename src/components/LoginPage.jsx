import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from './AuthContext'
import { RiDiscLine } from 'react-icons/ri'
import { FiShield, FiUser, FiLock, FiMail, FiArrowRight, FiCheckCircle, FiUserPlus, FiX } from 'react-icons/fi'

export default function LoginPage({ onToast }) {
  const { login, signup, authModalOpen, setAuthModalOpen, authMode } = useAuth()
  const [role, setRole] = useState('admin') // 'admin' | 'user'
  const [userMode, setUserMode] = useState('login') // 'login' | 'signup'

  const [username, setUsername] = useState('Viru')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('1016')
  const [loading, setLoading] = useState(false)

  // Direct navigation to Sign Up popup when requested
  useEffect(() => {
    if (authModalOpen) {
      if (authMode === 'signup') {
        setRole('user')
        setUserMode('signup')
        setUsername('')
        setEmail('')
        setPassword('')
      } else {
        setRole('admin')
        setUserMode('login')
        setUsername('Viru')
        setPassword('1016')
        setEmail('')
      }
    }
  }, [authModalOpen, authMode])

  // 🧊 Freeze background when auth modal is open
  useEffect(() => {
    if (authModalOpen) {
      document.body.classList.add('modal-active-freeze')
      document.documentElement.classList.add('modal-active-freeze')
    } else {
      document.body.classList.remove('modal-active-freeze')
      document.documentElement.classList.remove('modal-active-freeze')
    }
    return () => {
      document.body.classList.remove('modal-active-freeze')
      document.documentElement.classList.remove('modal-active-freeze')
    }
  }, [authModalOpen])

  if (!authModalOpen) return null

  const handleRoleSwitch = (newRole) => {
    setRole(newRole)
    setUserMode('login')
    if (newRole === 'admin') {
      setUsername('Viru')
      setPassword('1016')
      setEmail('')
    } else {
      setUsername('User')
      setPassword('123')
      setEmail('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (role === 'admin') {
        login(username, password, 'admin')
        if (onToast) onToast('Welcome, Administrator Viru! Full Access Granted.', 'ok')
      } else {
        if (userMode === 'signup') {
          if (!username.trim() || !email.trim() || !password.trim()) {
            throw new Error('Username, Email, and Password are required!')
          }
          signup(username, email, password)
          if (onToast) onToast(`Account created! Welcome to Resonance, ${username}!`, 'ok')
        } else {
          if (!username.trim() || !password.trim()) {
            throw new Error('Username/Email and Password are required!')
          }
          login(username, password, 'user')
          if (onToast) onToast(`Logged in successfully! Welcome back, ${username}.`, 'ok')
        }
      }
    } catch (err) {
      if (onToast) onToast(err.message || 'Authentication failed', 'err')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="modal-backdrop-animate"
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
    >
      <div
        className="modal-animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'rgba(23, 13, 43, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(168, 85, 247, 0.45)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(168, 85, 247, 0.3)',
          animation: 'rise 0.25s ease-out',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          title="Close Modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: 'var(--text-mid)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <FiX style={{ fontSize: '16px' }} />
        </button>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              color: '#fff',
              margin: '0 auto 14px',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.5)'
            }}
          >
            <RiDiscLine />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Resonance Music
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: 0 }}>
            DSA Powered Audio Streaming Platform
          </p>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            background: 'rgba(10, 5, 20, 0.6)',
            padding: '5px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '22px'
          }}
        >
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              transition: 'all 0.2s ease',
              background: role === 'admin' ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'transparent',
              color: role === 'admin' ? '#ffffff' : 'var(--text-mid)',
              boxShadow: role === 'admin' ? '0 4px 14px rgba(168, 85, 247, 0.4)' : 'none'
            }}
          >
            <FiShield style={{ fontSize: '14px' }} /> Log as Admin
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('user')}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              transition: 'all 0.2s ease',
              background: role === 'user' ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'transparent',
              color: role === 'user' ? '#ffffff' : 'var(--text-mid)',
              boxShadow: role === 'user' ? '0 4px 14px rgba(168, 85, 247, 0.4)' : 'none'
            }}
          >
            <FiUser style={{ fontSize: '14px' }} /> Log as User
          </button>
        </div>

        {/* Credentials Info Badge */}
        <div
          style={{
            padding: '10px 14px',
            background: role === 'admin' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            border: `1px solid ${role === 'admin' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            borderRadius: '12px',
            marginBottom: '18px',
            fontSize: '12px',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: role === 'admin' ? '#c084fc' : '#60a5fa' }}>
              {role === 'admin'
                ? 'ADMIN CREDENTIALS'
                : userMode === 'signup'
                ? 'NEW USER REGISTRATION'
                : 'USER ACCESS (ENTER REGISTERED DETAILS)'}
            </span>
            <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
              {role === 'admin'
                ? 'Username: Viru | Password: 1016'
                : userMode === 'signup'
                ? 'Create your account to start streaming'
                : 'Default Demo User: Username: User | Password: 123'}
            </div>
          </div>
          <FiCheckCircle style={{ color: role === 'admin' ? '#c084fc' : '#60a5fa', fontSize: '16px', flexShrink: 0 }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="field">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '5px', display: 'block' }}>
              {role === 'user' && userMode === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                placeholder={role === 'admin' ? 'Viru' : 'e.g. User or your username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  display: 'flex'
                }}
              >
                {role === 'admin' ? <FiShield /> : <FiUser />}
              </span>
            </div>
          </div>

          {/* Email field ONLY for user signup mode */}
          {role === 'user' && userMode === 'signup' && (
            <div className="field">
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '5px', display: 'block' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    display: 'flex'
                  }}
                >
                  <FiMail />
                </span>
              </div>
            </div>
          )}

          <div className="field">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '5px', display: 'block' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  display: 'flex'
                }}
              >
                <FiLock />
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: '4px',
              borderRadius: '12px'
            }}
          >
            {loading
              ? 'Processing...'
              : role === 'admin'
              ? 'Sign In as Admin'
              : userMode === 'signup'
              ? 'Create Account & Sign In'
              : 'Sign In as User'}
            {userMode === 'signup' ? <FiUserPlus style={{ marginLeft: '6px' }} /> : <FiArrowRight style={{ marginLeft: '6px' }} />}
          </button>
        </form>

        {/* Bottom Sign Up / Log In Toggle Link for Users */}
        {role === 'user' && (
          <div style={{ textAlign: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {userMode === 'login' ? (
              <p style={{ fontSize: '12.5px', color: 'var(--text-mid)', margin: 0 }}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setUserMode('signup')
                    setUsername('')
                    setPassword('')
                    setEmail('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#c084fc',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '0 2px'
                  }}
                >
                  Sign Up / Register Here
                </button>
              </p>
            ) : (
              <p style={{ fontSize: '12.5px', color: 'var(--text-mid)', margin: 0 }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setUserMode('login')
                    setUsername('User')
                    setPassword('123')
                    setEmail('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#c084fc',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '0 2px'
                  }}
                >
                  Sign In to Your Account
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
