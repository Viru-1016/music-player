import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Library from './components/Library'
import YourLibrary from './components/YourLibrary'
import EditSongs from './components/EditSongs'
import Queue from './components/Queue'
import Structures from './components/Structures'
import Trees from './components/Trees'
import Graph from './components/Graph'
import { ToastContainer } from './components/Toast'
import NowPlayingBar from './components/NowPlayingBar'
import { PlayerProvider, usePlayer } from './components/PlayerContext'
import { AuthProvider, useAuth } from './components/AuthContext'
import AuthModal from './components/AuthModal'
import LoginPage from './components/LoginPage'
import UserManagement from './components/UserManagement'
import QueueSidebar from './components/QueueSidebar'
import { api } from './api'

function AppContent() {
  const { user, splashState } = useAuth()
  const [activeTab, setActiveTab] = useState('library')
  const [songs, setSongs] = useState([])
  const [toasts, setToasts] = useState([])
  const [selectedSong, setSelectedSong] = useState(null)

  // User Saved Library State per user session (empty for guests)
  const [userLibraryIds, setUserLibraryIds] = useState([])

  const {
    queuedSongIds,
    toggleQueue: playerToggleQueue,
    setQueuedIds,
    updatePlaylist,
    isQueueOpen
  } = usePlayer()

  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`resonance_user_library_${user.id}`)
        setUserLibraryIds(saved ? JSON.parse(saved) : [])
      } catch (_) {
        setUserLibraryIds([])
      }
    } else {
      setUserLibraryIds([])
    }
  }, [user?.id])

  const toggleUserLibrary = (song) => {
    if (!song || song.id === undefined) return
    if (!user) {
      showToast('Please Log In to save songs to Your Library!', 'err')
      return
    }

    const songId = song.id
    setUserLibraryIds((prev) => {
      const exists = prev.some((id) => String(id) === String(songId))
      let next
      if (exists) {
        next = prev.filter((id) => String(id) !== String(songId))
        showToast(`"${song.title || 'Song'}" removed from Your Library`, 'info')
      } else {
        next = [...prev, songId]
        showToast(`"${song.title || 'Song'}" added to Your Library!`, 'ok')
      }
      localStorage.setItem(`resonance_user_library_${user.id}`, JSON.stringify(next))
      return next
    })
  }

  const toggleQueue = (song) => {
    if (!song || song.id === undefined) return
    const isAdded = playerToggleQueue(song)
    if (isAdded) {
      showToast(`"${song.title || 'Song'}" added to Queue!`, 'ok')
    } else {
      showToast(`"${song.title || 'Song'}" removed from Queue`, 'info')
    }
  }

  // Sidebar state (Default open on desktop, toggleable anytime)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // 🔄 When Queue sidebar opens, automatically collapse the main navigation sidebar
  useEffect(() => {
    if (isQueueOpen) {
      setIsSidebarOpen(false)
    }
  }, [isQueueOpen])

  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const fetchSongs = async () => {
    try {
      const data = await api.getSongs()
      let list = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && Array.isArray(data.songs)) {
        list = data.songs
      }
      setSongs(list)
      if (typeof updatePlaylist === 'function') {
        updatePlaylist(list)
      }
    } catch (err) {
      console.error('Failed to load songs:', err)
      showToast('Could not fetch songs from backend', 'err')
    }
  }

  useEffect(() => {
    fetchSongs()
  }, [])

  // Tab guard for guests & non-admin users
  useEffect(() => {
    if (user?.role !== 'admin' && activeTab !== 'library' && activeTab !== 'your-library') {
      setActiveTab('library')
    }
  }, [user, activeTab])

  return (
    <div className={`app ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'} ${isQueueOpen ? 'queue-drawer-open' : ''}`}>
      {/* Floating Toggle Button (Always visible on screen) */}
      {/* Floating Neon Squircle Hamburger Toggle Button */}
<button
  type="button"
  className={`sidebar-toggle-btn ${isSidebarOpen ? 'open' : 'closed'}`}
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
>
  <div className="squircle-hamburger">
    <span></span>
    <span></span>
    <span></span>
  </div>
</button>

      {/* Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Slide-in Animated Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab)
          if (window.innerWidth < 768) setIsSidebarOpen(false)
        }} 
        onToast={showToast} 
        onReconnect={fetchSongs}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area with Smooth Page/Tab Switch Transition */}
      <main className="main">
        <div key={activeTab} className="main-page-transition">
          {activeTab === 'library' && (
            <Library 
              songs={songs} 
              onRefresh={fetchSongs} 
              onToast={showToast}
              onSelectSong={setSelectedSong}
              selectedSong={selectedSong}
              userLibraryIds={userLibraryIds}
              onToggleUserLibrary={toggleUserLibrary}
              queuedSongIds={queuedSongIds}
              onToggleQueue={toggleQueue}
            />
          )}

          {activeTab === 'your-library' && (
            <YourLibrary
              songs={songs}
              userLibraryIds={userLibraryIds}
              onToggleUserLibrary={toggleUserLibrary}
              queuedSongIds={queuedSongIds}
              onToggleQueue={toggleQueue}
              onToast={showToast}
              onSelectSong={setSelectedSong}
            />
          )}

          {activeTab === 'users' && <UserManagement onToast={showToast} />}

          {activeTab === 'edit-songs' && (
            <EditSongs 
              songs={songs} 
              onRefresh={fetchSongs} 
              onToast={showToast} 
            />
          )}

          {activeTab === 'queue' && (
            <Queue
              songs={songs}
              queuedSongIds={queuedSongIds}
              onToggleQueue={toggleQueue}
              setQueuedSongIds={setQueuedIds}
              onToast={showToast}
            />
          )}
          {activeTab === 'structures' && (
            <Structures 
              songs={songs} 
              onToast={showToast} 
              onRefresh={fetchSongs} 
            />
          )}
          {activeTab === 'trees' && <Trees songs={songs} onToast={showToast} />}
          {activeTab === 'graph' && <Graph songs={songs} onToast={showToast} />}
        </div>
      </main>

      {/* Slide-in Queue Sidebar (Spotify-style right drawer) */}
      <QueueSidebar onToast={showToast} />

      <NowPlayingBar />

      <LoginPage onToast={showToast} />

      <ToastContainer toasts={toasts} />

      {/* 🚀 Login / Logout Smooth Splash Animation Overlay */}
      {splashState && (
        <div className="auth-splash-overlay">
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              color: '#fff',
              marginBottom: '16px',
              boxShadow: '0 0 35px rgba(168, 85, 247, 0.6)'
            }}
          >
            🎵
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            {splashState.title}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--accent-2)', margin: 0, fontWeight: 600 }}>
            {splashState.subtitle}
          </p>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </AuthProvider>
  )
}