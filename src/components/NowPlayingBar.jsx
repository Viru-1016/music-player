import React, { useState, useRef, useEffect } from 'react'
import { usePlayer } from './PlayerContext'
import CoverArt from './CoverArt'
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from 'react-icons/fa'
import { FiVolumeX, FiVolume1, FiVolume2 } from 'react-icons/fi'
import { RiPlayList2Line } from 'react-icons/ri'

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
    queue,
    isQueueOpen,
    toggleQueueSidebar
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
          <CoverArt
            url={currentSong?.coverUrl || currentSong?.cover_url || currentSong?.cover || currentSong?.imageUrl}
            title={currentSong?.title}
          />
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
            <FaStepBackward style={{ fontSize: '13px' }} />
          </button>

          <button
            type="button"
            className="btn-np-play"
            onClick={togglePlay}
            disabled={!currentSong}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <FaPause style={{ fontSize: '14px' }} />
            ) : (
              <FaPlay style={{ fontSize: '14px', marginLeft: '2px' }} />
            )}
          </button>

          <button type="button" className="btn-np-ctrl" onClick={next} title="Next">
            <FaStepForward style={{ fontSize: '13px' }} />
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

      {/* Right: Queue Toggle & Volume Controller */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={toggleQueueSidebar}
          className={`vol-btn-trigger ${isQueueOpen ? 'active-queue' : ''}`}
          title={isQueueOpen ? 'Close Queue' : 'Open Playback Queue'}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            color: isQueueOpen ? '#c084fc' : 'var(--text-mid)',
            background: isQueueOpen ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            borderRadius: '8px',
            border: isQueueOpen ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          <RiPlayList2Line style={{ fontSize: '18px' }} />
          {queue.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '1px 5px',
                minWidth: '14px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.6)'
              }}
            >
              {queue.length}
            </span>
          )}
        </button>

        <div className="np-volume" ref={volPopupRef}>
        <button
          type="button"
          onClick={() => setShowMobileVolume((prev) => !prev)}
          className="vol-btn-trigger"
          title="Volume"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {volume === 0 ? <FiVolumeX /> : volume < 0.5 ? <FiVolume1 /> : <FiVolume2 />}
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
  </div>
  )
}