import React, { useState, useEffect, useMemo, useRef } from 'react'
import { api } from '../api'
import CoverArt from './CoverArt'
import { usePlayer } from './PlayerContext'

function CustomDropdown({ label, options, value, onChange, placeholder = 'Select' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="field" ref={dropdownRef} style={{ position: 'relative' }}>
      {label && <label>{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--bg-2)',
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: '8px',
          color: 'var(--text)',
          fontFamily: 'var(--inter)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(168, 85, 247, 0.18)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: '12px',
            height: '12px',
            color: 'var(--text-mid)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, #170d2b, #110822)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '5px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 16px rgba(168, 85, 247, 0.15)',
            zIndex: 150,
            maxHeight: '200px',
            overflowY: 'auto',
            animation: 'rise 0.18s ease both'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontFamily: 'var(--inter)',
                  color: isSelected ? '#ffffff' : 'var(--text-mid)',
                  background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'
                    e.currentTarget.style.color = 'var(--text)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-mid)'
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <span style={{ color: 'var(--accent-2)', fontSize: '12px' }}>✓</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Library({ songs = [], onRefresh, onToast, onSelectSong, selectedSong }) {
  const { play, currentSong, isPlaying } = usePlayer()

  // State
  const [filterGenre, setFilterGenre] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('none')
  const [queuedSongIds, setQueuedSongIds] = useState(new Set())

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [songToDelete, setSongToDelete] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Local metadata storage map for persistent cover & duration
  const [metaMap, setMetaMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resonance_song_metadata_cache') || '{}')
    } catch (_) {
      return {}
    }
  })

  // Merge songs with local metadata
  const safeSongs = useMemo(() => {
    const list = Array.isArray(songs) ? songs : []
    return list.map((s) => {
      const id = String(s.id)
      const meta = metaMap[id] || {}
      return {
        ...s,
        coverUrl: s.coverUrl || s.cover_url || s.cover || s.imageUrl || meta.coverUrl || null,
        durationSeconds: s.durationSeconds || s.duration || s.duration_seconds || meta.durationSeconds || 180,
        audioUrl: s.audioUrl || s.audio_url || meta.audioUrl || null
      }
    })
  }, [songs, metaMap])

  const genres = ['ALL', ...new Set(safeSongs.map((s) => s?.genre).filter(Boolean))]

  const genreOptions = genres.map((g) => ({ value: g, label: g }))
  const sortOptions = [
    { value: 'none', label: 'Default Order' },
    { value: 'asc', label: 'Title (A - Z)' },
    { value: 'desc', label: 'Title (Z - A)' },
    { value: 'duration-asc', label: 'Duration (Shortest)' },
    { value: 'duration-desc', label: 'Duration (Longest)' }
  ]

  // Fetch initial queue state
  const refreshQueueState = async () => {
    try {
      const qData = await api.getQueue()
      let qList = []
      if (Array.isArray(qData)) qList = qData
      else if (qData && Array.isArray(qData.songs)) qList = qData.songs
      else if (qData && Array.isArray(qData.queue)) qList = qData.queue

      const ids = new Set(qList.map((s) => s.id || s.songId))
      setQueuedSongIds(ids)
    } catch (_) {}
  }

  useEffect(() => {
    refreshQueueState()
  }, [])

  // Filter & Sort Pipeline
  const displayedSongs = useMemo(() => {
    let list = [...safeSongs]

    if (filterGenre !== 'ALL') {
      list = list.filter((s) => s?.genre === filterGenre)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((s) =>
        (s?.title && s.title.toLowerCase().includes(q)) ||
        (s?.artist && s.artist.toLowerCase().includes(q)) ||
        (s?.album && s.album.toLowerCase().includes(q)) ||
        (s?.genre && s.genre.toLowerCase().includes(q))
      )
    }

    if (sortOrder !== 'none') {
      list.sort((a, b) => {
        if (sortOrder === 'asc') return (a.title || '').localeCompare(b.title || '')
        if (sortOrder === 'desc') return (b.title || '').localeCompare(a.title || '')
        if (sortOrder === 'duration-asc') {
          return (a.durationSeconds || 0) - (b.durationSeconds || 0)
        }
        if (sortOrder === 'duration-desc') {
          return (b.durationSeconds || 0) - (a.durationSeconds || 0)
        }
        return 0
      })
    }

    return list
  }, [safeSongs, filterGenre, searchQuery, sortOrder])

  // Toggle Queue Action
  const handleToggleQueue = async (song, e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }

    const isCurrentlyQueued = queuedSongIds.has(song.id)

    if (isCurrentlyQueued) {
      try {
        await api.dequeue(song.id)
        setQueuedSongIds((prev) => {
          const next = new Set(prev)
          next.delete(song.id)
          return next
        })
        if (onToast) onToast(`"${song.title}" removed from Queue`, 'ok')
      } catch (err) {
        if (onToast) onToast(err.message || 'Failed to remove from queue', 'err')
      }
    } else {
      try {
        await api.enqueue(song)
        setQueuedSongIds((prev) => new Set(prev).add(song.id))
        if (onToast) onToast(`"${song.title}" added to Queue!`, 'ok')
      } catch (err) {
        if (onToast) onToast(err.message || 'Failed to add to queue', 'err')
      }
    }
  }

  // Request Delete Confirmation Modal
  const requestDelete = (song, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    setSongToDelete(song)
  }

  // Execute Deletion + Stack Push
  const confirmDeleteSong = async () => {
    if (!songToDelete) return

    setDeleteLoading(true)
    const id = songToDelete.id

    try {
      const existingTrash = JSON.parse(localStorage.getItem('resonance_trash_stack') || '[]')
      localStorage.setItem('resonance_trash_stack', JSON.stringify([...existingTrash, songToDelete]))

      try {
        await api.pushStack(songToDelete)
      } catch (err) {
        console.warn('Stack push fallback:', err)
      }

      await api.deleteSong(id)
      if (onToast) onToast(`"${songToDelete.title}" moved to Trash (Stack)`, 'ok')

      setQueuedSongIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })

      setSongToDelete(null)
      if (typeof onRefresh === 'function') await onRefresh()
    } catch (err) {
      console.error('Delete error:', err)
      if (onToast) onToast('Failed to delete song', 'err')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Add Song Form State
  const [formData, setFormData] = useState({
    id: 101,
    title: '',
    artist: '',
    album: '',
    genre: '',
    durationSeconds: '210',
    audioUrl: '',
    coverUrl: ''
  })

  const openModal = () => {
    const nextId = safeSongs.length > 0 ? Math.max(...safeSongs.map((s) => Number(s.id) || 0)) + 1 : 1
    setFormData({
      id: nextId,
      title: '',
      artist: '',
      album: '',
      genre: '',
      durationSeconds: '210',
      audioUrl: '',
      coverUrl: ''
    })
    setShowAddModal(true)
  }

  const handleAddSong = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.artist.trim()) {
      if (onToast) onToast('Title and Artist are required!', 'err')
      return
    }

    setLoading(true)
    try {
      const songId = parseInt(formData.id, 10) || Date.now() % 100000
      const durSec = parseInt(formData.durationSeconds, 10) || 180
      const cUrl = formData.coverUrl.trim() || null
      const aUrl = formData.audioUrl.trim() || null

      const updatedMeta = {
        ...metaMap,
        [String(songId)]: {
          coverUrl: cUrl,
          durationSeconds: durSec,
          audioUrl: aUrl
        }
      }
      localStorage.setItem('resonance_song_metadata_cache', JSON.stringify(updatedMeta))
      setMetaMap(updatedMeta)

      const payload = {
        id: songId,
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        album: formData.album.trim() || 'Single',
        genre: formData.genre.trim() || 'General',
        duration: durSec,
        durationSeconds: durSec,
        duration_seconds: durSec,
        audioUrl: aUrl,
        audio_url: aUrl,
        coverUrl: cUrl,
        cover_url: cUrl,
        cover: cUrl,
        imageUrl: cUrl
      }

      await api.insertSong(payload)
      if (onToast) onToast('Song added successfully!', 'ok')
      setShowAddModal(false)
      if (typeof onRefresh === 'function') await onRefresh()
    } catch (err) {
      if (onToast) onToast(err.message || 'Failed to add song', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="h-title">Music <span>Library</span></h1>
          <p className="h-sub">
            {displayedSongs.length} of {safeSongs.length} songs available
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openModal}>
          <span>+</span> Add Song
        </button>
      </div>

      {/* Toolbar Filter Panel */}
      <div className="panel lib-toolbar-panel">
        <div className="lib-toolbar-layout">
          <div className="field search-box">
            <label>Search Query</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Search by title, artist, album..."
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
                  opacity: 0.6
                }}
              >
                🔍
              </span>
            </div>
          </div>

          <div className="filter-sort-group">
            <div className="filter-box">
              <CustomDropdown
                label="FILTER GENRE"
                options={genreOptions}
                value={filterGenre}
                onChange={setFilterGenre}
              />
            </div>

            <div className="sort-box">
              <CustomDropdown
                label="SORT BY"
                options={sortOptions}
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🎵 SPOTIFY-STYLE SEAMLESS MUSIC CARD GRID */}
      {/* ========================================================= */}
      <div className="spotify-cards-grid">
        {displayedSongs.map((song) => {
          const isCurrent = currentSong?.id === song.id
          const isQueued = queuedSongIds.has(song.id)

          return (
            <div
              key={song.id}
              className={`spotify-card ${isCurrent ? 'card-playing' : ''}`}
              onClick={() => onSelectSong && onSelectSong(song)}
            >
              {/* Artwork Box */}
              <div className="spotify-art-wrapper">
                <CoverArt url={song.coverUrl} title={song.title} />

                {/* Floating Play Button that rises on card hover */}
                <button
                  type="button"
                  className={`spotify-hover-play ${isCurrent && isPlaying ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isCurrent && isPlaying) {
                      play(song)
                    } else {
                      play(song, displayedSongs)
                    }
                  }}
                  title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                >
                  <span style={{ fontSize: isCurrent && isPlaying ? '14px' : '15px', marginLeft: isCurrent && isPlaying ? '0' : '2px' }}>
                    {isCurrent && isPlaying ? '❚❚' : '▶'}
                  </span>
                </button>

                {/* Card Quick Action Corner Icons (Queue & Delete) */}
                <div className="spotify-card-overlay-actions">
                  <button
                    type="button"
                    className={`card-icon-action ${isQueued ? 'queued' : ''}`}
                    onClick={(e) => handleToggleQueue(song, e)}
                    title={isQueued ? 'In Queue' : 'Add to Queue'}
                  >
                    📑
                  </button>
                  <button
                    type="button"
                    className="card-icon-action delete"
                    onClick={(e) => requestDelete(song, e)}
                    title="Delete Track"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Title & Artist Text (Pure Spotify Style) */}
              <div className="spotify-card-info">
                <div className="spotify-card-title" title={song.title}>
                  {song.title}
                </div>
                <div className="spotify-card-artist" title={song.artist}>
                  {song.artist}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {displayedSongs.length === 0 && (
        <div className="panel empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>No songs found in your library</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {songToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 2, 10, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => !deleteLoading && setSongToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'linear-gradient(145deg, #190e30, #110822)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '16px',
              padding: '26px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
              animation: 'rise 0.22s ease-out',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(124, 58, 237, 0.35))',
                border: '1px solid var(--accent)',
                color: '#f3e8ff',
                fontSize: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
              }}
            >
              🗑️
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Move to Trash (Stack)?
            </h3>

            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--text-mid)', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong style={{ color: '#fff' }}>"{songToDelete.title}"</strong>?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setSongToDelete(null)}
                disabled={deleteLoading}
                style={{
                  justifyContent: 'center',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSong}
                disabled={deleteLoading}
                style={{
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-2), var(--accent-dim))',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(168, 85, 247, 0.45)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {deleteLoading ? 'Moving...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Song Modal */}
      {/* ========================================================= */}
      {/* 🟣 COMPACT SLEEK ADD SONG MODAL */}
      {/* ========================================================= */}
      {showAddModal && (
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
          onClick={() => !loading && setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px', /* Small and Compact */
              background: 'linear-gradient(145deg, #190e30, #110822)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
              animation: 'rise 0.22s ease-out',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🎵</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                  Add New Song
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Compact Form */}
            <form onSubmit={handleAddSong} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px' }}>Song ID *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px' }}>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanda Numba Awidin"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px' }}>Artist *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uvindu Ayshcharya"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px' }}>Album</label>
                  <input
                    type="text"
                    placeholder="e.g. Single"
                    value={formData.album}
                    onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px' }}>Genre</label>
                  <input
                    type="text"
                    placeholder="e.g. Pop"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px' }}>Duration (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 210"
                    value={formData.durationSeconds}
                    onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Audio (.mp3) URL</label>
                <input
                  type="text"
                  placeholder="/audio/1.mp3 or https://..."
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: '13px' }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', marginBottom: '4px' }}>Cover Image URL</label>
                <input
                  type="text"
                  placeholder="/image/1.jpeg or https://..."
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: '13px' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--accent-2), var(--accent-dim))',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(168, 85, 247, 0.45)'
                  }}
                >
                  {loading ? 'Saving...' : 'Save Song'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}