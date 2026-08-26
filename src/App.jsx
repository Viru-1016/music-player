import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Library from './components/Library'
import YourLibrary from './components/YourLibrary'
import EditSongs from './components/EditSongs'
import SearchSort from './components/SearchSort'
import Queue from './components/Queue'
import Structures from './components/Structures'
import Trees from './components/Trees'
import Graph from './components/Graph'
import { ToastContainer } from './components/Toast'
import NowPlayingBar from './components/NowPlayingBar'
import { PlayerProvider, usePlayer } from './components/PlayerContext'
import { AuthProvider } from './components/AuthContext'
import AuthModal from './components/AuthModal'
import { api } from './api'

function AppContent() {
  const [activeTab, setActiveTab] = useState('library')
  const [songs, setSongs] = useState([])
  const [toasts, setToasts] = useState([])
  const [selectedSong, setSelectedSong] = useState(null)

  // User Saved Library State
  const [userLibraryIds, setUserLibraryIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resonance_user_library') || '[]')
    } catch (_) {
      return []
    }
  })

  // Global Playback Queue State
  const [queuedSongIds, setQueuedSongIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('resonance_playback_queue') || '[]')
      return stored.map((id) => String(id))
    } catch (_) {
      return []
    }
  })

  const toggleUserLibrary = (song) => {
    if (!song || song.id === undefined) return
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
      localStorage.setItem('resonance_user_library', JSON.stringify(next))
      return next
    })
  }

  const toggleQueue = (song) => {
    if (!song || song.id === undefined) return
    const songIdStr = String(song.id)
    setQueuedSongIds((prev) => {
      const exists = prev.some((id) => String(id) === songIdStr)
      let next
      if (exists) {
        next = prev.filter((id) => String(id) !== songIdStr)
        showToast(`"${song.title || 'Song'}" removed from Queue`, 'info')
        api.dequeue(song.id).catch(() => {})
      } else {
        next = [...prev, songIdStr]
        showToast(`"${song.title || 'Song'}" added to Queue!`, 'ok')
        api.enqueue(song).catch(() => {})
      }
      localStorage.setItem('resonance_playback_queue', JSON.stringify(next))
      return next
    })
  }

  // Sidebar state (Default open on desktop, toggleable anytime)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const { updatePlaylist } = usePlayer()

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

  return (
    <div className={`app ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
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

      {/* Main Content Area */}
      <main className="main">
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

        {activeTab === 'edit-songs' && (
          <EditSongs 
            songs={songs} 
            onRefresh={fetchSongs} 
            onToast={showToast} 
          />
        )}

        {activeTab === 'search' && <SearchSort songs={songs} onToast={showToast} />}
        {activeTab === 'queue' && (
          <Queue
            songs={songs}
            queuedSongIds={queuedSongIds}
            onToggleQueue={toggleQueue}
            setQueuedSongIds={setQueuedSongIds}
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
      </main>

      <NowPlayingBar />

      <AuthModal onToast={showToast} />

      <ToastContainer toasts={toasts} />
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