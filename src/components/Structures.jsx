import React, { useState, useEffect } from 'react'
import { api } from '../api'
import CoverArt from './CoverArt'

export default function Structures({ songs = [], onToast, onRefresh }) {
  const [activeTab, setActiveTab] = useState('stack')
  const [stackData, setStackData] = useState([])
  const [linkedListData, setLinkedListData] = useState([])
  const [hashTableData, setHashTableData] = useState({})
  const [setData, setSetData] = useState([])
  const [searchKey, setSearchKey] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Format Duration Helper
  const formatDuration = (sec) => {
    const s = parseInt(sec, 10) || 0
    if (!s) return '0:00'
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}:${rem.toString().padStart(2, '0')}`
  }

  // Fetch all structure data with LocalStorage Fallback for Stack
  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Stack (Deleted Items History)
      try {
        const sRes = await api.getStackHistory()
        const list = Array.isArray(sRes) ? sRes : (sRes?.stack || [])
        if (list.length > 0) {
          setStackData(list)
        } else {
          const localTrash = JSON.parse(localStorage.getItem('resonance_trash_stack') || '[]')
          setStackData(localTrash)
        }
      } catch (_) {
        const localTrash = JSON.parse(localStorage.getItem('resonance_trash_stack') || '[]')
        setStackData(localTrash)
      }

      // 2. Linked List
      try {
        const lRes = await api.getLinkedList()
        setLinkedListData(Array.isArray(lRes) ? lRes : (lRes?.list || []))
      } catch (_) {
        setLinkedListData([])
      }

      // 3. Hash Table
      try {
        const hRes = await api.getHashTable()
        setHashTableData(hRes && typeof hRes === 'object' ? hRes : {})
      } catch (_) {
        setHashTableData({})
      }

      // 4. Set (Unique Genres)
      try {
        const setRes = await api.getSet()
        setSetData(Array.isArray(setRes) ? setRes : (setRes?.set || []))
      } catch (_) {
        setSetData([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Restore Specific Track from Trash Table
  const handleRestoreSpecific = async (songToRestore, index) => {
    try {
      // 1. Remove from local trash
      const localTrash = JSON.parse(localStorage.getItem('resonance_trash_stack') || '[]')
      const updatedTrash = localTrash.filter((_, i) => i !== index)
      localStorage.setItem('resonance_trash_stack', JSON.stringify(updatedTrash))
      setStackData(updatedTrash)

      // 2. Backend Stack pop sync
      try { 
        await api.popStack() 
      } catch (_) {}

      // 3. Insert back to Library
      await api.insertSong(songToRestore)
      
      // 4. Trigger Real-time Global Refresh
      if (typeof onRefresh === 'function') {
        await onRefresh()
      }
      
      if (onToast) onToast(`Restored "${songToRestore.title}" back to Library!`, 'ok')
    } catch (err) {
      console.error('Restore error:', err)
      if (onToast) onToast('Failed to restore track', 'err')
    }
    fetchData()
  }

  // Restore Top Track (LIFO Undo)
  const handleUndoDelete = async () => {
    let itemToRestore = null
    const localTrash = JSON.parse(localStorage.getItem('resonance_trash_stack') || '[]')

    if (localTrash.length > 0) {
      itemToRestore = localTrash.pop()
      localStorage.setItem('resonance_trash_stack', JSON.stringify(localTrash))
      setStackData(localTrash)
    }

    try {
      const popped = await api.popStack()
      if (!itemToRestore && popped && typeof popped === 'object') {
        itemToRestore = popped
      }
    } catch (_) {}

    if (itemToRestore) {
      try {
        await api.insertSong(itemToRestore)
        
        // Trigger Real-time Global Refresh
        if (typeof onRefresh === 'function') {
          await onRefresh()
        }
        
        if (onToast) onToast(`Restored "${itemToRestore.title}" back to Library!`, 'ok')
      } catch (err) {
        if (onToast) onToast('Failed to insert restored song back', 'err')
      }
    } else {
      if (onToast) onToast('No deleted songs in Trash to restore', 'err')
    }

    fetchData()
  }

  // Instant Key Search (Hash Table Lookup)
  const handleHashLookup = async () => {
    if (!searchKey.trim()) return
    try {
      const res = await api.getHashTableKey(searchKey.trim())
      setSearchResult(res)
    } catch (err) {
      setSearchResult({ error: 'Item not found in cache' })
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="header">
        <div>
          <h1 className="h-title">Smart <span>Engine & Tools</span></h1>
          <p className="h-sub">Interactive features powered by High-Performance Data Structures</p>
        </div>

        <button type="button" className="btn" onClick={fetchData} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '22px' }}>
        <button
          type="button"
          className={`tab ${activeTab === 'stack' ? 'active' : ''}`}
          onClick={() => setActiveTab('stack')}
        >
          🗑️ Trash & Undo <span className="genre-pill" style={{ fontSize: '10px', marginLeft: '4px' }}>Stack</span>
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'linkedlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('linkedlist')}
        >
          📑 Smart Track Flow <span className="genre-pill" style={{ fontSize: '10px', marginLeft: '4px' }}>Linked List</span>
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'hashtable' ? 'active' : ''}`}
          onClick={() => setActiveTab('hashtable')}
        >
          ⚡ Instant Track Cache <span className="genre-pill" style={{ fontSize: '10px', marginLeft: '4px' }}>Hash Map</span>
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'set' ? 'active' : ''}`}
          onClick={() => setActiveTab('set')}
        >
          🏷️ Music Categories <span className="genre-pill" style={{ fontSize: '10px', marginLeft: '4px' }}>Set</span>
        </button>
      </div>

      {/* 1. TRASH & UNDO (STACK AS TABLE) */}
      {activeTab === 'stack' && (
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="panel-title" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🗑️</span> Deleted Items History (Undo Management)
              </div>
              <p className="panel-desc" style={{ margin: 0 }}>Songs you delete are held in LIFO order. You can restore tracks back to the library at any time.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUndoDelete}
              disabled={stackData.length === 0}
              style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}
            >
              ↶ Restore Last Deleted Song
            </button>
          </div>

          {/* Clean Table Layout matching Library */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '540px' }}>
              <thead>
                <tr>
                  <th style={{ width: '48px' }}></th>
                  <th>TRACK TITLE</th>
                  <th>ARTIST</th>
                  <th>GENRE</th>
                  <th>DURATION</th>
                  <th style={{ textAlign: 'right', minWidth: '130px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {[...stackData].reverse().map((song, rIdx) => {
                  const originalIdx = stackData.length - 1 - rIdx
                  const isTop = rIdx === 0
                  const songDuration = song.durationSeconds || song.duration || 0

                  return (
                    <tr
                      key={song.id || rIdx}
                      style={{
                        background: isTop ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <td className="cell-play">
                        <div className="row-cover">
                          <div className="cover" style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden' }}>
                            <CoverArt url={song.coverUrl} title={song.title} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="song-title-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{song.title || `Track #${song.id}`}</span>
                          {isTop && (
                            <span style={{
                              fontSize: '9.5px',
                              background: 'var(--accent)',
                              color: '#fff',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}>
                              TOP
                            </span>
                          )}
                        </div>
                        <div className="song-id-cell">ID #{song.id}</div>
                      </td>
                      <td style={{ color: 'var(--text-mid)' }}>{song.artist || 'Unknown'}</td>
                      <td>
                        <span className="genre-pill">{song.genre || 'General'}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
                        {formatDuration(songDuration)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleRestoreSpecific(song, originalIdx)}
                          title="Restore this song back to Library"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: 'rgba(168, 85, 247, 0.18)',
                            borderColor: 'var(--accent)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>↶</span> Restore
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {stackData.length === 0 && (
              <div className="empty" style={{ padding: '36px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗑️</div>
                <p>Trash is empty. Songs you delete from the library will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SMART TRACK FLOW (LINKED LIST) */}
      {activeTab === 'linkedlist' && (
        <div className="panel">
          <div className="panel-title">📑 Dynamic Play Sequence (Chain of Tracks)</div>
          <p className="panel-desc">Seamless track linkage allowing real-time insertion and deletion without audio gaps.</p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflowX: 'auto',
            padding: '24px 10px',
            WebkitOverflowScrolling: 'touch'
          }}>
            {linkedListData.map((node, index) => (
              <React.Fragment key={node.id || index}>
                <div style={{
                  minWidth: '160px',
                  maxWidth: '190px',
                  padding: '14px',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--accent-2)', fontFamily: 'var(--mono)' }}>STEP {index + 1}</div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {node.title || `Song #${node.id}`}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{node.artist || 'Unknown Artist'}</div>
                </div>

                {index < linkedListData.length - 1 && (
                  <div style={{ fontSize: '20px', color: 'var(--accent)', flexShrink: 0, fontWeight: 700 }}>
                    ➔
                  </div>
                )}
              </React.Fragment>
            ))}

            {linkedListData.length === 0 && (
              <div className="empty" style={{ width: '100%' }}>
                <p>Track sequence is currently empty.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. INSTANT CACHE & FINDER (HASH MAP) */}
      {activeTab === 'hashtable' && (
        <div className="panel">
          <div className="panel-title">⚡ Instant Track Index & Cache Lookup</div>
          <p className="panel-desc">Direct O(1) memory index for ultra-fast instant track retrieval by ID or Key.</p>

          <div style={{ display: 'flex', gap: '10px', maxWidth: '420px', margin: '16px 0 20px' }}>
            <input
              type="text"
              placeholder="Enter Song ID or Key to lookup..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleHashLookup()}
            />
            <button type="button" className="btn btn-primary" onClick={handleHashLookup}>
              Lookup
            </button>
          </div>

          {searchResult && (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid var(--accent)',
              borderRadius: '10px',
              marginBottom: '20px',
              maxWidth: '420px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-2)', fontWeight: 600 }}>LOOKUP RESULT</div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                {searchResult.title ? `${searchResult.title} - ${searchResult.artist}` : JSON.stringify(searchResult)}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {Object.entries(hashTableData).map(([key, val], idx) => (
              <div key={idx} style={{
                padding: '12px 14px',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '10px', color: 'var(--accent-2)', fontFamily: 'var(--mono)' }}>KEY / ID: #{key}</div>
                <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>
                  {typeof val === 'object' ? (val?.title || JSON.stringify(val)) : String(val)}
                </div>
              </div>
            ))}

            {Object.keys(hashTableData).length === 0 && (
              <div className="empty" style={{ gridColumn: '1 / -1' }}>
                <p>No keys indexed in Hash Table yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. GENRE CATEGORIES (SET) */}
      {activeTab === 'set' && (
        <div className="panel">
          <div className="panel-title">🏷️ Distinct Music Genres</div>
          <p className="panel-desc">Automatically filters duplicate genres to maintain clean music categories.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
            {setData.map((genre, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 18px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.25))',
                  border: '1px solid var(--accent)',
                  color: '#fff',
                  fontFamily: 'var(--inter)',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <span>🎵</span>
                <span>{genre}</span>
              </div>
            ))}

            {setData.length === 0 && (
              <div className="empty" style={{ width: '100%' }}>
                <p>No unique genres currently detected.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}