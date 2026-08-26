import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((message, ok = true) => {
    const id = idRef.current++
    setToasts(prev => [...prev, { id, message, ok }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={'toast ' + (t.ok ? 'ok' : 'err')}>
            <span className="tdot"></span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="toast-wrap" style={{ position: 'fixed', bottom: '80px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type === 'err' ? 'err' : 'ok'}`}
          style={{
            background: 'linear-gradient(135deg, #1f113a, #150a29)',
            border: `1px solid ${t.type === 'err' ? '#ef4444' : 'var(--accent)'}`,
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontFamily: 'var(--inter)',
            animation: 'rise 0.2s ease'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.type === 'err' ? '#ef4444' : 'var(--accent-2)' }}></span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
