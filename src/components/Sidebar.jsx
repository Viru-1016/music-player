import React, { useState, useEffect } from 'react'
import { getBaseUrl, setBaseUrl, checkConnection } from '../api'

export default function Sidebar({ activeTab, setActiveTab, onToast, onReconnect, isOpen }) {
  const [connected, setConnected] = useState(false)
  const [checking, setChecking] = useState(false)
  const [urlInput, setUrlInput] = useState(getBaseUrl() || 'http://localhost:8080/api')

  const checkStatus = async () => {
    setChecking(true)
    try {
      const ok = await checkConnection()
      setConnected(Boolean(ok))
    } catch (_) {
      setConnected(false)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleReconnect = async () => {
    setChecking(true)
    try {
      const ok = await checkConnection()
      setConnected(Boolean(ok))
      if (ok) {
        if (onToast) onToast('Connected to backend!', 'ok')
        if (typeof onReconnect === 'function') onReconnect()
      } else {
        if (onToast) onToast('Backend is offline. Check port 8080.', 'err')
      }
    } catch (err) {
      setConnected(false)
      if (onToast) onToast('Failed to connect to backend', 'err')
    } finally {
      setChecking(false)
    }
  }

  const handleUrlChange = (e) => {
    const val = e.target.value
    setUrlInput(val)
    setBaseUrl(val)
  }

  const navItems = [
    { id: 'library', label: 'Music Library', icon: '🎵' },
    { id: 'search', label: 'Search & Sort', icon: '⚡' },
    { id: 'queue', label: 'Playback Queue', icon: '📑' },
    { id: 'structures', label: 'Data Structures', icon: '📦' },
    { id: 'trees', label: 'Tree Visualizer', icon: '🌳' },
    { id: 'graph', label: 'Genre Graph', icon: '🕸️' },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div>
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <div className="brand-text">Resonance</div>
            <div className="brand-sub">DSA Music Hub</div>
          </div>
        </div>

        <div className="eq" style={{ marginTop: '12px' }}>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-label">Navigation</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span style={{ fontSize: '15px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Connection Box */}
      <div className="conn-box">
        <div className="conn-row" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span className={`dot ${connected ? 'ok' : 'bad'}`} />
            <span>{checking ? 'Checking...' : connected ? 'Connected' : 'Offline'}</span>
          </div>
          <button
            type="button"
            onClick={handleReconnect}
            className="btn btn-sm"
            style={{ padding: '3px 8px', fontSize: '10px' }}
          >
            Retry
          </button>
        </div>
        <input
          type="text"
          className="conn-input"
          value={urlInput}
          onChange={handleUrlChange}
          placeholder="http://localhost:8080/api"
        />
      </div>
    </aside>
  )
}