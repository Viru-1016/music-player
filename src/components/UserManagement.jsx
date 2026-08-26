import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from './AuthContext'
import {
  FiUsers,
  FiUserPlus,
  FiTrash2,
  FiShield,
  FiUser,
  FiSearch,
  FiClock,
  FiCalendar,
  FiX,
  FiLock,
  FiMail,
  FiCheckCircle
} from 'react-icons/fi'

export default function UserManagement({ onToast }) {
  const { user: currentUser, createUserByAdmin, removeUserByAdmin } = useAuth()
  const [usersList, setUsersList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [userToRemove, setUserToRemove] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // 🧊 Freeze background when modal is open
  useEffect(() => {
    if (showAddModal || userToRemove) {
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
  }, [showAddModal, userToRemove])

  // Add User Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' // 'admin' | 'user'
  })

  // Load user list from localStorage database
  const refreshUsers = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('resonance_users_db') || '[]')
      setUsersList(stored)
    } catch (_) {
      setUsersList([])
    }
  }

  useEffect(() => {
    refreshUsers()
  }, [])

  // Format Date String helper
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A'
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return 'N/A'
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (_) {
      return 'N/A'
    }
  }

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList
    const q = searchQuery.toLowerCase().trim()
    return usersList.filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
    )
  }, [usersList, searchQuery])

  // Count stats
  const adminCount = useMemo(() => usersList.filter((u) => u.role === 'admin').length, [usersList])
  const userCount = useMemo(() => usersList.filter((u) => u.role === 'user').length, [usersList])

  // Handle Add User Form Submission
  const handleAddUserSubmit = (e) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const newUser = createUserByAdmin(formData.username, formData.email, formData.password, formData.role)
      if (onToast) onToast(`User "${newUser.username}" created with ${newUser.role.toUpperCase()} access!`, 'ok')
      
      refreshUsers()
      setShowAddModal(false)
      setFormData({ username: '', email: '', password: '', role: 'user' })
    } catch (err) {
      if (onToast) onToast(err.message || 'Failed to create user', 'err')
    } finally {
      setSubmitLoading(false)
    }
  }

  // Handle Remove User
  const handleConfirmRemoveUser = () => {
    if (!userToRemove) return

    if (String(userToRemove.id) === String(currentUser?.id) || userToRemove.username === 'Viru') {
      if (onToast) onToast('Cannot remove primary Administrator Viru', 'err')
      setUserToRemove(null)
      return
    }

    try {
      removeUserByAdmin(userToRemove.id)
      if (onToast) onToast(`User "${userToRemove.username}" removed from database`, 'info')
      refreshUsers()
    } catch (err) {
      if (onToast) onToast(err.message || 'Failed to remove user', 'err')
    } finally {
      setUserToRemove(null)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="h-title">
            User <span>Management</span>
          </h1>
          <p className="h-sub">
            Manage system users, assign role access levels, and monitor login activity
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FiUserPlus style={{ fontSize: '15px' }} /> Add User
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div
          className="panel"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(15, 8, 30, 0.6))'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: 'var(--accent-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}
          >
            <FiUsers />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {usersList.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '4px' }}>
              Total Registered Users
            </div>
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.1), rgba(15, 8, 30, 0.6))'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(192, 132, 252, 0.2)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}
          >
            <FiShield />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {adminCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '4px' }}>
              Administrators
            </div>
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(15, 8, 30, 0.6))'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(96, 165, 250, 0.2)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}
          >
            <FiUser />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {userCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '4px' }}>
              Normal Users
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="panel lib-toolbar-panel" style={{ marginBottom: '20px' }}>
        <div className="field search-box" style={{ margin: 0, width: '100%' }}>
          <label>Search Registered Users</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search by username, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', width: '100%' }}
            />
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.6
              }}
            >
              <FiSearch />
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="panel" style={{ padding: '16px', overflowX: 'auto' }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
            No users found matching "{searchQuery}"
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-mid)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                <th style={{ padding: '12px 10px' }}>User Details</th>
                <th style={{ padding: '12px 10px' }}>Access Role</th>
                <th style={{ padding: '12px 10px' }}>First Login / Created</th>
                <th style={{ padding: '12px 10px' }}>Latest Login Date</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isAdminRole = u.role === 'admin'
                const isPrimaryAdmin = u.username === 'Viru'

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid rgba(168, 120, 255, 0.08)',
                      transition: 'background 0.15s ease'
                    }}
                    className="table-row-hover"
                  >
                    {/* User & Avatar */}
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                          alt={u.username}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--panel)',
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {u.username}
                            {String(u.id) === String(currentUser?.id) && (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td style={{ padding: '12px 10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isAdminRole
                            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(124, 58, 237, 0.2))'
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))',
                          color: isAdminRole ? '#c084fc' : '#60a5fa',
                          border: `1px solid ${isAdminRole ? 'rgba(168, 85, 247, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                        }}
                      >
                        {isAdminRole ? <FiShield style={{ fontSize: '12px' }} /> : <FiUser style={{ fontSize: '12px' }} />}
                        {isAdminRole ? 'ADMIN ACCESS' : 'NORMAL USER'}
                      </span>
                    </td>

                    {/* First Login Date */}
                    <td style={{ padding: '12px 10px', color: 'var(--text-mid)', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiCalendar style={{ opacity: 0.6 }} />
                        {formatDate(u.createdAt || u.firstLoginAt)}
                      </div>
                    </td>

                    {/* Latest Login Date */}
                    <td style={{ padding: '12px 10px', color: 'var(--text-mid)', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiClock style={{ opacity: 0.6 }} />
                        {formatDate(u.lastLoginAt || u.createdAt)}
                      </div>
                    </td>

                    {/* Remove Action */}
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={isPrimaryAdmin || String(u.id) === String(currentUser?.id)}
                        onClick={() => setUserToRemove(u)}
                        title={isPrimaryAdmin ? 'Primary Admin cannot be removed' : 'Remove User'}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: isPrimaryAdmin || String(u.id) === String(currentUser?.id) ? 'var(--text-dim)' : '#f87171',
                          opacity: isPrimaryAdmin || String(u.id) === String(currentUser?.id) ? 0.5 : 1,
                          cursor: isPrimaryAdmin || String(u.id) === String(currentUser?.id) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <FiTrash2 style={{ marginRight: '4px' }} /> Remove User
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 🟣 ADD USER POPUP MODAL */}
      {showAddModal && createPortal(
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
              maxWidth: '420px',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: 'linear-gradient(145deg, #1f113a, #110822)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '20px',
              padding: '30px 26px',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(168, 85, 247, 0.3)',
              position: 'relative',
              animation: 'rise 0.22s ease-out'
            }}
          >
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'var(--text-mid)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <FiX style={{ fontSize: '18px' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '20px',
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
                }}
              >
                <FiUserPlus />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 800 }}>Create New User</h3>
                <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '12px' }}>Add administrative or standard member access</p>
              </div>
            </div>

            <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '6px' }}>
                  Username *
                </label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#c084fc', fontSize: '17px', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter username..."
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="form-input-modern"
                    style={{ width: '100%', padding: '13px 16px 13px 44px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <FiMail style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#c084fc', fontSize: '17px', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    required
                    placeholder="name@resonance.music..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input-modern"
                    style={{ width: '100%', padding: '13px 16px 13px 44px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '6px' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#c084fc', fontSize: '17px', pointerEvents: 'none' }} />
                  <input
                    type="password"
                    required
                    placeholder="Create secure password..."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-input-modern"
                    style={{ width: '100%', padding: '13px 16px 13px 44px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '8px' }}>
                  User Access Permission (Role)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: formData.role === 'user' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: formData.role === 'user' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <FiUser style={{ color: formData.role === 'user' ? 'var(--accent)' : 'var(--text-dim)', fontSize: '18px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Normal User</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Standard UI only</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: formData.role === 'admin' ? '2px solid var(--accent-2)' : '1px solid var(--border)',
                      background: formData.role === 'admin' ? 'rgba(236, 72, 153, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <FiShield style={{ color: formData.role === 'admin' ? 'var(--accent-2)' : 'var(--text-dim)', fontSize: '18px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Admin</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Full control access</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitLoading}
                style={{
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '8px',
                  borderRadius: '12px'
                }}
              >
                {submitLoading ? 'Creating User...' : 'Create Account & Assign Role'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 🔴 REMOVE USER CONFIRMATION MODAL */}
      {userToRemove && createPortal(
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
              background: 'linear-gradient(145deg, #240e1a, #150912)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '18px',
              padding: '26px 22px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(239, 68, 68, 0.25)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🗑️</div>
            <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 8px', fontWeight: 800 }}>
              Remove User "{userToRemove.username}"?
            </h3>
            <p style={{ color: 'var(--text-mid)', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
              This will revoke all access and permanently delete this account from the user database.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setUserToRemove(null)}
                style={{ justifyContent: 'center', padding: '10px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleConfirmRemoveUser}
                style={{
                  justifyContent: 'center',
                  padding: '10px',
                  background: '#ef4444',
                  borderColor: '#f87171',
                  color: '#fff',
                  fontWeight: 700
                }}
              >
                Remove User
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
