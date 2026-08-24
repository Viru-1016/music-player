import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useToast } from './Toast.jsx'
import { SongTable, ConsoleBlock } from './Shared.jsx'

export default function Queue({ connected }) {
  const [queueText, setQueueText] = useState('')
  const [loading, setLoading] = useState(false)
  const [songId, setSongId] = useState('')
  const [actionResult, setActionResult] = useState(null)
  const showToast = useToast()

  async function refreshQueue() {
    setLoading(true)
    try {
      const r = await api('/queue')
      setQueueText(r.output || '')
    } catch (e) {
      setQueueText('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (connected) refreshQueue() }, [connected])

  async function handleAddRequest() {
    if (!songId) { showToast('Enter a song ID', false); return }
    try {
      await api('/queue/' + songId, { method: 'POST' })
      showToast('Request queued for song #' + songId)
      setSongId('')
      refreshQueue()
    } catch (e) {
      showToast(e.message, false)
    }
  }

  async function handleProcess() {
    try {
      const song = await api('/queue/process', { method: 'POST' })
      if (song && song.title) {
        setActionResult([song])
        showToast('Now playing: ' + song.title)
      } else {
        setActionResult([])
      }
      refreshQueue()
    } catch (e) {
      showToast(e.message, false)
    }
  }

  return (
    <section className="view">
      <div className="header">
        <div>
          <div className="h-title">Request <span>queue</span></div>
          <div className="h-sub">FIFO queue of pending song requests</div>
        </div>
        <button className="btn btn-primary" onClick={refreshQueue}>Refresh</button>
      </div>

      <div className="panel">
        <div className="panel-title">Queue a request</div>
        <div className="row">
          <div className="field"><label>Song ID</label><input type="number" placeholder="101" value={songId} onChange={e => setSongId(e.target.value)} /></div>
          <button className="btn" onClick={handleAddRequest}>Add to queue</button>
          <button className="btn btn-primary" onClick={handleProcess}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z" /></svg>
            Process next
          </button>
        </div>
        {actionResult !== null && <div style={{ marginTop: 14 }}><SongTable songs={actionResult} /></div>}
      </div>

      <div className="panel">
        <div className="panel-title">Current queue</div>
        <ConsoleBlock text={queueText} loading={loading} />
      </div>
    </section>
  )
}
