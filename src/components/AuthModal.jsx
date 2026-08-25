import React, { useState } from 'react'
import { useAuth } from './AuthContext'

export default function AuthModal({ onToast }) {
  const { authModalOpen, setAuthModalOpen, authMode, setAuthMode, login, signup } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!authModalOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (authMode === 'login') {
        login(username || email, password)
        if (onToast) onToast('Logged in successfully! Welcome back.', 'ok')
      } else {
        if (!username || !email || !password) {
          throw new Error('Please fill in all fields')
        }
        signup(username, email, password)
        if (onToast) onToast('Account created successfully!', 'ok')
      }
      setUsername('')
      setEmail('')
      setPassword('')
    } catch (err) {
      if (onToast) onToast(err.message, 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 2, 10, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(145deg, #190e30, #110822)',
          border: '1px solid rgba(168, 85, 247, 0.45)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
          animation: 'rise 0.22s ease-out',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              margin: '0 auto 12px',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)'
            }}
          >
            🎵
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px', color: '#fff' }}>
            {authMode === 'login' ? 'Welcome Back' : 'Join Resonance'}
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-mid)', margin: 0 }}>
            {authMode === 'login'
              ? 'Access your personal music library & queue'
              : 'Create an account to start streaming tracks'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {authMode === 'signup' && (
            <div className="field">
              <label>Username</label>
              <input
                type="text"
                required
                placeholder="e.g. alex99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>{authMode === 'login' ? 'Username or Email' : 'Email Address'}</label>
            <input
              type={authMode === 'login' ? 'text' : 'email'}
              required
              placeholder={authMode === 'login' ? 'username or name@email.com' : 'name@email.com'}
              value={authMode === 'login' ? username : email}
              onChange={(e) => (authMode === 'login' ? setUsername(e.target.value) : setEmail(e.target.value))}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent-2), var(--accent-dim))',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '6px',
              boxShadow: '0 4px 18px rgba(168, 85, 247, 0.45)',
              transition: 'transform 0.15s ease'
            }}
          >
            {loading ? 'Processing...' : authMode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle between Login & Signup */}
        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12.5px', color: 'var(--text-mid)' }}>
          {authMode === 'login' ? (
            <>
              Don't have an account?{' '}
              <span
                style={{ color: 'var(--accent-2)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setAuthMode('signup')}
              >
                Sign Up
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span
                style={{ color: 'var(--accent-2)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setAuthMode('login')}
              >
                Log In
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}