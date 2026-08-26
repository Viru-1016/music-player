import React, { useState, useMemo } from 'react'
import { api } from '../api'
import CoverArt from './CoverArt'

export default function EditSongs({ songs = [], onRefresh, onToast }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSong, setEditingSong] = useState(null)
  const [loading, setLoading] = useState(false)

  // Local metadata storage map for persistent cover, duration & language
  const [metaMap, setMetaMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resonance_song_metadata_cache') || '{}')
    } catch (_) {
      return {}
    }
  })

  // Edit Form State inside Popup Modal
  const [editFormData, setEditFormData] = useState({
    id: '',
    title: '',
    artist: '',
    album: '',
    genre: '',
    language: '',
    durationSeconds: '180',
    audioUrl: '',
    coverUrl: ''
  })

  // Merge songs with local metadata
  const safeSongs = useMemo(() => {
    const list = Array.isArray(songs) ? songs : []
    return list.map((s) => {
      const id = String(s.id)
      const meta = metaMap[id] || {}
      return {
        ...s,
        language: s.language || s.lang || meta.language || 'English',
        coverUrl: s.coverUrl || s.cover_url || s.cover || s.imageUrl || meta.coverUrl || null,
        durationSeconds: s.durationSeconds || s.duration || s.duration_seconds || meta.durationSeconds || 180,
        audioUrl: s.audioUrl || s.audio_url || meta.audioUrl || null
      }
    })
  }, [songs, metaMap])

  // Filtered Songs by Search Query
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return safeSongs
    const q = searchQuery.toLowerCase().trim()
    return safeSongs.filter((s) =>
      (s?.title && s.title.toLowerCase().includes(q)) ||
      (s?.artist && s.artist.toLowerCase().includes(q)) ||
      (s?.album && s.album.toLowerCase().includes(q)) ||
      (s?.genre && s.genre.toLowerCase().includes(q)) ||
      (s?.language && s.language.toLowerCase().includes(q)) ||
      (s?.id && String(s.id).includes(q))
    )
  }, [safeSongs, searchQuery])

  // Open Edit Popup Modal
  const handleOpenEditModal = (song) => {
    setEditingSong(song)
    setEditFormData({
      id: song.id,
      title: song.title || '',
      artist: song.artist || '',
      album: song.album || '',
      genre: song.genre || '',
      language: song.language || 'English',
      durationSeconds: String(song.durationSeconds || 180),
      audioUrl: song.audioUrl || '',
      coverUrl: song.coverUrl || ''
    })
  }

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editFormData.title.trim() || !editFormData.artist.trim()) {
      if (onToast) onToast('Title and Artist are required!', 'err')
      return
    }

    setLoading(true)
    try {
      const songId = parseInt(editFormData.id, 10)
      const durSec = parseInt(editFormData.durationSeconds, 10) || 180
      const cUrl = editFormData.coverUrl.trim() || null
      const aUrl = editFormData.audioUrl.trim() || null
      const songLang = editFormData.language.trim() || 'English'

      // Update local storage metadata cache
      const updatedMeta = {
        ...metaMap,
        [String(songId)]: {
          coverUrl: cUrl,
          durationSeconds: durSec,
          audioUrl: aUrl,
          language: songLang
        }
      }
      localStorage.setItem('resonance_song_metadata_cache', JSON.stringify(updatedMeta))
      setMetaMap(updatedMeta)

      const payload = {
        id: songId,
        title: editFormData.title.trim(),
        artist: editFormData.artist.trim(),
        album: editFormData.album.trim() || 'Single',
        genre: editFormData.genre.trim() || 'General',
        language: songLang,
        lang: songLang,
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

      await api.updateSong(songId, payload)
      if (onToast) onToast(`"${payload.title}" updated successfully!`, 'ok')
      
      setEditingSong(null)
      if (typeof onRefresh === 'function') await onRefresh()
    } catch (err) {
      console.error('Update song error:', err)
      if (onToast) onToast(err.message || 'Failed to update song', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="h-title">Song <span>Editor</span></h1>
          <p className="h-sub">
            Edit details, metadata, artwork, audio URLs, and languages for {safeSongs.length} songs
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="panel lib-toolbar-panel" style={{ marginBottom: '20px' }}>
        <div className="field search-box" style={{ margin: 0, width: '100%' }}>
          <label>Search Song to Edit</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search by ID, title, artist, genre, language..."
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
      </div>

      {/* Song List Table */}
      <div className="panel" style={{ padding: '16px', overflowX: 'auto' }}>
        {filteredSongs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
            No songs found matching "{searchQuery}"
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-mid)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '10px' }}># ID</th>
                <th style={{ padding: '10px' }}>Cover</th>
                <th style={{ padding: '10px' }}>Title & Artist</th>
                <th style={{ padding: '10px' }}>Album</th>
                <th style={{ padding: '10px' }}>Genre</th>
                <th style={{ padding: '10px' }}>Language</th>
                <th style={{ padding: '10px' }}>Duration</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSongs.map((song) => (
                <tr
                  key={song.id}
                  style={{
                    borderBottom: '1px solid rgba(168, 120, 255, 0.08)',
                    transition: 'background 0.15s ease'
                  }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                    #{song.id}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <CoverArt url={song.coverUrl} title={song.title} />
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{song.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>{song.artist}</div>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-mid)' }}>{song.album || 'Single'}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(168, 85, 247, 0.12)',
                      color: 'var(--accent-2)',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {song.genre || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(52, 211, 153, 0.12)',
                      color: '#34d399',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      🌐 {song.language || 'English'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                    {Math.floor(song.durationSeconds / 60)}:{(song.durationSeconds % 60).toString().padStart(2, '0')}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenEditModal(song)}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🟣 EDIT SONG POPUP MODAL */}
      {editingSong && (
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
          onClick={() => !loading && setEditingSong(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              boxSizing: 'border-box',
              background: 'linear-gradient(145deg, #190e30, #110822)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
              animation: 'rise 0.22s ease-out',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>✏️</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                  Edit Song #{editingSong.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSong(null)}
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

            {/* Balanced Edit Form */}
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Song ID</label>
                  <input
                    type="number"
                    disabled
                    value={editFormData.id}
                    style={{ padding: '8px 10px', fontSize: '13px', opacity: 0.6, cursor: 'not-allowed', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Title *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Artist *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.artist}
                    onChange={(e) => setEditFormData({ ...editFormData, artist: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Album</label>
                  <input
                    type="text"
                    value={editFormData.album}
                    onChange={(e) => setEditFormData({ ...editFormData, album: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Genre</label>
                  <input
                    type="text"
                    value={editFormData.genre}
                    onChange={(e) => setEditFormData({ ...editFormData, genre: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Language</label>
                  <input
                    type="text"
                    placeholder="e.g. Sinhala"
                    value={editFormData.language}
                    onChange={(e) => setEditFormData({ ...editFormData, language: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Duration (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.durationSeconds}
                    onChange={(e) => setEditFormData({ ...editFormData, durationSeconds: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Audio (.mp3) URL</label>
                <input
                  type="text"
                  placeholder="/audio/1.mp3 or https://..."
                  value={editFormData.audioUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, audioUrl: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Cover Image URL</label>
                <input
                  type="text"
                  placeholder="/image/1.jpeg or https://..."
                  value={editFormData.coverUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, coverUrl: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
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
                  className="btn-modal-submit"
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--accent-2), var(--accent-dim))',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(168, 85, 247, 0.45)'
                  }}
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
