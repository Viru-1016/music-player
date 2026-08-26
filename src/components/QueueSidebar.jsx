import React from 'react'
import { usePlayer } from './PlayerContext'
import CoverArt from './CoverArt'
import { FiX, FiTrash2, FiPlay, FiMusic, FiLayers, FiList } from 'react-icons/fi'
import { FaPlay, FaPause } from 'react-icons/fa'

export default function QueueSidebar({ onToast }) {
  const {
    currentSong,
    isPlaying,
    play,
    togglePlay,
    queue,
    removeFromQueue,
    clearQueue,
    isQueueOpen,
    closeQueue,
    playAllQueue
  } = usePlayer()

  return (
    <>
      {/* Mobile/Overlay backdrop when Queue Sidebar is open */}
      {isQueueOpen && (
        <div
          className="queue-sidebar-backdrop"
          onClick={closeQueue}
          title="Close Queue"
        />
      )}

      {/* Slide-out Queue Sidebar (Spotify-style right drawer) */}
      <aside className={`queue-sidebar ${isQueueOpen ? 'queue-sidebar-open' : 'queue-sidebar-closed'}`}>
        {/* Header with Title and Close ✕ Button */}
        <div className="queue-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.25))',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <FiList style={{ fontSize: '18px' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
                Queue
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {queue.length} {queue.length === 1 ? 'song' : 'songs'} queued
              </span>
            </div>
          </div>

          <button
            type="button"
            className="queue-close-btn"
            onClick={closeQueue}
            title="Close Queue (✕)"
          >
            <FiX style={{ fontSize: '18px' }} />
          </button>
        </div>

        {/* Action Controls: Play All Songs & Remove All Songs */}
        <div className="queue-sidebar-actions">
          <button
            type="button"
            className="btn-queue-action play-all"
            onClick={() => {
              if (queue.length === 0) {
                if (onToast) onToast('Queue is empty! Add songs to play.', 'info')
                return
              }
              playAllQueue()
              if (onToast) onToast('Playing all queued songs!', 'ok')
            }}
            disabled={queue.length === 0}
            title="Play all songs in queue"
          >
            <FaPlay style={{ fontSize: '12px' }} /> Play All
          </button>

          <button
            type="button"
            className="btn-queue-action clear-all"
            onClick={() => {
              if (queue.length === 0) return
              clearQueue()
              if (onToast) onToast('Queue cleared', 'info')
            }}
            disabled={queue.length === 0}
            title="Clear all songs from queue"
          >
            <FiTrash2 style={{ fontSize: '14px' }} /> Remove All
          </button>
        </div>

        {/* Scrollable Queue Content Area */}
        <div className="queue-sidebar-body">
          {/* 1. Now Playing Section */}
          <div className="queue-section-block">
            <h4 className="queue-section-title">Now playing</h4>
            {currentSong ? (
              <div
                className={`queue-song-card now-playing-card ${isPlaying ? 'is-active-playing' : ''}`}
                onClick={togglePlay}
                title={isPlaying ? 'Click to Pause' : 'Click to Play'}
              >
                <div style={{ position: 'relative', width: '46px', height: '46px', flexShrink: 0 }}>
                  <CoverArt
                    url={currentSong.coverUrl}
                    title={currentSong.title}
                    style={{ width: '46px', height: '46px', borderRadius: '8px' }}
                  />
                  <div className="card-play-overlay">
                    {isPlaying ? <FaPause style={{ fontSize: '13px' }} /> : <FaPlay style={{ fontSize: '13px', marginLeft: '2px' }} />}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="queue-card-title current-title" title={currentSong.title}>
                    {currentSong.title}
                  </div>
                  <div className="queue-card-artist" title={currentSong.artist}>
                    {currentSong.artist}
                  </div>
                </div>

                {isPlaying && (
                  <div className="now-playing-wave-bars">
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                  </div>
                )}
              </div>
            ) : (
              <div className="queue-empty-subtext">No song currently playing</div>
            )}
          </div>

          {/* 2. Next from Queue Section */}
          <div className="queue-section-block" style={{ marginTop: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 className="queue-section-title" style={{ margin: 0 }}>
                Next from: Playback Queue
              </h4>
              {queue.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                  FIFO Order
                </span>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="queue-sidebar-empty">
                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.7 }}>🎵</div>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#fff', marginBottom: '4px' }}>
                  Queue is empty
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>
                  Click <strong>"+ Add to Queue"</strong> on any song in the Library to line them up here.
                </p>
              </div>
            ) : (
              <div className="queue-cards-list">
                {queue.map((song, index) => {
                  const isThisCurrent = currentSong && String(currentSong.id) === String(song.id)
                  return (
                    <div
                      key={`${song.id}-${index}`}
                      className={`queue-song-card ${isThisCurrent ? 'is-active-playing' : ''}`}
                      onClick={() => play(song)}
                      title={`Play "${song.title}"`}
                    >
                      {/* Track index */}
                      <span className="queue-track-number">
                        {index + 1}
                      </span>

                      {/* Cover Art thumbnail */}
                      <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
                        <CoverArt
                          url={song.coverUrl}
                          title={song.title}
                          style={{ width: '40px', height: '40px', borderRadius: '7px' }}
                        />
                      </div>

                      {/* Metadata */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className={`queue-card-title ${isThisCurrent ? 'current-title' : ''}`}
                          title={song.title}
                        >
                          {song.title}
                        </div>
                        <div className="queue-card-artist" title={song.artist}>
                          {song.artist}
                        </div>
                      </div>

                      {/* Individual Remove Button directly in front / right of song */}
                      <button
                        type="button"
                        className="btn-queue-remove-song"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromQueue(song.id)
                          if (onToast) onToast(`"${song.title}" removed from queue`, 'info')
                        }}
                        title="Remove from queue"
                      >
                        <FiX style={{ fontSize: '15px' }} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
