import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useToast } from './Toast.jsx'
import { ConsoleBlock } from './Shared.jsx'

export default function Graph({ connected }) {
  const [graphText, setGraphText] = useState('')
  const [graphLoading, setGraphLoading] = useState(true)
  const [bfsText, setBfsText] = useState(null)
  const [dfsText, setDfsText] = useState(null)
  const [bfsLoading, setBfsLoading] = useState(false)
  const [dfsLoading, setDfsLoading] = useState(false)
  const showToast = useToast()

  async function refreshGraph() {
    setGraphLoading(true)
    try {
      const r = await api('/graph')
      setGraphText(r.output || '')
    } catch (e) {
      setGraphText('Error: ' + e.message)
    } finally {
      setGraphLoading(false)
    }
  }

  useEffect(() => { if (connected) refreshGraph() }, [connected])

  async function handleBuild() {
    try {
      await api('/graph/build', { method: 'POST' })
      showToast('Graph rebuilt from current songs')
      refreshGraph()
    } catch (e) {
      showToast(e.message, false)
    }
  }

  async function runBfs() {
    setBfsLoading(true)
    try {
      const r = await api('/graph/bfs')
      setBfsText(r.output || '')
    } catch (e) {
      setBfsText('Error: ' + e.message)
    } finally {
      setBfsLoading(false)
    }
  }

  async function runDfs() {
    setDfsLoading(true)
    try {
      const r = await api('/graph/dfs')
      setDfsText(r.output || '')
    } catch (e) {
      setDfsText('Error: ' + e.message)
    } finally {
      setDfsLoading(false)
    }
  }

  return (
    <section className="view">
      <div className="header">
        <div>
          <div className="h-title">Genre <span>graph</span></div>
          <div className="h-sub">Songs linked by shared genre — traverse with BFS or DFS</div>
        </div>
        <button className="btn btn-primary" onClick={handleBuild}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.85-3.36L23 10M1 14l4.65 4.36A9 9 0 0020.5 15" />
          </svg>
          Rebuild graph
        </button>
      </div>

      <div className="panel">
        <div className="panel-title">Graph structure</div>
        <ConsoleBlock text={graphText} loading={graphLoading} />
      </div>

      <div className="row" style={{ marginBottom: 6 }}>
        <button className="btn" onClick={runBfs}>Run BFS</button>
        <button className="btn" onClick={runDfs}>Run DFS</button>
      </div>

      <div className="panel">
        <div className="panel-title">Breadth-first traversal</div>
        <ConsoleBlock text={bfsText ?? ''} loading={bfsLoading} />
      </div>
      <div className="panel">
        <div className="panel-title">Depth-first traversal</div>
        <ConsoleBlock text={dfsText ?? ''} loading={dfsLoading} />
      </div>
    </section>
  )
}
