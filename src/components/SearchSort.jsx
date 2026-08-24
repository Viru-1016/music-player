import { useState } from 'react'
import { api } from '../api.js'
import { useToast } from './Toast.jsx'
import { SongTable, EmptyState, ConsoleBlock } from './Shared.jsx'

const MODES = [
  { id: 'title', label: 'By title (linear)' },
  { id: 'id', label: 'By ID (linear)' },
  { id: 'hash', label: 'By ID (hash)' },
  { id: 'bst', label: 'By title (BST)' },
  { id: 'artist', label: 'By artist' },
  { id: 'genre', label: 'By genre' }
]
const LABELS = { title: 'Title', id: 'Song ID', hash: 'Song ID', bst: 'Title', artist: 'Artist', genre: 'Genre' }

export default function SearchSort() {
  const [mode, setMode] = useState('title')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [textResult, setTextResult] = useState(null)
  const [searching, setSearching] = useState(false)

  const [sortType, setSortType] = useState('bubble')
  const [sorted, setSorted] = useState(null)
  const [sorting, setSorting] = useState(false)
  const showToast = useToast()

  async function handleSearch() {
    if (!query.trim()) { showToast('Enter a value to search for', false); return }
    setSearching(true)
    setResult(null)
    setTextResult(null)
    try {
      if (mode === 'title') setResult([await api('/songs/search/title?title=' + encodeURIComponent(query))])
      else if (mode === 'id') setResult([await api('/songs/search/id/' + encodeURIComponent(query))])
      else if (mode === 'hash') setResult([await api('/songs/search/hash/' + encodeURIComponent(query))])
      else if (mode === 'bst') setResult([await api('/songs/search/bst?title=' + encodeURIComponent(query))])
      else if (mode === 'artist') setTextResult((await api('/songs/search/artist?artist=' + encodeURIComponent(query))).output)
      else if (mode === 'genre') setTextResult((await api('/songs/search/genre?genre=' + encodeURIComponent(query))).output)
    } catch (e) {
      setResult(undefined)
      showToast(e.message, false)
    } finally {
      setSearching(false)
    }
  }

  async function handleSort() {
    setSorting(true)
    try {
      setSorted(await api('/songs/sort/' + sortType))
    } catch (e) {
      showToast(e.message, false)
    } finally {
      setSorting(false)
    }
  }

  return (
    <section className="view">
      <div className="header">
        <div>
          <div className="h-title">Search <span>&amp; sort</span></div>
          <div className="h-sub">Linear search, hash search, BST search, and five sort algorithms</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Find a song</div>
        <div className="tabs">
          {MODES.map(m => (
            <div key={m.id} className={'tab' + (mode === m.id ? ' active' : '')}
                 onClick={() => { setMode(m.id); setResult(null); setTextResult(null) }}>
              {m.label}
            </div>
          ))}
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label>{LABELS[mode]}</label>
            <input
              type={mode === 'id' || mode === 'hash' ? 'number' : 'text'}
              placeholder={mode === 'id' || mode === 'hash' ? 'e.g. 101' : 'Type here…'}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
        <div style={{ marginTop: 16 }}>
          {searching && <EmptyState>Searching…</EmptyState>}
          {!searching && result === undefined && <EmptyState>Not found.</EmptyState>}
          {!searching && result && <SongTable songs={result} />}
          {!searching && textResult !== null && <ConsoleBlock text={textResult} />}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Sort library</div>
        <div className="row">
          <div className="field">
            <label>Algorithm</label>
            <select value={sortType} onChange={e => setSortType(e.target.value)}>
              <option value="bubble">Bubble sort</option>
              <option value="selection">Selection sort</option>
              <option value="insertion">Insertion sort</option>
              <option value="merge">Merge sort</option>
              <option value="quick">Quick sort</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSort}>Sort</button>
        </div>
        <div style={{ marginTop: 16 }}>
          {sorting && <EmptyState>Sorting…</EmptyState>}
          {!sorting && sorted && <SongTable songs={sorted} />}
        </div>
      </div>
    </section>
  )
}
