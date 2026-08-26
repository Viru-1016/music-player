import React, { useState, useMemo, useEffect } from 'react'
import CoverArt from './CoverArt'
import { usePlayer } from './PlayerContext'
import { api } from '../api'
import { FiCheck, FiSearch, FiBookmark } from 'react-icons/fi'
import { FaPlay, FaPause } from 'react-icons/fa'
import { RiPlayList2Line } from 'react-icons/ri'

export default function YourLibrary({ songs = [], userLibraryIds = [], onToggleUserLibrary, queuedSongIds = [], onToggleQueue, onToast, onSelectSong }) {
  const { play, currentSong, isPlaying } = usePlayer()
  const [searchQuery, setSearchQuery] = useState('')

  // Local metadata storage cache fallback
  const [metaMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resonance_song_metadata_cache') || '{}')
    } catch (_) {
      return {}
    }
  })

  // Filter songs that belong to user library
  const savedSongs = useMemo(() => {
    const savedSet = new Set((userLibraryIds || []).map((id) => String(id)))
    const list = Array.isArray(songs) ? songs : []

    return list
      .filter((s) => savedSet.has(String(s.id)))
      .map((s) => {
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
  }, [songs, userLibraryIds, metaMap])

  // Filter by search query
  const displayedSongs = useMemo(() => {
    if (!searchQuery.trim()) return savedSongs
    const q = searchQuery.toLowerCase().trim()
    return savedSongs.filter(
      (s) =>
        (s?.title && s.title.toLowerCase().includes(q)) ||
        (s?.artist && s.artist.toLowerCase().includes(q)) ||
        (s?.album && s.album.toLowerCase().includes(q)) ||
        (s?.genre && s.genre.toLowerCase().includes(q))
    )
  }, [savedSongs, searchQuery])

  // Fetch initial queue state
  const refreshQueueState = async () => {
    try {
      const qData = await api.getQueue()
      let qList = []
      if (Array.isArray(qData)) qList = qData
      else if (qData && Array.isArray(qData.songs)) qList = qData.songs
      else if (qData && Array.isArray(qData.queue)) qList = qData.queue

      if (qList.length > 0) {
        setQueuedSongIds((prev) => {
          const merged = new Set([...Array.from(prev), ...qList.map((s) => String(s.id || s.songId))])
          localStorage.setItem('resonance_playback_queue', JSON.stringify(Array.from(merged)))
          return merged
        })
      }
    } catch (_) {}
  }

  useEffect(() => {
    refreshQueueState()
  }, [])

  // Toggle Queue Action
  const handleToggleQueue = async (song, e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }

    const songIdStr = String(song.id)
    const isCurrentlyQueued = Array.from(queuedSongIds).some((id) => String(id) === songIdStr)

    if (isCurrentlyQueued) {
      setQueuedSongIds((prev) => {
        const next = new Set(Array.from(prev).filter((id) => String(id) !== songIdStr))
        localStorage.setItem('resonance_playback_queue', JSON.stringify(Array.from(next)))
        return next
      })
      if (onToast) onToast(`"${song.title}" removed from Queue`, 'info')
      try {
        await api.dequeue(song.id)
      } catch (_) {}
    } else {
      setQueuedSongIds((prev) => {
        const next = new Set([...Array.from(prev), songIdStr])
        localStorage.setItem('resonance_playback_queue', JSON.stringify(Array.from(next)))
        return next
      })
      if (onToast) onToast(`"${song.title}" added to Queue!`, 'ok')
      try {
        await api.enqueue(song)
      } catch (_) {}
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="h-title">
            Your <span>Library</span>
          </h1>
          <p className="h-sub">
            {savedSongs.length} {savedSongs.length === 1 ? 'song' : 'songs'} saved in your personal collection
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      {savedSongs.length > 0 && (
        <div className="panel lib-toolbar-panel" style={{ marginBottom: '24px' }}>
          <div className="field search-box" style={{ maxWidth: '400px' }}>
            <label>Search Saved Songs</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Search your library..."
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
      )}

      {/* Cards Grid */}
      <div className="spotify-cards-grid">
        {displayedSongs.map((song) => {
          const isCurrent = currentSong?.id === song.id
          const isQueued = (queuedSongIds || []).some((id) => String(id) === String(song.id))

          return (
            <div
              key={song.id}
              className={`spotify-card ${isCurrent ? 'card-playing' : ''}`}
              onClick={() => onSelectSong && onSelectSong(song)}
            >
              {/* Artwork Box */}
              <div className="spotify-art-wrapper">
                <CoverArt url={song.coverUrl} title={song.title} />

                {/* Play Button */}
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
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isCurrent && isPlaying ? <FaPause style={{ fontSize: '13px' }} /> : <FaPlay style={{ fontSize: '13px', marginLeft: '2px' }} />}
                  </span>
                </button>

                {/* Overlay Action Icons */}
                <div className="spotify-card-overlay-actions">
                  <button
                    type="button"
                    className={`card-icon-action ${isQueued ? 'queued' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onToggleQueue) onToggleQueue(song)
                    }}
                    title={isQueued ? 'In Queue (Click to remove)' : 'Add to Queue'}
                  >
                    <RiPlayList2Line style={{ fontSize: '12px' }} />
                  </button>
                  <button
                    type="button"
                    className="card-icon-action in-library"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onToggleUserLibrary) onToggleUserLibrary(song)
                    }}
                    title="Remove from Your Library"
                  >
                    <FiCheck style={{ fontSize: '13px' }} />
                  </button>
                </div>
              </div>

              {/* Title & Artist */}
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

      {/* Empty State */}
      {savedSongs.length === 0 && (
        <div className="panel empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
            <FiBookmark style={{ color: 'var(--accent)' }} />
          </div>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Your Library is Empty
          </h3>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            Browse through the <strong>Music Library</strong> and click the <strong>"+"</strong> button on any song card to save your favorite songs here!
          </p>
        </div>
      )}
    </div>
  )
}
