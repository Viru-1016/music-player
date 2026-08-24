import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

const PlayerContext = createContext()

export function PlayerProvider({ children }) {
  const [playlist, setPlaylist] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  const audioRef = useRef(new Audio())

  // Update audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    audio.volume = volume

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const handleEnded = () => handleNext() // Auto play next when song ends
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
  }, [playlist, currentSong])

  // Set the global playlist (called from App when songs are fetched)
  const updatePlaylist = (songsList) => {
    if (Array.isArray(songsList)) {
      setPlaylist(songsList)
    }
  }

  // Play a specific track
  const play = (song, customList = null) => {
    if (!song) return
    const listToUse = customList || playlist
    if (customList) setPlaylist(customList)

    const audio = audioRef.current

    if (currentSong?.id === song.id) {
      if (audio.paused) {
        audio.play().catch(console.error)
      }
      return
    }

    setCurrentSong(song)
    if (song.audioUrl) {
      audio.src = song.audioUrl
      audio.play().catch(console.error)
    }
  }

  // Next Track Action
  const handleNext = () => {
    if (!playlist || playlist.length === 0) return
    const currentIndex = playlist.findIndex((s) => Number(s.id) === Number(currentSong?.id))
    
    let nextIndex = 0
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      nextIndex = currentIndex + 1
    } else {
      nextIndex = 0 // Loop back to first song
    }

    play(playlist[nextIndex])
  }

  // Previous Track Action
  const handlePrev = () => {
    if (!playlist || playlist.length === 0) return
    const currentIndex = playlist.findIndex((s) => Number(s.id) === Number(currentSong?.id))

    // If played more than 3 seconds, replay current song first
    if (audioRef.current.currentTime > 3) {
      seek(0)
      audioRef.current.play().catch(console.error)
      return
    }

    let prevIndex = playlist.length - 1
    if (currentIndex > 0) {
      prevIndex = currentIndex - 1
    }

    play(playlist[prevIndex])
  }

  // Toggle Play / Pause
  const togglePlay = () => {
    const audio = audioRef.current
    if (!currentSong) {
      if (playlist.length > 0) play(playlist[0])
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  return useContext(PlayerContext)
}