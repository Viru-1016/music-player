import React, { useState, useRef, useEffect } from 'react'
import { usePlayer } from './PlayerContext'
import CoverArt from './CoverArt'

export default function NowPlayingBar() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    next,
    prev,
    seek,
    changeVolume,
  } = usePlayer()

  const [showMobileVolume, setShowMobileVolume] = useState(false)
  const volPopupRef = useRef(null)

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  const volumePercent = Math.min(100, Math.max(0, volume * 100))

  const formatTime = (sec) => {
    const s = Math.floor(sec || 0)
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}:${rem.toString().padStart(2, '0')}`
  }

  // Outside click to close mobile volume popup
  useEffect(() => {
    const handleOutside = (e) => {
      if (volPopupRef.current && !volPopupRef.current.contains(e.target)) {
        setShowMobileVolume(false)
      }
    }
    if (showMobileVolume) {
      document.addEventListener('mousedown', handleOutside)
      document.addEventListener('touchstart', handleOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [showMobileVolume])

  return (
    <div className="now-playing">
      {/* Left: Track Info */}
      <div className="np-track">
        <div className="cover" style={{ width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
          <CoverArt url={currentSong?.coverUrl} title={currentSong?.title} />
        </div>
        <div className="np-info">
          <div className="np-title">{currentSong ? currentSong.title : 'Nothing playing'}</div>
          <div className="np-artist">
            {currentSong ? `${currentSong.artist}` : 'Pick a song'}
          </div>
        </div>
      </div>

      {/* Center: Glowing Modern Controls & Timeline */}
      <div className="np-center">
        <div className="np-controls">
          <button type="button" className="btn-np-ctrl" onClick={prev} title="Previous">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          <button
            type="button"
            className="btn-np-play"
            onClick={togglePlay}
            disabled={!currentSong}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginLeft: '2px' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button type="button" className="btn-np-ctrl" onClick={next} title="Next">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Dynamic Timeline Slider */}
        <div className="np-seek">
          <span className="np-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime || 0}
            onChange={(e) => seek(Number(e.target.value))}
            className="purple-slider"
            style={{
              background: `linear-gradient(to right, #a855f7 0%, #c084fc ${progressPercent}%, rgba(255, 255, 255, 0.12) ${progressPercent}%, rgba(255, 255, 255, 0.12) 100%)`
            }}
          />
          <span className="np-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume Controller with Mobile Popover */}
      <div className="np-volume" ref={volPopupRef}>
        <button
          type="button"
          onClick={() => setShowMobileVolume((prev) => !prev)}
          className="vol-btn-trigger"
          title="Volume"
        >
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>

        {/* Desktop inline & Mobile popup wrapper */}
        <div className={`volume-slider-box ${showMobileVolume ? 'mobile-visible' : ''}`}>
          <span className="vol-percent-label">{Math.round(volumePercent)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="purple-slider"
            style={{
              width: '100%',
              background: `linear-gradient(to right, #a855f7 0%, #c084fc ${volumePercent}%, rgba(255, 255, 255, 0.12) ${volumePercent}%, rgba(255, 255, 255, 0.12) 100%)`
            }}
          />
        </div>
      </div>
    </div>
  )
}