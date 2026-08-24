import React, { useState, useRef, useEffect } from 'react'
import { usePlayer } from './PlayerContext'
import CoverArt from './CoverArt'

export default function NowPlayingBar() {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    currentTime, 
    duration, 
    seek, 
    volume, 
    setVolume 
  } = usePlayer()

  const [showMobileVolume, setShowMobileVolume] = useState(false)
  const volumeRef = useRef(null)

  const formatTime = (sec) => {
    const s = parseInt(sec, 10) || 0
    if (!s) return '0:00'
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}:${rem.toString().padStart(2, '0')}`
  }

  // Click outside to close mobile volume popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target)) {
        setShowMobileVolume(false)
      }
    }
    if (showMobileVolume) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMobileVolume])

  return (
    <div className="now-playing">
      {/* Left: Track Info (Desktop only) */}
      <div className="np-track">
        <div className={`cover ${!currentSong ? 'cover-empty' : isPlaying ? 'cover-playing' : ''}`}>
          {currentSong ? (
            <CoverArt url={currentSong.coverUrl} title={currentSong.title} />
          ) : (
            <span style={{ fontSize: '18px' }}>🎵</span>
          )}
        </div>
        <div className="np-meta">
          <div className={`np-title ${!currentSong ? 'dim' : ''}`}>
            {currentSong ? currentSong.title : 'Nothing playing'}
          </div>
          <div className="np-artist">
            {currentSong ? `${currentSong.artist} • ${currentSong.genre || 'Music'}` : 'Pick a song from library'}
          </div>
        </div>
      </div>

      {/* Center: Controls & Seek Timeline */}
      <div className="np-center">
        <div className="np-controls">
          <button
            type="button"
            className="np-btn"
            onClick={() => seek(Math.max(0, currentTime - 5))}
            disabled={!currentSong}
            title="Rewind 5s"
          >
            ⏮
          </button>

          <button
            type="button"
            className="np-btn np-play"
            onClick={togglePlay}
            disabled={!currentSong}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>

          <button
            type="button"
            className="np-btn"
            onClick={() => seek(Math.min(duration, currentTime + 5))}
            disabled={!currentSong}
            title="Forward 5s"
          >
            ⏭
          </button>
        </div>

        <div className="np-seek">
          <span className="np-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="np-range"
            min={0}
            max={duration || 100}
            value={currentTime || 0}
            onChange={(e) => seek(parseFloat(e.target.value))}
            disabled={!currentSong}
          />
          <span className="np-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume Controls (With Mobile Popover) */}
      <div className="np-volume" ref={volumeRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="np-btn"
          onClick={() => setShowMobileVolume((prev) => !prev)}
          title="Volume"
        >
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>

        {/* Desktop inline slider */}
        <input
          type="range"
          className="np-range np-vol-range desktop-vol"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />

        {/* Mobile Volume Popover */}
        {showMobileVolume && (
          <div className="mobile-vol-popover">
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(volume * 100)}%
            </span>
            <input
              type="range"
              className="np-range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}