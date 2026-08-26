import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from './AuthContext'
import {
  FiMusic,
  FiEdit3,
  FiSearch,
  FiList,
  FiLayers,
  FiGitBranch,
  FiLogOut,
  FiBookmark,
  FiTrash2,
  FiUsers
} from 'react-icons/fi'
import { TbHierarchy2 } from 'react-icons/tb'
import { RiDiscLine } from 'react-icons/ri'

export default function Sidebar({ activeTab, setActiveTab, onToast, onReconnect, isOpen, onClose }) {
  const { user, setAuthModalOpen, setAuthMode, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // 🧊 Freeze background when logout modal is open
  useEffect(() => {
    if (showLogoutModal) {
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
  }, [showLogoutModal])

  const allNavItems = [
    { id: 'library', label: 'Music Library', icon: <FiMusic /> },
    { id: 'your-library', label: 'Your Library', icon: <FiBookmark /> },
    { id: 'users', label: 'User Management', icon: <FiUsers /> },
    { id: 'edit-songs', label: 'Edit Songs', icon: <FiEdit3 /> },
    { id: 'queue', label: 'Playback Queue', icon: <FiList /> },
    { id: 'structures', label: 'Recently Deleted', icon: <FiTrash2 /> },
    { id: 'trees', label: 'Tree Visualizer', icon: <TbHierarchy2 /> },
    { id: 'graph', label: 'Genre Graph', icon: <FiGitBranch /> },
  ]

  const navItems = user?.role === 'admin'
    ? allNavItems
    : allNavItems.filter((item) => item.id === 'library' || item.id === 'your-library')

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Brand Header with Close Squircle Icon */}
      <div className="brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-box">
            <RiDiscLine style={{ fontSize: '20px', display: 'block' }} />
          </div>
          <div>
            <div className="brand-name">Resonance</div>
            <div className="brand-sub">DSA MUSIC HUB</div>
          </div>
        </div>

        {/* Squircle Hamburger Close Button inside Sidebar */}
        <button
          type="button"
          className="sidebar-header-toggle-btn"
          onClick={onClose}
          title="Collapse Sidebar"
        >
          <div className="squircle-hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="nav-label">
        NAVIGATION ({user ? (user.role === 'admin' ? 'ADMIN' : 'USER') : 'GUEST'})
      </div>
      <nav className="nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Session Section */}
      <div style={{ marginTop: 'auto', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
        {user ? (
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--bg-2)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--panel)', flexShrink: 0 }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.username}
                </div>
                <div style={{ fontSize: '10px', color: user?.role === 'admin' ? '#c084fc' : '#60a5fa', fontWeight: 700 }}>
                  {user?.role === 'admin' ? 'ADMIN ACCESS' : 'USER ACCESS'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              title="Logout"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '15px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FiLogOut />
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{ justifyContent: 'center', fontSize: '11.5px', padding: '7px 0' }}
              onClick={() => {
                setAuthMode('login')
                setAuthModalOpen(true)
              }}
            >
              Log In
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ justifyContent: 'center', fontSize: '11.5px', padding: '7px 0' }}
              onClick={() => {
                setAuthMode('signup')
                setAuthModalOpen(true)
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Backend Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4ade80' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
            Connected
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onReconnect}
            style={{ padding: '2px 8px', fontSize: '10.5px' }}
          >
            Retry
          </button>
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontFamily: 'var(--mono)', wordBreak: 'break-all' }}>
          http://localhost:8080/api
        </div>
      </div>

      {/* Logout Confirmation Modal (Centered globally via Portal) */}
      {showLogoutModal && createPortal(
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
            padding: '16px'
          }}
        >
          <div
            className="modal-animate-pop"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'linear-gradient(145deg, #1d1133, #110822)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(168, 85, 247, 0.3)',
              textAlign: 'center',
              animation: 'rise 0.22s ease-out'
            }}
          >
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>🚪</div>
            <h3 style={{ color: '#fff', fontSize: '19px', margin: '0 0 8px', fontWeight: 800 }}>
              Confirm Logout
            </h3>
            <p style={{ color: 'var(--text-mid)', fontSize: '13px', margin: '0 0 24px', lineHeight: 1.5 }}>
              Are you sure you want to log out of your session?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowLogoutModal(false)}
                style={{ justifyContent: 'center', padding: '10px', fontSize: '13px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowLogoutModal(false)
                  logout()
                  if (onToast) onToast('Logged out successfully', 'info')
                }}
                style={{ justifyContent: 'center', padding: '10px', fontSize: '13px', fontWeight: 700 }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  )
}