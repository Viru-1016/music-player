import React, { useEffect, useState, useMemo } from 'react'
import { api } from '../api.js'
import CoverArt from './CoverArt.jsx'
import { usePlayer } from './PlayerContext.jsx'
import { FiList, FiPlus, FiTrash2, FiPlay, FiPause } from 'react-icons/fi'
import { FaPlay, FaPause } from 'react-icons/fa'
import { RiPlayList2Line } from 'react-icons/ri'

export default function Queue({ songs = [], queuedSongIds = [], onToggleQueue, setQueuedSongIds, onToast }) {
  const { play, currentSong, isPlaying } = usePlayer()
  const [songIdInput, setSongIdInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Local metadata storage map
  const [metaMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resonance_song_metadata_cache') || '{}')
    } catch (_) {
      return {}
    }
  })

  // Get full song objects for queued IDs
  const queuedSongs = useMemo(() => {
    const songMap = new Map((songs || []).map((s) => [String(s.id), s]))
    return queuedSongIds
      .map((id) => {
        const found = songMap.get(String(id))
        if (found) {
          const meta = metaMap[String(found.id)] || {}
          return {
            ...found,
            coverUrl: found.coverUrl || found.cover_url || meta.coverUrl || null,
            durationSeconds: found.durationSeconds || found.duration || meta.durationSeconds || 180
          }
        }
        return null
      })
      .filter(Boolean)
  }, [queuedSongIds, songs, metaMap])

  const refreshQueue = async () => {
    setLoading(true)
    try {
      const qData = await api.getQueue()
      let qList = []
      if (Array.isArray(qData)) qList = qData
      else if (qData && Array.isArray(qData.songs)) qList = qData.songs
      else if (qData && Array.isArray(qData.queue)) qList = qData.queue

      if (qList.length > 0) {
        const ids = qList.map((s) => String(s.id || s.songId))
        setQueuedSongIds(ids)
        localStorage.setItem('resonance_playback_queue', JSON.stringify(ids))
      }
    } catch (_) {
      // Keep local queue state on API disconnect
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshQueue()
  }, [])

  const handleAddById = async (e) => {
    e.preventDefault()
    if (!songIdInput.trim()) return

    const targetSong = songs.find((s) => String(s.id) === String(songIdInput.trim()))
    const songIdStr = String(songIdInput.trim())

    if (!targetSong) {
      if (onToast) onToast(`Song #${songIdInput} not found in library`, 'err')
      return
    }

    if (queuedSongIds.includes(songIdStr)) {
      if (onToast) onToast(`Song "${targetSong.title}" is already in Queue`, 'info')
      return
    }

    const nextQueue = [...queuedSongIds, songIdStr]
    setQueuedSongIds(nextQueue)
    localStorage.setItem('resonance_playback_queue', JSON.stringify(nextQueue))
    if (onToast) onToast(`"${targetSong.title}" added to Queue!`, 'ok')
    setSongIdInput('')

    try {
      await api.enqueue(targetSong)
    } catch (_) {}
  }

  const handleRemoveFromQueue = async (id, title) => {
    const songIdStr = String(id)
    const nextQueue = queuedSongIds.filter((qId) => String(qId) !== songIdStr)
    setQueuedSongIds(nextQueue)
    localStorage.setItem('resonance_playback_queue', JSON.stringify(nextQueue))
    if (onToast) onToast(`"${title || 'Song'}" removed from Queue`, 'info')

    try {
      await api.dequeue(id)
    } catch (_) {}
  }

  const handleClearQueue = () => {
    setQueuedSongIds([])
    localStorage.setItem('resonance_playback_queue', JSON.stringify([]))
    if (onToast) onToast('Playback Queue cleared', 'info')
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="h-title">
            Playback <span>Queue</span>
          </h1>
          <p className="h-sub">{queuedSongs.length} {queuedSongs.length === 1 ? 'song' : 'songs'} waiting in line</p>
        </div>

        {queuedSongs.length > 0 && (
          <button type="button" className="btn" onClick={handleClearQueue}>
            <FiTrash2 style={{ marginRight: '6px' }} /> Clear Queue
          </button>
        )}
      </div>

      {/* Manual Add Panel */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RiPlayList2Line style={{ color: 'var(--accent)' }} /> Add Song to Queue by ID
        </div>
        <form onSubmit={handleAddById} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
          <div className="field" style={{ flex: 1, maxWidth: '280px', marginBottom: 0 }}>
            <input
              type="number"
              placeholder="e.g. 101"
              value={songIdInput}
              onChange={(e) => setSongIdInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <FiPlus style={{ marginRight: '4px' }} /> Add to Queue
          </button>
        </form>
      </div>

      {/* Queue Cards Grid */}
      {queuedSongs.length > 0 ? (
        <div className="spotify-cards-grid">
          {queuedSongs.map((song) => {
            const isCurrent = currentSong?.id === song.id

            return (
              <div
                key={song.id}
                className={`spotify-card ${isCurrent ? 'card-playing' : ''}`}
                onClick={() => play(song, queuedSongs)}
              >
                <div className="spotify-art-wrapper">
                  <CoverArt url={song.coverUrl} title={song.title} />

                  <button
                    type="button"
                    className={`spotify-hover-play ${isCurrent && isPlaying ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isCurrent && isPlaying) play(song)
                      else play(song, queuedSongs)
                    }}
                    title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isCurrent && isPlaying ? <FaPause style={{ fontSize: '13px' }} /> : <FaPlay style={{ fontSize: '13px', marginLeft: '2px' }} />}
                    </span>
                  </button>

                  <div className="spotify-card-overlay-actions">
                    <button
                      type="button"
                      className="card-icon-action delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFromQueue(song.id, song.title)
                      }}
                      title="Remove from Queue"
                    >
                      <FiTrash2 style={{ fontSize: '12px' }} />
                    </button>
                  </div>
                </div>

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
      ) : (
        <div className="panel empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
            <RiPlayList2Line style={{ color: 'var(--accent)' }} />
          </div>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Playback Queue is Empty
          </h3>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            Hover over any song card in the <strong>Music Library</strong> and click the list icon to queue songs here!
          </p>
        </div>
      )}
    </div>
  )
}
