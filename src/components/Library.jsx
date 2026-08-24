import React, { useState, useEffect, useMemo, useRef } from 'react'
import { api } from '../api'
import CoverArt from './CoverArt'
import { usePlayer } from './PlayerContext'

// Custom Sleek Dropdown Component
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
          padding: '9px 14px',
          background: 'var(--bg-2)',
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: '9px',
          color: 'var(--text)',
          fontFamily: 'var(--inter)',
          fontSize: '13.5px',
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
            width: '13px',
            height: '13px',
            color: 'var(--text-mid)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '8px'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, #170d2b, #110822)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '6px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 16px rgba(168, 85, 247, 0.15)',
            zIndex: 150,
            maxHeight: '220px',
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
                  padding: '9px 12px',
                  borderRadius: '7px',
                  fontSize: '13px',
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

  const safeSongs = Array.isArray(songs) ? songs : []
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

  // Balanced Search & Sort Filter Pipeline
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
          const durA = a.durationSeconds || a.duration || 0
          const durB = b.durationSeconds || b.duration || 0
          return durA - durB
        }
        if (sortOrder === 'duration-desc') {
          const durA = a.durationSeconds || a.duration || 0
          const durB = b.durationSeconds || b.duration || 0
          return durB - durA
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

  // Open Custom Delete Confirmation Modal
  const requestDelete = (song, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    setSongToDelete(song)
  }

  // Execute Actual Deletion + Stack Push
  const confirmDeleteSong = async () => {
    if (!songToDelete) return

    setDeleteLoading(true)
    const id = songToDelete.id

    try {
      // 1. Save to Local Trash Backup
      const existingTrash = JSON.parse(localStorage.getItem('resonance_trash_stack') || '[]')
      localStorage.setItem('resonance_trash_stack', JSON.stringify([...existingTrash, songToDelete]))

      // 2. Push to Backend Stack (Undo capability)
      try {
        await api.pushStack(songToDelete)
      } catch (err) {
        console.warn('Stack push fallback:', err)
      }

      // 3. Delete from Backend API
      await api.deleteSong(id)
      if (onToast) onToast(`"${songToDelete.title}" moved to Trash (Stack)`, 'ok')

      // 4. Update local queue cache
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

  // Add Song State & Handlers
  const [formData, setFormData] = useState({
    id: 101,
    title: '',
    artist: '',
    album: '',
    genre: '',
    durationSeconds: '200',
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
      durationSeconds: '200',
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
      const payload = {
        id: parseInt(formData.id, 10) || Date.now() % 100000,
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        album: formData.album.trim() || 'Single',
        genre: formData.genre.trim() || 'General',
        durationSeconds: parseInt(formData.durationSeconds, 10) || 180,
        audioUrl: formData.audioUrl.trim() || null,
        coverUrl: formData.coverUrl.trim() || null
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

  const formatDuration = (sec) => {
    const s = parseInt(sec, 10) || 0
    if (!s) return '0:00'
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}:${rem.toString().padStart(2, '0')}`
  }

  return (
    <div>
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

      {/* Toolbar Panel */}
      <div className="panel lib-toolbar-panel">
        <div className="lib-toolbar-layout">
          {/* Search Box */}
          <div className="field search-box">
            <label>Search Query</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Search by title, artist, album"
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

          {/* Filter Genre & Sort Dropdowns */}
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

      {/* Main Table Panel */}
      <div className="panel">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '48px' }}></th>
                <th>Track Title</th>
                <th>Artist</th>
                <th>Genre</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right', minWidth: '110px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedSongs.map((song) => {
                const isCurrent = currentSong?.id === song.id
                const isQueued = queuedSongIds.has(song.id)
                const songDuration = song.durationSeconds || song.duration || 0

                return (
                  <tr
                    key={song.id}
                    className={isCurrent ? 'row-playing' : ''}
                    onClick={() => onSelectSong && onSelectSong(song)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="cell-play">
                      <div className="row-cover">
                        <div className={`cover ${isCurrent && isPlaying ? 'cover-playing' : ''}`}>
                          <CoverArt url={song.coverUrl} title={song.title} />
                        </div>
                        <button
                          type="button"
                          className="play-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            play(song)
                          }}
                          title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                        >
                          {isCurrent && isPlaying ? '❚❚' : '▶'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="song-title-cell" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{song.title}</span>
                        {isQueued && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              background: 'rgba(168,85,247,0.2)',
                              color: 'var(--accent-2)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)'
                            }}
                          >
                            Queued
                          </span>
                        )}
                      </div>
                      <div className="song-id-cell">ID #{song.id}</div>
                    </td>
                    <td style={{ color: 'var(--text-mid)' }}>{song.artist}</td>
                    <td>
                      <span className="genre-pill">{song.genre || 'General'}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
                      {formatDuration(songDuration)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={(e) => handleToggleQueue(song, e)}
                          title={isQueued ? 'Remove from Queue' : 'Add to Queue'}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: isQueued ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.08)',
                            borderColor: isQueued ? 'var(--accent)' : 'var(--border)',
                            color: isQueued ? '#fff' : 'var(--text-mid)',
                            boxShadow: isQueued ? '0 0 10px rgba(168,85,247,0.35)' : 'none'
                          }}
                        >
                          {isQueued ? '✓ 📑' : '+ 📑'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={(e) => requestDelete(song, e)}
                          title="Delete Track"
                          style={{ padding: '4px 8px' }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {displayedSongs.length === 0 && (
            <div className="empty">
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
              <p>No matching songs found</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🟣 GLOWING PURPLE DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
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
            {/* Purple Glowing Warning Icon Badge */}
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
              Are you sure you want to remove{' '}
              <strong style={{ color: '#fff' }}>"{songToDelete.title}"</strong>?
              <br />
              <span style={{ fontSize: '12px', color: 'var(--accent-2)' }}>
                You can undo and restore it anytime from Data Structures.
              </span>
            </p>

            {/* Purple Styled Song Preview Card */}
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '22px',
                textAlign: 'left'
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                <CoverArt url={songToDelete.coverUrl} title={songToDelete.title} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {songToDelete.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {songToDelete.artist} • ID #{songToDelete.id}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 2, 8, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px'
          }}
        >
          <div className="panel" style={{ width: '100%', maxWidth: '460px', margin: 0, padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div className="panel-title" style={{ fontSize: '17px', margin: 0 }}>
                <span>🎵</span> Add New Song
              </div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSong} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="grid">
                <div className="field">
                  <label>Song ID *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starboy"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid">
                <div className="field">
                  <label>Artist *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Weeknd"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Album</label>
                  <input
                    type="text"
                    placeholder="e.g. Starboy"
                    value={formData.album}
                    onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid">
                <div className="field">
                  <label>Genre</label>
                  <input
                    type="text"
                    placeholder="e.g. Synthwave"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Duration (Sec)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationSeconds}
                    onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Audio (.mp3) URL</label>
                <input
                  type="text"
                  placeholder="/audio/1.mp3 or https://..."
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Cover Image URL</label>
                <input
                  type="text"
                  placeholder="/covers/1.jpg or https://..."
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
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