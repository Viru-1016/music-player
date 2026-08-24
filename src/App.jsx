import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Library from './components/Library'
import SearchSort from './components/SearchSort'
import Queue from './components/Queue'
import Structures from './components/Structures'
import Trees from './components/Trees'
import Graph from './components/Graph'
import * as ToastModule from './components/Toast'
import NowPlayingBar from './components/NowPlayingBar'
import { PlayerProvider, usePlayer } from './components/PlayerContext'
import { api } from './api'

function AppContent() {
  const [activeTab, setActiveTab] = useState('library')
  const [songs, setSongs] = useState([])
  const [toasts, setToasts] = useState([])
  const [selectedSong, setSelectedSong] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  const ToastComponent = ToastModule.ToastContainer || ToastModule.Toast || ToastModule.default

  return (
    <div className="app">
      {/* Mobile Top Navigation Bar */}
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🎵</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Resonance</span>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ padding: '6px 12px' }}
        >
          {isSidebarOpen ? '✕ Close' : '☰ Menu'}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab)
          setIsSidebarOpen(false)
        }} 
        onToast={showToast} 
        onReconnect={fetchSongs}
        isOpen={isSidebarOpen}
      />

      <main className="main">
        {activeTab === 'library' && (
          <Library 
            songs={songs} 
            onRefresh={fetchSongs} 
            onToast={showToast}
            onSelectSong={setSelectedSong}
            selectedSong={selectedSong}
          />
        )}

        {activeTab === 'search' && <SearchSort songs={songs} onToast={showToast} />}
        {activeTab === 'queue' && <Queue songs={songs} onToast={showToast} />}
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

      {ToastComponent && <ToastComponent toasts={toasts} setToasts={setToasts} />}
    </div>
  )
}

export default function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  )
}