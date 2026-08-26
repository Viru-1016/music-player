import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { api } from '../api'

const PlayerContext = createContext()

export function PlayerProvider({ children }) {
  const [playlist, setPlaylist] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  // 🎵 Playback Queue State (Priority FIFO)
  const [queue, setQueue] = useState([])
  const [queuedSongIds, setQueuedSongIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resonance_playback_queue') || '[]')
    } catch (_) {
      return []
    }
  })

  // 🗂️ Right-side Queue Drawer / Sidebar visibility
  const [isQueueOpen, setIsQueueOpen] = useState(false)

  const audioRef = useRef(new Audio())
  const playlistRef = useRef([])
  const queueRef = useRef([])
  const queuePlayIndexRef = useRef(0) // Tracks current progress through the queue without deleting songs
  const currentSongRef = useRef(null)
  const lastBaseSongRef = useRef(null) // Tracks the anchor song in the library playlist

  // Synchronize refs with state to prevent stale closures in event listeners
  useEffect(() => {
    playlistRef.current = playlist
  }, [playlist])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    currentSongRef.current = currentSong
  }, [currentSong])

  // Sync queue with localStorage and update ID array
  const syncQueueStorage = (newQueue) => {
    const ids = newQueue.map((s) => String(s.id))
    setQueuedSongIds(ids)
    localStorage.setItem('resonance_playback_queue', JSON.stringify(ids))
  }

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current
    audio.volume = volume

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const handleEnded = () => handleNext()
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [])

  // Populate or update the global playlist from backend songs
  const updatePlaylist = (songsList) => {
    if (Array.isArray(songsList) && songsList.length > 0) {
      let metaMap = {}
      try {
        metaMap = JSON.parse(localStorage.getItem('resonance_song_metadata_cache') || '{}')
      } catch (_) {}

      const formattedList = songsList.map((s) => {
        const id = String(s.id)
        const meta = metaMap[id] || {}
        return {
          ...s,
          coverUrl: s.coverUrl || s.cover_url || s.cover || s.imageUrl || meta.coverUrl || null,
          audioUrl: s.audioUrl || s.audio_url || meta.audioUrl || null,
          durationSeconds: s.durationSeconds || s.duration || s.duration_seconds || meta.durationSeconds || 180
        }
      })

      setPlaylist(formattedList)
      playlistRef.current = formattedList

      // Build queue from stored IDs
      try {
        const storedIds = JSON.parse(localStorage.getItem('resonance_playback_queue') || '[]')
        if (Array.isArray(storedIds) && storedIds.length > 0) {
          const songMap = new Map(formattedList.map((s) => [String(s.id), s]))
          const rebuiltQueue = storedIds
            .map((id) => songMap.get(String(id)))
            .filter(Boolean)
          setQueue(rebuiltQueue)
          queueRef.current = rebuiltQueue
        }
      } catch (_) {}

      if (!currentSongRef.current) {
        const firstSong = formattedList[0]
        setCurrentSong(firstSong)
        currentSongRef.current = firstSong
        lastBaseSongRef.current = firstSong
        if (firstSong.audioUrl && audioRef.current) {
          audioRef.current.src = firstSong.audioUrl
        }
      }
    }
  }

  // Play a specific track
  const play = (song, customList = null) => {
    if (!song) return
    if (customList && Array.isArray(customList)) {
      setPlaylist(customList)
      playlistRef.current = customList
    }

    const audio = audioRef.current

    if (currentSongRef.current?.id === song.id) {
      if (audio.paused) {
        audio.play().catch(console.error)
      }
      return
    }

    // Check if this song is in the queue
    const qIndex = queueRef.current.findIndex((s) => String(s.id) === String(song.id))
    if (qIndex !== -1) {
      // Do NOT delete from queue! Just advance index to the song after this one
      queuePlayIndexRef.current = qIndex + 1
    } else {
      // It was selected from the library or playlist, track as base anchor
      lastBaseSongRef.current = song
      queuePlayIndexRef.current = 0
    }

    setCurrentSong(song)
    currentSongRef.current = song

    if (song.audioUrl) {
      audio.src = song.audioUrl
      audio.play().catch(console.error)
    }
  }

  // ⏭️ Next Track Action: Priority FIFO Queue -> Fallback to Playlist
  const handleNext = () => {
    // 1. HIGHEST PRIORITY: If there are queued songs waiting to play
    if (
      queueRef.current &&
      queueRef.current.length > 0 &&
      queuePlayIndexRef.current < queueRef.current.length
    ) {
      const nextQueuedSong = queueRef.current[queuePlayIndexRef.current]
      queuePlayIndexRef.current += 1
      play(nextQueuedSong)
      return
    }

    // 2. SECOND PRIORITY: If queue is done or empty, continue with regular playlist
    const currentPl = playlistRef.current
    if (!currentPl || currentPl.length === 0) return

    const anchorSong = lastBaseSongRef.current || currentSongRef.current
    const currentIndex = currentPl.findIndex((s) => String(s.id) === String(anchorSong?.id))

    let nextIndex = 0
    if (currentIndex !== -1 && currentIndex < currentPl.length - 1) {
      nextIndex = currentIndex + 1
    } else {
      nextIndex = 0
    }

    const nextSong = currentPl[nextIndex]
    lastBaseSongRef.current = nextSong
    play(nextSong)
  }

  // ⏮️ Previous Track Action
  const handlePrev = () => {
    const currentPl = playlistRef.current
    if (!currentPl || currentPl.length === 0) return

    if (audioRef.current.currentTime > 3) {
      seek(0)
      audioRef.current.play().catch(console.error)
      return
    }

    const anchorSong = lastBaseSongRef.current || currentSongRef.current
    const currentIndex = currentPl.findIndex((s) => String(s.id) === String(anchorSong?.id))

    let prevIndex = currentPl.length - 1
    if (currentIndex > 0) {
      prevIndex = currentIndex - 1
    }

    const prevSong = currentPl[prevIndex]
    lastBaseSongRef.current = prevSong
    play(prevSong)
  }

  // ➕ Add to Queue (Instant live update even during audio playback)
  const addToQueue = (song) => {
    if (!song || song.id === undefined) return
    const songIdStr = String(song.id)
    setIsQueueOpen(true) // 🚀 Auto-slide open Queue drawer on add
    if (queueRef.current.some((s) => String(s.id) === songIdStr)) return

    let metaMap = {}
    try {
      metaMap = JSON.parse(localStorage.getItem('resonance_song_metadata_cache') || '{}')
    } catch (_) {}

    const meta = metaMap[songIdStr] || {}
    const formatted = {
      ...song,
      coverUrl: song.coverUrl || song.cover_url || song.cover || song.imageUrl || meta.coverUrl || null,
      audioUrl: song.audioUrl || song.audio_url || meta.audioUrl || null,
      durationSeconds: song.durationSeconds || song.duration || song.duration_seconds || meta.durationSeconds || 180
    }

    const updatedQueue = [...queueRef.current, formatted]
    setQueue(updatedQueue)
    queueRef.current = updatedQueue
    syncQueueStorage(updatedQueue)

    try {
      api.enqueue(formatted).catch(() => {})
    } catch (_) {}
  }

  // ▶️ Play All Queue
  const playAllQueue = () => {
    if (queueRef.current.length === 0) return
    queuePlayIndexRef.current = 0
    play(queueRef.current[0])
  }

  // ➖ Remove from Queue
  const removeFromQueue = (songId) => {
    const songIdStr = String(songId)
    const removedIdx = queueRef.current.findIndex((s) => String(s.id) === songIdStr)
    const updatedQueue = queueRef.current.filter((s) => String(s.id) !== songIdStr)
    setQueue(updatedQueue)
    queueRef.current = updatedQueue
    if (removedIdx !== -1 && removedIdx < queuePlayIndexRef.current) {
      queuePlayIndexRef.current = Math.max(0, queuePlayIndexRef.current - 1)
    }
    syncQueueStorage(updatedQueue)

    try {
      api.dequeue(songId).catch(() => {})
    } catch (_) {}
  }

  // 🔀 Toggle Queue Status
  const toggleQueue = (song) => {
    if (!song || song.id === undefined) return false
    const songIdStr = String(song.id)
    const isQueued = queueRef.current.some((s) => String(s.id) === songIdStr)
    if (isQueued) {
      removeFromQueue(song.id)
      return false
    } else {
      addToQueue(song)
      return true
    }
  }

  // 🗑️ Clear Entire Queue
  const clearQueue = () => {
    setQueue([])
    queueRef.current = []
    queuePlayIndexRef.current = 0
    syncQueueStorage([])
    try {
      api.dequeue().catch(() => {})
    } catch (_) {}
  }

  // 🔄 Set Queued IDs manually (from Queue manager or backend sync)
  const setQueuedIds = (ids) => {
    const stringIds = (ids || []).map(String)
    setQueuedSongIds(stringIds)
    localStorage.setItem('resonance_playback_queue', JSON.stringify(stringIds))

    const songMap = new Map((playlistRef.current || []).map((s) => [String(s.id), s]))
    const newQueue = stringIds
      .map((id) => songMap.get(id))
      .filter(Boolean)
    setQueue(newQueue)
    queueRef.current = newQueue
  }

  // Toggle Play / Pause
  const togglePlay = () => {
    const audio = audioRef.current
    if (!currentSong) {
      if (queueRef.current.length > 0) play(queueRef.current[0])
      else if (playlist.length > 0) play(playlist[0])
      return
    }

    if (audio.paused) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }

  const pause = () => {
    audioRef.current.pause()
  }

  const resume = () => {
    const audio = audioRef.current
    if (audio.src) {
      audio.play().catch(console.error)
    }
  }

  const seek = (time) => {
    const audio = audioRef.current
    audio.currentTime = time
    setCurrentTime(time)
  }

  const changeVolume = (newVol) => {
    const vol = Math.max(0, Math.min(1, newVol))
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }

  return (
    <PlayerContext.Provider
      value={{
        playlist,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        play,
        pause,
        resume,
        togglePlay,
        seek,
        changeVolume,
        next: handleNext,
        prev: handlePrev,
        updatePlaylist,
        queue,
        queuedSongIds,
        addToQueue,
        removeFromQueue,
        toggleQueue,
        clearQueue,
        setQueuedIds,
        isQueueOpen,
        setIsQueueOpen,
        openQueue: () => setIsQueueOpen(true),
        closeQueue: () => setIsQueueOpen(false),
        toggleQueueSidebar: () => setIsQueueOpen((prev) => !prev),
        playAllQueue
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  return useContext(PlayerContext)
}