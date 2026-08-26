import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api'
import CoverArt from './CoverArt'
import { usePlayer } from './PlayerContext'
import { useAuth } from './AuthContext'
import { FiPlus, FiCheck, FiSearch, FiZap, FiRotateCcw, FiCpu, FiLayers } from 'react-icons/fi'
import { FaPlay, FaPause } from 'react-icons/fa'
import { RiPlayList2Line } from 'react-icons/ri'

function CustomDropdown({ label, options, value, onChange, placeholder = 'Select' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="field" ref={dropdownRef} style={{ position: 'relative' }}>
      {label && <label>{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--bg-2)',
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: '8px',
          color: 'var(--text)',
          fontFamily: 'var(--inter)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(168, 85, 247, 0.18)' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: '12px',
            height: '12px',
            color: 'var(--text-mid)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, #170d2b, #110822)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '5px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 16px rgba(168, 85, 247, 0.15)',
            zIndex: 150,
            maxHeight: '200px',
            overflowY: 'auto',
            animation: 'rise 0.18s ease both'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontFamily: 'var(--inter)',
                  color: isSelected ? '#ffffff' : 'var(--text-mid)',
                  background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'
                    e.currentTarget.style.color = 'var(--text)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-mid)'
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <span style={{ color: 'var(--accent-2)', fontSize: '12px' }}>✓</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Library({ songs = [], onRefresh, onToast, onSelectSong, selectedSong, userLibraryIds = [], onToggleUserLibrary, queuedSongIds = [], onToggleQueue }) {
  const { play, currentSong, isPlaying } = usePlayer()
  const { user, isAdmin } = useAuth()

  // Filter & Search State
  const [filterGenre, setFilterGenre] = useState('ALL')
  const [filterLanguage, setFilterLanguage] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [backendSearchMeta, setBackendSearchMeta] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  // Sort State
  const [sortOrder, setSortOrder] = useState('none')
  const [backendSortList, setBackendSortList] = useState(null)
  const [backendSortMeta, setBackendSortMeta] = useState(null)
  const [isSorting, setIsSorting] = useState(false)

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [songToDelete, setSongToDelete] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 🧊 Freeze background and prevent scroll when any modal is open
  useEffect(() => {
    if (showAddModal || songToDelete) {
      document.body.classList.add('modal-active-freeze')
      document.documentElement.classList.add('modal-active-freeze')
    } else {
      document.body.classList.remove('modal-active-freeze')
      document.documentElement.classList.remove('modal-active-freeze')
    }
    return () => {
      document.body.classList.remove('modal-active-freeze')
      document.documentElement.classList.remove('modal-active-freeze')
    }
  }, [showAddModal, songToDelete])

  // Local metadata storage map for persistent cover, duration & language
  const [metaMap, setMetaMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resonance_song_metadata_cache') || '{}')
    } catch (_) {
      return {}
    }
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

  const genres = ['ALL', ...new Set(safeSongs.map((s) => s?.genre).filter(Boolean))]
  const languages = ['ALL', ...new Set(safeSongs.map((s) => s?.language).filter(Boolean))]

  const genreOptions = genres.map((g) => ({ value: g, label: g }))
  const languageOptions = languages.map((l) => ({ value: l, label: l }))

  const sortOptions = [
    { value: 'none', label: 'Default Order' },
    { value: 'quick', label: '⚡ Quick Sort (Backend DS)' },
    { value: 'merge', label: '🔀 Merge Sort (Backend DS)' },
    { value: 'bubble', label: '🫧 Bubble Sort (Backend DS)' },
    { value: 'selection', label: '🎯 Selection Sort (Backend DS)' },
    { value: 'insertion', label: '📥 Insertion Sort (Backend DS)' },
    { value: 'asc', label: 'Title (A - Z)' },
    { value: 'desc', label: 'Title (Z - A)' },
    { value: 'duration-asc', label: 'Duration (Shortest)' },
    { value: 'duration-desc', label: 'Duration (Longest)' }
  ]

  // 🧠 Intelligent Algorithm Classifier: Automatically determines optimal DS algorithm based on query
  const detectedAlgorithm = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return null

    // 1. Pure Numeric ID Query -> Route to Hash Table Search O(1)
    const numMatch = q.match(/^#?(\d+)$/)
    if (numMatch) {
      return {
        type: 'id-hash',
        name: 'Hash Table Search',
        complexity: 'O(1)',
        icon: '⚡',
        id: parseInt(numMatch[1], 10),
        label: 'Hash Table Search O(1)'
      }
    }

    const lowerQ = q.toLowerCase()

    // 2. Matches known Genre -> Route to Genre Search Engine
    const isGenre = genres.some((g) => g !== 'ALL' && g.toLowerCase() === lowerQ) ||
      ['pop', 'rock', 'hip hop', 'hip-hop', 'r&b', 'synthwave', 'classical', 'jazz', 'electronic', 'country', 'metal', 'dance'].includes(lowerQ)
    if (isGenre) {
      return {
        type: 'genre-ds',
        name: 'Genre Search Engine',
        complexity: 'Hash Set',
        icon: '🏷️',
        genre: q,
        label: 'Genre Search Engine'
      }
    }

    // 3. Matches known Artist -> Route to Artist Search Engine
    const isArtist = safeSongs.some((s) => s.artist && s.artist.toLowerCase().includes(lowerQ))
    if (isArtist) {
      return {
        type: 'artist-ds',
        name: 'Artist Search Engine',
        complexity: 'Linked Index',
        icon: '🎤',
        artist: q,
        label: 'Artist Search Engine'
      }
    }

    // 4. Song Title / Text -> Route to Binary Search Tree (BST) O(log n)
    return {
      type: 'title-bst',
      name: 'BST Tree Search',
      complexity: 'O(log n)',
      icon: '🌳',
      title: q,
      label: 'BST Tree Search O(log n)'
    }
  }, [searchQuery, genres, safeSongs])

  // Automatically execute backend DS search in background when query changes (Debounced)
  useEffect(() => {
    if (!searchQuery.trim() || !detectedAlgorithm) {
      setBackendSearchMeta(null)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        if (detectedAlgorithm.type === 'id-hash') {
          await api.searchHashId(detectedAlgorithm.id)
        } else if (detectedAlgorithm.type === 'genre-ds') {
          await api.searchGenre(detectedAlgorithm.genre)
        } else if (detectedAlgorithm.type === 'artist-ds') {
          await api.searchArtist(detectedAlgorithm.artist)
        } else if (detectedAlgorithm.type === 'title-bst') {
          await api.searchBstTitle(detectedAlgorithm.title)
        }

        setBackendSearchMeta({
          type: `${detectedAlgorithm.icon} ${detectedAlgorithm.name} (${detectedAlgorithm.complexity})`,
          query: searchQuery.trim()
        })
      } catch (err) {
        setBackendSearchMeta({
          type: `${detectedAlgorithm.icon} ${detectedAlgorithm.name} (Auto-Routed)`,
          query: searchQuery.trim()
        })
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchQuery, detectedAlgorithm])

  // Handle Sort Change (Backend DS or Client)
  const handleSortChange = async (newSort) => {
    setSortOrder(newSort)

    const backendSortTypes = {
      quick: 'Quick Sort (O(n log n))',
      merge: 'Merge Sort (O(n log n))',
      bubble: 'Bubble Sort (O(n²))',
      selection: 'Selection Sort (O(n²))',
      insertion: 'Insertion Sort (O(n²))'
    }

    if (backendSortTypes[newSort]) {
      setIsSorting(true)
      try {
        const sortedData = await api.sortBackend(newSort)
        let list = []
        if (Array.isArray(sortedData)) list = sortedData
        else if (sortedData && Array.isArray(sortedData.songs)) list = sortedData.songs

        if (list.length > 0) {
          const formattedList = list.map((s) => {
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
          setBackendSortList(formattedList)
          setBackendSortMeta(backendSortTypes[newSort])
          if (onToast) onToast(`Library sorted via ${backendSortTypes[newSort]} (Backend DS)!`, 'ok')
        } else {
          applyLocalAlgorithmSort(newSort, backendSortTypes[newSort])
        }
      } catch (err) {
        console.warn('Backend sort error, applying local algorithm:', err)
        applyLocalAlgorithmSort(newSort, backendSortTypes[newSort])
      } finally {
        setIsSorting(false)
      }
    } else {
      setBackendSortList(null)
      setBackendSortMeta(null)
    }
  }

  // Local fallback implementations of DS sorting algorithms
  const applyLocalAlgorithmSort = (algo, label) => {
    let copy = [...safeSongs]
    if (algo === 'bubble') {
      for (let i = 0; i < copy.length - 1; i++) {
        for (let j = 0; j < copy.length - i - 1; j++) {
          if ((copy[j].title || '').localeCompare(copy[j + 1].title || '') > 0) {
            const temp = copy[j]
            copy[j] = copy[j + 1]
            copy[j + 1] = temp
          }
        }
      }
    } else if (algo === 'selection') {
      for (let i = 0; i < copy.length - 1; i++) {
        let minIdx = i
        for (let j = i + 1; j < copy.length; j++) {
          if ((copy[j].title || '').localeCompare(copy[minIdx].title || '') < 0) {
            minIdx = j
          }
        }
        const temp = copy[i]
        copy[i] = copy[minIdx]
        copy[minIdx] = temp
      }
    } else if (algo === 'insertion') {
      for (let i = 1; i < copy.length; i++) {
        let key = copy[i]
        let j = i - 1
        while (j >= 0 && (copy[j].title || '').localeCompare(key.title || '') > 0) {
          copy[j + 1] = copy[j]
          j = j - 1
        }
        copy[j + 1] = key
      }
    } else {
      copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    }
    setBackendSortList(copy)
    setBackendSortMeta(label)
    if (onToast) onToast(`Library sorted via ${label}!`, 'ok')
  }

  // Reset all search & sort
  const handleResetSearch = () => {
    setSearchQuery('')
    setBackendSearchMeta(null)
    setFilterGenre('ALL')
    setFilterLanguage('ALL')
    setSortOrder('none')
    setBackendSortList(null)
    setBackendSortMeta(null)
  }

  // Filter & Sort Pipeline (Reactive & Instant)
  const displayedSongs = useMemo(() => {
    let list = backendSortList ? [...backendSortList] : [...safeSongs]

    if (filterGenre !== 'ALL') {
      list = list.filter((s) => s?.genre === filterGenre)
    }

    if (filterLanguage !== 'ALL') {
      list = list.filter((s) => s?.language === filterLanguage)
    }

    // Instant Responsive Search Filter Across All Fields + Numeric ID
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const isNumeric = /^\d+$/.test(q)

      list = list.filter((s) => {
        if (isNumeric && (String(s?.id) === q || String(s?.id).startsWith(q))) {
          return true
        }
        return (
          (s?.title && s.title.toLowerCase().includes(q)) ||
          (s?.artist && s.artist.toLowerCase().includes(q)) ||
          (s?.album && s.album.toLowerCase().includes(q)) ||
          (s?.genre && s.genre.toLowerCase().includes(q)) ||
          (s?.language && s.language.toLowerCase().includes(q)) ||
          (String(s?.id) === q)
        )
      })
    }

    // Client-side sort if chosen and not already sorted via backendSortList
    if (!backendSortList && sortOrder !== 'none') {
      list.sort((a, b) => {
        if (sortOrder === 'asc') return (a.title || '').localeCompare(b.title || '')
        if (sortOrder === 'desc') return (b.title || '').localeCompare(a.title || '')
        if (sortOrder === 'duration-asc') {
          return (a.durationSeconds || 0) - (b.durationSeconds || 0)
        }
        if (sortOrder === 'duration-desc') {
          return (b.durationSeconds || 0) - (a.durationSeconds || 0)
        }
        return 0
      })
    }

    return list
  }, [safeSongs, backendSortList, filterGenre, filterLanguage, searchQuery, sortOrder])

  // Request Delete Confirmation Modal
  const requestDelete = (song, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    setSongToDelete(song)
  }

  // Execute Deletion + Stack Push
  const confirmDeleteSong = async () => {
    if (!songToDelete) return

    setDeleteLoading(true)
    const id = songToDelete.id

    try {
      const existingTrash = JSON.parse(localStorage.getItem('resonance_trash_stack') || '[]')
      localStorage.setItem('resonance_trash_stack', JSON.stringify([...existingTrash, songToDelete]))

      try {
        await api.pushStack(songToDelete)
      } catch (err) {
        console.warn('Stack push fallback:', err)
      }

      await api.deleteSong(id)
      if (onToast) onToast(`"${songToDelete.title}" moved to Trash (Stack)`, 'ok')

      setSongToDelete(null)
      if (typeof onRefresh === 'function') await onRefresh()
    } catch (err) {
      console.error('Delete error:', err)
      if (onToast) onToast('Failed to delete song', 'err')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Add Song Form State
  const [formData, setFormData] = useState({
    id: 101,
    title: '',
    artist: '',
    album: '',
    genre: '',
    language: 'English',
    durationSeconds: '210',
    audioUrl: '',
    coverUrl: ''
  })

  const openModal = () => {
    const nextId = safeSongs.length > 0 ? Math.max(...safeSongs.map((s) => Number(s.id) || 0)) + 1 : 1
    setFormData({
      id: nextId,
      title: '',
      artist: '',
      album: '',
      genre: '',
      language: 'English',
      durationSeconds: '210',
      audioUrl: '',
      coverUrl: ''
    })
    setShowAddModal(true)
  }

  const handleAddSong = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.artist.trim()) {
      if (onToast) onToast('Title and Artist are required!', 'err')
      return
    }

    setLoading(true)
    try {
      const songId = parseInt(formData.id, 10) || Date.now() % 100000
      const durSec = parseInt(formData.durationSeconds, 10) || 180
      const cUrl = formData.coverUrl.trim() || null
      const aUrl = formData.audioUrl.trim() || null
      const songLang = formData.language.trim() || 'English'

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
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        album: formData.album.trim() || 'Single',
        genre: formData.genre.trim() || 'General',
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

      await api.insertSong(payload)
      if (onToast) onToast('Song added successfully!', 'ok')
      setShowAddModal(false)
      if (typeof onRefresh === 'function') await onRefresh()
    } catch (err) {
      if (onToast) onToast(err.message || 'Failed to add song', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="h-title">Music <span>Library</span></h1>
          <p className="h-sub">
            {displayedSongs.length} of {safeSongs.length} songs available
          </p>
        </div>

        {(isAdmin || user?.role === 'admin') && (
          <button type="button" className="btn btn-primary" onClick={openModal}>
            <FiPlus style={{ fontSize: '15px' }} /> Add Song
          </button>
        )}
      </div>

      {/* Active Backend Search / Sort Status Banner (Subtle & Informative) */}
      {(backendSearchMeta || backendSortMeta) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(59, 130, 246, 0.08))',
            border: '1px solid rgba(168, 85, 247, 0.28)',
            fontSize: '12.5px',
            color: '#fff',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {backendSearchMeta && (
              <span style={{ fontWeight: 600, color: 'var(--accent-2)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>⚡</span> Smart DS Engine: {backendSearchMeta.type} &bull; Query: "{backendSearchMeta.query}"
              </span>
            )}
            {backendSortMeta && (
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                Sorted with: {backendSortMeta}
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleResetSearch}
            style={{ padding: '4px 10px', fontSize: '11.5px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FiRotateCcw /> Reset / View All
          </button>
        </div>
      )}

      {/* Modern Unified Toolbar Filter Panel */}
      <div className="panel lib-toolbar-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Unified Intelligent Search Bar */}
          <div className="field search-box" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ margin: 0, fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em' }}>
                SEARCH MUSIC LIBRARY
              </label>
              {detectedAlgorithm && searchQuery.trim() && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--accent-2)',
                    background: 'rgba(168, 85, 247, 0.15)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>{detectedAlgorithm.icon}</span> Auto Engine: {detectedAlgorithm.label}
                </span>
              )}
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Search by song name, artist, album, genre, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '38px',
                  paddingRight: searchQuery ? '36px' : '14px',
                  width: '100%',
                  height: '44px',
                  fontSize: '14px',
                  borderRadius: '12px'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.6
                }}
              >
                <FiSearch />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setBackendSearchMeta(null)
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: 0
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Bottom Filters & Sorting Algorithms */}
          <div className="filter-sort-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', width: '100%' }}>
            <div className="filter-box">
              <CustomDropdown
                label="FILTER GENRE"
                options={genreOptions}
                value={filterGenre}
                onChange={setFilterGenre}
              />
            </div>

            <div className="filter-box">
              <CustomDropdown
                label="FILTER LANGUAGE"
                options={languageOptions}
                value={filterLanguage}
                onChange={setFilterLanguage}
              />
            </div>

            <div className="sort-box">
              <CustomDropdown
                label="SORT BY (ALGORITHMS & ORDER)"
                options={sortOptions}
                value={sortOrder}
                onChange={handleSortChange}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 🎵 SPOTIFY-STYLE SEAMLESS MUSIC CARD GRID */}
      {/* ========================================================= */}
      <div className="spotify-cards-grid">
        {displayedSongs.map((song) => {
          const isCurrent = currentSong?.id === song.id
          const isQueued = (queuedSongIds || []).some((id) => String(id) === String(song.id))
          const isSaved = Array.isArray(userLibraryIds) && userLibraryIds.some((id) => String(id) === String(song.id))

          return (
            <div
              key={song.id}
              className={`spotify-card ${isCurrent ? 'card-playing' : ''}`}
              onClick={() => onSelectSong && onSelectSong(song)}
            >
              {/* Artwork Box */}
              <div className="spotify-art-wrapper">
                <CoverArt url={song.coverUrl} title={song.title} />

                {/* Floating Play Button that rises on card hover */}
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

                {/* Card Quick Action Corner Icons (Queue & Add to Your Library) */}
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
                    className={`card-icon-action ${isSaved ? 'in-library' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onToggleUserLibrary) onToggleUserLibrary(song)
                    }}
                    title={isSaved ? 'Remove from Your Library' : 'Add to Your Library'}
                  >
                    {isSaved ? <FiCheck style={{ fontSize: '13px' }} /> : <FiPlus style={{ fontSize: '13px' }} />}
                  </button>
                </div>
              </div>

              {/* Title & Artist Text (Pure Spotify Style) */}
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

      {displayedSongs.length === 0 && (
        <div className="panel empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px', marginBottom: '16px' }}>No songs found matching your search or filters</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleResetSearch}
            style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiRotateCcw /> Reset Search & View All
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {songToDelete && createPortal(
        <div
          className="modal-backdrop-animate"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            className="modal-animate-pop"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'linear-gradient(145deg, #190e30, #110822)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '16px',
              padding: '26px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
              animation: 'rise 0.22s ease-out',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(124, 58, 237, 0.35))',
                border: '1px solid var(--accent)',
                color: '#f3e8ff',
                fontSize: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
              }}
            >
              🗑️
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              Move to Trash (Stack)?
            </h3>

            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--text-mid)', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong style={{ color: '#fff' }}>"{songToDelete.title}"</strong>?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setSongToDelete(null)}
                disabled={deleteLoading}
                style={{
                  justifyContent: 'center',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSong}
                disabled={deleteLoading}
                style={{
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-2), var(--accent-dim))',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(168, 85, 247, 0.45)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {deleteLoading ? 'Moving...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Song Modal */}
      {/* ========================================================= */}
      {/* 🟣 COMPACT SLEEK ADD SONG MODAL */}
      {/* ========================================================= */}
      {showAddModal && createPortal(
        <div
          className="modal-backdrop-animate"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            className="modal-animate-pop"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
              background: 'linear-gradient(145deg, #190e30, #110822)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(168, 85, 247, 0.25)',
              animation: 'rise 0.22s ease-out',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🎵</span>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                  Add New Song
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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

            {/* Balanced Compact Form */}
            <form onSubmit={handleAddSong} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Song ID *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanda Numba Awidin"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    placeholder="e.g. Uvindu Ayshcharya"
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Album</label>
                  <input
                    type="text"
                    placeholder="e.g. Single"
                    value={formData.album}
                    onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Genre</label>
                  <input
                    type="text"
                    placeholder="e.g. Pop"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Language</label>
                  <input
                    type="text"
                    placeholder="e.g. Sinhala"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
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
                    placeholder="e.g. 210"
                    value={formData.durationSeconds}
                    onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
                    style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Audio (.mp3) URL</label>
                <input
                  type="text"
                  placeholder="/audio/1.mp3 or https://..."
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Cover Image URL</label>
                <input
                  type="text"
                  placeholder="/image/1.jpeg or https://..."
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  style={{ padding: '8px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  {loading ? 'Saving...' : 'Save Song'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}