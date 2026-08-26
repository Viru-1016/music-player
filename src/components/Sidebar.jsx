import React from 'react'
import { useAuth } from './AuthContext'
import {
  FiMusic,
  FiEdit3,
  FiSearch,
  FiList,
  FiLayers,
  FiGitBranch,
  FiLogOut,
  FiBookmark
} from 'react-icons/fi'
import { TbHierarchy2 } from 'react-icons/tb'
import { RiDiscLine } from 'react-icons/ri'

export default function Sidebar({ activeTab, setActiveTab, onToast, onReconnect, isOpen, onClose }) {
  const { user, setAuthModalOpen, setAuthMode, logout } = useAuth()

  const navItems = [
    { id: 'library', label: 'Music Library', icon: <FiMusic /> },
    { id: 'your-library', label: 'Your Library', icon: <FiBookmark /> },
    { id: 'edit-songs', label: 'Edit Songs', icon: <FiEdit3 /> },
    { id: 'search', label: 'Search & Sort', icon: <FiSearch /> },
    { id: 'queue', label: 'Playback Queue', icon: <FiList /> },
    { id: 'structures', label: 'Data Structures', icon: <FiLayers /> },
    { id: 'trees', label: 'Tree Visualizer', icon: <TbHierarchy2 /> },
    { id: 'graph', label: 'Genre Graph', icon: <FiGitBranch /> },
  ]

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
      <div className="nav-label">NAVIGATION</div>
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
                <div style={{ fontSize: '10px', color: 'var(--accent-2)' }}>Logged In</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
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
    </aside>
  )
}