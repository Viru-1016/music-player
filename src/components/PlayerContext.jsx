import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

const PlayerContext = createContext(null)

const DEFAULT_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  const audioRef = useRef(new Audio())

  useEffect(() => {
    const audio = audioRef.current
    audio.volume = volume

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const onEnded = () => setIsPlaying(false)
    const onError = (e) => {
      console.warn('Audio play error / source failed:', e)
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [])

  const play = (song) => {
    if (!song) return

    const audio = audioRef.current

    // If same song is toggled
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        audio.play().then(() => setIsPlaying(true)).catch((err) => {
          console.error('Playback failed:', err)
          setIsPlaying(false)
        })
      }
      return
    }

    // New song selected
    setCurrentSong(song)
    const sourceUrl = song.audioUrl || song.audio_url || DEFAULT_AUDIO
    audio.src = sourceUrl
    audio.load()

    audio.play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch((err) => {
        console.warn('Playback error with given URL, trying fallback audio:', err)
        audio.src = DEFAULT_AUDIO
        audio.load()
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.error('Fallback failed:', e))
      })
  }

  const pause = () => {
    audioRef.current.pause()
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (!currentSong) return
    if (isPlaying) {
      pause()
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error)
    }
  }

  const seek = (time) => {
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const changeVolume = (val) => {
    const v = Math.max(0, Math.min(1, val))
    setVolume(v)
    audioRef.current.volume = v
  }

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        play,
        pause,
        togglePlay,
        seek,
        setVolume: changeVolume
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}