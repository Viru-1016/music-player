import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useToast } from './Toast.jsx'
import { SongTable, ConsoleBlock } from './Shared.jsx'

export default function Trees({ connected }) {
  const [bstTitle, setBstTitle] = useState('')
  const [bstResult, setBstResult] = useState(null)
  const [bstOrder, setBstOrder] = useState('inorder')
  const [bstText, setBstText] = useState('')
  const [bstLoading, setBstLoading] = useState(true)

  const [avlRating, setAvlRating] = useState('')
  const [avlResult, setAvlResult] = useState(null)
  const [avlOrder, setAvlOrder] = useState('inorder')
  const [avlText, setAvlText] = useState('')
  const [avlLoading, setAvlLoading] = useState(true)

  const showToast = useToast()

  async function runBstOrder(order) {
    setBstOrder(order)
    setBstLoading(true)
    try {
      const r = await api('/bst/' + order)
      setBstText(r.output || '')
    } catch (e) {
      setBstText('Error: ' + e.message)
    } finally {
      setBstLoading(false)
    }
  }

  async function runAvlOrder(order) {
    setAvlOrder(order)
    setAvlLoading(true)
    try {
      const r = await api('/avl/' + order)
      setAvlText(r.output || '')
    } catch (e) {
      setAvlText('Error: ' + e.message)
    } finally {
      setAvlLoading(false)
    }
  }

  useEffect(() => { if (connected) { runBstOrder('inorder'); runAvlOrder('inorder') } }, [connected])

  async function handleBstSearch() {
    if (!bstTitle.trim()) { showToast('Enter a title', false); return }
    try {
      setBstResult([await api('/bst/search?title=' + encodeURIComponent(bstTitle))])
    } catch (e) {
      setBstResult(undefined)
      showToast(e.message, false)
    }
  }

  async function handleAvlSearch() {
    if (avlRating === '') { showToast('Enter a rating', false); return }
    try {
      setAvlResult([await api('/avl/search?rating=' + encodeURIComponent(avlRating))])
    } catch (e) {
      setAvlResult(undefined)
      showToast(e.message, false)
    }
  }

  async function handleAvlDelete() {
    if (avlRating === '') { showToast('Enter a rating to delete', false); return }
    try {
      await api('/avl?rating=' + encodeURIComponent(avlRating), { method: 'DELETE' })
      showToast('Deleted rating ' + avlRating + ' from AVL tree')
      runAvlOrder(avlOrder)
    } catch (e) {
      showToast(e.message, false)
    }
  }

  return (
    <section className="view">
      <div className="header">
        <div>
          <div className="h-title">Trees <span>&amp; balancing</span></div>
          <div className="h-sub">Binary search tree by title, AVL tree by rating</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Binary search tree (by title)</div>
        <div className="row">
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label>Title</label>
            <input type="text" placeholder="Search a title…" value={bstTitle} onChange={e => setBstTitle(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleBstSearch}>Search</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {bstResult === undefined && <div className="empty">Not found.</div>}
          {bstResult && <SongTable songs={bstResult} />}
        </div>
        <div className="tabs" style={{ marginTop: 16 }}>
          {['inorder', 'preorder', 'postorder'].map(o => (
            <div key={o} className={'tab' + (bstOrder === o ? ' active' : '')} onClick={() => runBstOrder(o)}>
              {o[0].toUpperCase() + o.slice(1)}
            </div>
          ))}
        </div>
        <ConsoleBlock text={bstText} loading={bstLoading} />
      </div>

      <div className="panel">
        <div className="panel-title">AVL tree (by rating)</div>
        <div className="row">
          <div className="field"><label>Rating</label><input type="number" step="0.1" placeholder="4.5" value={avlRating} onChange={e => setAvlRating(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={handleAvlSearch}>Search</button>
          <button className="btn btn-danger" onClick={handleAvlDelete}>Delete</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {avlResult === undefined && <div className="empty">Not found.</div>}
          {avlResult && <SongTable songs={avlResult} />}
        </div>
        <div className="tabs" style={{ marginTop: 16 }}>
          {['inorder', 'preorder', 'postorder'].map(o => (
            <div key={o} className={'tab' + (avlOrder === o ? ' active' : '')} onClick={() => runAvlOrder(o)}>
              {o[0].toUpperCase() + o.slice(1)}
            </div>
          ))}
        </div>
        <ConsoleBlock text={avlText} loading={avlLoading} />
      </div>
    </section>
  )
}
